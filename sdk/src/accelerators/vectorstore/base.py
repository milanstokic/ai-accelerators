"""Base vector store interface."""

from abc import ABC, abstractmethod
from typing import Any

from accelerators.vectorstore.models import Document, SearchResult


class VectorStore(ABC):
    """Abstract base class for vector store implementations.

    All vector store providers must inherit from this class
    and implement the required methods.
    """

    @abstractmethod
    async def create_collection(
        self,
        collection_name: str,
        dimension: int,
        **kwargs: dict,
    ) -> None:
        """Create a new collection.

        Args:
            collection_name: Name of the collection
            dimension: Dimension of the vectors
            **kwargs: Additional provider-specific parameters
        """
        raise NotImplementedError

    @abstractmethod
    async def delete_collection(self, collection_name: str) -> None:
        """Delete a collection.

        Args:
            collection_name: Name of the collection to delete
        """
        raise NotImplementedError

    @abstractmethod
    async def upsert(
        self,
        documents: list[Document],
        collection_name: str | None = None,
    ) -> None:
        """Upsert documents into the vector store.

        Args:
            documents: List of documents to upsert
            collection_name: Optional collection name (uses default if not provided)
        """
        raise NotImplementedError

    @abstractmethod
    async def search(
        self,
        query_vector: list[float],
        collection_name: str | None = None,
        limit: int = 10,
        filters: dict[str, Any] | None = None,
    ) -> list[SearchResult]:
        """Search for similar documents.

        Args:
            query_vector: Query embedding vector
            collection_name: Optional collection name (uses default if not provided)
            limit: Maximum number of results
            filters: Optional metadata filters

        Returns:
            List of search results sorted by similarity
        """
        raise NotImplementedError

    @abstractmethod
    async def delete(
        self,
        document_ids: list[str],
        collection_name: str | None = None,
    ) -> None:
        """Delete documents by ID.

        Args:
            document_ids: List of document IDs to delete
            collection_name: Optional collection name (uses default if not provided)
        """
        raise NotImplementedError



