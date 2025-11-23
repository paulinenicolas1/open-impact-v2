from fastapi.testclient import TestClient


def test_read_root(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"Hello": "World"}


def test_create_and_read_item(client: TestClient) -> None:
    # Create item
    response = client.post(
        "/items",
        json={"title": "Test Item", "description": "A test item"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Item"
    assert data["description"] == "A test item"
    assert "id" in data
    item_id = data["id"]

    # Read items
    response = client.get("/items")
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)
    # Check if our item is in the list
    found = any(item["id"] == item_id for item in items)
    assert found
