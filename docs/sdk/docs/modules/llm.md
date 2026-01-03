# LLM Module

Unified interface for LLM providers (Anthropic, OpenAI, Google, Ollama).

## Overview

The LLM module provides a consistent interface for working with multiple LLM providers, allowing you to switch providers without changing your code.

## Supported Providers

- **Anthropic**: Claude models (Sonnet, Opus, Haiku)
- **OpenAI**: GPT models (GPT-4, GPT-3.5)
- **Google**: Gemini models
- **Ollama**: Local models

## Basic Usage

```python
from accelerators.llm import LLMClient, Message

# Initialize client
client = LLMClient(
    provider="anthropic",
    api_key="sk-ant-...",
    model="claude-sonnet-4-20250514"
)

# Complete a conversation
response = await client.complete([
    Message(role="system", content="You are a helpful assistant."),
    Message(role="user", content="What is AI?")
])

print(response.content)
print(response.model)
print(response.usage)
```

## Streaming

```python
async for chunk in client.stream([
    Message(role="user", content="Tell me a story")
]):
    print(chunk.content, end="", flush=True)
```

## Provider-Specific Options

```python
# Anthropic
response = await client.complete(
    messages=[...],
    max_tokens=1000,
    temperature=0.7
)

# OpenAI
response = await client.complete(
    messages=[...],
    max_tokens=1000,
    temperature=0.7,
    top_p=0.9  # OpenAI-specific
)
```

## Error Handling

```python
from accelerators.llm import LLMError

try:
    response = await client.complete([...])
except LLMError as e:
    print(f"LLM error: {e}")
```

## Next Steps

- [Vector Store Module](vectorstore.md)
- [Examples](../../examples.md)

