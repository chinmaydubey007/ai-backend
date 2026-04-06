import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from fastapi.responses import StreamingResponse
import json

logger = logging.getLogger("AI_Backend.Lab")
router = APIRouter(prefix="/api/v1/lab", tags=["Design Lab"])

class ProductBrief(BaseModel):
    name: str = Field(..., description="Product name, e.g. 'IoT Temperature Logger'")
    description: str = Field(..., description="Brief description of what the product should do")
    constraints: Optional[str] = Field(None, description="Budget, size, power constraints")
    target_specs: Optional[str] = Field(None, description="Performance targets")

@router.post("/analyze")
async def analyze_product(brief: ProductBrief):
    """
    Takes a product brief and returns a structured engineering decomposition:
    - System block diagram (Mermaid)
    - Component suggestions with real specs
    - Subsystem breakdown
    - Knowledge gaps identification
    """
    from src.services.ai_service import AIGenerator
    
    prompt = f"""You are SiliconMind's Product Architecture Engine. A hardware engineer has the following product idea:

**Product**: {brief.name}
**Description**: {brief.description}
{f'**Constraints**: {brief.constraints}' if brief.constraints else ''}
{f'**Target Specs**: {brief.target_specs}' if brief.target_specs else ''}

Generate a STRUCTURED engineering analysis with these EXACT sections:

## 🏗️ System Block Diagram
```mermaid
graph LR
    [Generate a real block diagram with actual subsystem names]
```

## 📋 Subsystem Breakdown
For each subsystem, provide:
- Purpose
- Suggested component (real part number if possible)
- Key specifications
- Interface to other subsystems

## 🔌 Component List
| Component | Part Number | Function | Est. Price | Interface |
|-----------|-------------|----------|-----------|-----------|
[Fill with real components]

## ⚡ Power Budget
Calculate estimated total power consumption.

## ⚠️ Knowledge Gaps
List specific technical concepts the engineer needs to understand to build this.
Format each as: **[Concept Name]** — Why it matters for this product.

## 🗺️ Implementation Roadmap
Step-by-step build order with estimated time per step.

Be specific. Use real component part numbers. Don't be vague."""

    try:
        ai = AIGenerator()

        async def stream_analysis():
            try:
                async for payload in ai.stream_text(prompt=prompt, tone="Technical", max_tokens=2048):
                    if payload["type"] == "token":
                        yield f"data: {json.dumps({'token': payload['content']})}\n\n"
                    elif payload["type"] == "tool_used":
                        yield f"data: {json.dumps({'tool_used': payload['name']})}\n\n"
                    elif payload["type"] == "model_info":
                        yield f"data: {json.dumps({'model_info': payload['name']})}\n\n"
                yield f"data: {json.dumps({'done': True})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(
            stream_analysis(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
