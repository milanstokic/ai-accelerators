"""Base LLM client interface."""

from abc import ABC, abstractmethod
from typing import AsyncIterator

from accelerators.llm.models import LLMResponse, LLMStreamChunk, Message


class BaseLLMClient(ABC):
    """Abstract base class for LLM clients.

    All LLM provider implementations must inherit from this class
    and implement the required methods.
    """

    @abstractmethod
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

        Raises:
            LLMError: If the request fails
        """
        raise NotImplementedError

    @abstractmethod
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

        Raises:
            LLMError: If the request fails
        """
        raise NotImplementedError
