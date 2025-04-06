// src/services/AppsService.ts
import { ComposioClient } from '../ComposioClient';

export class AppsService {
  constructor(private client: ComposioClient) { }

  async listApps(category?: string, additionalFields?: string, includeLocal?: boolean) {
    const params: Record<string, any> = {};

    if (category) params.category = category;
    if (additionalFields) params.additionalFields = additionalFields;
    if (includeLocal !== undefined) params.includeLocal = includeLocal;

    return this.client.get('apps', { params });
  }
}
