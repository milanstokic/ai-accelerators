import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { Config } from '@backstage/config';
import { v4 as uuidv4 } from 'uuid';
import { AiChatbotRetriever } from './retriever';
import { AiChatbotGenerator } from './generator';
import { ResponseValidator } from './validator';

export interface RouterOptions {
  logger: Logger;
  config: Config;
  discovery: any;
}

interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: {
    currentPath: string;
    entityRef?: string;
  };
}

// In-memory session storage (replace with Redis in production)
const sessions = new Map<string, { messages: Array<{ role: string; content: string }> }>();

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config } = options;

  // Initialize components
  const anthropicApiKey = config.getOptionalString('aiChatbot.anthropicApiKey') 
    || process.env.ANTHROPIC_API_KEY;
  
  const qdrantUrl = config.getOptionalString('aiChatbot.qdrantUrl') 
    || process.env.QDRANT_URL 
    || 'http://localhost:6333';
  
  const qdrantCollection = config.getOptionalString('aiChatbot.qdrantCollection') 
    || process.env.QDRANT_COLLECTION 
    || 'backstage_knowledge';

  const modelName = config.getOptionalString('aiChatbot.model') 
    || process.env.AI_CHATBOT_MODEL 
    || 'claude-3-haiku-20240307';

  if (!anthropicApiKey) {
    logger.warn('ANTHROPIC_API_KEY not configured - AI chatbot will not function');
  }

  const retriever = new AiChatbotRetriever({
    qdrantUrl,
    collectionName: qdrantCollection,
    logger,
  });

  const generator = new AiChatbotGenerator({
    apiKey: anthropicApiKey || '',
    model: modelName,
    logger,
  });

  const validator = new ResponseValidator({ logger });

  const router = Router();
  router.use(express.json());

  // Health check endpoint
  router.get('/health', async (_req, res) => {
    try {
      const indexStatus = await retriever.getIndexStatus();
      res.json({
        status: anthropicApiKey ? 'healthy' : 'degraded',
        indexLastUpdated: indexStatus.lastUpdated,
        documentCount: indexStatus.documentCount,
        message: !anthropicApiKey ? 'ANTHROPIC_API_KEY not configured' : undefined,
      });
    } catch (error) {
      res.json({
        status: 'unhealthy',
        indexLastUpdated: 'unknown',
        documentCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Chat endpoint
  router.post('/chat', async (req, res) => {
    const { message, sessionId, context } = req.body as ChatRequest;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    if (message.length > 500) {
      res.status(400).json({ error: 'Message exceeds maximum length of 500 characters' });
      return;
    }

    if (!anthropicApiKey) {
      res.status(503).json({ 
        error: 'AI chatbot is not configured. Please set ANTHROPIC_API_KEY.',
        message: "I'm sorry, but the AI assistant is not currently configured. Please contact your administrator.",
        sources: [],
        confidence: 0,
        sessionId: sessionId || uuidv4(),
      });
      return;
    }

    try {
      // Get or create session
      const currentSessionId = sessionId || uuidv4();
      let session = sessions.get(currentSessionId);
      if (!session) {
        session = { messages: [] };
        sessions.set(currentSessionId, session);
      }

      // Limit session history
      if (session.messages.length > 20) {
        session.messages = session.messages.slice(-20);
      }

      logger.info(`Processing chat message: "${message.substring(0, 50)}..."`);

      // Step 1: Retrieve relevant documents
      const retrievedDocs = await retriever.retrieve(message, 5);
      logger.debug(`Retrieved ${retrievedDocs.length} relevant documents`);

      // Step 2: Generate response with context
      const { response, sources } = await generator.generate({
        query: message,
        retrievedDocs,
        conversationHistory: session.messages,
        currentPath: context?.currentPath,
      });

      // Step 3: Validate response
      const validatedResponse = await validator.validate(response, sources, retrievedDocs);

      // Update session
      session.messages.push({ role: 'user', content: message });
      session.messages.push({ role: 'assistant', content: validatedResponse.message });

      res.json({
        message: validatedResponse.message,
        sources: validatedResponse.sources,
        confidence: validatedResponse.confidence,
        sessionId: currentSessionId,
      });
    } catch (error) {
      logger.error('Error processing chat request:', error);
      res.status(500).json({
        error: 'Failed to process request',
        message: "I apologize, but I encountered an error processing your request. Please try again.",
        sources: [],
        confidence: 0,
        sessionId: sessionId || uuidv4(),
      });
    }
  });

  // Index trigger endpoint (admin only)
  router.post('/index', async (req, res) => {
    const { scope = 'full' } = req.body;
    
    try {
      logger.info(`Starting ${scope} index refresh`);
      // TODO: Implement actual indexing
      res.json({ 
        status: 'started',
        scope,
        message: 'Indexing has been initiated',
      });
    } catch (error) {
      logger.error('Error starting index:', error);
      res.status(500).json({ error: 'Failed to start indexing' });
    }
  });

  router.use(errorHandler());
  return router;
}
