import cors from '@chaindesk/lib/middlewares/cors';
import pipe from '@chaindesk/lib/middlewares/pipe';
import {
  createAuthApiHandler,
  respond,
} from '@chaindesk/lib/createa-api-handler';
import { AppNextApiRequest } from '@chaindesk/lib/types';
import { NextApiResponse } from 'next';
import { AddServiceProviderMetaSchema, ServiceProviderMeta } from '@chaindesk/lib/types/dtos';
import defaultAddServiceProvider from '../../../../../packages/integrations/_utils/default-add-service-provider'
import validate from '@chaindesk/lib/validate';
import { z } from 'zod';
import prisma from '@chaindesk/prisma/client';
import cuid from 'cuid';
const handler = createAuthApiHandler();

// function to exchange the token of the organization to get a valid token to interact with facebook GRAPH API
export const getToken = async (
  req: AppNextApiRequest,
  res: NextApiResponse
) => {
  const code = req.query.code;
  const agentId = req.query.agentId;

  if (typeof agentId !== 'string') {
    res.status(400).json({ error: 'agentId is required and must be a string' });
    return;
  }

  const response = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?` +
    `client_id=${process.env.FACEBOOK_CLIENT_ID}` +
    `&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}` +
    `&code=${code}`
  );

  const data = await response.json();
  console.log("********DATA IN EXCHANGE-CODE***********");

  console.log(data);
  console.log(agentId)

  const pageTokenResponse = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?access_token=${data.access_token}`
  );
  // obtenemos la informacion de la pagina de facebook
  const pageTokenData = await pageTokenResponse.json();
  const pageData = pageTokenData.data;

  if (!pageData || pageData.length === 0) {
    console.error("No se encontraron páginas asociadas.");
    throw new Error("No pages found for this token.");
  }
  const page = pageData[0];
  console.log("**********PAGE*******");
  console.log(page);
  // nos subscribimos al los eventos del  webhoook con esta pagina.
  const subscribed_app = await fetch(`https://graph.facebook.com/v21.0/${page.id}/subscribed_apps`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${page.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subscribed_fields: "name", // Puedes cambiar esto por los campos requeridos
    }),
  });
  console.log("*******SUBSCRIBED-APP*******");
  console.log(subscribed_app);

  // obtenemos el id de la pagina de instagram
  const instagramBusinessResponse = await fetch(
    `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
  );
  const instagramBusinessData = await instagramBusinessResponse.json();
  if (!instagramBusinessData.instagram_business_account) {
    console.error("No Instagram Business Account found for this page.");
    throw new Error("No Instagram Business Account found for this page.");
  }

  const instagramBusinessAccount = instagramBusinessData.instagram_business_account;
  // TODO: hacer la llamada al ServiceProvider para meta.
  const integration = await defaultAddServiceProvider<ServiceProviderMeta['config']>({
    type: 'meta',
    session: req.session,
    // user acces token
    // accessToken: data.accessToken,
    externalId: page.id,
    config: {
      pageId: page.id,
      instagramBusinessId: instagramBusinessAccount.id,
      pageAccessToken: page.access_token
    },
    agentId: agentId,
    validate: async (config) => {
      const found = await prisma.serviceProvider.findUnique({
        where: {
          unique_external_id: {
            externalId: config.pageId,
            type: 'meta',
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
    data: { page, instagramBusinessAccount }
  }
}
handler.get(respond(getToken));

export default pipe(cors({ methods: ['GET', 'POST', 'HEAD'] }), handler);