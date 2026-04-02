import os
import json
import logging
import asyncio
from openai import AsyncOpenAI
from dotenv import load_dotenv

logger = logging.getLogger("AI_Backend.AgentSwarm")

# Ensure env variables are loaded
load_dotenv()

# We use the official OpenAI SDK but point it at Groq's lightning-fast API endpoints
groq_api_key = os.getenv("GROQ_API_KEY")

try:
    groq_client = AsyncOpenAI(
        api_key=groq_api_key,
        base_url="https://api.groq.com/openai/v1"
    )
except Exception as e:
    logger.error(f"Failed to initialize Groq client: {e}")
    groq_client = None

# Define our Specialized Agents and their strict System Prompts
EXPERT_PROMPTS = {
    "embedded_c": (
        "You are a strict, world-class Embedded C Expert. Focus firmly on hardware abstraction "
        "layers, memory safety, bitwise operations, pointer arithmetic, MISRA-C compliance, "
        "and bare-metal microprocessor programming. Provide highly optimized, concise C code snippets without over-explaining basics."
    ),
    "rtos": (
        "You are an RTOS Expert specializing in FreeRTOS, Zephyr, and thread management. "
        "Focus entirely on task synchronization, mutexes, semaphores, message queues, priority "
        "inversion, and safely handling Interrupt Service Routines (ISRs). Provide robust code examples."
    ),
    "pcb": (
        "You are a senior Hardware & PCB Design Expert. Focus on signal integrity, "
        "controlled impedance, power delivery networks (PDN), decoupling strategies, "
        "EMI/EMC mitigation, and high-speed routing rules. Provide clear, physics-based reasoning."
    ),
    "vlsi": (
        "You are an elite VLSI and FPGA Design Expert. Focus on SystemVerilog, VHDL, RTL architecture, "
        "timing analysis, clock domain crossing (CDC) safely, flip-flop metastabilities, and "
        "synthesis optimization for Power, Performance, and Area (PPA). Produce clean RTL."
    )
}

# --------------------------------------------
# TOOL SCHEMAS
# --------------------------------------------

WEB_SEARCH_TOOL_SCHEMA = {
    "type": "function",
    "function": {
        "name": "web_search",
        "description": "Perform a technical web search for component specs, live engineering data, or datasheets when unsure of the answer.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The technical search term (e.g., 'STM32F405 datasheet electrical specs')"}
            },
            "required": ["query"]
        }
    }
}

PYTHON_INTERPRETER_TOOL_SCHEMA = {
    "type": "function",
    "function": {
        "name": "python_interpreter",
        "description": "Execute Python code to perform perfect mathematical calculations, logic-based physics simulations, or engineering math (e.g., calculating baud rates, filter poles, or RC time constants).",
        "parameters": {
            "type": "object",
            "properties": {
                "code": {"type": "string", "description": "The exact Python code to execute (e.g., 'import math; print(2*math.pi*1000)')"}
            },
            "required": ["code"]
        }
    }
}

INGEST_PDF_TOOL_SCHEMA = {
    "type": "function",
    "function": {
        "name": "ingest_pdf_from_url",
        "description": "Download and index a datasheet or technical PDF from a URL into the RAG system to 'read' its content.",
        "parameters": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "The full URL to the PDF file."}
            },
            "required": ["url"]
        }
    }
}

CONSULT_EXPERTS_TOOL_SCHEMA = {
    "type": "function",
    "function": {
        "name": "consult_experts",
        "description": "Consult a swarm of specialized hardware engineering agents for complex, cross-domain problems.",
        "parameters": {
            "type": "object",
            "properties": {
                "experts": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "enum": ["embedded_c", "rtos", "pcb", "vlsi"]
                    },
                    "description": "The domains of expertise needed."
                },
                "query": {
                    "type": "string",
                    "description": "The engineering task for the swarm."
                }
            },
            "required": ["experts", "query"]
        }
    }
}

ALL_TOOLS = [
    CONSULT_EXPERTS_TOOL_SCHEMA,
    WEB_SEARCH_TOOL_SCHEMA,
    PYTHON_INTERPRETER_TOOL_SCHEMA,
    INGEST_PDF_TOOL_SCHEMA
]

# --------------------------------------------
# EXECUTION LOGIC
# --------------------------------------------

async def _call_expert(expert_id: str, query: str) -> str:
    """Invokes a specific Groq LPU-accelerated expert model."""
    if not groq_client:
        return f"[Error: Groq client not initialized for {expert_id}]"

    system_prompt = EXPERT_PROMPTS.get(expert_id, "You are a helpful engineering assistant.")
    
    try:
        # We use a highly capable but extremely fast model for the sub-agents
        response = await groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"The Lead Engineer has requested your expertise: {query}"}
            ],
            temperature=0.2, # Low temperature for factual code
            max_tokens=1500
        )
        content = response.choices[0].message.content
        return f"=== {expert_id.upper()} EXPERT ANALYSIS ===\n{content}\n======================================"
    except Exception as e:
        logger.error(f"Error querying expert '{expert_id}': {e}")
        return f"[Error from {expert_id} expert: {str(e)}]"

async def execute_consult_experts(experts: list[str], query: str) -> str:
    """Simultaneously invokes multiple experts in the background."""
    logger.info(f"Swarm activated! Consulting experts: {experts}")
    valid_experts = [e for e in experts if e in EXPERT_PROMPTS]
    if not valid_experts:
        return "[Error: No valid expert domains were requested.]"

    tasks = [_call_expert(exp, query) for exp in valid_experts]
    results = await asyncio.gather(*tasks)
    return "\n\n".join(results)
