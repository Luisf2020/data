import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { ComposioToolSet } from "composio-core";
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

    console.log('action details')
    const toolset = new ComposioToolSet();
    const trigger = await toolset.triggers.getTriggerConfig({
      triggerId: "GMAIL_NEW_GMAIL_MESSAGE"
    })
    console.log(trigger.config)


    res.status(200).json(trigger.config);
  } catch (error) {
    console.error('Error fetching trigger:', error);
    res.status(500).json({ error: 'Failed to fetch trigger' });
  }
}
