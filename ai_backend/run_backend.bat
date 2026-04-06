@echo off
if exist .venv\Scripts\Activate.bat (
    call .venv\Scripts\Activate.bat
    uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
) else (
    echo Virtual environment not found. Please setup the backend.
)
