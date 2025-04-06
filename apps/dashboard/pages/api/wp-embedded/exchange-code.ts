import cors from '@chaindesk/lib/middlewares/cors';
import pipe from '@chaindesk/lib/middlewares/pipe';
import {
  createAuthApiHandler,
  respond,
} from '@chaindesk/lib/createa-api-handler';
import { AppNextApiRequest } from '@chaindesk/lib/types';
import { NextApiResponse } from 'next';
import { AddServiceProviderMetaSchema, ServiceProviderMeta, ServiceProviderWhatsapp } from '@chaindesk/lib/types/dtos';
import defaultAddServiceProvider from '../../../../../packages/integrations/_utils/default-add-service-provider'
import validate from '@chaindesk/lib/validate';
import { z } from 'zod';
import prisma from '@chaindesk/prisma/client';
import cuid from 'cuid';
const handler = createAuthApiHandler();

export const Embedding = async (
  req: AppNextApiRequest,
  res: NextApiResponse
) => {
  const code = req.query.code;
  const session = req.session;
  const agentId = req.query.agentId;
  const phoneNumberId = req.query.phoneNumberId as string;
  const wabaId = req.query.wabaId as string;

  if (typeof agentId !== 'string') {
    res.status(400).json({ error: 'agentId is required and must be a string' });
    return;
  }

  // Cambiamos el codigo por un token de acceso
  const response = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?` +
    `client_id=${process.env.FACEBOOK_CLIENT_ID}` +
    `&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}` +
    `&code=${code}`
  );

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("No access token received");
  }
  const businessToken = data.access_token;
  if (!wabaId) {
    throw new Error("wabaId is required");
  }
  if (!phoneNumberId) {
    throw new Error("PhonenumberId is required");
  }

  // Nos suscribimos a los eventos del webhook con el WABA ID
  const subscribeResponse = await fetch(
    `https://graph.facebook.com/v21.0/${wabaId}/subscribed_apps`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${businessToken}`,
        "Content-Type": "application/json",
      }
    }
  );
  if (!subscribeResponse.ok) {
    throw new Error("Error subscribing to WhatsApp Webhooks");
  }
  const pin = "123456";

  // Registramos el número de teléfono
  const registerPhoneNumber = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${businessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        pin: pin,
      }),
    }
  );
  if (!registerPhoneNumber.ok) {
    throw new Error("Error registering phone number");
  }

  // Obtenemos el número de teléfono
  const responsePhone = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}`, {
    headers: {
      Authorization: `Bearer ${businessToken}`,
    },
  });
  if (!responsePhone.ok) {
    throw new Error("Error getting phone number");
  }
  const phoneData = await responsePhone.json();
  const displayPhoneNumber = phoneData.display_phone_number;
  const phoneNumber = `${displayPhoneNumber.startsWith('+') ? '' : '+'
    }${displayPhoneNumber.replace(/[\s-]/g, '')}`;

  // Creamos la integración en el serviceProvider sino existe
  const integration = await defaultAddServiceProvider<ServiceProviderWhatsapp['config']>({
    type: 'whatsapp',
    session,
    accessToken: businessToken,
    externalId: phoneNumberId,
    config: {
      // usamos el appId para guardar el wabaId
      appId: wabaId,
      phoneNumberId,
      webhookVerifyToken: cuid(),
      phoneNumber,
      isEmbedding: true,
    },
    agentId: agentId,
    validate: async (config) => {
      const found = await prisma.serviceProvider.findUnique({
        where: {
          unique_external_id: {
            externalId: phoneNumberId,
            type: 'whatsapp',
          },
        },
      });

      return !found;
    },
  });
  if (!integration) {
    throw new Error("Error creating serviceProvider");
  }

  return {
    data: { success: true }
  }
}
handler.get(respond(Embedding))
export default pipe(cors({ methods: ['GET', 'POST', 'HEAD'] }), handler);


// function to exchange the token of the organization to get a valid token to interact with facebook GRAPH API
// export const handler = async (
//   req: AppNextApiRequest,
//   res: NextApiResponse
// ) => {
//   if (req.method === "GET") {
//     // const code = req.query.code;
//     const session = req.session;
//     console.log("session in exchange code", session);

//     const agentId = req.query.agentId;
//     const phoneNumberId = req.query.phoneNumberId as string;
//     const wabaId = req.query.wabaId;
//     if (typeof agentId !== 'string') {
//       res.status(400).json({ error: 'agentId is required and must be a string' });
//       return;
//     }

//     // const response = await fetch(
//     //   `https://graph.facebook.com/v21.0/oauth/access_token?` +
//     //   `client_id=${process.env.FACEBOOK_CLIENT_ID}` +
//     //   `&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}` +
//     //   `&code=${code}`
//     // );

//     // const data = await response.json();
//     // console.log("********DATA IN EXCHANGE-CODE***********");

//     // console.log(data);
//     // console.log(agentId)
//     // if (!data.access_token) {
//     //   console.error("Error obteniendo el token de acceso.");
//     //   return res.status(500).json({ error: "No access_token received" });
//     // }
//     // const businessToken = data.access_token;
//     // if (!wabaId) {
//     //   console.error("Falta el WABA ID");
//     //   return res.status(400).json({ error: "wabaId is required" });
//     // }
//     // if (!phoneNumberId) {
//     //   console.error("Falta el PhonenumerberId");
//     //   return res.status(400).json({ error: "PhonenumberId is required" });
//     // }
//     // const subscribeResponse = await fetch(
//     //   `https://graph.facebook.com/v21.0/${wabaId}/subscribed_apps`,
//     //   {
//     //     method: "POST",
//     //     headers: {
//     //       Authorization: `Bearer ${businessToken}`,
//     //       "Content-Type": "application/json",
//     //     }
//     //   }
//     // );
//     // const subscribedData = await subscribeResponse.json();
//     // console.log("*******SUBSCRIBED-APP RESPONSE*******");
//     // console.log(subscribedData);

//     // if (!subscribeResponse.ok) {
//     //   console.error("Error en la suscripción:", subscribedData);
//     //   return res.status(500).json({ error: "Error al suscribirse a WhatsApp Webhooks", details: subscribedData });
//     // }
//     // const registerPhoneNumberResponse = await registerPhoneNumber(businessToken, phoneNumberId as string, "123456");
//     // const responsePhone = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}`, {
//     //   headers: {
//     //     Authorization: `Bearer ${businessToken}`,
//     //   },
//     // });
//     // const displayPhoneNumber = await responsePhone.json();
//     // const phoneNumber = displayPhoneNumber.display_phone_number

//     const integration = defaultAddServiceProvider<ServiceProviderWhatsapp['config']>({
//       type: 'whatsapp',
//       session: req.session,
//       accessToken: businessToken,
//       externalId: phoneNumberId,
//       config: {
//         appId: '',
//         phoneNumberId,
//         webhookVerifyToken: cuid(),
//         phoneNumber
//       },
//       agentId: agentId,
//       validate: async (config) => {
//         const found = await prisma.serviceProvider.findUnique({
//           where: {
//             unique_external_id: {
//               externalId: phoneNumberId,
//               type: 'whatsapp',
//             },
//           },
//         });

//         return !found;
//       },
//     });
//     console.log("********INTEGRATION********");
//     console.log(integration);
//     return res.status(200).json({
//       data: "ok"
//     });
//   }

// }
// // handler.get(respond(getToken));