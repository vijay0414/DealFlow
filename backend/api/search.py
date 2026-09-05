from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from schemas import SearchRequest, AgentResponse
from db.connection import get_db
from db.repositories import create_order, update_order_result
from agent_loop import run_agent
from api.dependencies import require_buyer
import uuid

router = APIRouter(prefix="/api")

@router.post("/search", response_model=AgentResponse)
async def search_endpoint(req: SearchRequest, user: dict = Depends(require_buyer), db: AsyncSession = Depends(get_db)):
    buyer_id = uuid.UUID(user["id"])
    order = await create_order(db, buyer_id, req.query)
    
    result = await run_agent(db, query=req.query)
    
    await update_order_result(db, uuid.UUID(order["id"]), result, result.get("status", "completed"))
    
    return AgentResponse(
        order_id=order["id"],
        status=result.get("status", "completed"),
        answer=result.get("answer", ""),
        trace=result.get("trace", []),
        steps_count=len(result.get("trace", []))
    )
