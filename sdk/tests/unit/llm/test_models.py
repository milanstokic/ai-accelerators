"""Tests for LLM models."""

from accelerators.llm.models import LLMProvider, Message, MessageRole


def test_message_creation():
    """Test creating a Message."""
    msg = Message(role="user", content="Hello, world!")
    assert msg.role == "user"
    assert msg.content == "Hello, world!"


def test_message_to_dict():
    """Test converting Message to dictionary."""
    msg = Message(role="assistant", content="Hi there!")
    result = msg.to_dict()
    assert result == {"role": "assistant", "content": "Hi there!"}


def test_llm_provider_enum():
    """Test LLMProvider enum values."""
    assert LLMProvider.ANTHROPIC.value == "anthropic"
    assert LLMProvider.OPENAI.value == "openai"
    assert LLMProvider.GOOGLE.value == "google"
    assert LLMProvider.OLLAMA.value == "ollama"
