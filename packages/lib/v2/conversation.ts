import cuid from 'cuid';
import { prisma } from '@chaindesk/prisma/client';
import { MessageFrom, ConversationChannel } from '@chaindesk/prisma';

// Versión mínima del ConversationManager, enfocada en guardar mensajes humanos.
export default class ConversationManager {
  conversationId: string;
  channel: ConversationChannel;
  organizationId: string;

  constructor({
    conversationId,
    channel,
    organizationId,
  }: {
    conversationId: string;
    channel: ConversationChannel;
    organizationId: string;
  }) {
    this.conversationId = conversationId;
    this.channel = channel;
    this.organizationId = organizationId;
  }

  /**
   * Crea un mensaje humano y lo inserta en la conversación.
   * Si la conversación no existe, se crea con los datos mínimos.
   */
  async createHumanMessage({
    text,
    visitorId,
    agentId,
  }: {
    text: string;
    visitorId?: string;
    agentId?: string;
  }) {
    const messageId = cuid();
    return prisma.conversation.upsert({
      where: { id: this.conversationId },
      create: {
        id: this.conversationId,
        channel: this.channel,
        organization: { connect: { id: this.organizationId } },
        messages: {
          create: {
            id: messageId,
            text,
            from: MessageFrom.human, // Se fuerza que el mensaje sea humano
            visitorId,
            agentId,
          },
        },
      },
      update: {
        messages: {
          create: {
            id: messageId,
            text,
            from: MessageFrom.human,
            visitorId,
            agentId,
          },
        },
      },
      include: { messages: true },
    });
  }
}
