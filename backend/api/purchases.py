from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from schemas import CreatePurchaseOrderRequest, UpdatePurchaseOrderStatusRequest, PurchaseOrderResponse
from db.connection import get_db
from db.repositories import (
    create_purchase_order, get_purchase_orders_by_buyer,
    get_purchase_orders_by_dealer, update_purchase_order_status,
    get_product_by_id, get_purchase_order
)
from api.dependencies import require_buyer, require_dealer, get_current_user

router = APIRouter(prefix="/api/purchases", tags=["purchases"])

@router.post("", response_model=PurchaseOrderResponse)
async def create_purchase(req: CreatePurchaseOrderRequest, user: dict = Depends(require_buyer), db: AsyncSession = Depends(get_db)):
    try:
        product_id_uuid = uuid.UUID(req.product_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid product ID")
    
    product = await get_product_by_id(db, product_id_uuid)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    if not product["is_active"]:
        raise HTTPException(status_code=400, detail="Product is not currently active")
        
    if req.quantity < product["min_order_qty"]:
        raise HTTPException(status_code=400, detail=f"Minimum order quantity is {product['min_order_qty']}")
        
    buyer_id = uuid.UUID(user["id"])
    dealer_id = uuid.UUID(product["dealer_id"])
    
    # Calculate price based on bulk discounts
    discounted_price = product["unit_price"] * (1.0 - (product["bulk_discount_pct"] / 100.0))
    total_price = discounted_price * req.quantity
    
    po = await create_purchase_order(db, buyer_id, dealer_id, product_id_uuid, req.quantity, total_price)
    
    return po

@router.get("/buyer", response_model=List[PurchaseOrderResponse])
async def list_buyer_purchases(user: dict = Depends(require_buyer), db: AsyncSession = Depends(get_db)):
    buyer_id = uuid.UUID(user["id"])
    return await get_purchase_orders_by_buyer(db, buyer_id)

@router.get("/dealer", response_model=List[PurchaseOrderResponse])
async def list_dealer_purchases(user: dict = Depends(require_dealer), db: AsyncSession = Depends(get_db)):
    dealer_id = uuid.UUID(user["id"])
    return await get_purchase_orders_by_dealer(db, dealer_id)

@router.patch("/{po_id}/status", response_model=PurchaseOrderResponse)
async def update_purchase_status(po_id: str, req: UpdatePurchaseOrderStatusRequest, user: dict = Depends(require_dealer), db: AsyncSession = Depends(get_db)):
    try:
        po_id_uuid = uuid.UUID(po_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid order ID")
        
    po = await get_purchase_order(db, po_id_uuid)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
        
    if po["dealer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this order")
        
    updated = await update_purchase_order_status(db, po_id_uuid, req.status)
    return updated
