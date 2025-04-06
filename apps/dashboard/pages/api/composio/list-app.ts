import { Composio } from 'composio-core';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const composio = new Composio({
    apiKey: '2ce1x4lwoeig7zdxaaufm'
  });

  try {
    const apps: any = await composio.apps.list();

    if (!apps) {
      res.status(404).json({ error: 'No apps found' });
      return;
    }

    res.status(200).json(apps);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching apps:', error.message);

      if ('response' in error && (error as any).response && (error as any).response.status === 422) {
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
