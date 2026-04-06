import os
import logging
import uvicorn
from dotenv import load_dotenv

# Load environment variables before anything else
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from src.api.routes import router as api_router
from src.api.knowledge_routes import router as knowledge_router
from src.api.lab_routes import router as lab_router
from src.services.database import init_db

# 1. Configure production-grade logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("AI_Backend")

# 2. Lifespan: runs on startup and shutdown
@asynccontextmanager
async def lifespan(app):
    # Startup
    logger.info("Initializing database...")
    await init_db()
    yield
    # Shutdown
    logger.info("Shutting down.")

# 3. Create the core FastAPI Application object
def create_app() -> FastAPI:
    logger.info("Initializing FastAPI service...")
    app = FastAPI(
        title="Production AI Backend",
        description="A robust foundation for AI generation tasks.",
        version="1.0.0",
        lifespan=lifespan,
    )

    # 4. Allow the Next.js frontend to communicate with us
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    # 5. Mount our routes
    app.include_router(api_router)
    app.include_router(knowledge_router)
    app.include_router(lab_router)
    return app

app = create_app()

def main():
    logger.info("Starting uvicorn server...")
    # 4. Run the web server using Uvicorn
    # 'src.main:app' allows uvicorn to find the app object and supports automatic reloading
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    main()
