"""OpenAI provider implementation."""

from typing import AsyncIterator

from openai import AsyncOpenAI
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


class OpenAIProvider(BaseLLMClient):
    """OpenAI GPT LLM provider.

    Example:
        ```python
        from accelerators.llm import OpenAIProvider, Message

        client = OpenAIProvider(
            api_key="sk-...",
            default_model="gpt-4o"
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
        default_model: str = "gpt-4o",
    ) -> None:
        """Initialize OpenAI provider.

        Args:
            api_key: OpenAI API key
            default_model: Default model to use for completions
        """
        self.api_key = api_key
        self.default_model = default_model
        self._client = AsyncOpenAI(api_key=api_key)

    def _convert_messages(self, messages: list[Message]) -> list[dict[str, str]]:
        """Convert Message objects to OpenAI format."""
        return [msg.to_dict() for msg in messages]

    def _handle_error(self, error: Exception) -> None:
        """Convert OpenAI errors to our exception types."""
        error_str = str(error).lower()
        if "authentication" in error_str or "invalid api key" in error_str:
            raise LLMAuthenticationError(f"OpenAI authentication failed: {error}") from error
        elif "rate limit" in error_str:
            raise LLMRateLimitError(f"OpenAI rate limit exceeded: {error}") from error
        elif isinstance(error, Exception):
            raise LLMProviderError(f"OpenAI API error: {error}") from error
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
        """Generate a completion using OpenAI."""
        try:
            response = await self._client.chat.completions.create(
                model=model or self.default_model,
                messages=self._convert_messages(messages),
                max_tokens=max_tokens,
                temperature=temperature,
                **kwargs,
            )

            content = response.choices[0].message.content or ""
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            }

            return LLMResponse(
                content=content,
                model=response.model,
                usage=usage,
                finish_reason=response.choices[0].finish_reason,
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
        """Generate a streaming completion using OpenAI."""
        try:
            stream = await self._client.chat.completions.create(
                model=model or self.default_model,
                messages=self._convert_messages(messages),
                max_tokens=max_tokens,
                temperature=temperature,
                stream=True,
                **kwargs,
            )

            async for chunk in stream:
                if chunk.choices:
                    delta = chunk.choices[0].delta
                    if delta.content:
                        yield LLMStreamChunk(content=delta.content, done=False)

                # Check if this is the final chunk
                if chunk.choices and chunk.choices[0].finish_reason:
                    usage = None
                    if hasattr(chunk, "usage") and chunk.usage:
                        usage = {
                            "prompt_tokens": chunk.usage.prompt_tokens,
                            "completion_tokens": chunk.usage.completion_tokens,
                            "total_tokens": chunk.usage.total_tokens,
                        }
                    yield LLMStreamChunk(content="", done=True, usage=usage)
        except Exception as e:
            self._handle_error(e)
            raise
