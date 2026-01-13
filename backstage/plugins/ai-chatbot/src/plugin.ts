import {
  createPlugin,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { aiChatbotApiRef, AiChatbotClient } from './api';

/**
 * AI Chatbot plugin for Backstage
 * 
 * Provides an intelligent assistant that can answer questions
 * about the platform using natural language.
 */
export const aiChatbotPlugin = createPlugin({
  id: 'ai-chatbot',
  apis: [
    createApiFactory({
      api: aiChatbotApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) =>
        new AiChatbotClient({ discoveryApi, fetchApi }),
    }),
  ],
});

// Export the sidebar component
export { AiChatbotSidebar } from './components/ChatPanel';
