from fastapi.testclient import TestClient


def test_read_root(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"Hello": "World"}


def test_create_and_read_item(client: TestClient) -> None:
    # Create item
    response = client.post(
        "/api/v1/items/",
        json={"title": "Test Item", "description": "This is a test item"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Item"
    assert data["description"] == "This is a test item"
    assert "id" in data
    item_id = data["id"]

    # Read items
    response = client.get("/api/v1/items/")
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)
    assert len(items) > 0
    # Check if our item is in the list
    found = any(item["id"] == item_id for item in items)
    assert found
    # Also check the first item's title if it's the one we just created
    # This assumes the API returns items in creation order or that there's only one item
    if found and items[0]["id"] == item_id:
        assert items[0]["title"] == "Test Item"


def test_read_monthly_data(client: TestClient) -> None:
    response = client.get("/api/v1/monthly_data")
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert payload, "monthly_data should not be empty"
    first_row = payload[0]
    assert "MM" in first_row
    assert "MOIS" in first_row
    assert "data" in first_row
    assert isinstance(first_row["data"], dict)
    assert first_row["data"], "monthly_data row should include metrics"
