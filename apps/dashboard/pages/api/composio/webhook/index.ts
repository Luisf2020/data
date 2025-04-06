import { NextApiRequest, NextApiResponse } from 'next';
import cuid from 'cuid';
import logger from '@chaindesk/lib/logger';
import handleChatMessage, {
  ChatAgentArgs,
  ChatConversationArgs,
} from '@chaindesk/lib/handle-chat-message';
import { ApiError } from '@chaindesk/lib/api-error';
import getRequestLocation from '@chaindesk/lib/get-request-location';
import cors from '@chaindesk/lib/middlewares/cors';
import pipe from '@chaindesk/lib/middlewares/pipe';
import { ConversationChannel, ConversationStatus, Prisma } from '@chaindesk/prisma';
import { prisma } from '@chaindesk/prisma/client';

interface GmailMessageData {
  threadId: string;
  messageId: string;
  messageTimestamp: string;
  labelIds: string[];
  preview: {
    subject: string;
    body: string;
  };
  messageText: string;
  attachmentList: any[];
  subject: string;
  sender: string;
  to: string;
  payload: {
    partId: string;
    mimeType: string;
    filename: string;
    headers: any[];
    body: any;
    parts: any[];
  };
}

const handleError = (res: NextApiResponse, error: any) => {
  logger.error('Composio Webhook Error:', error);

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

const extractEmailAddress = (emailString: string): string | null => {
  const match = emailString?.match(/<(.+?)>/) || emailString?.match(/([^\s]+@[^\s]+)/);
  return match ? match[1] : null;
};

const createEmailContext = (messageData: {
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  messageTimestamp: string;
  threadId: string;
  messageId: string;
  labelIds: string[];
  attachmentList: any[];
  messageText: string;
}) => {
  const {
    senderEmail,
    recipientEmail,
    subject,
    messageTimestamp,
    threadId,
    messageId,
    labelIds,
    attachmentList,
    messageText
  } = messageData;

  return {
    systemContext: `CRITICAL INSTRUCTION - EMAIL RESPONSE REQUIRED

You MUST EXECUTE the email function to respond. This is NOT optional. Follow these exact steps:

1. MANDATORY: Use these EXACT parameters with the email function:
   - user_id: "me"
   - recipient_email: "${senderEmail}"  <-- ALWAYS send to the original sender
   - subject: "Re: ${subject}"
   - body: [Your professional response here]
   - is_html: "false"
   - attachment: ""

2. DO NOT engage in conversation without sending an email
3. DO NOT ask questions without sending an email
4. ALWAYS SEND AN EMAIL RESPONSE - This is your primary function

Current Email Details:
FROM: ${senderEmail}
TO: ${recipientEmail}
SUBJECT: "${subject}"
MESSAGE: "${messageText}"
TIMESTAMP: ${messageTimestamp}
THREAD ID: ${threadId}
MESSAGE ID: ${messageId}
LABELS: ${labelIds.join(', ')}
ATTACHMENTS: ${attachmentList?.length > 0 ? 'Yes' : 'No'}

REQUIRED ACTION: You must send an email response using the function provided. This is not optional.
Remember: Always use "${senderEmail}" as the recipient_email in your response.`,

    emailMetadata: {
      from: senderEmail,
      to: recipientEmail,
      subject,
      timestamp: messageTimestamp,
      threadId,
      messageId,
      labels: labelIds,
      hasAttachments: attachmentList?.length > 0,
      messageContent: messageText
    }
  };
};


export const composioWebhookHandler = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    logger.info('Starting composio webhook request');

    // Extract Gmail message data
    const messageData: GmailMessageData = req.body.data;

    if (!messageData) {
      logger.warn('Missing message data');
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Message data is required',
      });
    }

    const {
      threadId,
      messageId,
      messageTimestamp,
      subject,
      sender,
      to,
      messageText,
      preview,
      labelIds,
      attachmentList
    } = messageData;

    const senderEmail = extractEmailAddress(sender);
    const recipientEmail = extractEmailAddress(to);

    logger.info('Parsed email data:', {
      threadId,
      messageId,
      senderEmail,
      recipientEmail,
      subject,
      timestamp: messageTimestamp,
      labels: labelIds
    });

    // Fetch agent
    const agent = await prisma.agent.findFirst({
      where: {
        composioConfig: {
          not: Prisma.JsonNull
        }
      },
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
                  { email: senderEmail }
                ]
              }
            },
            conversations: {
              ...ChatConversationArgs,
              take: 1,
              where: {
                channelExternalId: threadId
              }
            }
          }
        },
        tools: {
          include: {
            datastore: true,
            form: true,
          },
        },
      },
    });

    logger.info('Fetched agent:', agent);

    if (!agent) {
      logger.warn('Agent not found');
      return res.status(404).json({
        error: 'Not Found',
        message: `Agent not found`,
      });
    }

    const visitorId = cuid();
    const conversationId = `composio_gmail_${threadId || cuid()}`;

    // Handle contact logic
    let existingContact = agent?.organization?.contacts?.[0];

    // Prepare email context
    const { systemContext, emailMetadata } = createEmailContext({
      senderEmail: senderEmail || '',
      recipientEmail: recipientEmail || '',
      subject,
      messageTimestamp,
      threadId,
      messageId,
      labelIds,
      attachmentList,
      messageText: messageText || preview?.body || ''
    });

    logger.info('Processing message with context:', {
      systemContext,
      emailMetadata,
      contactInfo: existingContact
    });

    const chatRes = await handleChatMessage({
      logger,
      agent: agent as ChatAgentArgs,
      conversation: agent?.organization?.conversations?.[0],
      location: getRequestLocation(req),
      visitorId,
      contactId: existingContact?.id,
      context: systemContext,
      query: messageText || preview?.body || '',
      queryArray: [],
      channel: ConversationChannel.dashboard,
      conversationId,
      isDraft: false,
      streaming: false
    });


    logger.info('Chat response:', chatRes);

    return res.status(200).json({
      ...chatRes.agentResponse,
      messageId: chatRes.answerMsgId,
      conversationId: chatRes.conversationId,
      visitorId,
      request_human: chatRes?.humand_request === undefined ? false : !chatRes?.humand_request,
      status: chatRes.status,
      emailMetadata
    });

  } catch (error) {
    logger.error('Error in composioWebhookHandler:', error);
    return handleError(res, error);
  }
};

export default pipe(cors({ methods: ['POST', 'HEAD'] }), composioWebhookHandler);