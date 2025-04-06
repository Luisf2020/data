import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} Not Allowed`);
    return;
  }

  try {
    const { id: appId } = req.query;

    if (!appId) {
      return res.status(400).json({
        error: 'No app ID provided. Please try again.'
      });
    }

    const options = {
      method: 'GET',
      headers: {
        'x-api-key': process.env.COMPOSIO_API_KEY
      }
    };

    const response = await fetch(`https://backend.composio.dev/api/v1/apps/${appId}`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.COMPOSIO_API_KEY || ''
      }
    });
    const app = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: app.error || 'Failed to fetch app'
      });
    }

    return res.status(200).json(app);

  } catch (error) {
    console.error('Error fetching app:', error);

    return res.status(500).json({
      error: 'Failed to fetch app',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}