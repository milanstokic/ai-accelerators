"""Embeddings module for generating text embeddings."""

from accelerators.embeddings.base import EmbeddingProvider
from accelerators.embeddings.providers.openai import OpenAIEmbeddingProvider

__all__ = [
    "EmbeddingProvider",
    "OpenAIEmbeddingProvider",
]



