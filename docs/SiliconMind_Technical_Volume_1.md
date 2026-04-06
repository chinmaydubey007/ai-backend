# 🏛️ SiliconMind Legacy Manual: Volume 1 — Architecture & File System

This volume provides an exhaustive, file-by-file breakdown of the SiliconMind project. It is designed to help you understand where every piece of logic lives and how the "Frontend" (the face) and "Backend" (the brain) are linked.

---

## 📁 1. Root Level Analysis
The root directory (`e:\softwlearn\`) is the "Base Camp" of the project.

### 📄 `.gitignore`
- **Purpose**: Prevents junk files from being uploaded to GitHub.
- **Why it matters**: Without this, your GitHub repo would be gigabytes large because of "dependencies" (temporary files) that I've excluded.

### 📄 `HOW_TO_RUN_SILICONMIND.md` (Coming Soon)
- **Purpose**: A quick-start guide for you to open the app whenever you want.

---

## 📁 2. Backend Architecture (`ai_backend/`)
The backend is the "Heart and Brain" of SiliconMind. It is written in **Python**.

### 📁 `src/` (Source Code)
The most important folder in the backend.

#### 📄 `main.py`
- **Role**: The Entry Point.
- **Key Logic**: Sets up the FastAPI server, defines the "CORS" security rules (so the frontend can talk to it), and "Includes" all the different sub-modules (Chat, Knowledge, Lab).
- **Technical Highlight**: Uses the `lifespan` event to ensure the database starts up properly before you send your first message.

#### 📄 `api/routes.py`
- **Role**: The Communication Hub.
- **Key Functionality**: Defines the URLs that the frontend calls (e.g., `/api/v1/stream` for chat messages).

#### 📄 `api/knowledge_routes.py`
- **Role**: The Librarian.
- **Key Functionality**: Reads the `knowledge_graph.json` file and sends it to the frontend. It also contains the logic to "Explain" a concept if you click it.

#### 📄 `api/lab_routes.py`
- **Role**: The Architect.
- **Key Functionality**: Specifically handles "Design Lab" requests. It takes your hardware idea and turns it into a structured roadmap.

#### 📄 `services/ai_service.py`
- **Role**: The Orchestrator.
- **Key Intelligence**: This is where I wrote the logic to choose between **Nvidia**, **Groq**, and your local **LM Studio (Gemma)**.
- **Technical Highlight**: Includes the "Expert Swarm" system prompts that tell the AI it is a Hardware Engineer.

#### 📄 `services/document_processor.py`
- **Role**: The Document Shredder.
- **Key Functionality**: Takes those PDFs you upload, extracts the text, and breaks it into small "chunks" so the AI can read them later.

#### 📄 `services/vector_store.py`
- **Role**: The AI Memory.
- **Key Functionality**: Uses `ChromaDB` to store the text chunks. It handles "Searching" for relevant context when you ask a question.

---

## 📁 3. Frontend Architecture (`siliconmind/`)
The frontend is the "User Interface." It is written in **Javascript (React/Next.js)**.

### 📁 `src/app/` (The Application)
This folder defines the "Pages" and "Routes" you see in the browser.

#### 📄 `layout.js`
- **Role**: The Frame.
- **Key Functionality**: Defines the global font (Inter / JetBrains Mono) and the structure that surrounds every page.

#### 📄 `page.js`
- **Role**: The Home Screen (Chat).
- **Key Logic**: Manages the "Active Session" and the live "Streaming" of messages from the AI.
- **Technical Highlight**: Uses `isSendingRef` to prevent your chat history from flickering while you wait for a response.

#### 📄 `explore/page.js`
- **Role**: The Knowledge Graph Page.
- **Key Functionality**: Renders the 3D-like graph of electronics concepts.

#### 📄 `lab/page.js`
- **Role**: The Design Lab Page.
- **Key Functionality**: Contains the form where you enter product specs and shows the resulting engineering plan.

### 📁 `src/app/components/` (The Building Blocks)
Reusable interface parts.

#### 📄 `Sidebar.js`
- **Role**: The Navigation Bar.
- **Key Logic**: Fetches your past sessions and handles files uploads.

#### 📄 `KnowledgeGraph.js`
- **Role**: The Graph Engine.
- **Technical Highlight**: Uses `ForceGraph2D`. Its logic includes "Centering" and "Zooming" when you click a node.

#### 📄 `InputBar.js`
- **Role**: The Command Center.
- **Key Functionality**: Handles your text input and the Voice-to-Text (Speech Recognition) feature.

---

## 📁 4. Data Layer (`ai_backend/data/`)
Static information that powers the AI's specialized knowledge.

#### 📄 `knowledge_graph.json`
- **Role**: The Blueprint.
- **Content**: 60 specialized nodes (Electrostatics, ADC, PCB Design, etc.) that tell the app how concepts are linked together.

---

## ⚙️ Key Technical Concept: The "Bridge"
How do these two folders talk?

1.  You type "Hello" in the **Frontend** (`siliconmind`).
2.  The Frontend sends an **HTTP POST** request to the **Backend** (`ai_backend`) at `localhost:8000/api/v1/stream`.
3.  The Backend calls the **AI Service** (`ai_service.py`).
4.  The AI response "Streams" back to the Frontend token-by-token so you see it appearing live.

---

**Next Volume**: We will dive into the "Brain" logic and how the Agentic Swarm actually works.
