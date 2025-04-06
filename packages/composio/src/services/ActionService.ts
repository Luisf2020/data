// src/services/ActionsService.ts
import { ComposioClient } from '../ComposioClient';

export class ActionsService {
  constructor(private client: ComposioClient) { }

  // Listar todas las acciones disponibles
  async listActions() {
    return this.client.get('actions');
  }

  // Obtener detalles de una acción específica
  async getActionInfo(actionId: string) {
    return this.client.get(`actions/${actionId}`);
  }

  // Ejecutar una acción específica
  async executeAction(actionId: string, payload: any) {
    return this.client.post(`actions/${actionId}/execute`, payload);
  }
}
