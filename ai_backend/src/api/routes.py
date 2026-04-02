from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from src.schemas import GenerateRequest, GenerateResponse, ChatSessionCreate
from src.services.ai_service import AIGenerator
from src.services.document_service import DocumentProcessor
from src.services.vector_store import VectorStore
from src.services import database as db
import json
import logging

logger = logging.getLogger("AI_Backend.Routes")

router = APIRouter()

# Instantiate services
try:
    ai_service = AIGenerator()
except Exception as e:
    logger.error(f"Failed to initialize AI service: {e}")
    ai_service = None

doc_processor = DocumentProcessor(upload_dir="uploads")
vector_store = VectorStore(persist_dir="vector_db")

# ============================================
# SYSTEM ENDPOINTS
# ============================================

@router.get("/health", tags=["System"])
async def health_check():
    """Simple background health check endpoint."""
    return {"status": "healthy", "service": "AI_Backend"}

# ============================================
# DOCUMENT ENDPOINTS
# ============================================

@router.post("/api/v1/documents/upload", tags=["Documents"])
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a PDF document. The system will:
    1. Save the file to disk
    2. Extract text from each page
    3. Split text into overlapping chunks
    4. Store chunks in the vector database with embeddings
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported currently.")

    try:
        # Read file content
        content = await file.read()
        
        # Save to disk
        filepath = doc_processor.save_file(file.filename, content)
        
        # Extract text from PDF pages
        pages = doc_processor.extract_text_from_pdf(filepath)
        if not pages:
            raise HTTPException(status_code=400, detail="Could not extract any text from this PDF.")
        
        # Chunk the text
        chunks = doc_processor.chunk_text(pages, file.filename)
        
        # Store in vector database
        vector_store.add_chunks(chunks)
        
        return {
            "status": "success",
            "filename": file.filename,
            "pages_extracted": len(pages),
            "chunks_created": len(chunks),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@router.get("/api/v1/documents", tags=["Documents"])
async def list_documents():
    """Returns a list of all uploaded documents."""
    docs = vector_store.get_document_list()
    return {"documents": docs}

@router.delete("/api/v1/documents/{doc_name}", tags=["Documents"])
async def delete_document(doc_name: str):
    """Deletes a document and all its chunks from the vector store."""
    vector_store.delete_document(doc_name)
    return {"status": "deleted", "document": doc_name}

# ============================================
# CHAT SESSION ENDPOINTS
# ============================================

@router.post("/api/v1/sessions", tags=["Chat Sessions"])
async def create_new_session(req: ChatSessionCreate):
    return await db.create_session(title=req.title)

@router.get("/api/v1/sessions", tags=["Chat Sessions"])
async def get_sessions():
    sessions = await db.list_sessions()
    return {"sessions": sessions}

@router.get("/api/v1/sessions/{session_id}/messages", tags=["Chat Sessions"])
async def get_messages(session_id: str):
    messages = await db.get_session_messages(session_id)
    return {"messages": messages}

@router.delete("/api/v1/sessions/{session_id}", tags=["Chat Sessions"])
async def delete_chat_session(session_id: str):
    await db.delete_session(session_id)
    return {"status": "deleted", "session_id": session_id}

@router.patch("/api/v1/sessions/{session_id}", tags=["Chat Sessions"])
async def rename_chat_session(session_id: str, req: ChatSessionCreate):
    """Update the title of an existing chat session."""
    await db.rename_session(session_id, req.title)
    return {"status": "renamed", "session_id": session_id, "new_title": req.title}

# ============================================
# AI GENERATION ENDPOINTS
# ============================================

@router.post("/api/v1/generate", response_model=GenerateResponse, tags=["AI Capabilities"])
async def generate_text(request: GenerateRequest):
    """Non-streaming text generation endpoint."""
    if not ai_service:
        raise HTTPException(status_code=500, detail="AI Service is not configured properly.")

    try:
        response_data = await ai_service.generate_text(
            prompt=request.prompt,
            max_tokens=request.max_tokens
        )
        return GenerateResponse(
            result=response_data["result"],
            tokens_used=response_data["tokens"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@router.post("/api/v1/stream", tags=["AI Capabilities"])
async def stream_text(request: GenerateRequest):
    """
    SSE streaming endpoint with RAG context.
    If documents are uploaded, retrieves relevant chunks and includes them
    as context in the AI prompt for grounded, cited answers.
    """
    if not ai_service:
        raise HTTPException(status_code=500, detail="AI Service is not configured properly.")

    # RAG: Search for relevant document chunks
    context_chunks = []
    citations = []
    if vector_store.collection.count() > 0:
        context_chunks = vector_store.search(request.prompt, n_results=5)
        citations = [
            {"source": c["metadata"].get("source", ""), "page": c["metadata"].get("page", 0)}
            for c in context_chunks
        ]

    # Build the RAG-enhanced prompt
    if context_chunks:
        context_text = "\n\n---\n\n".join([
            f"[Source: {c['metadata'].get('source', 'unknown')}, Page {c['metadata'].get('page', '?')}]\n{c['text']}"
            for c in context_chunks
        ])
        enhanced_prompt = f"""You are SiliconMind, an expert AI assistant for VLSI and embedded systems engineering.

Answer the user's question using the provided document excerpts if they are relevant. If the excerpts are relevant, always cite your sources using the format [Source · Page X] at the end of relevant statements.

If the documents do not contain the answer, or if the question is general, use your extensive internal knowledge of hardware, VLSI, and embedded systems to provide the best possible expert answer. Do not apologize for missing documents, just answer the question.

If the user asks for a flowchart, block diagram, state machine, or visual representation, YOU MUST output valid Mermaid.js code within a ````mermaid ```` code block.

--- DOCUMENT EXCERPTS ---
{context_text}
--- END EXCERPTS ---

User Question: {request.prompt}"""
    else:
        enhanced_prompt = f"""You are SiliconMind, an expert AI assistant for VLSI and embedded systems engineering. 
Answer the following question knowledgeably and concisely.

If the user asks for a flowchart, block diagram, state machine, or visual representation of any architecture or logic, YOU MUST output syntax within a ````mermaid ```` code block to visualize the concept natively for the user. Example:
```mermaid
graph TD;
    A-->B;
```

User Question: {request.prompt}"""

    async def event_generator():
        try:
            # 1. Start or get session
            session_id = request.session_id
            if not session_id:
                # Create a new session auto-named
                new_session = await db.create_session(title="New Chat")
                session_id = new_session["id"]
                # Fire and forget renaming happens after first user message
                await db.auto_title_session(session_id, request.prompt)
                
                # Tell frontend what the new session ID is
                yield f"data: {json.dumps({'session_id': session_id})}\n\n"
            
            # 2. Save user message to DB
            await db.save_message(session_id=session_id, role="user", content=request.prompt)

            # Send citations first so the frontend knows what sources were used
            unique_citations = []
            if citations:
                seen = set()
                for c in citations:
                    key = f"{c['source']}_p{c['page']}"
                    if key not in seen:
                        seen.add(key)
                        unique_citations.append(c)
                yield f"data: {json.dumps({'citations': unique_citations})}\n\n"

            # Stream tokens
            ai_content = ""
            async for payload in ai_service.stream_text(
                prompt=enhanced_prompt,
                max_tokens=request.max_tokens
            ):
                if payload["type"] == "token":
                    ai_content += payload["content"]
                    yield f"data: {json.dumps({'token': payload['content']})}\n\n"
                elif payload["type"] == "tool_used":
                    yield f"data: {json.dumps({'tool_used': payload['name']})}\n\n"
            
            # 3. Save AI message to DB when streaming finishes
            await db.save_message(session_id=session_id, role="ai", content=ai_content, citations=unique_citations if unique_citations else None)

            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            logger.error(f"Stream generation error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
