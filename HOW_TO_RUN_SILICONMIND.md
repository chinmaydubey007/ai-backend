# SiliconMind Pro: Project Execution & Architecture Guide

This document explains the complete process for correctly running and understanding the SiliconMind Pro workspace.

## 📁 System Architecture
The workspace is split into two major components:
1. **Frontend (`siliconmind/`)**: Built with React (Next.js), it runs on Port `3000`.
2. **Backend (`ai_backend/`)**: Built with Python (FastAPI), it runs on Port `8000` and connects to PostgreSQL.

---

## 🚀 How to Run the Servers Locally (The Easy Way)

The absolute easiest way to start everything is to double-click the `Start-SiliconMind.bat` script located in the root folder (`e:\softwlearn\`).

**What this script does:**
1. Opens a new terminal and launches your Python Backend.
2. Opens a second terminal and launches your Next.js Frontend.
3. Automatically opens your default web browser to the dashboard (`http://localhost:3000`).

---

## 🛠️ How to Run the Servers Manually (The Detailed Way)

If you need to restart just one piece, or the `.bat` file isn't working, here is exactly how to start them manually.

### STEP 1: Always Start the Backend First
If the frontend starts without the backend, the chats will not load (because there is no database running).
1. Open a new Terminal (PowerShell or Command Prompt).
2. Type: `cd e:\softwlearn\ai_backend`
3. Activate the virtual environment: `.\.venv\Scripts\Activate.ps1` (or `.bat` if using Command Prompt).
4. Start the server: `uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload`
5. Keep this terminal open!

### STEP 2: Start the Frontend Second
1. Open a *second*, completely new Terminal window.
2. Type: `cd e:\softwlearn\siliconmind`
3. Start the Next.js server: `npm run dev`
4. Keep this terminal open!

### STEP 3: Access the Dashboard
1. Open Chrome or Edge.
2. Go to: `http://localhost:3000`

---

## 🔑 Common Issues & Fixes

**"Chats nahi dikh rahi" (Chats are not loading/missing)**
- **Cause**: The Next.js frontend is running, but the Python backend is dead.
- **Fix**: Check your Backend terminal. Did `uvicorn` crash? If so, restart it using the backend steps above, then refresh the browser page.

**"Port is already in use" (Error starting server)**
- **Cause**: You already have the server running in the background or another terminal.
- **Fix**: Close all terminal instances you have open to kill the old servers, and then double-click `Start-SiliconMind.bat` again.

---

## 🌍 GitHub Cloud Hosting

This repository is pre-configured for **GitHub Codespaces**. This means if you ever push your code to a fresh GitHub Repository, you can click the green "Code" button on GitHub, select "Codespaces" -> "Create Codespace". 
A cloud computer will boot up, automatically execute the instructions located in `.devcontainer/postCreateCommand.sh`, and run both servers for you instantly in the browser without having to write a single command.
