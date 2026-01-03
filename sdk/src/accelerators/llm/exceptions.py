"""LLM-related exceptions."""


class LLMError(Exception):
    """Base exception for LLM operations."""

    pass


class LLMProviderError(LLMError):
    """Exception raised when provider-specific errors occur."""

    pass


class LLMRateLimitError(LLMError):
    """Exception raised when rate limits are exceeded."""

    pass


class LLMAuthenticationError(LLMError):
    """Exception raised when authentication fails."""

    pass


class LLMValidationError(LLMError):
    """Exception raised when request validation fails."""

    pass
