"""Qdrant vector store implementation."""

from typing import Any

from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, PointStruct, Filter, FieldCondition, MatchValue

from accelerators.vectorstore.base import VectorStore
from accelerators.vectorstore.models import Document, SearchResult


class QdrantVectorStore(VectorStore):
    """Qdrant vector store implementation.

    Example:
        ```python
        from accelerators.vectorstore import QdrantVectorStore, Document

        store = QdrantVectorStore(
            url="http://localhost:6333",
            collection_name="knowledge_base"
        )

        await store.create_collection("knowledge_base", dimension=1536)
        await store.upsert([
            Document(id="doc1", content="Hello world", metadata={"source": "test"})
        ])
        ```
    """

    def __init__(
        self,
        url: str,
        collection_name: str = "default",
        api_key: str | None = None,
    ) -> None:
        """Initialize Qdrant vector store.

        Args:
            url: Qdrant server URL
            collection_name: Default collection name
            api_key: Optional API key for authentication
        """
        self.url = url
        self.collection_name = collection_name
        self._client = AsyncQdrantClient(url=url, api_key=api_key)

    async def create_collection(
        self,
        collection_name: str,
        dimension: int,
        **kwargs: dict,
    ) -> None:
        """Create a new collection in Qdrant."""
        from qdrant_client.models import VectorParams, CollectionStatus

        await self._client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(
                size=dimension,
                distance=Distance.COSINE,
            ),
            **kwargs,
        )

        # Wait for collection to be ready
        await self._client.wait_for_collection(collection_name, timeout=10)

    async def delete_collection(self, collection_name: str) -> None:
        """Delete a collection from Qdrant."""
        await self._client.delete_collection(collection_name)

    async def upsert(
        self,
        documents: list[Document],
        collection_name: str | None = None,
    ) -> None:
        """Upsert documents into Qdrant."""
        collection = collection_name or self.collection_name

        points = []
        for doc in documents:
            if not doc.embedding:
                raise ValueError(f"Document {doc.id} must have an embedding")

            payload = {
                "content": doc.content,
                **doc.metadata,
            }

            points.append(
                PointStruct(
                    id=doc.id,
                    vector=doc.embedding,
                    payload=payload,
                )
            )

        await self._client.upsert(
            collection_name=collection,
            points=points,
        )

    async def search(
        self,
        query_vector: list[float],
        collection_name: str | None = None,
        limit: int = 10,
        filters: dict[str, Any] | None = None,
    ) -> list[SearchResult]:
        """Search for similar documents in Qdrant."""
        collection = collection_name or self.collection_name

        # Build filter if provided
        qdrant_filter = None
        if filters:
            conditions = []
            for key, value in filters.items():
                conditions.append(
                    FieldCondition(
                        key=key,
                        match=MatchValue(value=value),
                    )
                )
            if conditions:
                qdrant_filter = Filter(must=conditions)

        results = await self._client.search(
            collection_name=collection,
            query_vector=query_vector,
            limit=limit,
            query_filter=qdrant_filter,
        )

        search_results = []
        for result in results:
            payload = result.payload or {}
            document = Document(
                id=str(result.id),
                content=payload.get("content", ""),
                metadata={k: v for k, v in payload.items() if k != "content"},
                embedding=None,  # Not returned in search results
            )
            search_results.append(
                SearchResult(
                    document=document,
                    score=result.score or 0.0,
                )
            )

        return search_results

    async def delete(
        self,
        document_ids: list[str],
        collection_name: str | None = None,
    ) -> None:
        """Delete documents by ID from Qdrant."""
        collection = collection_name or self.collection_name
        await self._client.delete(
            collection_name=collection,
            points_selector=document_ids,
        )

