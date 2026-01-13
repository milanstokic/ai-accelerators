import { useState, useCallback, useRef } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { aiChatbotApiRef, ChatMessage, Source } from '../api';

interface UseChatOptions {
  currentPath?: string;
  entityRef?: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

/**
 * Hook for managing chat state and interactions
 */
export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const api = useApi(aiChatbotApiRef);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | undefined>(undefined);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Add placeholder for assistant response
    const assistantPlaceholderId = `assistant-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: assistantPlaceholderId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isLoading: true,
      },
    ]);

    try {
      const response = await api.chat({
        message: content.trim(),
        sessionId: sessionIdRef.current,
        context: {
          currentPath: options.currentPath || window.location.pathname,
          entityRef: options.entityRef,
        },
      });

      // Store session ID for conversation continuity
      sessionIdRef.current = response.sessionId;

      // Update with actual response
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantPlaceholderId
            ? {
                ...msg,
                content: response.message,
                sources: response.sources,
                isLoading: false,
              }
            : msg,
        ),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      
      // Update placeholder with error message
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantPlaceholderId
            ? {
                ...msg,
                content: "I'm sorry, I encountered an error processing your request. Please try again.",
                isLoading: false,
              }
            : msg,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [api, options.currentPath, options.entityRef]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    sessionIdRef.current = undefined;
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
