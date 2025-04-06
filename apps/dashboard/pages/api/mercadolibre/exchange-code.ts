import cors from '@chaindesk/lib/middlewares/cors';
import pipe from '@chaindesk/lib/middlewares/pipe';
import {
  createAuthApiHandler,
  respond,
} from '@chaindesk/lib/createa-api-handler';
import { AppNextApiRequest } from '@chaindesk/lib/types';
import { NextApiResponse } from 'next';
import { AddServiceProviderMetaSchema, ServiceProviderMercadolibre, ServiceProviderMeta } from '@chaindesk/lib/types/dtos';
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

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', `${process.env.MERCADOLIBRE_CLIENT_ID}`);
  params.append('client_secret', `${process.env.MERCADOLIBRE_CLIENT_SECRET}`);
  params.append('code', `${code}`);
  params.append('redirect_uri', `${process.env.MERCADOLIBRE_BASE_URL}ml-redirect`);
  const response = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    throw new Error("Error getting access token");
  }
  const data = await response.json();
  const user = await fetch('https://api.mercadolibre.com/users/me', { headers: { Authorization: `Bearer ${data.access_token}` } });
  if (!user.ok) {
    throw new Error("Error getting user data");
  }
  const userData = await user.json();
  const userName = userData.nickname;
  data.user_id = data.user_id.toString();
  const integration = await defaultAddServiceProvider<ServiceProviderMercadolibre['config']>({
    type: 'mercadolibre',
    session: req.session,
    // user acces token
    accessToken: data.access_token,
    externalId: data.user_id,
    config: {
      user_id: data.user_id,
      nickname: userName,
      refresh_token: data.refresh_token,
    },
    agentId: agentId,
    validate: async (config) => {
      const found = await prisma.serviceProvider.findUnique({
        where: {
          unique_external_id: {
            externalId: data.user_id,
            type: 'mercadolibre',
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
    data: { data, userData }
  }
}
handler.get(respond(getToken));

export default pipe(cors({ methods: ['GET', 'POST', 'HEAD'] }), handler);