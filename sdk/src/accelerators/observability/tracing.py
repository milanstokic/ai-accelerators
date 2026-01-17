"""Tracing and observability utilities using Langfuse."""

from contextlib import contextmanager
from functools import wraps
from typing import Any, AsyncIterator, Callable, Iterator, TypeVar

from langfuse import Langfuse
from langfuse.decorators import langfuse_context, observe as langfuse_observe

F = TypeVar("F", bound=Callable[..., Any])


class TraceContext:
    """Context manager for creating spans in traces."""

    def __init__(self, name: str, metadata: dict[str, Any] | None = None) -> None:
        """Initialize trace context.

        Args:
            name: Name of the span
            metadata: Optional metadata to attach to the span
        """
        self.name = name
        self.metadata = metadata or {}
        self._span = None

    def __enter__(self) -> "TraceContext":
        """Enter the trace context."""
        langfuse_context.update_current_trace(
            name=self.name,
            metadata=self.metadata,
        )
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Exit the trace context."""
        pass


class Trace:
    """Trace utility class for creating spans and logging."""

    @staticmethod
    @contextmanager
    def span(name: str, metadata: dict[str, Any] | None = None) -> Iterator[TraceContext]:
        """Create a span within the current trace.

        Args:
            name: Name of the span
            metadata: Optional metadata to attach to the span

        Yields:
            TraceContext for the span

        Example:
            ```python
            with trace.span("retrieval", {"query": "test"}):
                docs = await retrieve(query)
            ```
        """
        with TraceContext(name, metadata):
            yield TraceContext(name, metadata)

    @staticmethod
    def log_evaluation(
        name: str,
        score: float,
        comment: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Log an evaluation score.

        Args:
            name: Name of the evaluation
            score: Evaluation score (0.0 to 1.0)
            comment: Optional comment about the evaluation
            metadata: Optional metadata to attach

        Example:
            ```python
            trace.log_evaluation(
                name="relevance",
                score=0.85,
                comment="Retrieved docs were relevant"
            )
            ```
        """
        langfuse_context.score_current_trace(
            name=name,
            value=score,
            comment=comment,
        )

    @staticmethod
    def set_metadata(metadata: dict[str, Any]) -> None:
        """Set metadata on the current trace.

        Args:
            metadata: Dictionary of metadata to set
        """
        langfuse_context.update_current_trace(metadata=metadata)


# Global trace instance
trace = Trace()


def observe(
    name: str | None = None,
    capture_input: bool = True,
    capture_output: bool = True,
) -> Callable[[F], F]:
    """Decorator to observe function calls with Langfuse.

    Args:
        name: Optional name for the observation (defaults to function name)
        capture_input: Whether to capture function inputs
        capture_output: Whether to capture function outputs

    Returns:
        Decorated function

    Example:
        ```python
        @observe(name="rag_query")
        async def handle_query(query: str) -> str:
            # Function implementation
            return response
        ```
    """
    return langfuse_observe(
        name=name,
        capture_input=capture_input,
        capture_output=capture_output,
    )


def init_langfuse(
    public_key: str | None = None,
    secret_key: str | None = None,
    host: str = "https://cloud.langfuse.com",
) -> Langfuse:
    """Initialize Langfuse client.

    Args:
        public_key: Langfuse public key (from environment if not provided)
        secret_key: Langfuse secret key (from environment if not provided)
        host: Langfuse host URL

    Returns:
        Initialized Langfuse client

    Note:
        If keys are not provided, they will be loaded from environment variables:
        - LANGFUSE_PUBLIC_KEY
        - LANGFUSE_SECRET_KEY
    """
    return Langfuse(
        public_key=public_key,
        secret_key=secret_key,
        host=host,
    )



