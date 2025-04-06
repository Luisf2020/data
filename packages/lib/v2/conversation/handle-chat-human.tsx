import cuid from 'cuid';
import {
  ConversationChannel,
  ConversationStatus,
  MessageFrom,
} from '@chaindesk/prisma';
import type { ChatRequest } from '../../types/dtos';
import getRequestLocation from '../../get-request-location';
import ConversationManager from '../../conversation';

// While the original Props included properties related to the agent and others,
// here we only keep the necessary parameters for creating the human message.
type Props = Omit<ChatRequest, 'isDraft' | 'streaming'> & {
  logger?: any;
  location?: ReturnType<typeof getRequestLocation>;
  userId?: string;
  // The agent property is retained in case the ConversationManager requires the organizationId.
  agent: { organizationId: string };
  conversation?: { id?: string; status?: ConversationStatus; isAiEnabled?: boolean };
  isDraft?: boolean;
};

async function handleChatMessage({ agent, conversation, ...data }: Props) {
  // Determine if this is a new conversation
  const isNewConversation = !conversation?.id;
  const channel = (data.channel || ConversationChannel.dashboard) as ConversationChannel;
  const conversationId = conversation?.id || data.conversationId || cuid();
  const isDashboardMessage = channel === ConversationChannel.dashboard && !!data.userId;
  const visitorId = String(data.visitorId || cuid());

  // Initialize the ConversationManager
  const conversationManager = new ConversationManager({
    channel,
    organizationId: agent.organizationId,
    formId: data.formId!,
    conversationId,
    ...(data as any).channelExternalId && { channelExternalId: (data as any).channelExternalId },
    ...(data as any).channelCredentialsId && { channelCredentialsId: (data as any).channelCredentialsId },
    ...(!data.userId && isNewConversation && data?.location?.country
      ? { metadata: { country: data.location.country } }
      : {}),
    location: data.location,
  });

  // Generate an id for the input (human) message
  const inputMessageId = cuid();
  if (!data.query) {
    throw new Error('The "query" field is required to create the message');
  }
  console.log(data?.queryArray?.length && data.queryArray.length > 1)
  // If multiple queries are received, create multiple messages and concatenate the texts
  if (data?.queryArray?.length && data.queryArray.length > 1) {
    let concatenatedQueries = '';

    const messagePromises = data.queryArray.map((query: string) => {
      concatenatedQueries += query + '\n';
      return conversationManager.createMessage({
        id: cuid(),
        from: MessageFrom.human,
        text: query || '',
        attachments: data.attachments,
        externalId: (data as any).externalMessageId,
        externalVisitorId: (data as any).externalVisitorId,
        visitorId: isDashboardMessage ? undefined : visitorId,
        contactId: isDashboardMessage ? undefined : (data.contactId ?? undefined),
        userId: isDashboardMessage ? data.userId : undefined,
      });
    });

    await Promise.all(messagePromises);
    // Update the query by concatenating the texts
    data.query = concatenatedQueries.trim();
  } else {
    // If it is not a draft, create the human message
    if (!data.isDraft) {
      await conversationManager.createMessage({
        conversationStatus:
          conversation?.status === ConversationStatus.RESOLVED
            ? ConversationStatus.UNRESOLVED
            : conversation?.status,
        id: inputMessageId,
        from: MessageFrom.human,
        text: data.query || '',
        attachments: data.attachments,
        externalId: (data as any).externalMessageId,
        externalVisitorId: (data as any).externalVisitorId,
        visitorId: isDashboardMessage ? undefined : visitorId,
        contactId: isDashboardMessage ? undefined : (data.contactId ?? undefined),
        userId: isDashboardMessage ? data.userId : undefined,
      });
    }
  }

  return {
    inputMessageId,
    conversationId,
    agentResponse: undefined,
    answerMsgId: undefined,
    humand_request: conversation?.isAiEnabled,
    status: conversation?.status,
  };
}

export default handleChatMessage;
