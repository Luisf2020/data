import { WorkerPro, Job } from '@chaindesk/lib/bullmq-pro';
import Redis from 'ioredis';
import axios, { AxiosInstance } from 'axios';
import logger from '@chaindesk/lib/logger';
import { TaskQueue } from '@chaindesk/lib/types';
import { bufferService, BufferedMessage } from '@chaindesk/lib/queue/buffer-service';

interface ProcessConversationJobData_Conversation {
  conversationId: string;
}

interface ProcessConversationJobData_Messages {
  agentId: string;
  messages: BufferedMessage[];
}

type ProcessConversationJobData =
  | ProcessConversationJobData_Conversation
  | ProcessConversationJobData_Messages;

// Validación de variables de entorno
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error('REDIS_URL no está definida');

const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;
if (!dashboardUrl) throw new Error('NEXT_PUBLIC_DASHBOARD_URL no está definida');

// Conexión a Redis
const connection = new Redis(redisUrl);

// Instancia de Axios para llamadas a la API (envío del contexto a la IA)
const axiosInstance: AxiosInstance = axios.create({
  baseURL: dashboardUrl,
  timeout: 10000, // 10 s
  headers: { 'Content-Type': 'application/json' }
});

/**
 * Función que procesa el batch de mensajes y envía la query combinada al endpoint adecuado.
 */
async function processConversationMessages(
  job: Job<ProcessConversationJobData_Messages>
): Promise<any> {
  const { agentId, messages } = job.data;
  logger.info(`🔄 Procesando batch de mensajes para agente ${agentId} (Job ID: ${job.id})`);
  logger.info(`📦 Número de mensajes: ${messages.length}`);

  try {
    // Combina todos los mensajes en un solo query
    const combinedQuery = messages.map((m) => m.text).join('\n');
    logger.info(`📝 Query combinado: ${combinedQuery}`);
    logger.debug(`📝 Metadata: ${JSON.stringify(messages[0].metadata)}`);

    // Selecciona el endpoint según el tipo de mensaje (CRM o general)
    const isCRM = messages[0].metadata?.type === 'CRM';
    const endpoint = isCRM ? '/api/v2/agent/message/crm' : '/api/v2/agent/message';

    const payload: Record<string, any> = {
      id: agentId,
      query: combinedQuery,
      conversationId: messages[0].metadata.conversationId,
      visitorId: messages[0].metadata.visitorId
    };

    if (isCRM) {
      payload.metadata = messages[0].metadata; // Incluir metadata completa para CRM
    }

    const response = await axiosInstance.post(endpoint, payload);
    logger.info(`✅ Query procesado exitosamente para agente ${agentId} (Job ID: ${job.id})`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;
      logger.error(
        `Axios error para agente ${agentId} (Job ID: ${job.id}): Status ${status} - Data: ${JSON.stringify(data)}`
      );
    } else {
      logger.error(`Error inesperado para agente ${agentId} (Job ID: ${job.id}):`, error);
    }
    throw error;
  }
}

/**
 * Worker que procesa ambos tipos de jobs:
 * - "process-conversation": Llama a BufferService para extraer el contexto.
 * - "process-conversation-messages": Procesa y envía el batch de mensajes a la IA.
 */
const worker = new WorkerPro<ProcessConversationJobData>(
  TaskQueue.buffer_messages,
  async (job: Job<ProcessConversationJobData>) => {
    if (!job) {
      logger.warn('⚠️ Evento recibido sin información de job');
      return;
    }
    if (job.name === 'process-conversation') {
      const { conversationId } = job.data as ProcessConversationJobData_Conversation;
      logger.info(`⏰ Ejecutando job "process-conversation" para conversación ${conversationId} (Job ID: ${job.id})`);
      await bufferService.processConversation(conversationId);
      return;
    } else if (job.name === 'process-conversation-messages') {
      return processConversationMessages(job as Job<ProcessConversationJobData_Messages>);
    } else {
      logger.warn(`⚠️ Job recibido con nombre desconocido: ${job.name} (Job ID: ${job.id})`);
      return;
    }
  },
  {
    connection,
    concurrency: 5,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 3000 }
  }
);

worker.on('completed', (job) => {
  if (!job) {
    logger.warn('✨ Evento "completed" sin información de job');
    return;
  }
  if ('agentId' in job.data) {
    logger.info(`✨ Job ${job.id} completado para agente ${job.data.agentId}`);
  } else if ('conversationId' in job.data) {
    logger.info(`✨ Job ${job.id} completado para conversación ${job.data.conversationId}`);
  } else {
    logger.info(`✨ Job ${job.id} completado`);
  }
});

worker.on('failed', (job, error) => {
  if (!job) {
    logger.warn('💥 Evento "failed" sin información de job');
    return;
  }
  if ('agentId' in job.data) {
    logger.error(`💥 Job ${job.id} falló para agente ${job.data.agentId}:`, error);
  } else if ('conversationId' in job.data) {
    logger.error(`💥 Job ${job.id} falló para conversación ${job.data.conversationId}:`, error);
  } else {
    logger.error(`💥 Job ${job.id} falló:`, error);
  }
});

// Shutdown ordenado: cierra worker y conexión a Redis.
const gracefulShutdown = async () => {
  logger.info('👋 Cerrando worker...');
  try {
    await worker.close();
    await connection.quit();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error durante el shutdown del worker:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default worker;
