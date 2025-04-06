import { NextApiRequest, NextApiResponse } from 'next';
import formatSourcesRawText from '@chaindesk/lib/form-sources-raw-text';
import filterInternalSources from '@chaindesk/lib/filter-internal-sources';
import { AppNextApiRequest } from '@chaindesk/lib/types';
import cors from '@chaindesk/lib/middlewares/cors';
import pipe from '@chaindesk/lib/middlewares/pipe';
import { MessagingEvent, WebhookBody } from '@app/types/facebook';
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
  ConversationStatus,
  MessageFrom,
} from '@chaindesk/prisma';
import { currentDatePrompt, currentPhoneNumberNamePrompt } from '@chaindesk/lib/context-data-agents';
import { transcribeAudio } from '@chaindesk/lib/TranscribeAudio';
import pMap from 'p-map';
// Constante para el token de verificación
const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN;

// Función para manejar la verificación de los hooks de Facebook
export const handler = async (
  req: AppNextApiRequest,
  res: NextApiResponse
) => {
  if (req.method === "GET") {
    const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN;
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send("Forbidden");
    }
  } else if (req.method === "POST") {
    let body: WebhookBody = req.body;
    console.dir(body, { depth: null });

    if (body.object === "instagram") {
      for (const entry of body.entry) {
        for (const messagingEvent of entry.messaging) {
          if (messagingEvent.message?.is_echo) {
            console.log("Mensaje de eco recibido");
            continue;
          }
          let textMessages = messagingEvent.message?.text || "";
          const messageAttachments = messagingEvent.message?.attachments || [];
          const senderPsId = messagingEvent.sender.id;
          const instagramBusinessId = entry.id;
          const channelExternalId = senderPsId;

          // Validar credenciales de forma asincrónica
          const credentials = await prisma.serviceProvider.findFirst({
            where: {
              type: "meta",
              config: {
                path: ["instagramBusinessId"],
                equals: instagramBusinessId,
              },
            },
            include: {
              organization: {
                include: {
                  subscriptions: {
                    where: {
                      status: {
                        in: ["active", "trialing"],
                      },
                    },
                  },
                  contacts: {
                    where: {
                      instagramId: senderPsId,
                    },
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
                    where: {
                      channelExternalId,

                    },

                  },
                },
              },
            },
          });
          const isPremium = !!credentials?.organization?.subscriptions?.length;

          if (!isPremium) {
            throw new ApiError(ApiErrorType.PREMIUM_FEATURE);
          }

          if (!credentials) {
            throw new ApiError(ApiErrorType.NOT_FOUND);
          }

          const agent = credentials.agents?.[0];

          if (!agent) {
            throw new ApiError(ApiErrorType.NOT_FOUND);
          }

          const conversation = agent.conversations?.[0];
          const conversationId = conversation?.id || cuid();
          let appContact = credentials.organization?.contacts?.[0];
          const attachments = [] as CreateAttachmentSchema[];
          if (messageAttachments && messageAttachments.length > 0) {
            // Array para almacenar las transcripciones de los audios
            const transcribedAudios: string[] = [];

            await pMap(
              messageAttachments,
              async (attachment) => {
                if (attachment.type === "audio") {
                  const audioUrl = attachment.payload.url;
                  try {
                    // Descargamos el audio
                    const downloaded = await fetch(audioUrl);
                    const arrayBuffer = await downloaded.arrayBuffer();
                    const contentType = downloaded.headers.get("content-type");
                    // Creamos un Blob a partir del ArrayBuffer
                    const audioBlob = new Blob([arrayBuffer], {
                      type: contentType || "application/octet-stream",
                    });
                    // Transcribimos el audio (asegúrate de tener implementada o importada la función transcribeAudio)
                    const transcribedText = await transcribeAudio(audioBlob);
                    // Si se obtuvo una transcripción, la agregamos al array
                    if (transcribedText) {
                      console.log("Audio transcrito:", transcribedText);
                      transcribedAudios.push(`Audio transcrito: ${transcribedText}`);
                    }
                  } catch (error) {
                    console.error("Error al procesar el audio:", error);
                  }
                }
              },
              {
                concurrency: 4, // Limita a 4 procesos concurrentes
              }
            );

            // Una vez finalizado el procesamiento, agregamos todas las transcripciones al mensaje original
            if (transcribedAudios.length > 0) {
              console.log("Transcripciones de audios:");

              textMessages += "\n\n" + transcribedAudios.join("\n");
            }
          }
          console.log("***********CREDENTIALS********");

          console.log(credentials);

          console.log("***********APP CONTACT********");
          console.log(appContact);
          const pageAccessToken = (credentials.config as { pageAccessToken: string }).pageAccessToken;
          let igUserProfileName = undefined;
          try {
            const igUserProfile = await fetch(
              `https://graph.facebook.com/v21.0/${senderPsId}?fields=username&access_token=${pageAccessToken}`
            );
            const igUserProfileJson = await igUserProfile.json();
            if (igUserProfileJson) {
              igUserProfileName = igUserProfileJson.username;
              console.log("***********IG USER PROFILE********");
              console.log(igUserProfileJson);
            }
          } catch (error) {
            console.error("Error en la consulta al perfil de Instagram:", error);
            // igUserProfileName se queda como undefined
          }

          if (!appContact) {
            console.log("***********ORG ID*********");

            console.log(agent.organizationId);
            console.log("***********ID*********");
            console.log(senderPsId);

            appContact = await prisma.contact.create({
              data: {
                externalId: senderPsId!,
                instagramId: senderPsId!,
                firstName: igUserProfileName,
                organizationId: agent.organizationId!,
                metadata: getRequestLocation(req)
              },
            });
          }

          if ((messagingEvent.message?.text && messagingEvent.message.text.trim() !== "") || (messagingEvent.message?.attachments && messagingEvent.message.attachments.some(att => att.type === "audio"))) {
            console.log("Mensaje recibido: ", messagingEvent.message.text);

            const contextDataAgents = `${currentPhoneNumberNamePrompt(undefined, igUserProfileName)}\n\n${currentDatePrompt()}`
            const chatResponse = await handleChatMessage({
              logger: req.logger,
              channel: ConversationChannel.meta,
              agent,
              conversation,
              query: textMessages || "🧷",
              contactId: appContact.id,
              attachments,
              channelExternalId,
              channelCredentialsId: credentials.id,
              location: getRequestLocation(req),
              queryArray: [],
              contextDataAgents
            });

            if (chatResponse?.agentResponse) {
              const { answer, sources } = chatResponse.agentResponse;
              const finalAnswer = `${answer}\n\n${formatSourcesRawText(
                !!agent.includeSources ? filterInternalSources(sources || []) : []
              )}`.trim();

              console.log("Final answer: ", finalAnswer);
              const response = await handleMessage(senderPsId, messagingEvent, finalAnswer, (credentials.config as { pageAccessToken: string }).pageAccessToken);

              console.log("[[[[[[[[[[[[[[ RESPONSE ]]]]]]]]]]]]]]]]]]");
              console.log("senderpsidd:", senderPsId);

              console.log(response);
              const instagramBusinessIdResponse = response?.recipient_id

              if (instagramBusinessIdResponse && !appContact?.instagramId) {
                const contactWithInstagramId = await prisma.contact.findUnique({
                  where: {
                    unique_external_id_for_org: {
                      externalId: senderPsId,
                      organizationId: agent?.organizationId!,
                    },
                  },
                });

                if (contactWithInstagramId) {
                  // a contact with this phone number already exists so we need to delete the contact created earlier and update the input message with the new contact id
                  await prisma.$transaction([
                    prisma.message.update({
                      where: {
                        id: chatResponse?.inputMessageId,
                      },
                      data: {
                        contact: {
                          connect: {
                            id: contactWithInstagramId.id,
                          },
                        },
                      },
                    }),
                    prisma.contact.delete({
                      where: {
                        id: appContact?.id,
                      },
                    }),
                  ]);
                } else {
                  await prisma.contact.update({
                    where: {
                      id: appContact?.id,
                    },
                    data: {
                      instagramId: senderPsId!,
                      externalId: senderPsId!,
                    },
                  });
                }
              }
            }
          } else {
            console.log("Mensaje no soportado, se envía respuesta informando que solo se aceptan texto y audios.");
            await handleMessage(senderPsId, messagingEvent, "De momento, solo entiendo textos y audios. Muy pronto te voy a sorprender con nuevas funcionalidades!", (credentials.config as { pageAccessToken: string }).pageAccessToken);
          }
        }
      }

      return res.status(200).send("EVENT_RECEIVED");
    } else {
      return res.status(404).send("Not Found");
    }
  }
};


const callSendAPI = async (senderPsId: string, respond: { text: string }, token: string) => {
  console.log("estoy por hacer el callsendapi");
  console.log(token);

  const payload = {
    recipient: {
      id: senderPsId,
    },
    messaging_type: "RESPONSE",
    message: respond,
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/me/messages?access_token=${token}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Error enviando el mensaje:", result.error);
      return result.error; // Devuelve el error
    } else {
      console.log("Mensaje enviado con éxito:", result);
      return result; // Devuelve el resultado exitoso
    }
  } catch (error) {
    console.error("Error al conectar con la Graph API:", error);
    return error; // Devuelve el error en caso de fallo
  }
}

const handleMessage = async (senderPsId: string, messagingEvent: MessagingEvent, finalAnswer: string, token: string) => {
  let respond;
  respond = { text: finalAnswer };


  try {
    const result = await callSendAPI(senderPsId, respond, token); // Espera la respuesta de callSendAPI
    console.log("Resultado de callSendAPI:", result);
    return result
    // Aquí podrías hacer algo con el resultado, como loguearlo o realizar otras acciones

  } catch (error) {
    console.error("Error al enviar el mensaje:", error);
  }
};


export default pipe(cors({ methods: ['GET', 'POST'] }), handler);
