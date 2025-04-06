import { ChatCompletionMessageParam, ChatCompletionToolChoiceOption } from 'openai/resources/chat';
import pRetry from "p-retry";
import pLimit from 'p-limit';
import { Portkey } from 'portkey-ai';

import { countTokensEstimation } from "./count-tokens";
import failedAttemptHandler from "./lc-failed-attempt-hanlder";
import { promptTokensEstimate } from "./tokens-estimate";
import { SSE_EVENT } from "./types";
import config, { ModelConfig } from './config';
import { AgentModelName } from '@chaindesk/prisma';
import AzureOpenAI from './models/azure';
import uuidv4 from './uuidv4';
import DeepseekAI from './models/deepseek';
import AzureOpenAITwo from './models/azure-2';
import GeminiAI from './models/gemini';

interface ChatModelCallParams {
  handleStream?: (text: string, event?: SSE_EVENT) => any;
  signal?: AbortSignal;
  tools?: any[];
  messages: { role: string; content: string; tool_call_id?: string; name?: string }[] | any;
  model: string;
  temperature?: number;
  user: string;
  tool_choice?: 'auto' | 'none' | { type: string; function: { name: string } };
  stream?: boolean;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
  foundingModel?: string;
}

export default class ChatModel {
  public portkey: any;
  public agentPortkey: string;
  private currentTraceId: string;

  // Lista de modelos que no soportan mensajes de sistema
  private readonly noSystemMessageModels = [
    'mistral.mixtral-8x7b-instruct-v0:1',
    'anthropic.claude-3-haiku-20240307-v1:0',
    // Agregar otros modelos según sea necesario
  ];

  private readonly noStreamModels = [
    'cohere.command-r-plus-v1:0',
    // Agregar otros modelos de Bedrock que no soporten streaming
  ];

  constructor(agentPortkey: string, currentTraceId: string) {
    this.agentPortkey = agentPortkey;
    this.currentTraceId = currentTraceId;
  }

  private initializePortkey(foundingModel: string) {
    if (foundingModel === "azure") {
      return new Portkey({
        apiKey: process.env.PORTKEY_API_KEY,
        virtualKey: "azureopenai-244a75",
        traceID: this.currentTraceId,
        config: {
          cache: {
            mode: "semantic",
            max_age: 60000
          }
        }
      });
    }
    else if (foundingModel === "azure-2") {
      return new Portkey({
        apiKey: process.env.PORTKEY_API_KEY,
        virtualKey: "azure-2-b480eb",
        traceID: this.currentTraceId,
        config: {
          cache: {
            mode: "semantic",
            max_age: 60000
          }
        }
      });
    }
    else if (foundingModel === "groq-cloud") {
      return new Portkey({
        apiKey: process.env.PORTKEY_API_KEY,
        virtualKey: "groqcloud-518060",
        traceID: this.currentTraceId,
        config: {
          cache: {
            mode: "semantic",
            max_age: 60000
          }
        }
      });
    }
    else if (foundingModel === "deepseek") {
      return new Portkey({
        apiKey: process.env.PORTKEY_API_KEY,
        virtualKey: "deepseek-b39e19",
        traceID: this.currentTraceId,
        config: {
          cache: {
            mode: "semantic",
            max_age: 60000
          }
        }
      });
    }
    else if (foundingModel === "gemini") {
      return new Portkey({
        apiKey: process.env.PORTKEY_API_KEY,
        virtualKey: "google-6512bf",
        traceID: this.currentTraceId,
        config: {
          cache: {
            mode: "semantic",
            max_age: 60000
          }
        }
      });
    }
    else if (foundingModel === "aws") {
      return new Portkey({
        apiKey: process.env.PORTKEY_API_KEY,
        virtualKey: "amazonbedrock-957b70",
        traceID: this.currentTraceId,
        config: {
          cache: {
            mode: "semantic",
            max_age: 60000
          }
        }
      });
    }
    else if (foundingModel === "deepseek") {
      return new Portkey({
        apiKey: process.env.PORTKEY_API_KEY,
        virtualKey: "deepseek-b39e19"
      });
    }
    return null;
  }


  public async call(params: ChatModelCallParams) {
    // if (params.foundingModel === "gemini") {
    //   const model = new GeminiAI(this.agentPortkey, uuidv4());
    //   return model.call(params)
    // }
    // else if (params.foundingModel === "azure") {
    //   const model = new AzureOpenAI(params.user, uuidv4());

    //   return model.call(params);
    // }
    // else if (params.foundingModel === "deepseek") {
    //   const model = new DeepseekAI(params.user, uuidv4());

    //   return model.call(params);
    // }
    // else {
    //   // Evita 2 llamadas simultáneas
    //   return pLimit(1)(() => this._callInternal(params));
    // }
    return pLimit(1)(() => this._callInternal(params));

  }

  private async _callInternal({
    handleStream,
    signal,
    tools = [],
    messages = [],
    ...otherProps
  }: ChatModelCallParams) {
    this.portkey = this.initializePortkey(otherProps.foundingModel!);
    if (!this.portkey) {
      throw new Error(`Unsupported founding model: ${otherProps.foundingModel}`);
    }

    // 1) Limpiar mensajes vacíos y duplicados
    const cleanedMessages = this.sanitizeMessages(messages);

    // 2) Formatear según modelo (por si no soporta 'system')
    const formattedMessages = this.formatMessagesForModel(cleanedMessages, otherProps.model);

    // 3) [DEBUG] Imprime mensajes finales con su índice
    console.log('=== Final messages for Bedrock ===');
    formattedMessages.forEach((m: any, i: number) => {
      console.log(`Index=${i} | role=${m.role} | content="${m.content}"`);
    });

    // 4) Config base (sin streaming)
    const baseConfig = {
      messages: formattedMessages,
      model: otherProps.model,
      temperature: otherProps.temperature,
      user: this.agentPortkey,
      stream: false,
    };

    // 5) Calcular tokens
    let usage = {
      completion_tokens: 0,
      prompt_tokens: promptTokensEstimate({
        tools,
        useFastApproximation: true,
        tool_choice: otherProps?.tool_choice as ChatCompletionToolChoiceOption,
        messages: formattedMessages as ChatCompletionMessageParam[],
      }),
      total_tokens: 0,
    };

    // 6) Llamar con pRetry con retries=0
    return pRetry(
      async () => {
        // 6.1) Caso: Tools
        if (tools.length > 0) {
          const completionConfig = {
            ...baseConfig,
            tools,
            tool_choice: otherProps.tool_choice || 'auto',
            stream: false,
          } as any;

          console.log('=== Running with Tools (no streaming) ===');
          const runner = await (this.portkey.beta as any).chat.completions.runTools(
            completionConfig
          );
          const completion = await runner.finalChatCompletion();
          const content = completion?.choices?.[0]?.message?.content || '';

          usage.completion_tokens = countTokensEstimation({ text: content });
          usage.total_tokens = usage.prompt_tokens + usage.completion_tokens;

          return {
            answer: content.trim(),
            usage,
            completion,
          };
        }

        // 6.2) Caso: Sin Tools
        console.log('=== Running normal completion (no streaming) ===');
        const completion = await this.portkey.chat.completions.create(baseConfig);
        const content = completion.choices[0]?.message?.content || '';

        usage.completion_tokens = countTokensEstimation({ text: content });
        usage.total_tokens = usage.prompt_tokens + usage.completion_tokens;

        return {
          answer: content.trim(),
          usage,
          completion,
        };
      },
      {
        signal,
        retries: 0,
        factor: 1,
        minTimeout: 300,
        maxTimeout: 1000,
        onFailedAttempt: (error) => {
          console.log(
            `Intento fallido #${error.attemptNumber}. Motivo: ${error.message}`
          );
        },
      }
    );
  }

  /**
   * Filters messages with empty content and avoids consecutive duplicates
   */
  private sanitizeMessages(messages: any[]) {
    const cleaned: any[] = [];
    for (const msg of messages) {
      // Handle multimodal content (array of content objects)
      if (Array.isArray(msg.content)) {
        // Keep multimodal messages as is
        cleaned.push(msg);
        continue;
      }

      // Filter empty messages for text-only content
      if (!msg.content || !msg?.content?.trim()) {
        console.log(`>> SKIP empty content msg: role=${msg.role}`, msg);
        continue;
      }

      // Avoid consecutive duplicates for text-only messages
      if (
        cleaned.length > 0 &&
        cleaned[cleaned.length - 1].role === msg.role &&
        cleaned[cleaned.length - 1].content === msg.content
      ) {
        console.log(`>> SKIP duplicate msg: role=${msg.role}`, msg);
        continue;
      }

      cleaned.push(msg);
    }
    return cleaned;
  }



  /**
   * For models that do not support 'system', convert system -> user
   * and merge consecutive user messages
   */
  private formatMessagesForModel(messages: any[], model: string): any[] {
    if (this.noSystemMessageModels.includes(model)) {
      let formattedMessages = messages.map((m) => {
        // Handle system messages
        if (m.role === 'system') {
          return { role: 'user', content: m.content };
        }
        return m;
      });

      // Only merge consecutive user messages if they are text-only
      formattedMessages = formattedMessages.reduce((acc, curr) => {
        if (
          acc.length === 0 ||
          curr.role !== 'user' ||
          acc[acc.length - 1].role !== 'user' ||
          Array.isArray(curr.content) ||
          Array.isArray(acc[acc.length - 1].content)
        ) {
          acc.push(curr);
        } else {
          acc[acc.length - 1].content += '\n\n' + curr.content;
        }
        return acc;
      }, []);
      return formattedMessages;
    }

    return messages;
  }

  public async createEmbedding(params: any) {
    try {
      this.portkey = this.initializePortkey("azure");
      const response = await this.portkey.embeddings.create(params);
      return response;
    } catch (error) {
      console.error('Embedding error:', error);
      throw error;
    }
  }

  public async createChatCompletion(params: any) {
    return this.portkey.chat.completions.create({
      ...params
    });
  }
}