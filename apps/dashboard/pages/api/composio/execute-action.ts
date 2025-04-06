// pages/api/composio/execute-action.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;

interface AuthConfig {
  parameters: any[];
  base_url?: string;
  body?: Record<string, any>;
}

interface ActionPayload {
  appName: string;
  authConfig: AuthConfig;
  connectedAccountId?: string;
  customDescription?: string;
  entityId?: string;
  input: Record<string, any>;
  sessionInfo?: {
    metadata?: Record<string, any>;
    sessionId?: string;
  };
  systemPrompt?: string;
  text?: string;
}

interface RequestBody {
  actionId: string;
  payload: ActionPayload;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!COMPOSIO_API_KEY) {
      return res.status(500).json({ error: 'Composio API key is not configured' });
    }

    const { actionId, payload } = req.body as RequestBody;

    if (!actionId || !payload) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const composioResponse = await axios({
      method: 'POST',
      url: `https://backend.composio.dev/api/v2/actions/${actionId}/execute`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': COMPOSIO_API_KEY
      },
      data: payload
    });

    return res.status(200).json(composioResponse.data);

  } catch (error) {
    console.error('Error executing action:', error);

    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.error || error.message;

      return res.status(statusCode).json({
        error: errorMessage,
        data: error.response?.data
      });
    }

    return res.status(500).json({
      error: 'An unexpected error occurred',
      data: null
    });
  }
}