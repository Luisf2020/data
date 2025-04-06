import handleChatIAMessage from '@chaindesk/lib/v2/agents/handle-chat-agent';
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
import { ChatAgentArgs, ChatConversationArgs } from '@chaindesk/lib/handle-chat-message';

const handler = createLazyAuthHandler();

export const chatAgentRequest = async (
  req: AppNextApiRequest,
  res: NextApiResponse
) => {
  const session = req.session;
  const agentId = req.body.id as string;
  const data = req.body as ChatRequest;
  const visitorId = data.visitorId || cuid();
  const hasContact =
    data?.contact?.email || data?.contact?.phoneNumber || data?.contact?.userId;
  const conversationId = data.conversationId || cuid();

  // 🚫 Si es un borrador y no hay organización, se rechaza.
  if (data.isDraft && !session?.organization?.id) {
    throw new ApiError(ApiErrorType.UNAUTHORIZED);
  }

  // 📡 Asignamos el canal según el tipo de autenticación y datos recibidos
  if (
    (session?.authType === 'apiKey' && data.channel !== ConversationChannel.form) ||
    !data.channel
  ) {
    data.channel = ConversationChannel.api;
  }

  // 🔍 Buscamos el agente y la organización
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
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
              : { AND: { id: conversationId, participantsAgents: { some: { id: agentId } } } },
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
    throw new ApiError(ApiErrorType.NOT_FOUND);
  }

  // 🚫 Si el agente es privado y la organización no coincide, se rechaza.
  if (
    agent.visibility === AgentVisibility.private &&
    agent?.organization?.id !== session?.organization?.id
  ) {
    throw new ApiError(ApiErrorType.UNAUTHORIZED);
  }

  // 📇 Si hay información de contacto y no existe en la organización, se crea.
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

  // 📥 Obtenemos la conversación (si existe) para agregar la respuesta
  // Obtenemos la conversación (si existe) para agregar la respuesta,
  // completando con valores por defecto para que cumpla con ChatConversationArgs

  // 📡 Si se solicita streaming, configuramos la respuesta SSE.
  if (data.streaming) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });
  }

  // 🤖 Preparamos la información del agente para el mensaje
  // Primero creamos agentForMessage a partir del agente obtenido

  // 🔄 Transformamos el agente para que cumpla con el tipo AgentWithTools:
  // Solo se conservan las propiedades requeridas, y la propiedad "organization" se mapea a { usage }

  // 🚀 Llamamos a la función que procesa la consulta y devuelve la respuesta de la IA
  const chatRes = await handleChatIAMessage({
    ...data,
    logger: req.logger,
    conversation: agent?.organization?.conversations[0],
    location: getRequestLocation(req),
    userId: session?.user?.id,
    visitorId,
    contactId: existingContact?.id || data.contactId,
    agent: agent as ChatAgentArgs,
  });

  // 📡 Si se solicita streaming, enviamos la respuesta vía SSE
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
    // ✅ Retornamos solo la respuesta de la IA y los IDs importantes.
    return {
      messageId: chatRes.answerMsgId,
      conversationId: chatRes.conversationId,
      visitorId,
      status: chatRes.status,
    };
  }
};

handler.post(pipe(respond(chatAgentRequest)));

export default pipe(cors({ methods: ['POST', 'HEAD'] }), handler);
