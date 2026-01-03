"""LLM-related data models."""

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class LLMProvider(str, Enum):
    """Supported LLM providers."""

    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    GOOGLE = "google"
    OLLAMA = "ollama"


class MessageRole(str, Enum):
    """Message roles in a conversation."""

    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class Message(BaseModel):
    """A message in a conversation.

    Attributes:
        role: The role of the message sender
        content: The message content
    """

    role: Literal["system", "user", "assistant"] = Field(..., description="Message role")
    content: str = Field(..., description="Message content")

    def to_dict(self) -> dict[str, str]:
        """Convert message to dictionary format for API calls."""
        return {"role": self.role, "content": self.content}


class LLMResponse(BaseModel):
    """Response from an LLM completion.

    Attributes:
        content: The generated text content
        model: The model used for generation
        usage: Token usage information
        finish_reason: Reason for completion finish
    """

    content: str = Field(..., description="Generated text content")
    model: str = Field(..., description="Model identifier")
    usage: dict[str, int] = Field(default_factory=dict, description="Token usage statistics")
    finish_reason: str | None = Field(None, description="Reason for completion finish")


class LLMStreamChunk(BaseModel):
    """A chunk from a streaming LLM response.

    Attributes:
        content: The text content of this chunk
        done: Whether this is the final chunk
        usage: Token usage information (only in final chunk)
    """

    content: str = Field(..., description="Chunk text content")
    done: bool = Field(default=False, description="Whether this is the final chunk")
    usage: dict[str, int] | None = Field(None, description="Token usage (final chunk only)")
