import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} Not Allowed`);
    return;
  }

  const { action_name } = req.query;

  if (!action_name) {
    res.status(400).json({ error: 'actionId is required' });
    return;
  }

  try {
    const options = {
      method: 'GET',
      headers: {
        'x-api-key': process.env.COMPOSIO_API_KEY
      }
    };

    const response = await axios.get(`https://backend.composio.dev/api/v2/actions/${action_name}`, options);
    const data = response.data;

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching action:', error);
    res.status(500).json({ error: 'Failed to fetch action' });
  }
}
