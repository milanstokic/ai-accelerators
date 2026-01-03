"""OpenAI embedding provider implementation."""

from openai import AsyncOpenAI

from accelerators.embeddings.base import EmbeddingProvider


class OpenAIEmbeddingProvider(EmbeddingProvider):
    """OpenAI embedding provider.

    Example:
        ```python
        from accelerators.embeddings import OpenAIEmbeddingProvider

        provider = OpenAIEmbeddingProvider(
            api_key="sk-...",
            model="text-embedding-3-small"
        )

        embedding = await provider.embed("Hello world")
        embeddings = await provider.embed_batch(["Hello", "World"])
        ```
    """

    def __init__(
        self,
        api_key: str,
        model: str = "text-embedding-3-small",
    ) -> None:
        """Initialize OpenAI embedding provider.

        Args:
            api_key: OpenAI API key
            model: Embedding model to use
        """
        self.api_key = api_key
        self.model = model
        self._client = AsyncOpenAI(api_key=api_key)

    async def embed(self, text: str) -> list[float]:
        """Generate embedding for a single text."""
        response = await self._client.embeddings.create(
            model=self.model,
            input=text,
        )
        return response.data[0].embedding

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for multiple texts."""
        response = await self._client.embeddings.create(
            model=self.model,
            input=texts,
        )
        return [item.embedding for item in response.data]

    @property
    def dimension(self) -> int:
        """Get the dimension of embeddings."""
        # text-embedding-3-small: 1536
        # text-embedding-3-large: 3072
        if "large" in self.model:
            return 3072
        return 1536

