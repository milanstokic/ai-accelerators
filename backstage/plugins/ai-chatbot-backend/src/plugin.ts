import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './service/router';

/**
 * AI Chatbot backend plugin for Backstage
 */
export const aiChatbotPlugin = createBackendPlugin({
  pluginId: 'ai-chatbot',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        discovery: coreServices.discovery,
      },
      async init({ httpRouter, logger, config, discovery }) {
        httpRouter.use(
          await createRouter({
            logger,
            config,
            discovery,
          }),
        );
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
