import { NextApiResponse } from 'next';
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionTool,
  ChatCompletionToolMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources';

import { HttpToolPayload } from '@chaindesk/lib/agent';
import {
  createHandler as createHttpToolHandler,
  toJsonSchema as httpToolToJsonSchema,
} from '@chaindesk/lib/agent/tools/http';
import { ApiError, ApiErrorType } from '@chaindesk/lib/api-error';
import ChatModel from '@chaindesk/lib/chat-model';
import { ModelConfig } from '@chaindesk/lib/config';
import {
  createAuthApiHandler,
  respond,
} from '@chaindesk/lib/createa-api-handler';
import pipe from '@chaindesk/lib/middlewares/pipe';
import promptInject from '@chaindesk/lib/prompt-inject';
import { AppNextApiRequest } from '@chaindesk/lib/types';
import { HttpToolSchema } from '@chaindesk/lib/types/dtos';
import validate from '@chaindesk/lib/validate';
import { prisma } from '@chaindesk/prisma/client';
import uuidv4 from '@chaindesk/lib/uuidv4';

const handler = createAuthApiHandler();

export const approve = async (req: AppNextApiRequest, res: NextApiResponse) => {
  const id = req.query.id as string;

  const action = await prisma.actionApproval.findUnique({
    where: {
      id,
      organizationId: req.session.organization.id,
    },
    include: {
      agent: {
        include: {
          tools: {
            include: {
              datastore: true,
              form: true,
            },
          },
        },
      },
      message: {
        include: {
          input: true,
        },
      },
      tool: true,
    },
  });

  if (action?.organizationId !== req.session.organization.id) {
    throw new ApiError(ApiErrorType.UNAUTHORIZED);
  }

  if (!action?.agent) {
    throw new ApiError(ApiErrorType.NOT_IMPLEMENTED);
  }

  if (action.tool?.type !== 'http') {
    throw new ApiError(ApiErrorType.NOT_IMPLEMENTED);
  }

  const toolWithId = {
    ...action.tool,
    id: action.tool.id || uuidv4()
  };

  const t = HttpToolSchema.parse(toolWithId) as any;
  t.config.withApproval = false;

  const toolResult = await createHttpToolHandler(t)(
    action.payload as HttpToolPayload
  );

  // {role: "user",      content: "How's the weather this week?"}
  // {role: "assistant", tool_calls: [{type: "function", function: {name: "getCurrentLocation", arguments: "{}"}, id: "123"}
  // {role: "tool",      name: "getCurrentLocation", content: "Boston", tool_call_id: "123"}
  // {role: "assistant", tool_calls: [{type: "function", function: {name: "getWeather", arguments: '{"location": "Boston"}'}, id: "1234"}]}
  // {role: "tool",      name: "getWeather", content: '{"temperature": "50degF", "preciptation": "high"}', tool_call_id: "1234"}
  // {role: "assistant", content: "It's looking cold and rainy - you might want to wear a jacket!"}
  //
  const model = new ChatModel("", "");

  const formatedHttpTools = action.agent.tools
    .filter((each) => each.type === 'http')
    .map((each) => ({
      type: 'function',
      function: {
        ...httpToolToJsonSchema(HttpToolSchema.parse(each) as any),
        parse: JSON.parse,
        function: createHttpToolHandler(HttpToolSchema.parse(each) as any),
      },
    })) as unknown as ChatCompletionTool[];


  const messages: ChatCompletionMessageParam[] = [
    ...(action?.agent?.systemPrompt
      ? [{
        role: 'system' as const,
        content: action.agent.systemPrompt
      } satisfies ChatCompletionSystemMessageParam]
      : []),
    ...(action?.message?.input
      ? [{
        role: 'user' as const,
        content: action?.agent?.userPrompt
          ? promptInject({
            query: action?.message?.input?.text,
            template: action?.agent?.userPrompt,
          })
          : action?.message?.input?.text,
      } satisfies ChatCompletionUserMessageParam]
      : []),
    {
      role: 'assistant' as const,
      tool_calls: [{
        type: 'function' as const,
        function: {
          name: t.id || 'default',
          arguments: JSON.stringify(action.payload)
        },
        id: t.id || `call_${Date.now()}`
      }]
    } satisfies ChatCompletionAssistantMessageParam,
    {
      role: 'tool' as const,
      content: JSON.stringify(toolResult),
      tool_call_id: t.id || `call_${Date.now()}`
    } satisfies ChatCompletionToolMessageParam
  ];

  const { answer, usage }: any = await model.call({
    model: ModelConfig[action.agent.modelName].name,
    messages,
    temperature: action.agent.temperature,
    tools: formatedHttpTools,
    user: "test-chatsappai2",
    stream: false
  });


  //const { answer, usage } = response as { answer: string; usage: { completion_tokens: number; prompt_tokens: number; total_tokens: number; } };

  await prisma.$transaction([
    prisma.message.update({
      where: {
        id: action.messageId!,
      },
      data: {
        text: answer,
        usage: {
          ...usage,
        },
      },
    }),
    prisma.actionApproval.delete({
      where: {
        id,
      },
    }),
  ]);

  return {
    answer,
  };
};

export default handler;
