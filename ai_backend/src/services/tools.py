import os
import json
import logging
import asyncio
import httpx
import sys
import io
import contextlib
from duckduckgo_search import DDGS

logger = logging.getLogger("AI_Backend.Tools")

# ============================================
# 1. WEB SEARCH (DuckDuckGo)
# ============================================

async def execute_web_search(query: str, max_results: int = 5) -> str:
    """
    Performs a technical web search for component specs, datasheets, or engineering info.
    """
    logger.info(f"Web Search Tool: {query}")
    try:
        results = []
        with DDGS() as ddgs:
            # We filter for technical/engineering content
            for r in ddgs.text(query, max_results=max_results):
                results.append(f"Title: {r['title']}\nSnippet: {r['body']}\nURL: {r['href']}\n")
        
        if not results:
            return "No relevant search results found."
        
        return "\n---\n".join(results)
    except Exception as e:
        logger.error(f"Search failed: {e}")
        return f"[Error during web search: {str(e)}]"


# ============================================
# 2. PYTHON INTERPRETER (Restricted Math Sandbox)
# ============================================

def execute_python_code(code: str) -> str:
    """
    Executes Python code in a restricted sandbox for engineering calculations.
    Returns the STDOUT or an error message.
    """
    logger.info("Python Interpreter Tool activated.")
    
    # Restrict the environment for safety
    safe_globals = {
        "__builtins__": {
            "abs": abs, "float": float, "int": int, "len": len, "max": max, "min": min,
            "round": round, "sum": sum, "range": range, "list": list, "dict": dict,
            "print": print, "bool": bool, "str": str, "pow": pow, "divmod": divmod
        },
        "math": __import__("math"),
        "json": __import__("json"),
    }
    
    # Try to include numpy if available
    try:
        safe_globals["np"] = __import__("numpy")
    except ImportError:
        pass

    stdout_capture = io.StringIO()
    try:
        with contextlib.redirect_stdout(stdout_capture):
            # We use exec but with NO access to __builtins__ other than listed
            exec(code, safe_globals, {})
        
        output = stdout_capture.getvalue()
        return output if output.strip() else "[Code executed successfully with no output]"
    except Exception as e:
        logger.error(f"Code execution failed: {e}")
        return f"[Error during code execution: {str(e)}]"


# ============================================
# 3. AUTONOMOUS PDF INGESTION
# ============================================

async def ingest_pdf_from_url(url: str, session_id: str = None) -> str:
    """
    Downloads a PDF from a URL and automatically adds it to the RAG system.
    """
    from src.services.document_service import DocumentProcessor
    from src.services.vector_store import VectorStore
    
    logger.info(f"Auto-Ingestion Tool: Fetching {url}")
    
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            
            # Basic validation: Check content type or file extension
            content_type = response.headers.get("content-type", "").lower()
            if "pdf" not in content_type and not url.lower().endswith(".pdf"):
                return f"[Error: Link does not appear to be a PDF. Content-Type: {content_type}]"
            
            # Limit size (10MB)
            if len(response.content) > 10 * 1024 * 1024:
                return "[Error: PDF is too large (>10MB). Ingestion skipped.]"
            
            # Process the file
            filename = os.path.basename(url.split("?")[0]) or "downloaded_datasheet.pdf"
            if not filename.endswith(".pdf"): filename += ".pdf"
            
            processor = DocumentProcessor(upload_dir="uploads")
            vstore = VectorStore(persist_dir="vector_db")
            
            filepath = processor.save_file(filename, response.content)
            pages = processor.extract_text_from_pdf(filepath)
            
            if not pages:
                return "[Error: PDF download successful but was empty or unreadable.]"
            
            chunks = processor.chunk_text(pages, filename)
            vstore.add_chunks(chunks)
            
            logger.info(f"Auto-Ingested: {filename} ({len(chunks)} chunks)")
            return f"Successfully downloaded and indexed '{filename}'. The RAG system now contains {len(chunks)} new snippets from this datasheet."
            
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        return f"[Error during PDF ingestion: {str(e)}]"
