// packages/lib/queue/buffer-worker.ts
import { WorkerPro } from '@chaindesk/lib/bullmq-pro';
import Redis from 'ioredis';
import logger from '@chaindesk/lib/logger';

const connection = new Redis(process.env.REDIS_URL!);

connection.on('connect', async () => {
  try {
    await connection.config('SET', 'maxmemory-policy', 'noeviction');
    logger.info('Redis buffer configured successfully');
  } catch (error) {
    logger.warn('Could not set Redis buffer policy:', error);
  }
});

connection.on('error', (error) => {
  logger.error('Redis buffer connection error:', error);
});

const worker = new WorkerPro(
  'message-buffer',
  async (job) => {
    const { agentId } = job.data;
    logger.info(`Procesando buffer para agente ${agentId}`);

    try {
      // Obtener mensajes del buffer
      const bufferKey = `buffer:agent:${agentId}`;
      const messages = await connection
        .multi()
        .lrange(bufferKey, 0, -1)
        .del(bufferKey)
        .exec();

      if (!messages || !messages[0][1]) {
        logger.info(`No hay mensajes para agente ${agentId}`);
        return null;
      }

      const parsedMessages = (messages[0][1] as string[])
        .map(msg => JSON.parse(msg));

      logger.info(`Procesando ${parsedMessages.length} mensajes para ${agentId}`);

      // Combinar mensajes
      const combinedQuery = parsedMessages.map(m => m.text).join('\n');

      // Enviar a query
      const response = await fetch(`${process.env.API_BASE_URL}/agents/${agentId}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AUTH_TOKEN}`
        },
        body: JSON.stringify({
          query: combinedQuery,
          conversationId: parsedMessages[0].metadata?.conversationId,
          visitorId: parsedMessages[0].metadata?.visitorId
        })
      });

      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`);
      }

      const result = await response.json();
      logger.info(`Query procesada exitosamente para ${agentId}`);
      return result;

    } catch (error) {
      logger.error(`Error procesando mensajes para ${agentId}:`, error);
      throw error;
    }
  },
  {
    connection: connection as any,
    concurrency: 5,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 }
  }
);

worker.on('completed', (job) => {
  logger.info(`Job ${job.id} completado para agente ${job.data?.agentId}`);
});

worker.on('failed', (job, error) => {
  logger.error(`Job ${job?.id} falló para agente ${job?.data?.agentId}:`, error);
});

export default worker;