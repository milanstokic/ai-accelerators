import Anthropic from '@anthropic-ai/sdk';
import { Logger } from 'winston';
import { RetrievedDocument } from './retriever';

export interface Source {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
}

export interface GeneratorOptions {
  apiKey: string;
  model: string;
  logger: Logger;
}

export interface GenerateInput {
  query: string;
  retrievedDocs: RetrievedDocument[];
  conversationHistory: Array<{ role: string; content: string }>;
  currentPath?: string;
}

export interface GenerateOutput {
  response: string;
  sources: Source[];
}

/**
 * System prompt with hallucination prevention guardrails
 */
const SYSTEM_PROMPT = `You are an AI assistant for the AI Accelerators developer portal. Your role is to help developers find information, understand components, and get started with the platform.

## CRITICAL RULES - YOU MUST FOLLOW THESE:

1. **ONLY use information from the PROVIDED CONTEXT DOCUMENTS below**
   - Never make up information or speculate beyond what's in the context
   - If the answer is not in the context, say "I don't have information about that in the current documentation"

2. **ALWAYS cite your sources using [1], [2], etc. format**
   - Every factual claim must have a citation
   - Include the source number immediately after the relevant statement

3. **Response formatting:**
   - Use markdown for formatting (headers, lists, code blocks)
   - Keep responses concise and actionable
   - Highlight important terms with **bold**

4. **Scope limitations:**
   - Only answer questions about the AI Accelerators platform
   - For unrelated questions, politely redirect: "I can only help with questions about the AI Accelerators platform"

5. **When uncertain:**
   - Say "Based on the available documentation..." or "I don't have specific information about..."
   - Never guess or extrapolate beyond the provided context

## AVAILABLE CONTEXT DOCUMENTS:
`;

/**
 * Generator for creating LLM responses with source citations
 */
export class AiChatbotGenerator {
  private client: Anthropic;
  private model: string;
  private logger: Logger;

  constructor(options: GeneratorOptions) {
    this.client = new Anthropic({
      apiKey: options.apiKey,
    });
    this.model = options.model;
    this.logger = options.logger;
  }

  /**
   * Generate a response for the user query
   */
  async generate(input: GenerateInput): Promise<GenerateOutput> {
    const { query, retrievedDocs, conversationHistory, currentPath } = input;

    // Build context from retrieved documents
    const contextDocs = this.buildContextDocuments(retrievedDocs);
    const systemPrompt = SYSTEM_PROMPT + contextDocs;

    // Build messages array
    const messages: Anthropic.MessageParam[] = [];

    // Add conversation history (limit to last 10 messages)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Add current query with context hint
    let userMessage = query;
    if (currentPath) {
      userMessage = `[User is currently viewing: ${currentPath}]\n\n${query}`;
    }
    messages.push({ role: 'user', content: userMessage });

    try {
      this.logger.debug(`Generating response for query: "${query.substring(0, 50)}..."`);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        temperature: 0.1, // Low temperature for consistency
        system: systemPrompt,
        messages,
      });

      // Extract text from response
      const textContent = response.content.find(c => c.type === 'text');
      const responseText = textContent ? textContent.text : 'I apologize, but I was unable to generate a response.';

      // Build sources from retrieved docs that were likely cited
      const sources = this.extractSources(responseText, retrievedDocs);

      return {
        response: responseText,
        sources,
      };
    } catch (error) {
      this.logger.error('Error generating response:', error);
      
      // Return a graceful fallback response
      return {
        response: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        sources: [],
      };
    }
  }

  /**
   * Build context document string for the system prompt
   */
  private buildContextDocuments(docs: RetrievedDocument[]): string {
    if (docs.length === 0) {
      return '\n[No relevant documents found]\n';
    }

    let context = '\n';
    docs.forEach((doc, index) => {
      context += `### [${index + 1}] ${doc.metadata.title}\n`;
      context += `URL: ${doc.metadata.url}\n`;
      context += `Type: ${doc.metadata.type}\n`;
      context += `Content: ${doc.content}\n\n`;
    });

    return context;
  }

  /**
   * Extract and format sources from the response
   */
  private extractSources(response: string, docs: RetrievedDocument[]): Source[] {
    const sources: Source[] = [];
    const citationPattern = /\[(\d+)\]/g;
    const citedNumbers = new Set<number>();

    // Find all citation numbers in the response
    let match;
    while ((match = citationPattern.exec(response)) !== null) {
      const num = parseInt(match[1], 10);
      if (num > 0 && num <= docs.length) {
        citedNumbers.add(num);
      }
    }

    // Build sources from cited documents
    citedNumbers.forEach(num => {
      const doc = docs[num - 1];
      if (doc) {
        sources.push({
          title: doc.metadata.title,
          url: doc.metadata.url,
          snippet: doc.content.substring(0, 150) + '...',
          relevance: doc.score,
        });
      }
    });

    // If no citations found but we have docs, include top 2 as context
    if (sources.length === 0 && docs.length > 0) {
      docs.slice(0, 2).forEach(doc => {
        sources.push({
          title: doc.metadata.title,
          url: doc.metadata.url,
          snippet: doc.content.substring(0, 150) + '...',
          relevance: doc.score,
        });
      });
    }

    return sources;
  }
}
