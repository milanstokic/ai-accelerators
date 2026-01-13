import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { AiChatbotApi, ChatRequest, ChatResponse, HealthStatus } from './AiChatbotApi';

/**
 * Client implementation for the AI Chatbot API
 */
export class AiChatbotClient implements AiChatbotApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  private async getBaseUrl(): Promise<string> {
    return await this.discoveryApi.getBaseUrl('ai-chatbot');
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const baseUrl = await this.getBaseUrl();
    
    const response = await this.fetchApi.fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Chat request failed: ${error}`);
    }

    return await response.json();
  }

  async getHealth(): Promise<HealthStatus> {
    const baseUrl = await this.getBaseUrl();
    
    const response = await this.fetchApi.fetch(`${baseUrl}/health`);

    if (!response.ok) {
      return {
        status: 'unhealthy',
        indexLastUpdated: 'unknown',
        documentCount: 0,
      };
    }

    return await response.json();
  }
}
