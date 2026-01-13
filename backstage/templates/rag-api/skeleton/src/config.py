"""Configuration for ${{ values.name | capitalize }}.

This module handles all configuration and client initialization.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # LLM Configuration
    llm_provider: str = "${{ values.llmProvider }}"
    llm_api_key: str = ""
    llm_model: str = "{% if values.llmModel %}${{ values.llmModel }}{% else %}{% endif %}"
    
    # Embedding Configuration
    embedding_provider: str = "${{ values.embeddingProvider }}"
    embedding_api_key: str = ""
    embedding_model: str = "${{ values.embeddingModel }}"
    
    # Vector Store Configuration
{% if values.vectorStore == 'qdrant' %}
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str | None = None
{% elif values.vectorStore == 'pinecone' %}
    pinecone_api_key: str = ""
    pinecone_environment: str = ""
{% elif values.vectorStore == 'chromadb' %}
    chromadb_path: str = "./data/chromadb"
{% endif %}
    collection_name: str = "${{ values.collectionName }}"
    
    # Application Settings
    debug: bool = False
    log_level: str = "INFO"
    
    model_config = SettingsConfigDict(
        env_prefix="RAG_",
        case_sensitive=False,
        env_file=".env",
    )


@lru_cache()
def get_settings() -> AppSettings:
    """Get cached settings instance."""
    return AppSettings()


settings = get_settings()


# =============================================================================
# Client Factories
# =============================================================================

_llm_client = None
_embedding_provider = None
_vector_store = None


def get_llm_client():
    """Get or create LLM client."""
    global _llm_client
    if _llm_client is None:
{% if values.llmProvider == 'anthropic' %}
        from anthropic import AsyncAnthropic
        _llm_client = AsyncAnthropic(api_key=settings.llm_api_key)
{% elif values.llmProvider == 'openai' %}
        from openai import AsyncOpenAI
        _llm_client = AsyncOpenAI(api_key=settings.llm_api_key)
{% elif values.llmProvider == 'google' %}
        import google.generativeai as genai
        genai.configure(api_key=settings.llm_api_key)
        _llm_client = genai.GenerativeModel(settings.llm_model or "gemini-pro")
{% endif %}
    return _llm_client


def get_embedding_provider():
    """Get or create embedding provider."""
    global _embedding_provider
    if _embedding_provider is None:
{% if values.embeddingProvider == 'openai' %}
        from openai import AsyncOpenAI
        _embedding_provider = AsyncOpenAI(api_key=settings.embedding_api_key)
{% elif values.embeddingProvider == 'voyage' %}
        import voyageai
        _embedding_provider = voyageai.Client(api_key=settings.embedding_api_key)
{% elif values.embeddingProvider == 'cohere' %}
        import cohere
        _embedding_provider = cohere.Client(api_key=settings.embedding_api_key)
{% endif %}
    return _embedding_provider


def get_vector_store():
    """Get or create vector store client."""
    global _vector_store
    if _vector_store is None:
{% if values.vectorStore == 'qdrant' %}
        from qdrant_client import QdrantClient
        _vector_store = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
        )
{% elif values.vectorStore == 'pinecone' %}
        from pinecone import Pinecone
        _vector_store = Pinecone(api_key=settings.pinecone_api_key)
{% elif values.vectorStore == 'chromadb' %}
        import chromadb
        _vector_store = chromadb.PersistentClient(path=settings.chromadb_path)
{% endif %}
    return _vector_store
