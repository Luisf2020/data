import { ServiceProviderType } from '@prisma/client';
import axios from 'axios';
import { NextApiResponse } from 'next';
import z from 'zod';

import { ApiError, ApiErrorType } from '@chaindesk/lib/api-error';
import {
  createAuthApiHandler,
  respond,
} from '@chaindesk/lib/createa-api-handler';
import { AppNextApiRequest } from '@chaindesk/lib/types';
import validate from '@chaindesk/lib/validate';
import prisma from '@chaindesk/prisma/client';

const handler = createAuthApiHandler();

export const getServiceProvider = async (
  req: AppNextApiRequest,
  res: NextApiResponse
) => {
  const id = req.query.id as string;

  const provider = await prisma.serviceProvider.findUnique({
    where: {
      organizationId: req?.session?.organization?.id as string,
      id,
    },
  });

  if (provider?.organizationId !== req.session?.organization?.id) {
    throw new ApiError(ApiErrorType.UNAUTHORIZED);
  }

  return provider;
};

handler.get(respond(getServiceProvider));

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  agentId: z.string().min(1).optional(),
});

export const updateIntegration = async (
  req: AppNextApiRequest,
  res: NextApiResponse
) => {
  const session = req.session;
  const id = req.query.id as string;
  const data = req.body as z.infer<typeof UpdateSchema>;

  const integration = await prisma.serviceProvider.findUnique({
    where: {
      id,
    },
    include: {
      agents: true,
    },
  });

  if (
    integration?.organizationId !== session.organization.id &&
    integration?.agents?.[0]?.organizationId !== session.organization.id
  ) {
    throw new ApiError(ApiErrorType.UNAUTHORIZED);
  }

  let agent = undefined;

  if (data?.agentId) {
    agent = await prisma.agent.findUnique({
      where: {
        id: data.agentId,
      },
    });

    if (agent?.organizationId !== session.organization.id) {
      throw new ApiError(ApiErrorType.UNAUTHORIZED);
    }
  }

  const updated = await prisma.serviceProvider.update({
    where: {
      id,
    },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(agent?.id
        ? {
          agents: {
            connect: {
              id: agent.id,
            },
          },
        }
        : {}),
    },
  });

  return updated;
};

handler.put(
  validate({
    body: UpdateSchema,
    handler: respond(updateIntegration),
  })
);

export const deleteIntegration = async (
  req: AppNextApiRequest,
  res: NextApiResponse
) => {
  const session = req.session;
  const id = req.query.id as string;

  const integration = await prisma.serviceProvider.findUnique({
    where: {
      id,
    },
    include: {
      agents: true,
    },
  });

  if (
    integration?.organizationId !== session.organization.id &&
    integration?.agents?.[0]?.organizationId !== session.organization.id
  ) {
    throw new Error('Unauthorized');
  }

  // clean up webhooks
  if (integration?.type === 'telegram') {
    /* This code snippet is making a POST request to the Telegram Bot API in order to delete a
          webhook. Here's a breakdown of what's happening: */
    const { data } = await axios.post(
      `https://api.telegram.org/bot${(integration?.config as any).http_token
      }/deleteWebhook`
    );

    if (!data.ok) {
      throw new Error('Unable to remove webhook');
    }
  }
  if (integration?.type === 'meta') {
    const { data } = await axios.delete(`https://graph.facebook.com/v21.0/${(integration?.config as any).pageId}/subscribed_apps?access_token=${(integration?.config as any).pageAccessToken}`);

    if (!data.success) {
      throw new Error('Unable to remove webhook');
    }
  }
  if (integration?.type === 'whatsapp' && (integration?.config as any).isEmbedding) {
    const { data } = await axios.delete(`https://graph.facebook.com/v21.0/${(integration?.config as any).appId}/subscribed_apps?access_token=${integration?.accessToken}`);

    if (!data.success) {
      throw new Error('Unable to remove webhook');
    }
  }

  if (integration?.type === 'mercadolibre') {
    // Suponemos que en integration.config se almacena el userId de Mercado Libre
    const userId = (integration?.config as any).user_id;
    const appId = process.env.MERCADOLIBRE_CLIENT_ID!
    const clientSecret = process.env.MERCADOLIBRE_CLIENT_SECRET!;
    const refreshUrl = 'https://api.mercadolibre.com/oauth/token';
    const refreshParams = new URLSearchParams();
    refreshParams.append('grant_type', 'refresh_token');
    refreshParams.append('client_id', appId);
    refreshParams.append('client_secret', clientSecret);
    refreshParams.append('refresh_token', (integration?.config as any)?.refresh_token);

    const refreshResponse = await axios.post(refreshUrl, refreshParams.toString(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!refreshResponse.data) {
      throw new ApiError(ApiErrorType.NOT_FOUND);
    }
    const { data } = await axios.delete(
      `https://api.mercadolibre.com/users/${userId}/applications/${appId}`,
      {
        headers: {
          Authorization: `Bearer ${refreshResponse.data.access_token}`,
        },
      }
    );
    console.log("Deletedata", data);

    if (!data.msg || data.msg !== 'Autorización eliminada') {
      throw new Error('Unable to remove Mercado Libre webhook');
    }
  }
  return prisma.serviceProvider.delete({
    where: {
      id,
    },
  });
};

handler.delete(respond(deleteIntegration));

export default handler;
