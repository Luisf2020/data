// src/index.ts
import { ComposioClient } from './ComposioClient';
import { AppsService } from './services/AppsService';
import { ActionsService } from './services/ActionService';
import { IntegrationsService } from './services/IntegrationService';
import { LogsService } from './services/LogService';

// Configuración del cliente global
const composioClient = new ComposioClient(
  process.env.COMPOSIO_API_BASE_URL || 'https://backend.composio.dev/api/v1/',
  process.env.COMPOSIO_API_KEY!
);

// Exportar instancias de servicios
export const appsService = new AppsService(composioClient);
export const actionsService = new ActionsService(composioClient);
export const integrationsService = new IntegrationsService(composioClient);
export const logsService = new LogsService(composioClient);
