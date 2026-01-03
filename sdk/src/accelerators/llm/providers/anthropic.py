"""Anthropic Claude provider implementation."""

from typing import AsyncIterator

import anthropic
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from accelerators.llm.base import BaseLLMClient
from accelerators.llm.exceptions import (
    LLMAuthenticationError,
    LLMError,
    LLMRateLimitError,
    LLMProviderError,
)
from accelerators.llm.models import LLMResponse, LLMStreamChunk, Message


class AnthropicProvider(BaseLLMClient):
    """Anthropic Claude LLM provider.

    Example:
        ```python
        from accelerators.llm import AnthropicProvider, Message

        client = AnthropicProvider(
            api_key="sk-ant-...",
            default_model="claude-sonnet-4-20250514"
        )

        response = await client.complete([
            Message(role="user", content="Hello!")
        ])
        print(response.content)
        ```
    """

    def __init__(
        self,
        api_key: str,
        default_model: str = "claude-sonnet-4-20250514",
    ) -> None:
        """Initialize Anthropic provider.

        Args:
            api_key: Anthropic API key
            default_model: Default model to use for completions
        """
        self.api_key = api_key
        self.default_model = default_model
        self._client = anthropic.AsyncAnthropic(api_key=api_key)

    def _convert_messages(self, messages: list[Message]) -> dict:
        """Convert Message objects to Anthropic format."""
        # Anthropic doesn't support system messages in the messages array
        # They need to be passed separately
        system_messages = [msg.content for msg in messages if msg.role == "system"]
        conversation_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
            if msg.role != "system"
        ]

        return {
            "system": "\n".join(system_messages) if system_messages else None,
            "messages": conversation_messages,
        }

    def _handle_error(self, error: Exception) -> None:
        """Convert Anthropic errors to our exception types."""
        if isinstance(error, anthropic.AuthenticationError):
            raise LLMAuthenticationError(f"Anthropic authentication failed: {error}") from error
        elif isinstance(error, anthropic.RateLimitError):
            raise LLMRateLimitError(f"Anthropic rate limit exceeded: {error}") from error
        elif isinstance(error, anthropic.APIError):
            raise LLMProviderError(f"Anthropic API error: {error}") from error
        else:
            raise LLMError(f"Unexpected error: {error}") from error

    @retry(
        retry=retry_if_exception_type((LLMRateLimitError, LLMProviderError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def complete(
        self,
        messages: list[Message],
        model: str | None = None,
        max_tokens: int | None = None,
        temperature: float = 1.0,
        **kwargs: dict,
    ) -> LLMResponse:
        """Generate a completion using Anthropic Claude."""
        try:
            message_data = self._convert_messages(messages)
            model_name = model or self.default_model

            response = await self._client.messages.create(
                model=model_name,
                max_tokens=max_tokens or 1024,
                temperature=temperature,
                system=message_data["system"],
                messages=message_data["messages"],
                **kwargs,
            )

            # Extract content from response
            content = ""
            if response.content:
                for block in response.content:
                    if hasattr(block, "text"):
                        content += block.text

            usage = {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
            }

            return LLMResponse(
                content=content,
                model=response.model,
                usage=usage,
                finish_reason=response.stop_reason,
            )
        except Exception as e:
            self._handle_error(e)
            raise

    @retry(
        retry=retry_if_exception_type((LLMRateLimitError, LLMProviderError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def stream(
        self,
        messages: list[Message],
        model: str | None = None,
        max_tokens: int | None = None,
        temperature: float = 1.0,
        **kwargs: dict,
    ) -> AsyncIterator[LLMStreamChunk]:
        """Generate a streaming completion using Anthropic Claude."""
        try:
            message_data = self._convert_messages(messages)
            model_name = model or self.default_model

            async with self._client.messages.stream(
                model=model_name,
                max_tokens=max_tokens or 1024,
                temperature=temperature,
                system=message_data["system"],
                messages=message_data["messages"],
                **kwargs,
            ) as stream:
                async for event in stream:
                    if event.type == "content_block_delta":
                        if hasattr(event.delta, "text"):
                            yield LLMStreamChunk(content=event.delta.text, done=False)
                    elif event.type == "message_delta":
                        if hasattr(event, "usage"):
                            usage = {
                                "input_tokens": event.usage.input_tokens,
                                "output_tokens": event.usage.output_tokens,
                            }
                            yield LLMStreamChunk(content="", done=True, usage=usage)
                    elif event.type == "message_stop":
                        yield LLMStreamChunk(content="", done=True)
        except Exception as e:
            self._handle_error(e)
            raise
