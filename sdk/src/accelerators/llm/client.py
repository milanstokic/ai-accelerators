"""Unified LLM client interface."""

from typing import AsyncIterator

from accelerators.llm.models import LLMProvider, LLMResponse, LLMStreamChunk, Message
from accelerators.llm.providers.anthropic import AnthropicProvider
from accelerators.llm.providers.openai import OpenAIProvider


class LLMClient:
    """Unified client for interacting with multiple LLM providers.

    This client provides a consistent interface across different LLM providers,
    allowing you to switch providers without changing your code.

    Example:
        ```python
        from accelerators.llm import LLMClient, Message

        # Initialize with Anthropic
        client = LLMClient(
            provider="anthropic",
            api_key="sk-ant-...",
            model="claude-sonnet-4-20250514"
        )

        # Use the same interface
        response = await client.complete([
            Message(role="user", content="Hello!")
        ])

        # Switch to OpenAI
        client = LLMClient(
            provider="openai",
            api_key="sk-...",
            model="gpt-4o"
        )
        ```
    """

    def __init__(
        self,
        provider: str | LLMProvider,
        api_key: str,
        model: str | None = None,
    ) -> None:
        """Initialize LLM client with a specific provider.

        Args:
            provider: Provider name ("anthropic", "openai", etc.)
            api_key: API key for the provider
            model: Model identifier (uses provider default if not specified)

        Raises:
            ValueError: If provider is not supported
        """
        provider_str = provider.value if isinstance(provider, LLMProvider) else provider.lower()

        if provider_str == LLMProvider.ANTHROPIC.value:
            default_model = model or "claude-sonnet-4-20250514"
            self._client = AnthropicProvider(api_key=api_key, default_model=default_model)
        elif provider_str == LLMProvider.OPENAI.value:
            default_model = model or "gpt-4o"
            self._client = OpenAIProvider(api_key=api_key, default_model=default_model)
        else:
            raise ValueError(
                f"Unsupported provider: {provider}. "
                f"Supported providers: {[p.value for p in LLMProvider]}"
            )

    async def complete(
        self,
        messages: list[Message],
        model: str | None = None,
        max_tokens: int | None = None,
        temperature: float = 1.0,
        **kwargs: dict,
    ) -> LLMResponse:
        """Generate a completion from the LLM.

        Args:
            messages: List of messages in the conversation
            model: Model identifier (overrides default)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0.0 to 2.0)
            **kwargs: Additional provider-specific parameters

        Returns:
            LLMResponse with generated content and metadata
        """
        return await self._client.complete(
            messages=messages,
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            **kwargs,
        )

    async def stream(
        self,
        messages: list[Message],
        model: str | None = None,
        max_tokens: int | None = None,
        temperature: float = 1.0,
        **kwargs: dict,
    ) -> AsyncIterator[LLMStreamChunk]:
        """Generate a streaming completion from the LLM.

        Args:
            messages: List of messages in the conversation
            model: Model identifier (overrides default)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0.0 to 2.0)
            **kwargs: Additional provider-specific parameters

        Yields:
            LLMStreamChunk objects with incremental content
        """
        async for chunk in self._client.stream(
            messages=messages,
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            **kwargs,
        ):
            yield chunk
