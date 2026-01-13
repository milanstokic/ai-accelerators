# AI Chatbot Plugin

A Backstage frontend plugin that provides an AI-powered chatbot assistant for the developer portal.

## Features

- 🤖 Natural language Q&A about the platform
- 📚 Searches across Catalog, TechDocs, and APIs
- 🔗 Source citations with direct links
- 💬 Conversation history within session
- 🎯 Contextual suggestions based on current page

## Installation

The plugin is automatically included in the Backstage app. No additional installation required.

## Usage

1. Click the "Ask AI" floating button in the bottom-right corner
2. Type your question in natural language
3. The assistant will search the platform and provide an answer with sources

## Example Questions

- "How do I create a new RAG application?"
- "What SDK modules are available?"
- "Who owns the Cloud Run module?"
- "How do I deploy to GCP?"

## Configuration

The plugin uses the AI Chatbot backend. See the backend plugin README for configuration options.

## Components

- `AiChatbotSidebar` - Main sidebar component to add to your app
- `ChatPanel` - The chat interface panel
- `ChatMessage` - Individual message display
- `ChatInput` - Message input component
- `SourceCitation` - Source citation display

## API

The plugin provides an API client for communicating with the backend:

```typescript
import { aiChatbotApiRef } from '@internal/plugin-ai-chatbot';
import { useApi } from '@backstage/core-plugin-api';

const api = useApi(aiChatbotApiRef);
const response = await api.chat({ message: 'How do I get started?' });
```
