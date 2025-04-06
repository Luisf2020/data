// src/ComposioClient.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export class ComposioClient {
  private client: AxiosInstance;

  constructor(private baseURL: string, private apiKey: string) {
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    // Interceptores de respuesta
    this.client.interceptors.response.use(
      response => response.data,
      error => {
        console.error('Composio API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Método genérico para GET
  public async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get(endpoint, config);
  }

  // Método genérico para POST
  public async post<T>(endpoint: string, data: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post(endpoint, data, config);
  }

  // Método genérico para PATCH
  public async patch<T>(endpoint: string, data: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.patch(endpoint, data, config);
  }

  // Método genérico para DELETE
  public async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete(endpoint, config);
  }
}
