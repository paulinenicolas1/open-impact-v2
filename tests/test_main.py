import pytest
from fastapi.testclient import TestClient


def test_read_root(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"Hello": "World"}


@pytest.mark.asyncio
async def test_read_item(client: TestClient) -> None:
    # Note: TestClient is synchronous, but we can mark async if we were using AsyncClient
    # For this template, we stick to simple TestClient but show async marker usage
    response = client.get("/items/42?q=test")
    assert response.status_code == 200
    assert response.json() == {"item_id": 42, "q": "test"}
