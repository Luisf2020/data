// src/services/LogsService.ts
import { ComposioClient } from '../ComposioClient';

export class LogsService {
  constructor(private client: ComposioClient) { }

  // Obtener los logs generales
  async getLogs() {
    return this.client.get('logs');
  }

  // Publicar un nuevo log (si aplica)
  async postLog(data: any) {
    return this.client.post('logs', data);
  }
}
