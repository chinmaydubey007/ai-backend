# 🚀 SiliconMind Legacy Manual: Volume 4 — Operations & Deployment

This volume is your "Swiss Army Knife" for running, fixing, and maintaining SiliconMind on your Windows 11 machine.

---

## 🛠️ 1. Environment Configuration

The "Secret Ingredients" are stored in two `.env` files. If these are missing, the AI won't talk to you.

### **Backend Secrets (`ai_backend/.env`)**
- `NVIDIA_API_KEY`: Your primary high-detail brain.
- `GROQ_API_KEY`: Your high-speed fallback brain.
- `DATABASE_URL`: Where the sessions are stored.
- `LM_STUDIO_URL`: Usually `http://localhost:1234/v1`.

### **Frontend Config (`siliconmind/.env.local`)**
- `NEXT_PUBLIC_API_URL`: Points to `http://localhost:8000`.

---

## 🏃 2. How to Start SiliconMind (The 1-2-3 Ritual)

### **Step 1: Start the Local AI (Optional but Recommended)**
1.  Open **LM Studio**.
2.  Select the **Gemma 4 4B** model.
3.  Click the **"Server"** icon (on the left menu).
4.  Ensure the port is `1234` and click **"Start Server"**.
- **Benefit**: SiliconMind will use your own computer to summarize long text, making the cloud AI much faster and cheaper.

### **Step 2: Start the Backend (The Brain)**
1.  Open a terminal in `e:\softwlearn\ai_backend`.
2.  Activate the environment: `.venv\Scripts\activate`.
3.  Run the server: `uvicorn src.main:app --reload --port 8000`.
- **Checkpoint**: If you see `Uvicorn running on http://127.0.0.1:8000`, the brain is alive.

### **Step 3: Start the Frontend (The Face)**
1.  Open a terminal in `e:\softwlearn\siliconmind`.
2.  Run the development server: `npm run dev`.
3.  Open [http://localhost:3000](http://localhost:3000) in your browser.
- **Checkpoint**: If you see the "SiliconMind Industrial" logo, you are ready to design hardware.

---

## 📦 3. Managing the GitHub Repository

Since we converted this to a **Monorepo**, everything lives together.

### **To Save Your Work (Push):**
```bash
git add .
git commit -m "Describe your change here"
git push origin main
```

### **Common Git Fixes:**
- **"Rejected - non-fast-forward"**: This means the version on GitHub is newer than yours. Use `git pull --rebase origin main` to sync before pushing.
- **"Large File Error"**: Never try to upload `node_modules` or `__pycache__`. My `.gitignore` prevents this automatically.

---

## 🧪 4. Troubleshooting Master Table

| Symptom | Cause | Command to Fix |
| :--- | :--- | :--- |
| **"Could Not Connect to Backend"** | FastAPI is not running. | `cd ai_backend; .venv\Scripts\activate; uvicorn src.main:app --reload --port 8000` |
| **"NPM Command Not Found"** | Node.js is not installed. | Download Node.js v20+ from [nodejs.org](https://nodejs.org) |
| **"Python is not recognized"** | Path error. | Ensure Python 3.11 is added to your Windows PATH. |
| **"Graph is Black"** | CSS class mismatch. | Check `globals.css` for `.app-layout` class. |

---

## 💡 5. Final Technical Tips

- **Database**: The session data is stored in a SQLite file called `electronics_copilot.db`. You can copy this file if you want to move your chat history to another computer.
- **Expertise**: If you want to change how "Embedded C" expert sounds, edit the system prompts in `ai_backend/src/services/ai_service.py`.

---

**This concludes the SiliconMind Legacy Manual.** You now have a 360-degree understanding of your AI hardware assistant.
