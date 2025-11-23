from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.database import get_session, init_db
from app.models import Item, ItemCreate, ItemRead


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None]:
    await init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,  # type: ignore
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# WebSocket Manager
class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
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
            self.active_connections.remove(connection)


manager = ConnectionManager()


@app.get("/")
async def read_root() -> dict[str, str]:
    return {"Hello": "World"}


@app.get("/items", response_model=list[ItemRead])
async def get_items(session: Annotated[AsyncSession, Depends(get_session)]) -> list[Item]:
    result = await session.execute(select(Item))
    return list(result.scalars().all())


@app.post("/items", response_model=ItemRead)
async def create_item(item: ItemCreate, session: Annotated[AsyncSession, Depends(get_session)]) -> Item:
    db_item = Item.model_validate(item)
    session.add(db_item)
    await session.commit()
    await session.refresh(db_item)
    await manager.broadcast(f"New item added: {db_item.title}")
    return db_item


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"Client says: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast("A client left the chat")
