import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAIToolSet } from 'composio-core';
import axios from 'axios';

interface Action {
  name: string;
  enum: string;
  logo: string;
  tags: string[];
  displayName: string;
  description: string;
  appId: string;
  deprecated: boolean;
  appKey: string;
  display_name: string;
}

interface AppConnection {
  name?: string;
  appId?: string;
  logo?: string;
  actions: Action[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} Not Allowed`);
    return;
  }

  try {
    const { id: organizationId } = req.query;

    if (!organizationId) {
      return res.status(200).json({
        status: 'not_connected',
        message: 'No organization ID provided. Please login to continue.',
        connections: null
      });
    }

    const toolset = new OpenAIToolSet({
      apiKey: process.env.COMPOSIO_API_KEY
    });

    const entity = await toolset.client.getEntity(organizationId as string);
    const connected_accounts = await entity.getConnections();

    if (!connected_accounts) {
      return res.status(200).json({
        status: 'not_connected',
        message: 'No accounts connected. Please connect your account to continue.',
        connections: null
      });
    }

    const options = { method: 'GET', headers: { 'x-api-key': process.env.COMPOSIO_API_KEY } };

    // Process each connected account to include their actions
    const processedConnections: AppConnection[] = await Promise.all(
      connected_accounts.map(async (account) => {
        try {
          // Get all actions for this app
          const actionsResponse = await axios.get(
            `https://backend.composio.dev/api/v2/actions/list/all?apps=${account.appName}`,
            options
          );

          // Combine and process actions
          const actions = actionsResponse.data.items.map((item: any) => ({
            name: item.name,
            enum: item.enum,
            logo: item.logo,
            tags: item.tags,
            displayName: item.displayName,
            description: item.description,
            appId: item.appId,
            deprecated: item.deprecated,
            appKey: item.appKey,
            display_name: item.display_name,
          }));

          return {
            name: account.appName,
            appId: account.appUniqueId,
            logo: account.logo,
            actions: actions
          };
        } catch (error) {
          console.error(`Error fetching actions for ${account.appName}:`, error);
          return {
            name: account.appName,
            appId: account.appUniqueId,
            logo: account.logo,
            actions: []
          };
        }
      })
    );

    return res.status(200).json({
      status: 'connected',
      message: 'Accounts successfully connected',
      connections: processedConnections
    });

  } catch (error) {
    console.error('Error fetching connected accounts:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Unable to verify connections. Please try again later.',
      connections: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}