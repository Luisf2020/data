import cuid from 'cuid';
import { NextApiResponse } from 'next';
import handleChatMessageV2 from '@chaindesk/lib/v2/conversation/handle-chat-human';
import { ApiError, ApiErrorType } from '@chaindesk/lib/api-error';
import { createLazyAuthHandler, respond } from '@chaindesk/lib/createa-api-handler';
import getRequestLocation from '@chaindesk/lib/get-request-location';
import handleChatMessage, { ChatAgentArgs, ChatConversationArgs } from '@chaindesk/lib/handle-chat-message';
import cors from '@chaindesk/lib/middlewares/cors';
import pipe from '@chaindesk/lib/middlewares/pipe';
import streamData from '@chaindesk/lib/stream-data';
import { AppNextApiRequest, SSE_EVENT } from '@chaindesk/lib/types';
import { ChatRequest } from '@chaindesk/lib/types/dtos';
import { AgentVisibility, ConversationChannel, ToolType } from '@chaindesk/prisma';
import { prisma } from '@chaindesk/prisma/client';
import { currentDatePrompt, currentPhoneNumberNamePrompt } from '@chaindesk/lib/context-data-agents';
import { bufferService } from '@chaindesk/lib/queue/buffer-service';

const handler = createLazyAuthHandler();

// Helper function to create contact
const createContact = async (data: any, agent: any, metadata: any) => {
  try {
    return await prisma.contact.create({
      data: {
        ...data,
        organization: { connect: { id: agent?.organization?.id! } },
        metadata,
      },
    });
  } catch (error) {
    console.log('error creating contact:', error);
    return null;
  }
};

// Helper function to handle streaming response
const handleStreamResponse = (res: NextApiResponse, chatRes: any, visitorId: string) => {
  streamData({
    event: SSE_EVENT.endpoint_response,
    data: JSON.stringify({
      messageId: chatRes.answerMsgId,
      answer: chatRes?.agentResponse?.answer,
      sources: chatRes?.agentResponse?.sources,
      conversationId: chatRes.conversationId,
      visitorId,
      metadata: chatRes?.agentResponse?.metadata,
      status: chatRes.status,
    }),
    res,
  });

  streamData({ data: '[DONE]', res });
};

export const chatAgentRequest = async (req: AppNextApiRequest, res: NextApiResponse) => {
  const session = req.session;
  const id = req.query.id as string;
  const data = req.body as ChatRequest;
  const visitorId = data.visitorId || cuid();
  const conversationId = data.conversationId || cuid();

  // Basic validations
  if (data.isDraft && !session?.organization?.id) {
    throw new ApiError(ApiErrorType.UNAUTHORIZED);
  }

  // Configure channel
  if ((session?.authType == 'apiKey' && data.channel !== ConversationChannel.form) || !data.channel) {
    data.channel = ConversationChannel.api;
  }

  // Get agent with includes
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      ...ChatAgentArgs.include,
      organization: {
        ...ChatAgentArgs.include?.organization,
        include: {
          ...ChatAgentArgs.include?.organization.include,
          contacts: {
            take: 1,
            where: {
              OR: [
                { conversationsV2: { some: { id: conversationId } } },
                ...(data?.contact?.email ? [{ email: data.contact.email }] : []),
                ...(data?.contact?.phoneNumber ? [{ phoneNumber: data.contact.phoneNumber }] : []),
                ...(data?.contact?.userId ? [{ externalId: data.contact.userId }] : []),
              ],
            },
          },
          conversations: {
            ...ChatConversationArgs,
            take: 1,
            where: data.isDraft
              ? { id: conversationId, organizationId: session?.organization?.id }
              : { AND: { id: conversationId, participantsAgents: { some: { id } } } },
          },
        },
      },
      tools: {
        include: {
          datastore: true,
          form: true,
        },
      },
    },
  });

  if (!agent) throw new ApiError(ApiErrorType.NOT_FOUND);
  if (agent?.visibility === AgentVisibility.private && agent?.organizationId !== session?.organization?.id) {
    throw new ApiError(ApiErrorType.UNAUTHORIZED);
  }

  // Validate access to datastores
  for (const datastoreId of data.filters?.datastore_ids || []) {
    if (!agent?.tools?.find((one) => one?.datastoreId === datastoreId)) {
      throw new ApiError(ApiErrorType.UNAUTHORIZED);
    }
  }

  // Configure streaming
  const ctrl = new AbortController();
  if (data.streaming) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });
    req.socket.on('close', () => ctrl.abort());
  }

  // Handle contact
  let existingContact: any = agent?.organization?.contacts?.[0];
  const location = getRequestLocation(req);

  if (!existingContact) {
    if (data?.contact?.email || data?.contact?.phoneNumber || data?.contact?.userId) {
      existingContact = await createContact({
        email: data?.contact?.email,
        phoneNumber: data?.contact?.phoneNumber,
        externalId: data?.contact?.userId,
        firstName: data?.contact?.firstName,
        lastName: data?.contact?.lastName,
      }, agent, location);
    } else if (data?.contact?.instagramId) {
      existingContact = await createContact({
        instagramId: data?.contact?.instagramId,
        externalId: data?.contact?.userId,
      }, agent, location);
    }
  }

  // Filter tools if there is contact
  if (!!existingContact || data?.contact?.email || data?.contact?.phoneNumber || data?.contact?.userId) {
    agent.tools = agent.tools.filter(each => each.type !== ToolType.lead_capture);
  }

  // Prepare common data
  const commonData = {
    ...data,
    logger: req.logger,
    location,
    userId: session?.user?.id,
    visitorId,
    contactId: existingContact?.id || data.contactId,
  };

  try {
    let chatRes;
    if (agent.useConversationalMode) {
      const conversation = agent?.organization?.conversations[0] && {
        ...agent.organization.conversations[0],
        isAiEnabled: agent.organization.conversations[0].isAiEnabled ?? undefined,
      };

      chatRes = await handleChatMessageV2({
        ...commonData,
        conversation,
        agent: { ...agent, organizationId: agent.organization?.id ?? '' },
      });

      await bufferService.addMessage(id, data.query, { conversationId, visitorId, accountId: '' });
    } else {
      chatRes = await handleChatMessage({
        ...commonData,
        agent: agent as ChatAgentArgs,
        conversation: agent?.organization?.conversations?.[0],
        handleStream: (data: string, event: SSE_EVENT) =>
          streamData({ event: event || SSE_EVENT.answer, data, res }),
        abortController: ctrl,
        context: data.context,
        contextDataAgents: `${currentPhoneNumberNamePrompt()}\n\n${currentDatePrompt()}`,
      });
    }

    if (data.streaming) {
      handleStreamResponse(res, chatRes, visitorId);
    } else {
      return {
        ...chatRes.agentResponse,
        messageId: chatRes.answerMsgId,
        conversationId: chatRes.conversationId,
        visitorId,
        request_human: chatRes?.humand_request == undefined ? false : !chatRes?.humand_request,
        status: chatRes.status,
      };
    }
  } catch (error) {
    console.error('Chat processing error:', error);
    throw error;
  }
};

handler.post(pipe(respond(chatAgentRequest)));

export default pipe(cors({ methods: ['POST', 'HEAD'] }), handler);