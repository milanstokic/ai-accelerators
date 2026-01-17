"""Vector store data models."""

from typing import Any

from pydantic import BaseModel, Field


class Document(BaseModel):
    """A document with content and metadata.

    Attributes:
        id: Unique document identifier
        content: Document text content
        metadata: Optional metadata dictionary
        embedding: Optional embedding vector
    """

    id: str = Field(..., description="Document identifier")
    content: str = Field(..., description="Document content")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Document metadata")
    embedding: list[float] | None = Field(None, description="Document embedding vector")


class SearchResult(BaseModel):
    """A search result with document and similarity score.

    Attributes:
        document: The matched document
        score: Similarity score
    """

    document: Document = Field(..., description="Matched document")
    score: float = Field(..., description="Similarity score")



