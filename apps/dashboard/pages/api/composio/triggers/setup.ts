// src/pages/api/triggers/setup.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { ComposioToolSet } from "composio-core";
import axios from 'axios';
import { prisma } from '@chaindesk/prisma/client';
import { ToolType } from '@chaindesk/prisma';
import logger from '@chaindesk/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      error: `Method ${req.method} not allowed`
    });
  }

  try {
    const {
      connectedAccountId,
      triggerName,
      agentId,
      toolConfig
    } = req.body;

    if (!connectedAccountId || !triggerName || !agentId) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'connectedAccountId, triggerName, and agentId are required'
      });
    }

    // Buscar el agente
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        tools: true
      }
    });

    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found',
        message: `No agent found with ID ${agentId}`
      });
    }

    // Initialize ComposioToolSet
    const toolset = new ComposioToolSet();

    // Get the trigger configuration
    const triggerSchema = await toolset.triggers.getTriggerConfig({
      triggerId: triggerName
    });

    // Get the entity connections
    const entity = toolset.client.getEntity(connectedAccountId);
    const connections = await entity.getConnections();

    if (!connections || connections.length === 0) {
      return res.status(400).json({
        error: 'No connections found',
        message: 'No connections available for this entity'
      });
    }

    // Build the trigger configuration
    const triggerConfig: { [key: string]: any } = {};
    Object.entries(triggerSchema.config.properties as { [key: string]: any }).forEach(([key, value]) => {
      triggerConfig[key] = toolConfig?.[key] || value.default;
    });

    // Prepare the request body
    const requestBody = {
      triggerConfig
    };

    logger.info('Configuring trigger:', {
      connectionId: connections[0].id,
      triggerName,
      config: requestBody
    });

    // Enable the trigger in Composio
    const response = await axios.post(
      `https://backend.composio.dev/api/v1/triggers/enable/${connections[0].id}/${triggerName}`,
      requestBody,
      {
        headers: {
          'x-api-key': process.env.COMPOSIO_API_KEY!,
          'Content-Type': 'application/json'
        }
      }
    );

    // Actualizar o crear la herramienta de trigger en el agente
    const composioConfig = typeof agent.composioConfig === 'object' && agent.composioConfig !== null ? agent.composioConfig : {};
    const updatedComposioConfig = {
      ...composioConfig,
      connection_id: connections[0].id,
      triggers: {
        ...(composioConfig as any)?.triggers,
        [triggerName]: {
          config: triggerConfig,
          trigger_id: response.data.triggerId
        }
      }
    };

    // Transacción para actualizar el agente y crear/actualizar la herramienta
    const updatedAgent = await prisma.$transaction(async (tx) => {
      // Actualizar la configuración del agente
      const agent = await tx.agent.update({
        where: { id: agentId },
        data: {
          composioConfig: updatedComposioConfig
        }
      });

      // Crear o actualizar la herramienta
      const tool = await tx.tool.upsert({
        where: {
          id: `composio-trigger-${triggerName}-${agentId}`
        },
        create: {
          id: `composio-trigger-${triggerName}-${agentId}`,
          type: ToolType.connector,
          agentId: agentId,
          config: {
            triggerName,
            connectionId: connections[0].id,
            triggerConfig
          }
        },
        update: {
          config: {
            triggerName,
            connectionId: connections[0].id,
            triggerConfig
          }
        }
      });

      return { agent, tool };
    });

    return res.status(200).json({
      success: true,
      agent: updatedAgent,
      trigger: {
        ...response.data,
        parameters: { properties: triggerConfig }
      }
    });

  } catch (error: any) {
    logger.error('Error configuring trigger:', {
      message: error.message,
      response: error.response?.data
    });

    return res.status(error.response?.status || 500).json({
      error: 'Error configuring trigger',
      message: error.response?.data?.message || error.message,
      details: error.response?.data
    });
  }
}