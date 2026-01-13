"""Tests for ${{ values.name | capitalize }} API."""

import pytest
from httpx import AsyncClient
from src.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.mark.anyio
async def test_health(client):
    """Test health endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.anyio
async def test_ready(client):
    """Test readiness endpoint."""
    response = await client.get("/ready")
    assert response.status_code == 200


@pytest.mark.anyio
async def test_query_validation(client):
    """Test query input validation."""
    # Empty query should fail
    response = await client.post("/query", json={"query": ""})
    assert response.status_code == 422


@pytest.mark.anyio
async def test_ingest_validation(client):
    """Test ingest input validation."""
    # Empty text should fail
    response = await client.post("/ingest", json={"text": ""})
    assert response.status_code == 422
