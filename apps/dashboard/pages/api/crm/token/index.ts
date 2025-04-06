import { prisma } from '@chaindesk/prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(req.body);

  if (req.method === 'GET') {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    try {
      const token = await prisma.cRMChatsappaiToken.findFirst({
        where: { organization: { id: String(organizationId) } },
      });

      const verificationResponse = await fetch(`${process.env.CRM_CHATSAPPAI_ENDPOINT!}/api/v1/profile`, {
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': token?.token || '',
        },
      });

      if (!verificationResponse.ok) {
        return res.status(400).json({ error: 'Invalid token or endpoint not found' });
      }

      const accountData = await verificationResponse.json();
      if (token) {
        res.json({ token: token.token, accounts: accountData.accounts });
      } else {
        res.json({ token: null, accounts: accountData.accounts });
      }
    } catch (error) {
      console.error('Error fetching token:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    const { organizationId, token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required' });
    }

    try {
      const verificationResponse = await fetch(`${process.env.CRM_CHATSAPPAI_ENDPOINT!}/api/v1/profile`, {
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': token,
        },
      });

      if (!verificationResponse.ok) {
        const errorText = await verificationResponse.text();
        console.error('Fetch error:', verificationResponse.status, errorText);
        return res.status(400).json({ success: false, message: 'Invalid token or endpoint not found' });
      }

      const accountData = await verificationResponse.json();

      const user = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Check if the token already exists
      const existingToken = await prisma.cRMChatsappaiToken.findUnique({
        where: { token: token },
      });

      if (existingToken) {
        // Update the existing token
        await prisma.cRMChatsappaiToken.update({
          where: { token: token },
          data: { organization: { connect: { id: organizationId } } },
        });
      } else {
        // Save the new token
        await prisma.cRMChatsappaiToken.create({
          data: { token: token, organization: { connect: { id: organizationId } }, tokenAgentBot: '' },
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Token saved successfully',
        account: accountData?.accounts,
      });
    } catch (error) {
      console.error('Error saving token in CRM:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}