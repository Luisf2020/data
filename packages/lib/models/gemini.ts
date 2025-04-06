import { traceable } from "langsmith/traceable";
import { ChatCompletionMessageParam } from 'openai/resources/chat';
import pRetry from "p-retry";
import { Portkey } from 'portkey-ai';
import { v4 as uuidv4 } from 'uuid';

import { countTokensEstimation } from "./../count-tokens";
import failedAttemptHandler from "./../lc-failed-attempt-hanlder";
import { promptTokensEstimate } from "./../tokens-estimate";
import { SSE_EVENT } from "./../types";

export default class GeminiAI {
  public portkey: Portkey;
  public agentPortkey: string;
  private currentTraceId: string;

  constructor(agentPortkey: string, messageId: string) {
    this.agentPortkey = agentPortkey;
    this.currentTraceId = messageId;
  }

  private async createSpan(name: string, parentSpanId?: string, metadata: any = {}) {
    const spanId = uuidv4();
    // Crear span con metadata enriquecida
    return {
      spanId,
      name,
      metadata: {
        traceId: this.currentTraceId,
        spanId: spanId,
        parentSpanId,
        agent: this.agentPortkey,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }

  async call({
    handleStream,
    signal,
    tools = [],
    messages = [],
    ...otherProps
  }: any) {


    this.portkey = new Portkey({
      apiKey: process.env.PORTKEY_API_KEY,
      virtualKey: "google-6512bf",
    })

    const mainSpan = await this.createSpan("agent_step", undefined, {
      model: otherProps.model,
      messageCount: messages.length,
      hasTools: tools.length > 0
    });

    return pRetry(
      async () => {
        // Span de procesamiento con tokens
        const promptSpan = await this.createSpan("thought_process", mainSpan.spanId, {
          step: "processing_input",
          tokens: promptTokensEstimate({
            tools,
            useFastApproximation: true,
            tool_choice: otherProps?.tool_choice as 'auto' | 'none' | { type: 'function'; function: { name: string } },
            messages: messages as ChatCompletionMessageParam[]
          })
        });

        let usage = {
          completion_tokens: 0,
          prompt_tokens: promptTokensEstimate({
            tools,
            useFastApproximation: true,
            tool_choice: otherProps?.tool_choice as 'auto' | 'none' | { type: 'function'; function: { name: string } },
            messages: messages as ChatCompletionMessageParam[],
          }),
          total_tokens: 0,
        };

        if (tools?.length > 0) {
          const toolsSpan = await this.createSpan("reasoning", mainSpan.spanId, {
            step: "tool_selection",
            toolCount: tools.length
          });


          const runner = await this.portkey.beta.chat.completions?.runTools({
            messages: messages as ChatCompletionMessageParam[],
            model: otherProps.model,
            tools,
            stream: true,
            tool_choice: otherProps.tool_choice || 'auto',
            temperature: otherProps.temperature,
            user: this.agentPortkey
          });

          let fullResponse = '';

          runner.on('message', async (msg: any) => {
            await this.createSpan("thought", toolsSpan.spanId, {
              step: "processing_message",
              messageType: msg.type
            });
          });

          runner.on('functionCall', async (functionCall: any) => {
            const querySpan = await this.createSpan("action", toolsSpan.spanId, {
              step: "function_execution",
              functionName: functionCall?.name
            });

            console.log(JSON.stringify(functionCall, null, 2));

            if (handleStream) {
              handleStream(
                JSON.stringify({
                  type: 'function',
                  name: functionCall?.name,
                  arguments: functionCall?.arguments,
                }),
                SSE_EVENT.tool_call
              );
            }
          });

          runner.on('content', async (chunk: any) => {
            await this.createSpan("response_generation", toolsSpan.spanId, {
              step: "generating_content",
              chunkSize: chunk?.length
            });

            if (handleStream) {
              handleStream(chunk);
            }
            fullResponse += chunk;
            usage.completion_tokens += countTokensEstimation({
              text: chunk || "",
            });
          });

          const completion = await runner.finalChatCompletion();

          usage.total_tokens = usage.prompt_tokens + usage.completion_tokens;

          return {
            answer: fullResponse.trim() || completion?.choices?.[0]?.message?.content?.trim(),
            usage,
            completion,
          };
        } else {
          const responseSpan = await this.createSpan("direct_response", mainSpan?.spanId, {
            step: "generating_response"
          });

          if (handleStream) {
            const streaming = await this.portkey.chat.completions.create({
              messages,
              model: otherProps.model,
              stream: true,
              temperature: otherProps.temperature,
              user: this.agentPortkey
            });

            let buffer = "";
            for await (const chunk of streaming) {
              const chunkSpan = await this.createSpan("chunk_processing", responseSpan.spanId, {
                step: "processing_chunk",
                chunkSize: chunk.choices[0]?.delta?.content?.length
              });

              const content: string = Array.isArray(chunk.choices[0]?.delta?.content)
                ? (chunk.choices[0]?.delta?.content as string[]).join("")
                : (chunk.choices[0]?.delta?.content ?? "");
              handleStream(content);
              buffer += content;
              usage.completion_tokens += countTokensEstimation({
                text: content,
              });
            }

            usage.total_tokens = usage.prompt_tokens + usage.completion_tokens;

            return {
              answer: buffer.trim(),
              usage,
            };
          }
        }
      },
      {
        signal,
        retries: 6,
        onFailedAttempt: failedAttemptHandler,
      }
    );
  }

  // Nuevo método para manejar feedback
  async handleFeedback(value: "good" | "bad", traceId: string) {
    try {
      const feedbackValue = value === "good" ? 1 : -1;

      console.log(feedbackValue)

      await this.portkey.feedback.create({
        traceID: traceId,
        value: feedbackValue,
        weight: 1,
        metadata: {
          agent: this.agentPortkey,
          timestamp: new Date().toISOString(),
          interaction_type: value
        }
      });

      console.log('Feedback enviado exitosamente:', {
        traceID: this.currentTraceId,
        value: feedbackValue
      });

      return true;
    } catch (error) {
      console.error('Error al enviar feedback:', {
        error,
        traceID: this.currentTraceId
      });
      throw error;
    }
  }

}