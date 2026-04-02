#!/bin/bash
set -e

# --- SiliconMind Workspace Setup Script ---
echo "Initializing SiliconMind Pro in Codespaces..."

# 1. Setup Backend
echo "Setting up Python Backend..."
cd ai_backend
python -m venv .venv
source .venv/bin/activate
pip install setuptools uvicorn fastapi psycopg2-binary asyncpg sqlalchemy pydantic groq duckduckgo-search "pdfplumber[all]"
cd ..

# 2. Setup Frontend
echo "Setting up Next.js Frontend..."
cd siliconmind
npm install
cd ..

# 3. Create start script aliases for convenience
echo "alias start-backend='cd ai_backend && source .venv/bin/activate && uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload'" >> ~/.bashrc
echo "alias start-frontend='cd siliconmind && npm run dev'" >> ~/.bashrc

echo "Setup complete! Type 'start-backend' in one terminal and 'start-frontend' in another."
