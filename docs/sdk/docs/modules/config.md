# Config Module

Configuration management with environment variable support and Pydantic Settings.

## Overview

The Config module provides environment-aware configuration management using Pydantic Settings.

## Basic Usage

```python
from accelerators.config import BaseSettings
from pydantic_settings import SettingsConfigDict

class AppSettings(BaseSettings):
    api_key: str
    model: str = "default"
    debug: bool = False
    
    model_config = SettingsConfigDict(
        env_prefix="APP_",
        case_sensitive=False
    )

settings = AppSettings()
# Reads from APP_API_KEY, APP_MODEL, APP_DEBUG
```

## Environment Variables

```bash
export APP_API_KEY=sk-...
export APP_MODEL=claude-sonnet-4
export APP_DEBUG=true
```

## Validation

```python
from pydantic import Field

class AppSettings(BaseSettings):
    api_key: str = Field(..., min_length=10)
    port: int = Field(default=8000, ge=1, le=65535)
```

## Next Steps

- [Examples](../../examples.md)
- [API Reference](../../api-reference.md)

