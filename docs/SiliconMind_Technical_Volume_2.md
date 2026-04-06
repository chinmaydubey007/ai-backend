# 🧠 SiliconMind Legacy Manual: Volume 2 — The Agentic Swarm & AI Logic

This volume explains the "Brain" of the operation. You will learn how the AI decides which specialist to call and how it combines cloud-based extreme intelligence with your local machine's speed.

---

## 🐝 1. What is an Agentic Swarm?

In a normal chatbot, you ask a question and it answers. In SiliconMind, when you ask a question:
1.  **The Orchestrator** (the project manager) listens to you.
2.  It chooses one or more **Specialists** (Embedded C, PCB, VLSI, or RTOS) to handle the specific parts of your query.
3.  They collaborate to give you an answer that is technically grounded in engineering, not just "poetry".

---

## 🛠️ 2. The Specialist Agents (Deep Dive)

Inside `ai_backend/src/services/ai_service.py`, I have defined these specialized prompts:

### 🖋️ **Agent: EMBEDDED_C**
- **Knowledge Base**: Linux kernel, bare-metal C, Arduino, ESP32, and STM32.
- **Job**: To write code that is "MISRA C" compliant (industry standard for safety) and focuses on memory efficiency.
- **When it triggers**: Whenever you mention things like `ISR`, `DMA`, `SPI`, or `I2C`.

### ✒️ **Agent: RTOS (Real-Time Operating Systems)**
- **Knowledge Base**: FreeRTOS, Zephyr, and Micrium.
- **Job**: To handle task scheduling, semaphores, and mutexes. It ensures your hardware doesn't "hang" or miss important events.
- **When it triggers**: If you ask about multitasking or "system hangs".

### 📐 **Agent: PCB_DESIGN**
- **Knowledge Base**: Kicad, Altium, Signal Integrity, and Power Distribution.
- **Job**: To give advice on trace width, impedance matching (50-ohm), and layer stacking.
- **When it triggers**: If you ask about hardware layout or specific components like "BGA" or "0402" resistors.

---

## 📡 3. The 3-Tier Execution Model

SiliconMind is designed to be **Cost-Effective** and **High Performance**.

### **Tier 1: The Cloud Behemoth (Nvidia Qwen / Groq)**
- **Model**: `qwen2.5-397b` or `llama-3.3-70b`.
- **Logic**: These models have trillions of parameters. They handle the "Thinking" and the "Architecture".
- **Usage**: Every new chat starts here.

### **Tier 2: The Local Helper (LM Studio - Gemma 4)**
- **Model**: Your local `gemma-2-4b` or `4b-instruct`.
- **Logic**: I've optimized the backend to detect if your **LM Studio** is running.
- **Duty**: It handles **Summarization**. For example, if we search the web and find 10 long datasheets, your local machine summarizes them into 1 paragraph. This saves you thousands of "Tokens" and makes the Cloud AI much faster.

---

## 🖋️ 4. Prompts: The Instructions
I have written "System Prompts" that are injected into the AI's mind before it even sees your first word.

**The "Engineering Mindset" Prompt:**
> "You are NOT a creative writer. You are a Senior Electronics Engineer. You prioritize Safety, Signal Integrity, and Manufacturability. If asked about a circuit, you MUST mention decoupling capacitors and ground planes."

This is why SiliconMind sounds like an engineer and not a general assistant.

---

## 🌐 5. Web Search & RAG (Real-Time Knowledge)

### **Web Search**
- Using `DuckDuckGo`, SiliconMind can go out and find real part numbers (e.g., "STM32F401") and their prices. It doesn't hallucinate "fake" chips.

### **RAG (Knowledge Memory)**
- When you upload a datasheet, we use **ChromaDB**.
- The AI creates a "Semantic Map" of the document.
- When you ask "What is the I2C address?", it doesn't try to guess; it looks up the exact coordinates in the vector database and cites the page.

---

**Next Volume**: The "Error Bible" (A–Z). We will look at exactly what went wrong during build-time and how we fixed each bug.
