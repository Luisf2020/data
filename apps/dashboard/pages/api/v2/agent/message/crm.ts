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
import { bufferService } from '@chaindesk/lib/queue/buffer-service';
import { ChatAgentArgs, ChatConversationArgs } from '@chaindesk/lib/handle-chat-message';
import axios from 'axios';
import logger from '@chaindesk/lib/logger';

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
  agentMessages: any[];
}


const handler = createLazyAuthHandler();

export const chatAgentRequest = async (
  req: AppNextApiRequest,
  res: NextApiResponse
) => {
  const session = req.session;
  console.log(req.body)
  const agentId = req.body.id as string;
  const data = req.body as any;
  const visitorId = data.visitorId || cuid();
  const hasContact =
    data?.contact?.email || data?.contact?.phoneNumber || data?.contact?.userId;
  const conversationId = data.conversationId || cuid();
  logger.info('You arrived on time')
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

  // 🚫 If the agent is private and the organization does not match, reject the request.
  if (
    agent.visibility === AgentVisibility.private &&
    agent?.organization?.id !== session?.organization?.id
  ) {
    throw new ApiError(ApiErrorType.UNAUTHORIZED);
  }

  // 📇 If there is contact information and it does not exist in the organization, create it.
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

  const tokenRecord = await prisma.cRMChatsappaiToken.findFirst({
    where: { organizationId: String(agent?.organizationId) }
  });

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
    contactId: existingContact?.id || data.accountId,
    agent: agent as ChatAgentArgs,
  });


  if (chatRes?.agentMessages && chatRes.agentMessages.length > 0) {
    await sendAgentMessagesToCRM({
      accountId: data?.metada?.accountId,
      conversationId: data?.metada?.crmConversationId,
      content: '', // Este campo se reemplaza dentro del loop
      messageType: 'incoming',
      isPrivate: false,
      contentType: 'input_email',
      contentAttributes: {},
      templateParams: {},
      token: tokenRecord?.tokenAgentBot ?? '',
      agentMessages: chatRes.agentMessages,
    });
  } else {
    // Sino, se envía la respuesta completa
    await sendMessageToCRM({
      accountId: data?.metada?.accountId,
      conversationId: data?.metada?.crmConversationId,
      content: `📌 ${chatRes?.agentResponse?.answer ?? ''}`,
      messageType: 'incoming',
      isPrivate: false,
      contentType: 'input_email',
      contentAttributes: {},
      templateParams: {},
      token: tokenRecord?.tokenAgentBot ?? '',
      agentMessages: [], // opcional o se puede omitir en este caso
    });
  }


  // Handle human handoff if needed
  const humanRequest = chatRes?.humand_request === undefined ? false : !chatRes?.humand_request;
  if (humanRequest) {
    if (tokenRecord) {
      await chatwoot_human_handoff(
        data?.metada?.crmConversationId,
        tokenRecord.tokenAgentBot,
        data.metada.accountId
      );
    } else {
      // Handle the case where tokenRecord is null
      logger.error('Token record is null, cannot proceed with human handoff');
    }
  }

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

const sendAgentMessagesToCRM = async (
  payload: CRMMessagePayload & { agentMessages: Array<{ id: string; text: string }> }
) => {
  console.log('🚀 Enviando mensajes al CRM de forma secuencial...');
  for (const message of payload.agentMessages) {
    try {
      // 🔄 Para cada mensaje, preparamos el payload reemplazando el contenido
      const messagePayload: CRMMessagePayload = {
        ...payload,
        content: message.text, // 📬 Usamos el texto del mensaje actual
      };
      console.log(`⏳ Enviando mensaje ${message.id}: "${message.text}"`);
      // 🕒 Esperamos a que se envíe el mensaje antes de continuar
      await sendMessageToCRM(messagePayload);
      console.log(`✅ Mensaje ${message.id} enviado correctamente.`);
    } catch (error: any) {
      console.error(`❌ Error al enviar el mensaje ${message.id}: ${error.message}`);
      // ❗ Puedes decidir si abortar toda la secuencia o continuar; en este caso se aborta
      throw new Error(`Error al enviar el mensaje ${message.id}: ${error.message}`);
    }
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


handler.post(pipe(respond(chatAgentRequest)));

export default pipe(cors({ methods: ['POST', 'HEAD'] }), handler);
