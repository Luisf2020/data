import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAIToolSet } from 'composio-core';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} Not Allowed`);
    return;
  }

  try {

    const { organizationid } = req.headers;
    const { id: appId } = req.query;

    if (!organizationid) {
      return res.status(200).json({
        status: 'not_connected',
        message: 'No organization ID provided. Please login to continue.',
        connection: null
      });
    }

    if (!appId) {
      return res.status(200).json({
        status: 'not_connected',
        message: 'No app ID provided. Please try again.',
        connection: null
      });
    }

    const toolset = new OpenAIToolSet({
      apiKey: process.env.COMPOSIO_API_KEY
    });
    // Filter based on entity id
    const entity = await toolset.client.getEntity(organizationid as string);

    // Lists all connections of the entity for the tool with appId in appName
    const connected_accounts = await entity.getConnection({ appName: appId as string });

    if (connected_accounts) {
      return res.status(200).json({
        status: 'connected',
        message: 'Gmail account successfully connected',
        connection: connected_accounts
      });
    }

    return res.status(200).json({
      status: 'not_connected',
      message: 'No Gmail account connected. Please connect your account to continue.',
      connection: null
    });

  } catch (error) {
    console.error('Error fetching connected accounts:', error);

    return res.status(200).json({
      status: 'error',
      message: 'Unable to verify Gmail connection. Please try again later.',
      connection: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}