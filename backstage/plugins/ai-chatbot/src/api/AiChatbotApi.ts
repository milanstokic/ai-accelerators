import { createApiRef } from '@backstage/core-plugin-api';

/**
 * Represents a source citation for a chatbot response
 */
export interface Source {
  /** Display title of the source */
  title: string;
  /** URL path within Backstage */
  url: string;
  /** Relevant snippet from the source */
  snippet: string;
  /** Relevance score (0-1) */
  relevance: number;
}

/**
 * Represents a chat message in the conversation
 */
export interface ChatMessage {
  /** Unique message ID */
  id: string;
  /** Message role: 'user' or 'assistant' */
  role: 'user' | 'assistant';
  /** Message content (may contain markdown) */
  content: string;
  /** Source citations (assistant messages only) */
  sources?: Source[];
  /** Timestamp */
  timestamp: Date;
  /** Whether the message is still being generated */
  isLoading?: boolean;
}

/**
 * Response from the chat API
 */
export interface ChatResponse {
  /** The assistant's response message */
  message: string;
  /** Source citations */
  sources: Source[];
  /** Confidence score (0-1) */
  confidence: number;
  /** Session ID for conversation continuity */
  sessionId: string;
}

/**
 * Request to the chat API
 */
export interface ChatRequest {
  /** User's message */
  message: string;
  /** Optional session ID for conversation continuity */
  sessionId?: string;
  /** Optional context about current page */
  context?: {
    currentPath: string;
    entityRef?: string;
  };
}

/**
 * Health status of the AI chatbot service
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  indexLastUpdated: string;
  documentCount: number;
}

/**
 * API interface for the AI Chatbot plugin
 */
export interface AiChatbotApi {
  /**
   * Send a chat message and get a response
   */
  chat(request: ChatRequest): Promise<ChatResponse>;
  
  /**
   * Get the health status of the chatbot service
   */
  getHealth(): Promise<HealthStatus>;
}

/**
 * API reference for the AI Chatbot
 */
export const aiChatbotApiRef = createApiRef<AiChatbotApi>({
  id: 'plugin.ai-chatbot.api',
});
