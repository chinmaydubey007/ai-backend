import os
import logging
from openai import AsyncOpenAI

logger = logging.getLogger("AI_Backend.Service")

class AIGenerator:
    def __init__(self):
        # We use the NVIDIA Cloud endpoint that is OpenAI-compatible
        api_key = os.environ.get("NVIDIA_API_KEY")
        if not api_key:
            logger.error("NVIDIA_API_KEY environment variable is not set!")
            raise ValueError("Missing API key for AI Generation.")

        self.client = AsyncOpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=api_key,
            timeout=15.0  # Added timeout to prevent infinite hanging
        )
        self.model_name = "meta/llama3-8b-instruct" # Switched to faster model
        logger.info(f"AI Generator initialized. Target model: {self.model_name}")

    async def generate_text(self, prompt: str, max_tokens: int = 100) -> dict:
        """
        Sends the prompt to the NVIDIA Cloud via AsyncOpenAI API.
        """
        try:
            logger.info(f"Generating text for prompt (max {max_tokens} tokens)...")
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=0.6,
            )
            
            result_text = response.choices[0].message.content
            # The API returns usage stats which we can pass back
            tokens_used = response.usage.total_tokens

            return {
                "result": result_text,
                "tokens": tokens_used
            }
        except Exception as e:
            logger.error(f"Error during AI generation: {str(e)}")
            raise e

    async def stream_text(self, prompt: str, max_tokens: int = 1024):
        """
        Agentic Loop: Uses Groq for intelligent orchestration with tool-calling.
        Step 1: Ask Groq orchestrator if experts are needed.
        Step 2: If yes, fire the swarm (also on Groq), collect results.
        Step 3: Stream the final synthesized answer back to the user.
        If Groq is unavailable, falls back to simple NVIDIA NIM streaming.
        """
        import json
        import os
        from openai import AsyncOpenAI
        from src.services.agent_swarm import ALL_TOOLS, execute_consult_experts
        from src.services.tools import execute_web_search, execute_python_code, ingest_pdf_from_url

        groq_api_key = os.getenv("GROQ_API_KEY")
        
        # If Groq is not configured, fall back to simple NVIDIA NIM streaming
        if not groq_api_key:
            logger.warning("GROQ_API_KEY not set. Falling back to basic NVIDIA NIM streaming.")
            stream = await self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=0.6,
                stream=True,
            )
            async for chunk in stream:
                if chunk.choices and len(chunk.choices) > 0 and chunk.choices[0].delta.content:
                    yield {"type": "token", "content": chunk.choices[0].delta.content}
            return

        # Use Groq for orchestration (it supports native tool calling)
        groq_client = AsyncOpenAI(
            api_key=groq_api_key,
            base_url="https://api.groq.com/openai/v1"
        )
        orchestrator_model = "llama-3.3-70b-versatile"
        
        # Build orchestrator system prompt - AGGRESSIVE tool usage
        system_message = {
            "role": "system",
            "content": (
                "You are SiliconMind, the Lead AI Engineering Orchestrator in a professional hardware lab.\n\n"
                "CRITICAL RULES — you MUST follow them:\n"
                "1. If the user asks about ANY component, chip, pinout, voltage, or datasheet → YOU MUST call web_search FIRST.\n"
                "2. If the user asks ANY math, calculation, frequency, baud rate, filter, resistance, or power → YOU MUST call python_interpreter with working Python code that prints results.\n"
                "3. If you find a PDF/datasheet URL during web_search → call ingest_pdf_from_url to index it.\n"
                "4. For deep analysis of embedded C, RTOS, PCB trace, or VLSI/FPGA design → call consult_experts with the relevant domain experts.\n\n"
                "NEVER answer from memory alone when a tool could give a better, verified answer.\n"
                "NEVER say 'I cannot browse the internet' — you CAN, via web_search.\n"
                "NEVER say 'I cannot calculate' — you CAN, via python_interpreter.\n\n"
                "Strategy: Use tools FIRST to gather data, THEN synthesize a professional engineering report.\n"
                "If no tools are needed (e.g., 'hello'), respond directly."
            )
        }
        messages = [system_message, {"role": "user", "content": prompt}]
        
        try:
            # Multi-turn tool execution loop
            max_turns = 5
            for turn in range(max_turns):
                logger.info(f"Orchestrator turn {turn+1}: checking for tool calls...")
                
                response = await groq_client.chat.completions.create(
                    model=orchestrator_model,
                    messages=messages,
                    tools=ALL_TOOLS,
                    tool_choice="auto",
                    max_tokens=max_tokens,
                    temperature=0.1,
                )

                message = response.choices[0].message
                
                # If no tool calls, we are ready to stream the final answer
                if not message.tool_calls:
                    break
                
                # Add the assistant's decision to history
                messages.append(message)
                
                # Process each tool call
                for tool_call in message.tool_calls:
                    f_name = tool_call.function.name
                    f_id = tool_call.id
                    try:
                        f_args = json.loads(tool_call.function.arguments)
                    except Exception:
                        f_args = {}
                    
                    logger.info(f"Orchestrator invoking tool (ID: {f_id}): {f_name}")
                    
                    if f_name == "consult_experts":
                        experts = f_args.get("experts", [])
                        query = f_args.get("query", "")
                        yield {"type": "tool_used", "name": f"🤖 Consulting {', '.join(experts)}..."}
                        result = await execute_consult_experts(experts, query)
                        
                    elif f_name == "web_search":
                        query = f_args.get("query", "")
                        yield {"type": "tool_used", "name": f"🔍 Searching web for '{query}'..."}
                        result = await execute_web_search(query)
                        
                    elif f_name == "python_interpreter":
                        code = f_args.get("code", "")
                        yield {"type": "tool_used", "name": f"🧮 Executing engineering math..."}
                        result = execute_python_code(code)
                        
                    elif f_name == "ingest_pdf_from_url":
                        url = f_args.get("url", "")
                        yield {"type": "tool_used", "name": f"📥 Auto-ingesting datasheet..."}
                        result = await ingest_pdf_from_url(url)
                    
                    else:
                        result = f"Error: Tool {f_name} not found."

                    # Append tool result to history (MUST match the tool_call_id)
                    messages.append({
                        "role": "tool",
                        "tool_call_id": f_id,
                        "name": f_name,
                        "content": result
                    })
                
                # IMPORTANT: If the model generated content alongside tool calls, add it too
                if message.content:
                    messages.append({"role": "assistant", "content": message.content})

                
                # After tools are processed, the loop repeats to let the AI digest the new info
                # If we've hit a reasonable point, the next pass will break and stream.

            # Final Pass: Stream the synthesized answer
            logger.info("Agentic loop complete. Streaming final response...")
            stream = await groq_client.chat.completions.create(
                model=orchestrator_model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.5,
                stream=True
            )
            async for chunk in stream:
                if chunk.choices and len(chunk.choices) > 0 and chunk.choices[0].delta.content:
                    yield {"type": "token", "content": chunk.choices[0].delta.content}
                
        except Exception as e:
            logger.error(f"Error during agentic tool-loop: {str(e)}")
            raise e


