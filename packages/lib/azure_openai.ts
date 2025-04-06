import { AzureOpenAI } from 'openai';
import { ClientSecretCredential, DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity';

class AzureOpenAIService {
  private static instance: AzureOpenAIService;
  private client: AzureOpenAI;

  private constructor() {
    this.client = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      apiVersion: '2024-02-15-preview',
      endpoint: process.env.AZURE_OPENAI_ENDPOINT// Add this if needed
    });
  }

  public static getInstance(): AzureOpenAIService {
    if (!AzureOpenAIService.instance) {
      AzureOpenAIService.instance = new AzureOpenAIService();
    }
    return AzureOpenAIService.instance;
  }

  public async createChatCompletion(params: any) {
    return this.client.chat.completions.create(params);
  }

  public async createEmbedding(params: any) {
    return this.client.embeddings.create(params);
  }
}

export const azureOpenAI = AzureOpenAIService.getInstance();
