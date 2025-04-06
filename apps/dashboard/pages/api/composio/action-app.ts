import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} Not Allowed`);
    return;
  }

  const { appId } = req.query;

  if (!appId) {
    res.status(400).json({ error: 'appId is required' });
    return;
  }

  try {
    const options = {
      headers: {
        'x-api-key': process.env.COMPOSIO_API_KEY || ''
      }
    };
    const response = await axios.get(`https://backend.composio.dev/api/v2/actions/list/all?apps=${appId}`, options);

    const actions = response.data.items.map((item: any) => ({
      name: item.name,
      enum: item.enum,
      logo: item.logo,
      tags: item.tags,
      displayName: item.displayName,
      description: item.description,
      appId: item.appId,
      deprecated: item.deprecated,
      appKey: item.appKey,
      display_name: item.display_name
    }));

    res.status(200).json({ actions, page: response.data.page, totalPages: response.data.totalPages });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching apps:', error.message);

      if (axios.isAxiosError(error) && error.response && error.response.status === 422) {
        res.status(422).json({ error: 'Unprocessable Entity' });
      } else {
        res.status(500).json({ error: 'Failed to fetch apps' });
      }
    } else {
      console.error('Unknown error:', error);
      res.status(500).json({ error: 'Failed to fetch apps' });
    }
  }
}
