// packages/lib/queue/types.ts

// Tipo para los mensajes del buffer
export interface BufferMessage {
  agentId: string;
  text: string;
  timestamp: number;
  metadata?: BufferMetadata;
}

// Metadatos opcionales para cada mensaje
export interface BufferMetadata {
  conversationId?: string;
  visitorId?: string;
}

// Configuración del Buffer Service
export interface BufferConfig {
  redisUrl: string;
  timeWindow: number; // en milisegundos
  maxSize?: number;
}

// Respuesta del endpoint de buffer
export interface BufferResponse {
  success: boolean;
  message: string;
  data?: {
    agentId: string;
    timestamp: string;
    buffered: boolean;
  };
  error?: string;
}

// Datos necesarios para crear un job en la cola
export interface BufferJobData {
  agentId: string;
}

// Configuración del Worker
export interface WorkerConfig {
  connection: any;
  concurrency: number;
  removeOnComplete: {
    count: number;
  };
  removeOnFail: {
    count: number;
  };
  lockDuration: number;
}

// Respuesta esperada del endpoint de query
export interface QueryResponse {
  answer: string;
  conversationId: string;
  visitorId?: string;
  sources?: any[];
  [key: string]: any;
}

// Payload para el endpoint de query
export interface QueryPayload {
  query: string;
  conversationId?: string;
  visitorId?: string;
  streaming?: boolean;
  filters?: Record<string, any>;
  [key: string]: any;
}

// Constantes para la configuración
export const BUFFER_CONSTANTS = {
  QUEUE_NAME: 'message-buffer',
  DEFAULT_TIME_WINDOW: 2000,
  DEFAULT_MAX_SIZE: 100,
  REDIS_KEY_PREFIX: 'buffer:agent:',
  JOB_PREFIX: 'buffer-'
} as const;