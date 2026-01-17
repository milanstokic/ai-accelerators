# Project Plan: AI Search Integration on Homepage

**Version:** 1.0  
**Created:** January 14, 2026  
**Status:** Completed

## Overview

This plan captures the implementation of AI-powered search on the Backstage homepage, replacing the standard search bar with an inline AI search experience.

## Goals

1. Integrate AI chatbot capabilities directly into the homepage search bar
2. Provide inline AI responses with source citations
3. Maintain fallback to standard search functionality
4. Enhance user experience with suggested queries

## Implementation Details

### Components Created

1. **AiSearchBox Component** (`backstage/plugins/ai-chatbot/src/components/AiSearchBox/AiSearchBox.tsx`)
   - AI-powered search input with inline response panel
   - Collapsible result panel with markdown rendering
   - Source citations with clickable links
   - Suggested queries for quick access
   - Loading states and error handling

2. **Export Updates** (`backstage/plugins/ai-chatbot/src/plugin.ts`, `backstage/plugins/ai-chatbot/src/index.ts`)
   - Added `AiSearchBox` export from the AI chatbot plugin

### Integration Points

- **HomePage Integration**: The `AiSearchBox` component is integrated into the custom `HomePage.tsx` component
- **API Reuse**: Leverages the existing `useChat` hook and `AiChatbotApi` for backend communication
- **Styling**: Uses Material-UI styling consistent with Backstage design system

## Technical Decisions

1. **Inline Results**: AI responses are shown inline below the search bar rather than navigating to a separate page
2. **Suggested Queries**: Pre-defined suggested queries help users discover the AI capabilities
3. **Beta Label**: The feature is marked as "Beta" to set user expectations
4. **Graceful Degradation**: If the AI service is unavailable, users can still use standard Backstage search

## Files Modified

- `backstage/plugins/ai-chatbot/src/plugin.ts` - Added AiSearchBox export
- `backstage/plugins/ai-chatbot/src/index.ts` - Added AiSearchBox export
- `backstage/plugins/ai-chatbot/src/components/AiSearchBox/AiSearchBox.tsx` - New component
- `backstage/plugins/ai-chatbot/src/components/AiSearchBox/index.ts` - New index file
- `backstage/packages/app/src/components/home/HomePage.tsx` - Integrated AiSearchBox

## Dependencies

- Existing AI Chatbot plugin infrastructure
- `useChat` hook for chat state management
- `AiChatbotApi` for backend communication
- Qdrant vector store for knowledge retrieval
- Anthropic Claude for response generation
