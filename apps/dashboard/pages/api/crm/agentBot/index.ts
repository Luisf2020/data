import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { organizationId, token, agentId, nameAccount, accountId } = req.body;
    if (!organizationId || !token) {
      return res.status(400).json({ error: 'Organization ID and token are required' });
    }

    try {
      const verificationResponse = await fetch(`${process.env.CRM_CHATSAPPAI_ENDPOINT!}/api/v1/profile`, {
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': token,
        },
      });

      if (!verificationResponse.ok) {
        throw new Error('Invalid token or endpoint not found');
      }

      const profileData = await verificationResponse.json();

      if (!profileData.account_id) {
        throw new Error('Account ID not found in the profile data');
      }

      // Prepare the URL and POST method to send the information to the CRM
      const crmUrl = 'https://crm.chatsappai.com/platform/api/v1/agent_bots';
      const agentBotData = {
        name: nameAccount,
        account_id: accountId,
        description: 'By ChatsappAI V2',
        outgoing_url: `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/api/agents/${agentId}/chatwoot-webhook`
      };

      console.log(agentBotData);

      const response = await fetch(crmUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': 'sAEriHbYjJLYv1PTnUtQ6KbH'
        },
        body: JSON.stringify(agentBotData),
      });

      console.log('----------Agent bot data---------');
      console.log(organizationId)
      const responseData = await response.json();
      console.log(responseData);

      if (!response.ok) {
        throw new Error('Failed to create agent bot in CRM');
      }
      console.log(responseData.access_token)
      // Check if the record exists before updating
      const existingRecord = await prisma.cRMChatsappaiToken.findFirst({
        where: { organizationId: organizationId },
      });

      if (!existingRecord) {
        throw new Error('Record to update not found');
      }

      await prisma.cRMChatsappaiToken.update({
        where: { id: existingRecord.id },
        data: {
          token: token,
          tokenAgentBot: responseData?.access_token,
        },
      });

      return res.status(201).json(responseData); // Use responseData instead of newAgentBot
    } catch (error) {
      console.error('Error creating agent bot:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}