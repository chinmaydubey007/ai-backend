import asyncio
import os
from dotenv import load_dotenv

# Ensure env is loaded so DATABASE_URL is available
load_dotenv()

from src.services.database import engine
from src.models import Base

async def reset_tables():
    print("Dropping all tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        print("Creating all tables with Timezone awareness...")
        await conn.run_sync(Base.metadata.create_all)
    print("Done!")

if __name__ == "__main__":
    asyncio.run(reset_tables())
