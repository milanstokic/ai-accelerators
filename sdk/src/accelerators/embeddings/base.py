"""Base embedding provider interface."""

from abc import ABC, abstractmethod


class EmbeddingProvider(ABC):
    """Abstract base class for embedding providers."""
    """Abstract base class for embedding providers."""

    @abstractmethod
    async def embed(self, text: str) -> list[float]:
        """Generate embedding for a single text.

        Args:
            text: Input text

        Returns:
            Embedding vector
        """
        raise NotImplementedError

    @abstractmethod
    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for multiple texts.

        Args:
            texts: List of input texts

        Returns:
            List of embedding vectors
        """
        raise NotImplementedError

    @property
    @abstractmethod
    def dimension(self) -> int:
        """Get the dimension of embeddings produced by this provider."""
        raise NotImplementedError

