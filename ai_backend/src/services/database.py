import logging
import json
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, update
from datetime import datetime, timezone
from src.models import Base, ChatSession, ChatMessage

logger = logging.getLogger("AI_Backend.Database")

# Use PostgreSQL if configured, otherwise fall back to SQLite for local dev
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "sqlite+aiosqlite:///siliconmind.db"
)

engine = create_async_engine(DATABASE_URL, echo=False)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    """Create all tables if they don't exist."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized.")


# ============================================
# SESSION CRUD
# ============================================

async def create_session(title: str = "New Chat") -> dict:
    async with async_session_factory() as session:
        chat = ChatSession(title=title)
        session.add(chat)
        await session.commit()
        await session.refresh(chat)
        logger.info(f"Created session: {chat.id} ({chat.title})")
        return {"id": chat.id, "title": chat.title, "created_at": str(chat.created_at)}


async def list_sessions() -> list[dict]:
    async with async_session_factory() as session:
        result = await session.execute(
            select(ChatSession).order_by(ChatSession.updated_at.desc())
        )
        sessions = result.scalars().all()
        return [
            {
                "id": s.id,
                "title": s.title,
                "created_at": str(s.created_at),
                "updated_at": str(s.updated_at),
            }
            for s in sessions
        ]


async def get_session_messages(session_id: str) -> list[dict]:
    async with async_session_factory() as session:
        result = await session.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at)
        )
        messages = result.scalars().all()
        return [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "citations": json.loads(m.citations) if m.citations else None,
                "created_at": str(m.created_at),
            }
            for m in messages
        ]


async def rename_session(session_id: str, new_title: str):
    async with async_session_factory() as session:
        await session.execute(
            update(ChatSession)
            .where(ChatSession.id == session_id)
            .values(title=new_title, updated_at=datetime.now(timezone.utc))
        )
        await session.commit()


async def delete_session(session_id: str):
    async with async_session_factory() as session:
        result = await session.execute(
            select(ChatSession).where(ChatSession.id == session_id)
        )
        chat = result.scalar_one_or_none()
        if chat:
            await session.delete(chat)
            await session.commit()
            logger.info(f"Deleted session: {session_id}")


# ============================================
# MESSAGE CRUD
# ============================================

async def save_message(session_id: str, role: str, content: str, citations: list = None) -> dict:
    async with async_session_factory() as session:
        msg = ChatMessage(
            session_id=session_id,
            role=role,
            content=content,
            citations=json.dumps(citations) if citations else None,
        )
        session.add(msg)
        # Also update the session's updated_at timestamp
        await session.execute(
            update(ChatSession)
            .where(ChatSession.id == session_id)
            .values(updated_at=datetime.now(timezone.utc))
        )
        await session.commit()
        await session.refresh(msg)
        return {"id": msg.id, "role": msg.role, "content": msg.content}


async def auto_title_session(session_id: str, first_message: str):
    """Auto-generate a session title from the first user message."""
    title = first_message[:50] + ("..." if len(first_message) > 50 else "")
    await rename_session(session_id, title)
