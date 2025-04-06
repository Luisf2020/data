import { NextApiRequest, NextApiResponse } from 'next';
import formatSourcesRawText from '@chaindesk/lib/form-sources-raw-text';
import filterInternalSources from '@chaindesk/lib/filter-internal-sources';
import { AppNextApiRequest } from '@chaindesk/lib/types';
import cors from '@chaindesk/lib/middlewares/cors';
import pipe from '@chaindesk/lib/middlewares/pipe';
import prisma from '@chaindesk/prisma/client';
import { ApiError, ApiErrorType } from '@chaindesk/lib/api-error';
import { CreateAttachmentSchema } from '@chaindesk/lib/types/dtos';
import getRequestLocation from '@chaindesk/lib/get-request-location';
import cuid from 'cuid';
import handleChatMessage, {
  ChatAgentArgs,
  ChatConversationArgs,
} from '@chaindesk/lib/handle-chat-message';
import {
  ConversationChannel,
} from '@chaindesk/prisma';
import { currentDatePrompt, currentPhoneNumberNamePrompt } from '@chaindesk/lib/context-data-agents';
import { WebhookBody } from '@app/types/mercadolibre';
import { log } from 'node:console';

// Función que procesa la notificación en segundo plano
async function processNotification(req: AppNextApiRequest, body: WebhookBody) {
  try {
    const { user_id, resource } = body;
    // obtenemos el id de la pregunta 
    const parts = resource.split('/');
    const questionId = parts[2];
    const channelExternalId = questionId;
    console.log("***********RESOURCE********", resource);
    console.log("***********user_id********", user_id);
    const userIdStr = user_id.toString();

    const credentials = await prisma.serviceProvider.findFirst({
      where: {
        type: "mercadolibre",
        config: {
          path: ["user_id"],
          equals: userIdStr,
        },
      },
      include: {
        organization: {
          include: {
            subscriptions: {
              where: { status: { in: ["active", "trialing"] } },
            },
            contacts: {
              where: { externalId: channelExternalId },
            },
          },
        },
        agents: {
          ...ChatAgentArgs,
          take: 1,
          include: {
            ...ChatAgentArgs.include,
            conversations: {
              ...ChatConversationArgs,
              take: 1,
              where: { channelExternalId },
            },
          },
        },
      },
    });

    console.log("***********CREDENTIALS********", credentials);

    if (!credentials) {
      throw new ApiError(ApiErrorType.NOT_FOUND);
    }
    const agent = credentials.agents?.[0];
    if (!agent) {
      throw new ApiError(ApiErrorType.NOT_FOUND);
    }
    const conversation = agent.conversations?.[0];
    if (conversation && conversation.channelExternalId === channelExternalId) {
      console.log('La conversación ya existe. No se requiere procesamiento adicional.');
      return

    }
    // Refrescar token en MercadoLibre
    const refreshUrl = 'https://api.mercadolibre.com/oauth/token';
    const refreshParams = new URLSearchParams();
    refreshParams.append('grant_type', 'refresh_token');
    refreshParams.append('client_id', process.env.MERCADOLIBRE_CLIENT_ID!);
    refreshParams.append('client_secret', process.env.MERCADOLIBRE_CLIENT_SECRET!);
    refreshParams.append('refresh_token', (credentials.config as any)?.refresh_token);

    const refreshResponse = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: refreshParams.toString(),
    });

    if (!refreshResponse.ok) {
      throw new ApiError(ApiErrorType.NOT_FOUND);
    }
    const tokenData = await refreshResponse.json();
    console.log('Nuevos tokens recibidos:', tokenData);

    await prisma.serviceProvider.update({
      where: { id: credentials.id },
      data: {
        accessToken: tokenData.access_token,
        config: {
          ...(credentials.config as any),
          refresh_token: tokenData.refresh_token,
        },
      },
    });
    credentials.accessToken = tokenData.access_token;
    (credentials.config as any).refresh_token = tokenData.refresh_token;

    // Obtener la pregunta desde MercadoLibre
    console.log("***********CONVERSATION********", conversation);
    const conversationId = conversation?.id || cuid();
    const questionResponse = await fetch(`https://api.mercadolibre.com${resource}`, {
      headers: { Authorization: `Bearer ${credentials.accessToken}` },
    });
    if (!questionResponse.ok) {
      throw new ApiError(ApiErrorType.NOT_FOUND);
    }
    const question = await questionResponse.json();
    // Buscar o crear contacto en la organización
    let appContact = credentials.organization?.contacts?.[0];
    const attachments = [] as CreateAttachmentSchema[];
    if (!appContact) {
      console.log("***********ORG ID*********", agent.organizationId);
      appContact = await prisma.contact.create({
        data: {
          externalId: questionId,
          organizationId: agent.organizationId!,
          metadata: getRequestLocation(req)
        },
      });
    }
    const productResponse = await fetch(`https://api.mercadolibre.com/items?ids=${question.item_id}`, {
      headers: { Authorization: `Bearer ${credentials.accessToken}` },
    });
    if (!productResponse.ok) {
      throw new ApiError(ApiErrorType.NOT_FOUND);
    }
    const product = await productResponse.json();
    const productInfo = product[0].body;
    log("***********PRODUCT***********", product);
    const contextDataAgents = `${currentPhoneNumberNamePrompt()}\n\n${currentDatePrompt()}`;
    const chatResponse = await handleChatMessage({
      logger: req.logger,
      channel: ConversationChannel.mercadolibre,
      agent,
      conversation,
      query: question.text || "🧷",
      contactId: appContact.id,
      attachments,
      channelExternalId,
      channelCredentialsId: credentials.id,
      location: getRequestLocation(req),
      queryArray: [],
      contextDataAgents,
      productInfo,
    });

    if (chatResponse?.agentResponse) {
      const { answer, sources } = chatResponse.agentResponse;
      const finalAnswer = `${answer}\n\n${formatSourcesRawText(
        agent.includeSources ? filterInternalSources(sources || []) : []
      )}`.trim();
      try {
        const answerPayload = {
          question_id: questionId,
          text: finalAnswer,
        };
        const answerResponse = await fetch('https://api.mercadolibre.com/answers', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(answerPayload),
        });
        const answerData = await answerResponse.json();
        const externalIdResponse = answerData.id;
        if (externalIdResponse && !appContact.externalId) {
          const contactWithExternalId = await prisma.contact.findUnique({
            where: {
              unique_external_id_for_org: {
                externalId: externalIdResponse,
                organizationId: agent.organizationId!,
              },
            },
          });
          if (contactWithExternalId) {
            await prisma.$transaction([
              prisma.message.update({
                where: { id: chatResponse.inputMessageId },
                data: {
                  contact: {
                    connect: { id: contactWithExternalId.id },
                  },
                },
              }),
              prisma.contact.delete({
                where: { id: appContact.id },
              }),
            ]);
          } else {
            await prisma.contact.update({
              where: { id: appContact.id },
              data: { externalId: channelExternalId },
            });
          }
        }
      } catch (error) {
        console.error('Error al publicar la respuesta:', error);
      }
    }
  } catch (error) {
    console.error("Error procesando la notificación de MercadoLibre:", error);
  }
}

export const handler = async (req: AppNextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const body: WebhookBody = req.body;
    console.dir(body, { depth: null });

    // Si el topic es "questions", respondemos inmediatamente y luego procesamos en background
    if (body.topic === "questions") {
      // Responder de inmediato
      res.status(200).end();
      console.log("ATALA4");
      // Ejecutar el procesamiento sin esperar la finalización (fire-and-forget)
      (async () => {
        await processNotification(req, body);
      })();
      return;
    } else {
      return res.status(500).end();
    }
  } else {
    return res.status(405).send("Method Not Allowed");
  }
};

export default pipe(cors({ methods: ['GET', 'POST'] }), handler);
