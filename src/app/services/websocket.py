from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        """Disconnect a websocket if it's still in the active connections."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str) -> None:
        """Send message to all connected clients, removing disconnected ones."""
        disconnected_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                # Connection is closed, mark for removal
                disconnected_connections.append(connection)

        # Remove disconnected clients
        for connection in disconnected_connections:
            if connection in self.active_connections:
                self.active_connections.remove(connection)


manager = ConnectionManager()
