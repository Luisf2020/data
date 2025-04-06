import axios, { AxiosInstance } from 'axios';
interface AuthConfig {
  parameters: any[];
  base_url?: string;
  body?: Record<string, any>;
}

interface ActionExecutionPayload {
  appName: string;
  authConfig: AuthConfig;
  connectedAccountId?: string;
  customDescription?: string;
  entityId?: string;
  input: Record<string, any>;
  sessionInfo?: {
    metadata?: Record<string, any>;
    sessionId?: string;
  };
  systemPrompt?: string;
  text?: string;
}

class ComposioClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/composio',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          switch (error.response.status) {
            case 401:
              console.error('Authentication error: Unauthorized');
              break;
            case 403:
              console.error('Permission error: Forbidden');
              break;
            case 404:
              console.error('Error: Resource not found');
              break;
            case 500:
              console.error('Server error: Internal server error');
              break;
            default:
              console.error(`Error: ${error.response.statusText}`);
          }
        } else if (error.request) {
          console.error('Error: No se recibió respuesta del servidor');
        } else {
          console.error('Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  async listApps() {
    try {
      const { data } = await this.client.get('/list-app');
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAppDetails(appId: string) {
    try {
      const { data } = await this.client.get(`/${appId}/single-app`);
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }



  async getConnectionStatus(appId: string, organizationId: string) {
    try {
      const { data } = await this.client.get(`/${appId}`, {
        headers: {
          'organizationId': organizationId,
        },
      });
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getMeApps(organizationId: string) {
    try {
      const { data } = await this.client.get(`/${organizationId}/all-app`);
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getMeTriggersApps(organizationId: string) {
    try {
      const { data } = await this.client.get(`/${organizationId}/all-trigger`);
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTriggerDetail(connectAccountId: string, action_name: string, agentId: string) {
    try {
      const { data } = await this.client.post(`/triggers/setup`, {
        triggerName: action_name,
        connectedAccountId: connectAccountId,
        agentId: agentId
      });
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getActionApps(appId: string) {
    try {
      const { data } = await this.client.get(`/action-app`, {
        params: { appId },
      });
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getActionDetail(action_name: string) {
    try {
      const { data } = await this.client.get(`/action-app-detail`, {
        params: { action_name },
      });
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async executeAction(actionId: string, payload: ActionExecutionPayload) {
    try {
      const response = await this.client.post(`/execute-action`, {
        actionId,
        payload
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async connectApp(organizationId: string, integrationId: string) {
    try {
      const { data } = await this.client.post('/app', {
        organizationId,
        integrationId,
      });
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async disconnectApp(connectedAccountId: string) {
    try {
      const { data } = await this.client.delete('/delete-conection', {
        data: {
          connectedAccountId,
        },
      });
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }



  private handleError(error: any) {
    if (error.response) {
      return {
        error: true,
        message: error.response.data.message || 'Error en la solicitud',
        status: error.response.status,
      };
    } else if (error.request) {
      return {
        error: true,
        message: 'No se pudo conectar con el servidor',
      };
    } else {
      return {
        error: true,
        message: 'Error al procesar la solicitud',
      };
    }
  }
}

export const composioClient = new ComposioClient();