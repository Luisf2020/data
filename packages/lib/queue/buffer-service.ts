import Redis from 'ioredis';
import logger from '@chaindesk/lib/logger';
import { Queue } from '@chaindesk/lib/bullmq-pro';
import { TaskQueue } from '@chaindesk/lib/types';

/**
 * Interfaz para la metadata del mensaje.
 */
export interface MessageMetadata {
  conversationId: string;
  visitorId?: string;
  inputId?: string;
  type?: string;
  accountId?: string;
  contactId?: string;
  userId?: string;
  location?: string | Record<string, any>;
  messageType?: string;
  isPrivate?: boolean;
  contentType?: string;
  contentAttributes?: Record<string, any>;
  templateParams?: Record<string, any>;
  token?: string;
  crmConversationId?: string;
}

/**
 * Interfaz para el mensaje bufferizado.
 */
export interface BufferedMessage {
  agentId: string;
  text: string;
  metadata: MessageMetadata;
  timestamp: number;
}

class BufferService {
  private static instance: BufferService;
  private redis: Redis;
  private bufferQueue: Queue;
  // Mapear conversationId al jobId programado para implementar el debounce
  private conversationScheduled: Map<string, string>;

  private constructor() {
    // Validación temprana de variables de entorno
    const redisHost = process.env.REDIS_HOST;
    const redisPort = process.env.REDIS_PORT;
    const redisPassword = process.env.REDIS_PASSWORD;

    if (!redisHost || !redisPort || !redisPassword) {
      throw new Error('Faltan variables de entorno requeridas para la conexión a Redis');
    }

    // Conexión a Redis (configura TLS si es necesario)
    this.redis = new Redis({
      host: redisHost,
      port: parseInt(redisPort, 10),
      password: redisPassword,
      tls: {}
    });

    // Inicializar la cola de BullMQ
    this.bufferQueue = new Queue(TaskQueue.buffer_messages, {
      connection: {
        host: redisHost,
        port: parseInt(redisPort, 10),
        password: redisPassword,
        tls: {}
      }
    });

    this.conversationScheduled = new Map();
  }

  public static getInstance(): BufferService {
    if (!BufferService.instance) {
      BufferService.instance = new BufferService();
    }
    return BufferService.instance;
  }

  private getConversationKey(conversationId: string): string {
    return `buffer:${conversationId}`;
  }

  /**
   * Agrega un mensaje al buffer y programa (o reprogra) un job con delay de 8 s.
   * Si ya existe un job programado para esa conversación, se cancela para reiniciar el timer.
   */
  public async addMessage(
    agentId: string,
    message: string,
    metadata: MessageMetadata
  ): Promise<void> {
    const { conversationId } = metadata;
    const bufferKey = this.getConversationKey(conversationId);

    const bufferedMessage: BufferedMessage = {
      agentId,
      text: message,
      metadata,
      timestamp: Date.now()
    };

    try {
      await this.redis.rpush(bufferKey, JSON.stringify(bufferedMessage));
      logger.info(`📥 Mensaje agregado a conversación ${conversationId}`);
    } catch (error) {
      logger.error(`❌ Error agregando mensaje a la conversación ${conversationId}:`, error);
      throw error;
    }

    // Si ya existe un job programado, lo cancelamos para reiniciar el timer.
    if (this.conversationScheduled.has(conversationId)) {
      const existingJobId = this.conversationScheduled.get(conversationId);
      if (existingJobId) {
        try {
          await this.bufferQueue.remove(existingJobId);
          logger.info(`♻️ Job previamente programado para conversación ${conversationId} removido (debounce).`);
        } catch (err) {
          logger.error(`❌ Error removiendo job programado para conversación ${conversationId}:`, err);
        }
      }
    }

    // Programamos un nuevo job con delay de 8 s.
    try {
      const job = await this.bufferQueue.add(
        'process-conversation',
        { conversationId },
        { delay: 8000, removeOnComplete: true, removeOnFail: true }
      );
      if (job.id) {
        this.conversationScheduled.set(conversationId, job.id);
        logger.info(`⏰ Nuevo job programado para conversación ${conversationId} con delay de 8 s.`);
      } else {
        throw new Error(`Job ID is undefined for conversation ${conversationId}`);
      }
    } catch (error) {
      logger.error(`❌ Error programando job para conversación ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Extrae los mensajes del buffer de forma atómica y programa el job
   * para enviar el contexto combinado a la IA.
   * Al finalizar, si se detectan nuevos mensajes (llegados durante el procesamiento),
   * se reprograma un nuevo job con delay de 8 s.
   */
  public async processConversation(conversationId: string): Promise<void> {
    const bufferKey = this.getConversationKey(conversationId);
    try {
      // Usamos MULTI para obtener y borrar los mensajes de forma atómica
      const multi = this.redis.multi();
      multi.lrange(bufferKey, 0, -1);
      multi.del(bufferKey);
      const result = await multi.exec();

      if (!result) {
        logger.error(`❌ Falló la transacción Redis para conversación ${conversationId}`);
        return;
      }

      const messagesData = result[0][1] as string[] | null;
      if (!messagesData || messagesData.length === 0) {
        logger.info(`📭 No se encontraron mensajes para conversación ${conversationId}`);
        return;
      }

      const messages: BufferedMessage[] = messagesData.map((msg) => JSON.parse(msg));
      logger.info(`📦 Procesando ${messages.length} mensajes de conversación ${conversationId}`);

      const agentId = messages[0].agentId;

      // Programamos el job para enviar el contexto a la IA.
      await this.bufferQueue.add(
        'process-conversation-messages',
        { agentId, messages },
        { removeOnComplete: true, removeOnFail: true }
      );
      logger.info(`✅ Job para conversación ${conversationId} agregado a la cola.`);
    } catch (error) {
      logger.error(`❌ Error procesando la conversación ${conversationId}:`, error);
      throw error;
    } finally {
      // Eliminamos el flag para permitir futuros jobs.
      this.conversationScheduled.delete(conversationId);
      // Si quedaron mensajes nuevos, reprogramamos el job con delay de 8 s.
      const pendingCount = await this.redis.llen(bufferKey);
      if (pendingCount > 0) {
        logger.info(
          `⚠️ Se detectaron ${pendingCount} nuevos mensajes en conversación ${conversationId} tras el procesamiento. Reprogramando job con delay de 8 s.`
        );
        const job = await this.bufferQueue.add(
          'process-conversation',
          { conversationId },
          { delay: 8000, removeOnComplete: true, removeOnFail: true }
        );
        if (job && job.id) {
          this.conversationScheduled.set(conversationId, job.id);
        } else {
          logger.error(`❌ No se pudo programar el job para conversación ${conversationId}`);
        }

      }
    }
  }

  /**
   * Ejecuta un shutdown ordenado: procesa conversaciones pendientes y cierra conexiones.
   */
  public async cleanup(): Promise<void> {
    try {
      for (const conversationId of Array.from(this.conversationScheduled.keys())) {
        await this.processConversation(conversationId);
      }
    } catch (error) {
      logger.error('❌ Error durante el cleanup de BufferService:', error);
    } finally {
      await this.redis.quit();
      await this.bufferQueue.close();
      logger.info('✅ Cleanup de BufferService completado');
    }
  }
}

export const bufferService = BufferService.getInstance();
export default BufferService;
