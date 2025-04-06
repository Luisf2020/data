import axios from 'axios';
import cuid from 'cuid';
import { NextApiResponse } from 'next';

import { transcribeAudio } from '@chaindesk/lib/TranscribeAudio';
import handleChatMessageV2 from '@chaindesk/lib/v2/conversation/handle-chat-human';

import { ApiError } from '@chaindesk/lib/api-error';
import getRequestLocation from '@chaindesk/lib/get-request-location';
import handleChatMessage, {
  ChatAgentArgs,
  ChatConversationArgs,
} from '@chaindesk/lib/handle-chat-message';
import logger from '@chaindesk/lib/logger';
import cors from '@chaindesk/lib/middlewares/cors';
import pipe from '@chaindesk/lib/middlewares/pipe';
import streamData from '@chaindesk/lib/stream-data';
import { AppNextApiRequest, SSE_EVENT } from '@chaindesk/lib/types';
import {
  ConversationStatus,
} from '@chaindesk/prisma';
import { prisma } from '@chaindesk/prisma/client';
import { bufferService } from '@chaindesk/lib/queue/buffer-service';
import { createLazyAuthHandler, respond } from '@chaindesk/lib/createa-api-handler';

interface MessageRequest {
  conversation: { status: string; id: string };
  sender: { account: { id: string } };
  account: { id: string };
  content: string;
  message_type: string;
  context: any;
  enableStreaming: boolean;
}

interface CRMMessagePayload {
  accountId: string;
  conversationId: string;
  content: string;
  messageType: 'outgoing' | 'incoming';
  isPrivate: boolean;
  contentType: 'input_email' | 'cards' | 'input_select' | 'form' | 'article';
  contentAttributes: object;
  templateParams: object;
  token: string;
}

async function downloadFileFromUrl(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Error downloading file');
  return await response.blob();
}

// Custom error handler
const handleError = (res: NextApiResponse, error: any) => {
  logger.error('Chat Agent Error:', error);

  if (error instanceof ApiError) {
    return res.status((error as any).statusCode).json({
      error: error.message,
      code: (error as any).type,
    });
  }

  return res.status(500).json({
    error: 'Internal server error',
    message: error.message,
  });
};

const handler = createLazyAuthHandler();

export const chatAgentRequest = async (
  req: AppNextApiRequest,
  res: NextApiResponse
) => {
  try {
    logger.info('Starting chat agent request');
    const id = req.query.id as string;
    const session = req.session;

    // Validate required fields
    if (!id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Agent ID is required',
      });
    }

    console.log('Request Body Full:', JSON.stringify(req.body, null, 2));
    const data = req.body;

    // Validate request body
    if (!data?.conversation?.id || !data?.account?.id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields in request body',
      });
    }

    if (data.message_type !== 'incoming') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid message type. Only incoming messages are supported.',
      });
    }

    // Handle audio transcription
    let transcription = '';
    const audioAttachment =
      data.attachments?.find((attachment: any) => attachment.file_type === 'audio') ||
      data.context?.attachments?.find((attachment: any) => attachment.file_type === 'audio');

    console.log('Find audiio attachement')
    console.log(audioAttachment)

    if (audioAttachment) {
      logger.info('Audio file detected, starting transcription');
      const audioBlob = await downloadFileFromUrl(audioAttachment?.data_url);
      console.log('Audio blob')
      console.log(audioBlob)
      transcription = await transcribeAudio(audioBlob);
    }
    console.log('Transcription......')
    console.log(transcription)

    // If transcription exists, update the query content
    if (transcription) {
      logger.info('Transcription completed, updating request content');
      data.content = transcription;
    }

    const visitorId = data.sender.account.id || cuid();
    const conversationId = `crmchatsappai_${String(data.account.id)}_${String(data.conversation.id)}`;
    const messageStatus = data.conversation.status as 'open' | 'resolved' | 'pending';

    // Handle resolved status
    if (messageStatus === 'resolved') {
      await updateConversationStatus(conversationId, 'RESOLVED', true);
    }

    // Early return for unsupported status
    if (!['pending', 'resolved'].includes(messageStatus)) {
      return res.status(200).json({
        message: 'Message status not actionable',
        agent_id: id,
        ignored: true,
      });
    }

    // Fetch agent with detailed error handling
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
                OR: [{ conversationsV2: { some: { id: conversationId } } }],
              },
            },
            conversations: {
              ...ChatConversationArgs,
              take: 1,
              where: {
                id: conversationId,
                participantsAgents: { some: { id } },
              },
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

    if (!agent) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Agent with ID ${id} not found`,
      });
    }

    // Set up streaming if enabled
    const ctrl = new AbortController();
    if (data.enableStreaming) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      });

      req.socket.on('close', () => {
        logger.info('Client disconnected, aborting stream');
        ctrl.abort();
      });
    }

    const handleStream = (data: string, event: SSE_EVENT) => {
      return streamData({
        event: event || SSE_EVENT.answer,
        data,
        res,
      });
    };

    // Handle contact logic
    let existingContact = agent?.organization?.contacts?.[0];
    const tokenRecord = await prisma.cRMChatsappaiToken.findFirst({
      where: { organizationId: String(agent?.organizationId) }
    });

    if (!tokenRecord?.tokenAgentBot) {
      return res.status(400).json({
        error: 'Configuration Error',
        message: 'Missing CRM token configuration',
      });
    }

    const commonData = {
      ...data,
      query: data.content,
      logger: req.logger,
      location: getRequestLocation(req),
      userId: session?.user?.id,
      visitorId,
      contactId: existingContact?.id || data.contactId,
    };

    // Process chat message
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
      await bufferService.addMessage(id, data.content, {
        conversationId,
        visitorId,
        type: 'CRM',
        accountId: data.account.id,
        contactId: existingContact?.id || data.contactId,
        crmConversationId: data.conversation.id,
        userId: session?.user?.id,
        location: getRequestLocation(req),
        messageType: 'incoming',
        isPrivate: false,
        contentType: 'input_email',
        contentAttributes: {},
        templateParams: {},
        token: tokenRecord.tokenAgentBot
      });
    } else {
      chatRes = await handleChatMessage({
        logger,
        agent: agent as ChatAgentArgs,
        conversation: agent?.organization?.conversations?.[0],
        handleStream,
        abortController: ctrl,
        location: getRequestLocation(req),
        visitorId,
        contactId: existingContact?.id,
        context: undefined,
        query: data.content,
        queryArray: [],
        channel: 'api',
        conversationId
      });
      // Send response to CRM
      await sendMessageToCRM({
        accountId: data.account.id,
        conversationId: data.conversation.id,
        content: chatRes?.agentResponse?.answer!,
        messageType: 'incoming',
        isPrivate: false,
        contentType: 'input_email',
        contentAttributes: {},
        templateParams: {},
        token: tokenRecord.tokenAgentBot
      });

      // Handle human handoff if needed
      const humanRequest = chatRes?.humand_request === undefined ? false : !chatRes?.humand_request;
      if (humanRequest) {
        await chatwoot_human_handoff(
          data.conversation.id,
          tokenRecord.tokenAgentBot,
          data.account.id
        );
      }

      return res.status(200).json({
        ...chatRes.agentResponse,
        messageId: chatRes.answerMsgId,
        conversationId: chatRes.conversationId,
        visitorId: visitorId,
        request_human: humanRequest,
        status: chatRes.status,
      });
    }

    return res.status(200).json({})


  } catch (error) {
    return handleError(res, error);
  }
};

const sendMessageToCRM = async (payload: CRMMessagePayload) => {
  console.log('Message CRM', payload)
  const url = `https://crm.chatsappai.com/api/v1/accounts/${payload?.accountId}/conversations/${payload?.conversationId}/messages`;
  console.log('URL', url)

  const dataSend = {
    content: payload?.content,
    private: false,
    message_type: "outgoing",
    content_attributes: payload?.contentAttributes,
    template_params: payload?.templateParams,
  }

  try {
    const response = await axios.post(url, dataSend, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'api_access_token': payload.token
      },
    });
    console.log(response)
    logger.info('Message sent to CRM successfully');
    return response.data;
  } catch (error: any) {
    console.log(error)
    logger.error('Failed to send message to CRM:', error.message);
    throw new Error(`Failed to send message to CRM: ${error.message}`);
  }
};

const chatwoot_human_handoff = async (conversationId: string, token: string, accountId: string) => {
  const url = `https://crm.chatsappai.com/api/v1/accounts/${accountId}/conversations/${conversationId}/toggle_status`;

  try {
    const response = await axios.post(
      url,
      { status: 'open' },
      {
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': token,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`Failed to change status. Status: ${response.status}`);
    }

    logger.info('Human handoff completed successfully');
    return response.data;
  } catch (error: any) {
    logger.error('Human handoff failed:', error.message);
    throw new Error(`Failed to initiate human handoff: ${error.message}`);
  }
};

const updateConversationStatus = async (
  conversationId: string,
  status: string,
  isAiEnabled: boolean
) => {
  try {
    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: status as ConversationStatus,
        isAiEnabled,
      },
    });
    logger.info('Conversation status updated successfully');
    return updated;
  } catch (error: any) {
    logger.error('Failed to update conversation status:', error.message);
    throw new Error(`Failed to update conversation status: ${error.message}`);
  }
};

handler.post(pipe(respond(chatAgentRequest)));

export default pipe(cors({ methods: ['POST', 'HEAD'] }), handler);
