import os
import json
import logging
from openai import AsyncOpenAI

logger = logging.getLogger("AI_Backend.Service")

# ============================================
# TONE PRESETS
# ============================================
TONE_MAP = {
    "Standard": "Provide a clear, professional, balanced answer.",
    "Technical": "Use heavy engineering jargon, rigid formulas, deeply technical specifications, and zero fluff.",
    "Academic": "Write like a formal peer-reviewed academic paper. Use formal language and rigorous logic.",
    "Creative": "You are a visionary tech mentor. Use brilliant analogies and imaginative concepts to explain complex topics."
}

def build_system_prompt(tone: str = "Standard", context_text: str = None) -> str:
    tone_instruction = TONE_MAP.get(tone, TONE_MAP["Standard"])
    prompt = (
        "You are SiliconMind, the Lead AI Engineering Orchestrator in a professional hardware lab.\n\n"
        f"TONE ENFORCEMENT: {tone_instruction}\n\n"
        "CRITICAL RULES — you MUST follow them:\n"
        "1. If the user asks about ANY component, chip, pinout, voltage, or datasheet → YOU MUST call web_search FIRST.\n"
        "2. If the user asks ANY math, calculation, frequency, baud rate, filter, resistance, or power → YOU MUST call python_interpreter.\n"
        "3. If you find a PDF/datasheet URL during web_search → call ingest_pdf_from_url to index it.\n"
        "4. For deep analysis of embedded C, RTOS, PCB trace, or VLSI/FPGA design → call consult_experts.\n"
        "5. If the user asks for a flowchart, block diagram, state machine → output valid ```mermaid ``` code block.\n"
        "6. REASONING: Write your thought process in <think> ... </think> tags before your final answer.\n\n"
        "NEVER answer from memory alone when a tool could give a better, verified answer.\n"
        "NEVER say 'I cannot browse the internet' — you CAN, via web_search.\n"
        "NEVER say 'I cannot calculate' — you CAN, via python_interpreter.\n\n"
        "Strategy: Use tools FIRST, THINK in <think> tags, THEN give a professional engineering report."
    )
    if context_text:
        prompt += f"\n\n--- RAG DOCUMENT EXCERPTS ---\n{context_text}\n--- END EXCERPTS ---\n"
    return prompt


class AIGenerator:
    def __init__(self):
        api_key = os.environ.get("NVIDIA_API_KEY")
        if not api_key:
            logger.error("NVIDIA_API_KEY environment variable is not set!")
            raise ValueError("Missing API key for AI Generation.")

        # Primary: NVIDIA NIM (Qwen 3.5 397B)
        self.nvidia_client = AsyncOpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=api_key,
            timeout=60.0
        )
        self.nvidia_model = "qwen/qwen3.5-397b-a17b"

        # Fallback: Groq (Llama 3.3 70B — fast, reliable tool-calling)
        groq_key = os.getenv("GROQ_API_KEY")
        self.groq_client = None
        self.groq_model = "llama-3.3-70b-versatile"
        if groq_key:
            self.groq_client = AsyncOpenAI(
                api_key=groq_key,
                base_url="https://api.groq.com/openai/v1",
                timeout=30.0
            )

        # Local: LM Studio (Gemma 4 4B — for lightweight helper tasks)
        self.local_client = AsyncOpenAI(
            base_url="http://localhost:1234/v1",
            api_key="lm-studio",
            timeout=30.0
        )
        self.local_model = "gemma-4-4b" 
        self.local_available = False

        logger.info(f"AI Generator initialized. Primary: {self.nvidia_model}, Fallback: {self.groq_model}")

    async def _detect_local_model(self):
        """Auto-detect model name from LM Studio."""
        if self.local_available: return True
        try:
            models = await self.local_client.models.list()
            if models.data:
                self.local_model = models.data[0].id
                self.local_available = True
                logger.info(f"LM Studio model detected: {self.local_model}")
                return True
        except Exception as e:
            logger.warning(f"LM Studio not available: {e}")
        return False

    async def generate_text(self, prompt: str, max_tokens: int = 100) -> dict:
        """Non-streaming text generation."""
        try:
            response = await self.nvidia_client.chat.completions.create(
                model=self.nvidia_model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=0.6,
            )
            return {
                "result": response.choices[0].message.content,
                "tokens": response.usage.total_tokens
            }
        except Exception as e:
            logger.error(f"Error during AI generation: {e}")
            raise

    async def stream_text(self, prompt: str, context_text: str = None, tone: str = "Standard", max_tokens: int = 1024):
        """
        Full agentic pipeline with smart model fallback.
        1. Local Helper (Gemma 4): Pre-process/Summarize if available.
        2. Orchestrator Loop: Tool-calling logic (Nvidia -> Groq).
        3. Primary Model: Final streaming output.
        """
        from src.services.agent_swarm import ALL_TOOLS, execute_consult_experts
        from src.services.tools import execute_web_search, execute_python_code, ingest_pdf_from_url

        # Check for local Gemma
        await self._detect_local_model()

        sys_prompt = build_system_prompt(tone=tone, context_text=context_text)
        messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": prompt}
        ]

        # ---- PHASE 1: Tool-calling orchestration loop ----
        # Try Nvidia first, fall back to Groq on error
        candidates = []
        candidates.append(("⚡ Qwen 3.5 397B", self.nvidia_client, self.nvidia_model))
        if self.groq_client:
            candidates.append(("🦙 Llama 3.3 70B", self.groq_client, self.groq_model))

        active_label = None
        active_client = None
        active_model = None
        tool_loop_success = False

        for label, client, model in candidates:
            try:
                logger.info(f"Trying orchestrator: {label} ({model})...")
                max_turns = 5

                for turn in range(max_turns):
                    logger.info(f"[{label}] Turn {turn+1}: checking for tool calls...")

                    response = await client.chat.completions.create(
                        model=model,
                        messages=messages,
                        tools=ALL_TOOLS,
                        tool_choice="auto",
                        max_tokens=max_tokens,
                        temperature=0.2,
                    )

                    message = response.choices[0].message

                    if not message.tool_calls:
                        # No more tool calls — ready to stream
                        break

                    messages.append(message)

                    for tool_call in message.tool_calls:
                        f_name = tool_call.function.name
                        f_id = tool_call.id
                        try:
                            f_args = json.loads(tool_call.function.arguments)
                        except Exception:
                            f_args = {}

                        logger.info(f"[{label}] Invoking tool: {f_name}")

                        if f_name == "consult_experts":
                            experts = f_args.get("experts", [])
                            query = f_args.get("query", "")
                            yield {"type": "tool_used", "name": f"🤖 Consulting {', '.join(experts)}..."}
                            result = await execute_consult_experts(experts, query)
                        elif f_name == "web_search":
                            query = f_args.get("query", "")
                            yield {"type": "tool_used", "name": f"🔍 Searching: '{query}'"}
                            raw_result = await execute_web_search(query)
                            
                            # Use Local Gemma to summarize if available (saves tokens on main orchestrator)
                            if self.local_available:
                                yield {"type": "tool_used", "name": "🧠 Local Gemma summarizing search..."}
                                try:
                                    sum_res = await self.local_client.chat.completions.create(
                                        model=self.local_model,
                                        messages=[{
                                            "role": "system", 
                                            "content": "Summarize these search results for a hardware engineer. Focus on specs, models, and prices."
                                        }, {"role": "user", "content": raw_result}],
                                        max_tokens=300
                                    )
                                    result = f"Local Summary of Search: {sum_res.choices[0].message.content}\n\nOriginal (Truncated): {raw_result[:400]}"
                                except Exception as le:
                                    logger.warning(f"Local summarization failed: {le}")
                                    result = raw_result
                            else:
                                result = raw_result
                        elif f_name == "python_interpreter":
                            code = f_args.get("code", "")
                            yield {"type": "tool_used", "name": "🧮 Calculating..."}
                            result = execute_python_code(code)
                        elif f_name == "ingest_pdf_from_url":
                            url = f_args.get("url", "")
                            yield {"type": "tool_used", "name": "📥 Ingesting datasheet..."}
                            result = await ingest_pdf_from_url(url)
                        else:
                            result = f"Error: Unknown tool {f_name}"

                        messages.append({
                            "role": "tool",
                            "tool_call_id": f_id,
                            "name": f_name,
                            "content": result
                        })

                    if message.content:
                        messages.append({"role": "assistant", "content": message.content})

                # If we get here without exception, this provider worked
                active_label = label
                active_client = client
                active_model = model
                tool_loop_success = True
                yield {"type": "model_info", "name": label}
                break

            except Exception as e:
                logger.warning(f"[{label}] failed: {e}. Trying next provider...")
                continue

        # ---- PHASE 2: Stream the final synthesized answer ----
        if tool_loop_success and active_client:
            try:
                logger.info(f"[{active_label}] Streaming final response...")
                stream = await active_client.chat.completions.create(
                    model=active_model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=0.5,
                    stream=True
                )
                async for chunk in stream:
                    if chunk.choices and len(chunk.choices) > 0 and chunk.choices[0].delta.content:
                        yield {"type": "token", "content": chunk.choices[0].delta.content}
                return
            except Exception as e:
                logger.error(f"[{active_label}] Streaming failed: {e}")
                # Fall through to emergency fallback

        # ---- EMERGENCY FALLBACK: Direct stream without tools ----
        logger.warning("All orchestrators failed. Streaming directly without tools...")
        yield {"type": "tool_used", "name": "⚠️ Tools unavailable, using direct AI..."}

        fallback_clients = [
            (self.nvidia_client, self.nvidia_model),
        ]
        if self.groq_client:
            fallback_clients.append((self.groq_client, self.groq_model))

        for client, model in fallback_clients:
            try:
                stream = await client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=0.5,
                    stream=True
                )
                async for chunk in stream:
                    if chunk.choices and len(chunk.choices) > 0 and chunk.choices[0].delta.content:
                        yield {"type": "token", "content": chunk.choices[0].delta.content}
                return
            except Exception as e:
                logger.error(f"Emergency fallback ({model}) failed: {e}")
                continue

        yield {"type": "token", "content": "⚠️ All AI providers are currently unavailable. Please try again later."}
