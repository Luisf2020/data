import handleChatMessageV2 from '@chaindesk/lib/v2/conversation/handle-chat-human';
import cuid from 'cuid';
import { NextApiResponse } from 'next';

import { ApiError, ApiErrorType } from '@chaindesk/lib/api-error';
import { createLazyAuthHandler, respond } from '@chaindesk/lib/createa-api-handler';
import getRequestLocation from '@chaindesk/lib/get-request-location';
import cors from '@chaindesk/lib/middlewares/cors';
import pipe from '@chaindesk/lib/middlewares/pipe';
import streamData from '@chaindesk/lib/stream-data';
import { AppNextApiRequest, SSE_EVENT } from '@chaindesk/lib/types';
import { ChatRequest } from '@chaindesk/lib/types/dtos';
import { ConversationChannel, AgentVisibility } from '@chaindesk/prisma';
import { prisma } from '@chaindesk/prisma/client';
import { bufferService } from '@chaindesk/lib/queue/buffer-service';

const handler = createLazyAuthHandler();

const service = bufferService;

export const chatAgentRequest = async (
  req: AppNextApiRequest,
  res: NextApiResponse
) => {
  const session = req.session;
  const agentId = req.body.agentId as string;
  const data = req.body as ChatRequest;
  const visitorId = data.visitorId || cuid();
  const hasContact =
    data?.contact?.email || data?.contact?.phoneNumber || data?.contact?.userId;
  const conversationId = data.conversationId || cuid();

  if (data.isDraft && !session?.organization?.id) {
    throw new ApiError(ApiErrorType.UNAUTHORIZED);
  }

  // Assign the channel based on the type of authentication and received data
  if (
    (session?.authType === 'apiKey' && data.channel !== ConversationChannel.form) ||
    !data.channel
  ) {
    data.channel = ConversationChannel.api;
  }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      organization: {
        select: {
          id: true,
          contacts: {
            take: 1,
            where: {
              OR: [
                ...(hasContact
                  ? [
                    data.contact?.email ? { email: data.contact.email } : {},
                    data.contact?.phoneNumber ? { phoneNumber: data.contact.phoneNumber } : {},
                    data.contact?.userId ? { externalId: data.contact.userId } : {},
                  ]
                  : []),
              ],
            },
          },
          conversations: {
            where: { id: conversationId },
            take: 1,
            select: { id: true, status: true, isAiEnabled: true },
          },
        },
      },
    },
  });

  if (!agent) {
    throw new ApiError(ApiErrorType.NOT_FOUND);
  }

  if (
    agent.visibility === AgentVisibility.private &&
    agent?.organization?.id !== session?.organization?.id
  ) {
    throw new ApiError(ApiErrorType.UNAUTHORIZED);
  }

  // If contact information is provided and it does not yet exist in the organization, create it.
  let existingContact = agent?.organization?.contacts[0] || null;
  if (hasContact && !existingContact) {
    try {
      existingContact = await prisma.contact.create({
        data: {
          email: data?.contact?.email,
          phoneNumber: data?.contact?.phoneNumber,
          externalId: data?.contact?.userId,
          firstName: data?.contact?.firstName,
          lastName: data?.contact?.lastName,
          organization: { connect: { id: agent?.organization?.id } },
          metadata: getRequestLocation(req),
        },
      });
    } catch (error) {
      console.error('Error al crear el contacto:', error);
    }
  }

  const conversation = agent?.organization?.conversations[0]
    ? {
      ...agent.organization.conversations[0],
      isAiEnabled:
        agent.organization.conversations[0].isAiEnabled === null
          ? undefined
          : agent.organization.conversations[0].isAiEnabled,
    }
    : undefined;

  // If streaming is required, configure the response as SSE.
  if (data.streaming) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });
  }

  const agentForMessage = {
    ...agent,
    organizationId: agent.organization?.id ?? '',
  };

  const chatRes = await handleChatMessageV2({
    ...data,
    logger: req.logger,
    conversation,
    location: getRequestLocation(req),
    userId: session?.user?.id,
    visitorId,
    contactId: existingContact?.id || data.contactId,
    agent: agentForMessage,
  });
  // In this example, since the simplified function does not generate an agent response,
  // only the information of the created conversation is sent.
  await service.addMessage(agentId, data.query, {
    conversationId,
    visitorId,
    accountId: '',
  });

  if (data.streaming) {
    streamData({
      event: SSE_EVENT.endpoint_response,
      data: JSON.stringify({
        messageId: chatRes.answerMsgId,
        conversationId: chatRes.conversationId,
        visitorId,
        status: chatRes.status,
      }),
      res,
    });
    streamData({ data: '[DONE]', res });
  } else {
    return {
      messageId: chatRes.answerMsgId,
      conversationId: chatRes.conversationId,
      visitorId,
      request_human: chatRes.humand_request === undefined ? true : !chatRes.humand_request,
      status: chatRes.status,
    };
  }
};

handler.post(pipe(respond(chatAgentRequest)));

export default pipe(cors({ methods: ['POST', 'HEAD'] }), handler);