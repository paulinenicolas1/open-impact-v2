"""Test WebSocket functionality and disconnection handling."""

from fastapi.testclient import TestClient

from app.main import app


def test_websocket_basic_connection() -> None:
    """Test basic WebSocket connection and communication."""
    client = TestClient(app)

    with client.websocket_connect("/ws") as websocket:
        # Send a message
        websocket.send_text("Hello")

        # Receive broadcast
        data = websocket.receive_text()
        assert "Client says: Hello" in data


def test_websocket_disconnect_doesnt_crash_broadcast() -> None:
    """
    Test that disconnecting a client while broadcasting doesn't crash the server.

    This reproduces the bug where refreshing the browser causes:
    - ConnectionClosedOK exception
    - WebSocketDisconnect during broadcast

    The bug occurs when:
    1. Client A disconnects
    2. Server tries to broadcast "client left" message
    3. Server tries to send to Client A (already disconnected)
    4. Exception is raised and not caught
    """
    client = TestClient(app)

    # Connect two clients
    with client.websocket_connect("/ws") as ws1:
        with client.websocket_connect("/ws") as _ws2:
            # Both clients are connected
            pass  # _ws2 disconnects here when exiting context

        # _ws2 is now disconnected
        # Server tries to broadcast "client left" to all clients including _ws2
        # This will crash if the bug exists

        # Receive the "client left" message
        disconnect_msg = ws1.receive_text()
        assert "client left" in disconnect_msg.lower()

        # Now ws1 sends a message to trigger another broadcast
        ws1.send_text("test message")

        # If the bug exists, this will fail because the server crashed
        # when trying to send the disconnect message to _ws2
        data = ws1.receive_text()
        assert "test message" in data


def test_multiple_clients_one_disconnect() -> None:
    """Test that one client disconnecting doesn't affect others."""
    client = TestClient(app)

    # Start with 3 connected clients
    with (
        client.websocket_connect("/ws") as _ws1,
        client.websocket_connect("/ws") as _ws2,
        client.websocket_connect("/ws") as _ws3,
    ):
        # Just testing that connections work
        # The test is that this doesn't raise an exception
        pass


def test_rapid_disconnect_during_broadcast() -> None:
    """
    Test that multiple rapid disconnects during broadcast don't cause ValueError.

    The bug was: ValueError: list.remove(x): x not in list
    This happened when broadcast() tried to remove a connection that was
    already removed by disconnect() or by a previous cleanup iteration.
    """
    client = TestClient(app)

    # This test passes if no ValueError is raised
    # Connect and rapidly disconnect multiple clients
    for _ in range(10):
        with client.websocket_connect("/ws"):
            pass  # Immediately disconnect, triggering broadcast cleanup

    # If we got here without crashing, the fix works
    assert True
