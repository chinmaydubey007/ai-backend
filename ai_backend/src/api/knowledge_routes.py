import json
import os
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

logger = logging.getLogger("AI_Backend.Knowledge")
router = APIRouter(prefix="/api/v1/knowledge", tags=["Knowledge Graph"])

# Load graph data
GRAPH_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "knowledge_graph.json")

def load_graph():
    with open(GRAPH_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

class ExplainRequest(BaseModel):
    node_id: str = Field(..., description="The concept node ID to explain")
    mode: str = Field("implementation", description="'implementation' or 'theory'")

class ExpandRequest(BaseModel):
    query: str = Field(..., description="A concept to dynamically add to the graph")

@router.get("/graph")
async def get_knowledge_graph():
    """Return the full knowledge graph for frontend rendering."""
    try:
        graph = load_graph()
        return graph
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load graph: {e}")

@router.get("/node/{node_id}")
async def get_node_details(node_id: str):
    """Get details about a specific node including its neighbors."""
    graph = load_graph()
    
    node = None
    for n in graph["nodes"]:
        if n["id"] == node_id:
            node = n
            break
    
    if not node:
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found")
    
    # Find all connected nodes (both directions)
    prerequisites = []  # nodes that point TO this node
    leads_to = []       # nodes this node points TO
    
    for link in graph["links"]:
        if link["target"] == node_id:
            prerequisites.append(link["source"])
        if link["source"] == node_id:
            leads_to.append(link["target"])
    
    # Get full node info for neighbors
    node_map = {n["id"]: n for n in graph["nodes"]}
    
    return {
        "node": node,
        "prerequisites": [node_map[pid] for pid in prerequisites if pid in node_map],
        "leads_to": [node_map[lid] for lid in leads_to if lid in node_map],
        "domain_color": graph["domain_colors"].get(node["domain"], "#888"),
        "domain_label": graph["domain_labels"].get(node["domain"], node["domain"])
    }

@router.post("/explain")
async def explain_concept(request: ExplainRequest):
    """AI explains a concept with implementation-focused context."""
    from src.services.ai_service import AIGenerator
    
    graph = load_graph()
    node_map = {n["id"]: n for n in graph["nodes"]}
    
    node = node_map.get(request.node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    # Find neighbors for context
    prereqs = []
    leads = []
    for link in graph["links"]:
        if link["target"] == request.node_id and link["source"] in node_map:
            prereqs.append(node_map[link["source"]]["label"])
        if link["source"] == request.node_id and link["target"] in node_map:
            leads.append(node_map[link["target"]]["label"])
    
    prompt = (
        f"Explain '{node['label']}' ({node['desc']}) for a hardware engineer.\n\n"
        f"Prerequisites: {', '.join(prereqs) if prereqs else 'None (foundational concept)'}\n"
        f"This leads to: {', '.join(leads) if leads else 'Advanced specialization'}\n\n"
    )
    
    if request.mode == "implementation":
        prompt += (
            "Focus on PRACTICAL implementation:\n"
            "1. When does an engineer encounter this in REAL work?\n"
            "2. Give a concrete debugging/design example\n"
            "3. What are the common mistakes?\n"
            "4. Show code/formulas if relevant\n"
            "Keep it concise but actionable."
        )
    else:
        prompt += "Explain the underlying theory clearly with intuitive analogies."
    
    try:
        ai = AIGenerator()
        result = await ai.generate_text(prompt, max_tokens=800)
        return {"explanation": result["result"], "node": node}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
