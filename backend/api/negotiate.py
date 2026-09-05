from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from schemas import NegotiateRequest, NegotiateResponse
from db.connection import get_db
from db.repositories import get_order, get_negotiations, append_negotiation, update_order_result
from agent_loop import run_agent
from api.dependencies import require_buyer
import uuid

router = APIRouter(prefix="/api")

@router.post("/negotiate", response_model=NegotiateResponse)
async def negotiate_endpoint(req: NegotiateRequest, user: dict = Depends(require_buyer), db: AsyncSession = Depends(get_db)):
    try:
        order_id_uuid = uuid.UUID(req.order_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order = await get_order(db, order_id_uuid)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    negotiation_history = await get_negotiations(db, order_id_uuid)
    
    # Rebuild messages for run_agent
    messages = [
        {"role": "user", "parts": [{"text": order["query_text"]}]}
    ]
    
    if order["result_json"] and "answer" in order["result_json"]:
        messages.append({"role": "assistant", "parts": [{"text": order["result_json"]["answer"]}]})
        
    for turn in negotiation_history:
        messages.append({"role": "user", "parts": [{"text": turn["message"]}]})
        messages.append({"role": "assistant", "parts": [{"text": turn["response"]}]})
        
    messages.append({"role": "user", "parts": [{"text": req.message}]})
    
    result = await run_agent(db, messages=messages)
    
    await append_negotiation(db, order_id_uuid, req.message, result.get("answer", ""))
    
    await update_order_result(db, order_id_uuid, result, result.get("status", "completed"))
    
    return NegotiateResponse(
        order_id=req.order_id,
        status=result.get("status", "completed"),
        answer=result.get("answer", ""),
        trace=result.get("trace", []),
        steps_count=len(result.get("trace", [])),
        negotiation_turn=len(negotiation_history) + 1
    )
