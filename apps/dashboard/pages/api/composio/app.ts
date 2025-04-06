import { NextApiRequest, NextApiResponse } from 'next';
import { ComposioToolSet } from 'composio-core';
import logger from '@chaindesk/lib/logger';

const toolset = new ComposioToolSet({
  apiKey: process.env.COMPOSIO_API_KEY
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== 'POST') {
    logger.warn(`Invalid method: ${method}`);
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
    return;
  }

  const { organizationId, integrationId } = req.body;

  if (!organizationId) {
    logger.warn('Missing organization ID');
    return res.status(400).json({
      error: 'Organization ID is required'
    });
  }

  try {
    // Set redirect URL
    const redirectURL = `${req.headers.origin}/connection/success`;

    logger.info('Initiating integration connection', {
      organizationId,
      integrationId,
      redirectURL
    });

    // Initiate connection using the correct method
    const connectionRequest = await toolset.connectedAccounts.initiate({
      appName: integrationId,
      redirectUri: redirectURL,
      entityId: organizationId,
      authMode: "OAUTH2",
    });

    logger.info('Connection request response:', connectionRequest);

    if (connectionRequest.connectionStatus === 'INITIATED') {
      return res.status(200).json({
        redirectUrl: connectionRequest.redirectUrl,
        connectedAccountId: connectionRequest.connectedAccountId
      });
    } else {
      logger.error('Unexpected connection status', {
        status: connectionRequest.connectionStatus
      });
      return res.status(500).json({
        error: 'Error initiating connection',
        status: connectionRequest.connectionStatus
      });
    }

  } catch (error) {
    logger.error('Gmail connection process failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      organizationId
    });

    return res.status(500).json({
      error: 'An error occurred during the Gmail connection process',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}