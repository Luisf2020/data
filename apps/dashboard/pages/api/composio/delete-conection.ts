import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${method} Not Allowed`);
    return;
  }

  const { connectedAccountId } = req.body;
  console.log('Connect', connectedAccountId)

  if (!connectedAccountId) {
    res.status(400).json({ error: 'connectedAccountId is required' });
    return;
  }

  try {
    const options = {
      headers: {
        'x-api-key': process.env.COMPOSIO_API_KEY || ''
      }
    };
    const response = await axios.delete(`https://backend.composio.dev/api/v1/connectedAccounts/${connectedAccountId}`, options);
    console.log(response)
    res.status(200).json(response.data);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error deleting app:', error.message);

      if (axios.isAxiosError(error) && error.response && error.response.status === 422) {
        res.status(422).json({ error: 'Unprocessable Entity' });
      } else {
        res.status(500).json({ error: 'Failed to delete app' });
      }
    } else {
      console.error('Unknown error:', error);
      res.status(500).json({ error: 'Failed to delete app' });
    }
  }
}