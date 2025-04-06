import slugify from '@sindresorhus/slugify';
import { traceable } from 'langsmith/traceable';
import {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources';
import { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions';
import { v4 as uuidv4 } from 'uuid';

import {
  Agent,
  AgentModelName,
  ConversationChannel,
  Message,
  Tool,
  ToolType,
} from '@chaindesk/prisma';

import { handler as datastoreToolHandler } from './agent/tools/datastore';
import {
  createHandlerV2 as createFormToolHandlerV2,
  toJsonSchema as formToolToJsonSchema,
} from './agent/tools/form';
import {
  createHandler as createAppToolHandler,
  createParser as createParserAppTool,
  toJsonSchema as appToolToJsonSchema,
} from './agent/tools/app';

import {
  createHandler as createHttpToolHandler,
  createParser as createParserHttpTool,
  toJsonSchema as httpToolToJsonSchema,
} from './agent/tools/http';
import {
  createHandler as createLeadCaptureToolHandler,
  createParser as createParserLeadCaptureTool,
  toJsonSchema as leadCaptureToolToJsonSchema,
} from './agent/tools/lead-capture';
import {
  createHandler as createMarkAsResolvedToolHandler,
  toJsonSchema as markAsResolvedToolToJsonSchema,
} from './agent/tools/mark-as-resolved';
import {
  createHandler as createRequestHumanToolHandler,
  toJsonSchema as requestHumanToolToJsonSchema,
} from './agent/tools/request-human';
import {
  CreateToolHandler,
  CreateToolHandlerConfig,
  ToolPayload,
} from './agent/tools/type';
import type { Source } from './types/document';
import {
  ChatModelConfigSchema,
  ChatRequest,
  ChatResponse,
  FormToolSchema,
  HttpToolSchema,
  AppToolSchema,
  LeadCaptureToolSchema,
  MarkAsResolvedToolSchema,
  RequestHumanToolSchema,
  ToolSchema,
} from './types/dtos';
import ChatModel from './chat-model';
import cleanTextForEmbeddings from './clean-text-for-embeddings';
import { ModelConfig } from './config';
import createToolParser from './create-tool-parser';
import formatMessagesOpenAI from './format-messages-openai';
import getUsageCost from './get-usage-cost';
import promptInject from './prompt-inject';
import {
  createLeadCapturePrompt,
  MARK_AS_RESOLVED,
  REQUEST_HUMAN,
} from './prompt-templates';
import truncateChatMessages from './truncateChatMessages';
import { log } from 'console';

export type ChatProps = ChatModelConfigSchema & {
  organizationId: string;
  agentId: string;
  channel?: ConversationChannel;
  systemPrompt?: string;
  userPrompt?: string;
  query: string;
  retrievalQuery?: string;
  stream?: any;
  modelName?: AgentModelName;
  history?: Message[];
  abortController?: AbortController;
  context?: string;
  useXpContext?: boolean;
  tools?: Tool[];
  filters?: ChatRequest['filters'];
  topK?: number;
  toolsConfig?: ChatRequest['toolsConfig'];
  conversationId?: ChatRequest['conversationId'];
  images?: string[];
  userName?: string;
  organizationName?: string;
  agentPortkey?: string;
  contextDataAgents?: string;
  productInfo?: any;
  // Behaviors
  useMarkdown?: boolean;
  useLanguageDetection?: boolean;
  restrictKnowledge?: boolean;
  useContextDataAgents?: boolean;
};

const chat = async ({
  query,
  userPrompt,
  systemPrompt,
  stream,
  temperature,
  history,
  modelName = AgentModelName.gpt_3_5_turbo,
  abortController,
  context,
  tools = [],
  filters,
  topK,
  toolsConfig,
  conversationId,
  organizationId,
  agentId,
  retrievalQuery,
  useMarkdown,
  useLanguageDetection,
  useContextDataAgents,
  restrictKnowledge,
  channel,
  images,
  userName,
  organizationName,
  agentPortkey,
  contextDataAgents,
  productInfo,
  ...otherProps
}: ChatProps) => {
  // Tools
  const nbDatastoreTools =
    tools?.filter((each) => each.type === 'datastore')?.length || 0;

  const datastoreTools = (tools as ToolSchema[]).filter(
    (each) => each.type === ToolType.datastore
  ) as ToolSchema[];

  const httpTools = (tools as ToolSchema[]).filter(
    (each) => each.type === ToolType.http
  ) as HttpToolSchema[];

  const appTools = (tools as ToolSchema[]).filter(
    (each) => each.type === ToolType.app
  ) as AppToolSchema[];

  const formTools = (tools as ToolSchema[]).filter(
    (each) => each.type === ToolType.form
  ) as FormToolSchema[];

  const markAsResolvedTool = (tools as ToolSchema[]).find(
    (each) => each.type === ToolType.mark_as_resolved
  ) as MarkAsResolvedToolSchema;

  const requestHumanTool = (tools as ToolSchema[]).find(
    (each) => each.type === ToolType.request_human
  ) as RequestHumanToolSchema;

  const leadCaptureTool = (tools as ToolSchema[]).find(
    (each) => each.type === ToolType.lead_capture
  ) as LeadCaptureToolSchema;

  const approvals: ChatResponse['approvals'] = [];

  const handleToolWithApproval = async (
    props: ChatResponse['approvals'][0]
  ) => {
    approvals.push(props);

    throw 'ToolApprovalRequired';
  };

  let messageId = uuidv4();
  let metadata: object | undefined = undefined;

  const baseConfig = {
    conversationId,
    modelName,
    organizationId,
    agentId,
  };

  const createHandler =
    <T extends { type: ToolType }>(handler: CreateToolHandler<T>) =>
      (
        tool: ToolSchema & T,
        config: CreateToolHandlerConfig<T>,
        channel?: ConversationChannel
      ) =>
        async (args: ToolPayload<T>) => {
          const res = await handler(tool, config, channel)(args);

          if (res?.approvalRequired) {
            return handleToolWithApproval({
              tool,
              payload: args,
            });
          }

          if (res?.metadata) {
            metadata = {
              ...metadata,
              ...res?.metadata,
            };
          }

          if (res?.messageId) {
            messageId = res.messageId as string;
          }

          return res?.data;
        };

  const formatedHttpTools = httpTools.map((each) => {
    const toolConfig = each?.id ? toolsConfig?.[each.id] : undefined;
    const config = { ...baseConfig, toolConfig };

    return ({
      type: 'function',
      function: {
        ...httpToolToJsonSchema(each as any),
        parse: createParserHttpTool(each as any, config as any),
        function: createHandler(createHttpToolHandler as any)(each as any, config as any),
      },
    } as unknown) as ChatCompletionTool;
  });


  const formattedAppTools = appTools.map((each) => {
    const toolConfig = each?.id ? toolsConfig?.[each?.id] : undefined;
    const config = { ...baseConfig, toolConfig };

    return {
      type: 'function',
      function: {
        name: each.id,
        description: each.config.description,
        parameters: {
          type: 'object',
          properties: {
            ...each.config?.body?.reduce((acc, param) => ({
              ...acc,
              [param.key]: {
                type: 'string',
                description: param.description
              }
            }), {}),
            ...each.config?.queryParameters?.reduce((acc, param) => ({
              ...acc,
              [param.key]: {
                type: 'string',
                description: param.description
              }
            }), {})
          },
          required: each.config?.body
            ?.filter(param => param?.isUserProvided)
            ?.map(param => param.key) || []
        },
        parse: createParserAppTool(each, config),
        function: createHandler(createAppToolHandler as any)(each, config),
      },
    } as ChatCompletionTool;
  });

  const formatedFormTools = formTools.map((each) => {
    const toolConfig = each?.id ? toolsConfig?.[each?.id] : undefined;
    const config = { ...baseConfig, toolConfig };

    return {
      type: 'function',
      function: {
        ...formToolToJsonSchema(each),
        parse: JSON.parse,
        function: createHandler(createFormToolHandlerV2)(each, config, channel),
      },
    } as ChatCompletionTool;
  });

  const formatedMarkAsResolvedTool = !!markAsResolvedTool
    ? ({
      type: 'function',
      function: {
        ...markAsResolvedToolToJsonSchema(markAsResolvedTool, {
          ...baseConfig,
        }),
        parse: JSON.parse,
        function: createHandler(createMarkAsResolvedToolHandler)(
          markAsResolvedTool,
          { ...baseConfig }
        ),
      },
    } as ChatCompletionTool)
    : undefined;

  const formatedRequestHumanTool = !!requestHumanTool
    ? ({
      type: 'function',
      function: {
        ...requestHumanToolToJsonSchema(requestHumanTool, {
          ...baseConfig,
        }),
        parse: JSON.parse,
        function: createHandler(createRequestHumanToolHandler)(
          requestHumanTool,
          { ...baseConfig }
        ),
      },
    } as ChatCompletionTool)
    : undefined;

  const formatedLeadCaptureTool = !!leadCaptureTool
    ? ({
      type: 'function',
      function: {
        ...leadCaptureToolToJsonSchema(leadCaptureTool, {
          ...baseConfig,
        }),
        parse: createParserLeadCaptureTool(leadCaptureTool, {
          ...baseConfig,
        }),
        function: createHandler(createLeadCaptureToolHandler)(
          leadCaptureTool,
          { ...baseConfig }
        ),
      },
    } as ChatCompletionTool)
    : undefined;

  let retrievalData:
    | Awaited<ReturnType<typeof datastoreToolHandler>>
    | undefined = undefined;

  // if (userPrompt?.includes('{context}')) {
  retrievalData = await traceable(datastoreToolHandler, { run_type: 'retriever', name: 'Retrieve Docs' })({
    maxTokens: Math.min(ModelConfig?.[modelName!]?.maxTokens * 0.2, 2000), // limit RAG to max 2K tokens
    query: retrievalQuery || query,
    tools: tools,
    filters: filters,
    topK: topK,
    similarityThreshold: 0.72,
  });
  // }

  // Messages
  const truncatedHistory = (
    await truncateChatMessages({
      messages: formatMessagesOpenAI(history || []).reverse(),
      maxTokens: Math.min(ModelConfig[modelName]?.maxTokens * 0.3, 2000), // 30% tokens limit for history - max 2000 tokens
    })
  ).reverse();

  const isViaOpenRouter = !!ModelConfig[modelName]?.baseUrl?.includes?.('openrouter');

  const model = new ChatModel(agentPortkey!, conversationId!);

  try {
    // if (!!markAsResolvedTool) {
    //   _systemPrompt += `\n${MARK_AS_RESOLVED}`;
    // }

    // if (!!requestHumanTool) {
    //   _systemPrompt += `\n${REQUEST_HUMAN}`;
    // }

    // if (!!leadCaptureTool) {
    //   _systemPrompt += `\n${createLeadCapturePrompt({
    //     isEmailEnabled: !!leadCaptureTool.config.isEmailEnabled,
    //     isPhoneNumberEnabled: !!leadCaptureTool.config.isPhoneNumberEnabled,
    //     isRequiredToContinue: !!leadCaptureTool.config.isRequired,
    //   })}`;
    // }

    const infos = [
      ...(leadCaptureTool?.config?.isEmailEnabled ? ['email'] : []),
      ...(leadCaptureTool?.config?.isPhoneNumberEnabled
        ? ['phone number and phone extension']
        : []),
    ].join(' and ');

    const requestHumanInstructions = `If the user is not satisfied with the assistant answers, offer to request a human operator, then if the user accepts use tool \`request_human\` to request a human to take over the conversation.`;
    const markAsResolvedInstructions = `If the user is happy with your answer, use tool \`mark_as_resolved\` to mark the conversation as resolved.`;

    const _systemPrompt = `${systemPrompt}
    ${!!leadCaptureTool
        ? `**Lead Capture**
    1. Start the conversation by greeting the user and asking for his ${infos} in order to contact them if necessary.
    2. If the user provides their ${infos}, confirm receipt.
    3. If the user does not provide his ${infos}, politely ask again.
    5. Make sure the ${infos} is/are valid and are not empty before proceeding.
    4. After the user has provided a valid ${infos}, thank them and save the email whith the lead capture tool.
    ${leadCaptureTool?.config?.isRequired
          ? `5. If the user refuses to provide his ${infos}, politely inform the user that you need the ${infos} to continue the conversation. Do not continue until the user has provided valid ${infos}.`
          : ``
        }`
        : ``
      }
    ${useMarkdown
        ? "Answer using markdown without using the markdown tag at the beginning and the end of the message to display the content in a nice and aerated way.CORRECT RESPONSE: Hola WRONG RESPONSE: ```markdown HOLA```"
        : ``
      }
    ${useLanguageDetection
        ? `Always answer using same language as the user's last message.`
        : ``
      }
    ${
      // use useLanguageDetection for this too until we add a checkbox in the ui
      useLanguageDetection
        ? `Never make up URLs, email addresses, or any other information that have not been provided during the conversation.`
        : ``
      }
    ${!!markAsResolvedTool ? markAsResolvedInstructions : ``}
    ${!!requestHumanTool ? requestHumanInstructions : ``}
    `.trim();

    const userMessage = promptInject({
      template: userPrompt || '{query}',
      query: query,
      context: retrievalData?.context,
    });
    log('USER MESSAGE:', userMessage);
    const messages: ChatCompletionMessageParam[] = [
      ...(_systemPrompt
        ? [
          {
            role: 'system',
            content: _systemPrompt,
          } as ChatCompletionMessageParam,
        ]
        : []),
      ...(nbDatastoreTools > 0
        ? restrictKnowledge
          ? ([
            {
              role: 'user',
              content: `Only use informations from the provided knowledge base. If you don't have enough information to answer my questions, politely say that you do not know. Do not mention the knowledge base, context, or any specific sources when information is not found. If the information is not available, simply state that you do not have enough information to answer the question and apologize for the inconvenience. For example, if a user asks about a topic for which there is no available information, respond with: "Unfortunately, I do not have enough information about [topic] to give you a detailed explanation. I apologize that I cannot provide a more informative response to your question.`,
            },
            {
              role: 'assistant',
              content: `Ok I will follow your instructions carefully.`,
            },
          ] as ChatCompletionMessageParam[])
          : ([] as ChatCompletionMessageParam[])
        : []),

      ...(nbDatastoreTools > 0
        ? [
          {
            role: 'system' as any,
            // name: 'queryKnowledgeBase',
            content: `<knowledge-base>${retrievalData?.context}</knowledge-base>`,
          },
        ]
        : []),
      // Agregamos el contexto del agente si existe
      ...(useContextDataAgents && contextDataAgents
        ? [
          {
            role: 'user',
            content: `${contextDataAgents}`,
          },
          {
            role: 'assistant',
            content: `Ok, I will take that info into account.`,
          },
        ]
        : []),
      ...(productInfo
        ? [
          {
            role: 'user',
            content: `This is the information about the product i am requesting info: ${JSON.stringify(productInfo)}`,
          },
          {
            role: 'assistant',
            content: `Ok, I will take that info into account.`,
          },
        ]
        : []),
      ...(conversationId
        ? [
          {
            role: 'user',
            content: `This is the conversation_id: ${conversationId}`,
          },
          {
            role: 'assistant',
            content: `Ok, I will take that info into account.IMPORTANT: The conversation_id will remain strictly confidential and will never be used in any interaction with the client.`,
          },
        ]
        : []),
      ...truncatedHistory,
      {
        role: 'user',
        content:
          ModelConfig[modelName]?.hasVision && !!images?.length
            ? [
              { type: 'text', text: userMessage },
              ...(images?.map?.((url) => ({
                type: 'image_url',
                image_url: {
                  url,
                },
              })) as { type: 'image_url'; image_url: { url: string } }[]),
            ]
            : userMessage,
      },
    ];

    const openAiTools = [
      ...formatedHttpTools,
      ...formatedFormTools,
      ...formattedAppTools,
      ...(formatedMarkAsResolvedTool ? [formatedMarkAsResolvedTool] : []),
      ...(formatedRequestHumanTool ? [formatedRequestHumanTool] : []),
      ...(formatedLeadCaptureTool ? [formatedLeadCaptureTool] : []),
      // ...(nbDatastoreTools > 0
      //   ? [
      //       {
      //         type: 'function',
      //         function: {
      //           name: 'queryKnowledgeBase',
      //           description: `Useful to fetch informations from the knowledge base (${datastoreTools
      //             .map((each) => each?.datastore?.name)
      //             .join(', ')})`,
      //           parameters: {
      //             type: 'object',
      //             properties: {},
      //           },
      //           parse: JSON.parse,
      //           function: async () => {
      //             if (retrievalData) {
      //               return retrievalData.context;
      //             }

      //             retrievalData = await datastoreToolHandler({
      //               maxTokens: ModelConfig?.[modelName!]?.maxTokens * 0.2,
      //               query: retrievalQuery || query,
      //               tools: tools,
      //               filters: filters,
      //               topK: topK,
      //               similarityThreshold: 0.7,
      //             });
      //             return retrievalData.context;
      //           },
      //         },
      //       } as ChatCompletionTool,
      //     ]
      //   : []),
    ] as ChatCompletionTool[];

    const numberOfMessages =
      Number(history?.filter((msg) => msg.from === 'human').length) + 1;

    const formToolToCall = formTools.find(
      (formTool) => formTool.config?.messageCountTrigger === numberOfMessages
    );

    if (formToolToCall) {
      // Force the model to use this tool
      messages.push({
        role: `user`,
        content: `Call function \`share-form-${slugify(
          formToolToCall?.form?.name || ''
        )}\``,
      });
    }
    console.log("USERNAME:" + userName);
    // Model not temperature added conditional ModelConfig = ex: azure-2 models o3-mini || o3
    const callParams = {
      handleStream: stream,
      model: ModelConfig[modelName]?.name,
      foundingModel: ModelConfig[modelName]?.foundingModel,
      messages,
      ...(ModelConfig[modelName]?.foundingModel !== 'azure-2' && { temperature: temperature || 0 }),
      top_p: otherProps.topP,
      frequency_penalty: otherProps.frequencyPenalty,
      presence_penalty: otherProps.presencePenalty,
      max_tokens: otherProps.maxTokens,
      signal: abortController?.signal,
      ...(ModelConfig[modelName].isToolCallingSupported &&
        openAiTools.length > 0
        ? { tool_choice: 'auto', tools: openAiTools }
        : { tools: [] }),
      user: userName
    } as unknown as Parameters<typeof model.call>[0];

    console.log(
      'CALL PARAMS_----------------->',
      JSON.stringify(callParams, null, 2)
    );

    const output = await model.call(callParams);

    const answer = output?.answer;
    console.log('ANSWER-->', answer);

    const usage = {
      completionTokens: output?.usage?.completion_tokens,
      promptTokens: output?.usage?.prompt_tokens,
      totalTokens: output?.usage?.total_tokens,
      cost: getUsageCost({
        modelName,
        usage: output?.usage!,
      }),
    };

    // if (metadata && 'shouldDisplayForm' in metadata) {
    //   return {
    //     answer: '',
    //     usage: {},
    //     approvals,
    //     sources: [] as Source[],
    //     metadata,
    //   };
    // }

    return {
      answer,
      usage,
      sources: retrievalData?.sources || [],
      approvals,
      metadata,
      messageId,
    } as ChatResponse;
  } catch (err: any) {
    if (err?.message?.includes('ToolApprovalRequired')) {
      return {
        answer: '',
        usage: {},
        approvals,
        sources: [] as Source[],
        metadata,
        messageId,
      } as ChatResponse;
    } else {
      throw err;
    }
  }
};

export default chat;