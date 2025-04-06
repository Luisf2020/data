import { traceable } from "langsmith/traceable";
import { ChatCompletionMessageParam } from 'openai/resources/chat';
import pRetry from "p-retry";
import { Portkey } from 'portkey-ai';
import { v4 as uuidv4 } from 'uuid';

import { countTokensEstimation } from "./../count-tokens";
import failedAttemptHandler from "./../lc-failed-attempt-hanlder";
import { promptTokensEstimate } from "./../tokens-estimate";
import { SSE_EVENT } from "./../types";

export default class DeepseekAI {
  public portkey: Portkey;
  public agentPortkey: string;
  private currentTraceId: string;

  constructor(agentPortkey: string, messageId: string) {
    this.agentPortkey = agentPortkey;
    this.currentTraceId = messageId;
  }

  private async createSpan(name: string, parentSpanId?: string, metadata: any = {}) {
    const spanId = uuidv4();
    return {
      spanId, name, metadata: {
        traceId: this.currentTraceId,
        spanId,
        parentSpanId,
        agent: this.agentPortkey,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }

  async call({ handleStream, signal, tools = [], messages = [], ...otherProps }: any) {
    this.portkey = new Portkey({
      apiKey: process.env.PORTKEY_API_KEY,
      virtualKey: "deepseek-b39e19"
    });

    return pRetry(async () => {
      try {
        const toolId = uuidv4();

        const response = await this.portkey.chat.completions.create({
          model: "deepseek-chat",
          messages: [
            ...messages,
            {
              role: "assistant",
              content: null,
              tool_calls: [{
                id: toolId,
                type: "function",
                function: {
                  name: tools[0].function.name,
                  arguments: "{}"
                }
              }]
            },
            {
              role: "tool",
              content: "Success",
              tool_call_id: toolId
            }
          ],
          tools,
          tool_choice: "required",
          temperature: 0,
          stream: true
        });

        let fullResponse = '';
        for await (const chunk of response) {
          console.log("Chunk:", chunk);

          if (chunk.choices[0]?.delta?.tool_calls?.[0]) {
            const toolCall = chunk.choices[0].delta.tool_calls[0];
            handleStream(
              JSON.stringify({
                type: 'function',
                name: toolCall.function.name,
                arguments: toolCall.function.arguments || "{}"
              }),
              SSE_EVENT.tool_call
            );
          } else if (chunk.choices[0]?.delta?.content) {
            handleStream(chunk.choices[0].delta.content);
            fullResponse += chunk.choices[0].delta.content;
          }
        }

        const usage = {
          completion_tokens: countTokensEstimation({ text: fullResponse }),
          prompt_tokens: promptTokensEstimate({ tools, messages }),
          total_tokens: 0
        };
        usage.total_tokens = usage.prompt_tokens + usage.completion_tokens;

        return {
          answer: fullResponse,
          usage
        };

      } catch (error) {
        console.error("DeepseekAI Error:", error);
        throw error;
      }
    }, {
      signal,
      retries: 6,
      onFailedAttempt: failedAttemptHandler
    });
  }
}