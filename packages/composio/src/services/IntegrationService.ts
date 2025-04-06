// src/services/IntegrationsService.ts
import { ComposioClient } from '../ComposioClient';

export class IntegrationsService {
  constructor(private client: ComposioClient) { }

  // Listar todos los conectores
  async listConnectors() {
    return this.client.get('integrations/connectors');
  }

  // Crear un nuevo conector
  async createConnector(data: any) {
    return this.client.post('integrations/connectors', data);
  }

  // Eliminar un conector
  async deleteConnector(connectorId: string) {
    return this.client.delete(`integrations/connectors/${connectorId}`);
  }

  // Obtener información de un conector específico
  async getConnectorInfo(connectorId: string) {
    return this.client.get(`integrations/connectors/${connectorId}`);
  }
}
