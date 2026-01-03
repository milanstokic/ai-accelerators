# Observability Module

Instrument applications for monitoring and debugging with Langfuse integration.

## Overview

The Observability module provides tracing, monitoring, and cost tracking for AI applications using Langfuse.

## Features

- **Tracing**: Track LLM calls and operations
- **Monitoring**: Monitor performance and errors
- **Cost Tracking**: Track API costs
- **Custom Spans**: Add custom instrumentation

## Basic Usage

```python
from accelerators.observability import observe, trace
from accelerators.llm import LLMClient

@observe(name="my_function")
async def my_function():
    with trace.span("llm_call"):
        client = LLMClient(...)
        response = await client.complete([...])
    
    trace.set_metadata({"tokens": response.usage.total_tokens})
    return response
```

## Configuration

```python
from accelerators.observability import configure

configure(
    public_key="pk-...",
    secret_key="sk-...",
    host="https://cloud.langfuse.com"
)
```

## Custom Spans

```python
with trace.span("custom_operation"):
    # Your code here
    trace.set_metadata({"key": "value"})
```

## Next Steps

- [Config Module](config.md)
- [Examples](../../examples.md)

