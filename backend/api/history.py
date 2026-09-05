from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from schemas import OrderHistoryResponse, OrderSummary, OrderDetailResponse, NegotiationTurn
from db.connection import get_db
from db.repositories import get_orders_by_buyer, get_order, get_negotiations
from api.dependencies import require_buyer
import uuid

router = APIRouter(prefix="/api")

@router.get("/history", response_model=OrderHistoryResponse)
async def list_history(user: dict = Depends(require_buyer), db: AsyncSession = Depends(get_db)):
    buyer_id = uuid.UUID(user["id"])
    orders = await get_orders_by_buyer(db, buyer_id)
    
    summaries = []
    for o in orders:
        ans = o["result_json"].get("answer", "") if o["result_json"] else ""
        if len(ans) > 200:
            ans = ans[:197] + "..."
            
        summaries.append(OrderSummary(
            order_id=o["id"],
            query=o["query_text"],
            status=o["status"],
            answer=ans,
            created_at=o["created_at"]
        ))
    return OrderHistoryResponse(orders=summaries)

@router.get("/history/{order_id}", response_model=OrderDetailResponse)
async def get_history_detail(order_id: str, user: dict = Depends(require_buyer), db: AsyncSession = Depends(get_db)):
    try:
        order_id_uuid = uuid.UUID(order_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order = await get_order(db, order_id_uuid)
    if not order or order["buyer_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Order not found")
        
    negotiations = await get_negotiations(db, order_id_uuid)
    
    turns = [
        NegotiationTurn(
            message=n["message"],
            response=n["response"],
            created_at=n["created_at"]
        ) for n in negotiations
    ]
    
    result = order["result_json"] or {}
    
    return OrderDetailResponse(
        order_id=order["id"],
        query=order["query_text"],
        status=order["status"],
        answer=result.get("answer", ""),
        trace=result.get("trace", []),
        negotiations=turns,
        created_at=order["created_at"]
    )
