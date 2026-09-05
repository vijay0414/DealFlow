from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from schemas import (ProfileResponse, CreateProfileRequest, UpdateProfileRequest,
                    CreateProductRequest, UpdateProductRequest, ProductResponse,
                    AnalyticsResponse, SimpleResponse)
from db.connection import get_db
from db.repositories import (get_dealer_profile, create_dealer_profile, update_dealer_profile,
                             create_product, list_dealer_products, update_product, deactivate_product,
                             get_dealer_analytics)
from api.dependencies import require_dealer
import uuid

router = APIRouter(prefix="/api/dealer", dependencies=[Depends(require_dealer)])

@router.get("/profile", response_model=ProfileResponse)
async def get_profile(user: dict = Depends(require_dealer), db: AsyncSession = Depends(get_db)):
    uid = uuid.UUID(user["id"])
    profile = await get_dealer_profile(db, uid)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Create one first.")
    return profile

@router.post("/profile", response_model=ProfileResponse, status_code=201)
async def create_profile(req: CreateProfileRequest, user: dict = Depends(require_dealer), db: AsyncSession = Depends(get_db)):
    uid = uuid.UUID(user["id"])
    profile = await get_dealer_profile(db, uid)
    if profile:
        raise HTTPException(status_code=409, detail="Profile already exists")
    
    new_profile = await create_dealer_profile(
        db, uid, req.company_name, req.location,
        req.reliability_score, req.fulfillment_rate, req.base_delivery_days
    )
    return new_profile

@router.put("/profile", response_model=ProfileResponse)
async def update_profile(req: UpdateProfileRequest, user: dict = Depends(require_dealer), db: AsyncSession = Depends(get_db)):
    uid = uuid.UUID(user["id"])
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    
    updated = await update_dealer_profile(db, uid, **updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Profile not found. Create one first.")
    return updated

@router.post("/products", status_code=201)
async def add_product(req: CreateProductRequest, user: dict = Depends(require_dealer), db: AsyncSession = Depends(get_db)):
    uid = uuid.UUID(user["id"])
    await create_product(
        db, uid, req.name, req.category, req.unit_price, 
        req.bulk_discount_pct, req.min_order_qty, req.stock_available, req.specs
    )
    return {"detail": "Created"}

@router.get("/products", response_model=List[ProductResponse])
async def list_products(user: dict = Depends(require_dealer), db: AsyncSession = Depends(get_db)):
    uid = uuid.UUID(user["id"])
    products = await list_dealer_products(db, uid)
    return products

@router.put("/products/{product_id}", response_model=ProductResponse)
async def modify_product(product_id: str, req: UpdateProductRequest, user: dict = Depends(require_dealer), db: AsyncSession = Depends(get_db)):
    try:
        pid = uuid.UUID(product_id)
        uid = uuid.UUID(user["id"])
    except Exception:
        raise HTTPException(status_code=404, detail="Not found")
        
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    try:
        updated = await update_product(db, pid, uid, **updates)
        if not updated:
            raise HTTPException(status_code=404, detail="Not found")
        return updated
    except ValueError:
        raise HTTPException(status_code=403, detail="You can only modify your own products")

@router.patch("/products/{product_id}/deactivate", response_model=SimpleResponse)
async def disable_product(product_id: str, user: dict = Depends(require_dealer), db: AsyncSession = Depends(get_db)):
    try:
        pid = uuid.UUID(product_id)
        uid = uuid.UUID(user["id"])
    except Exception:
        raise HTTPException(status_code=404, detail="Not found")
        
    try:
        success = await deactivate_product(db, pid, uid)
        if not success:
            raise HTTPException(status_code=404, detail="Not found")
        return {"deactivated": True}
    except ValueError:
        raise HTTPException(status_code=403, detail="You can only modify your own products")

@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(user: dict = Depends(require_dealer), db: AsyncSession = Depends(get_db)):
    uid = uuid.UUID(user["id"])
    analytics = await get_dealer_analytics(db, uid)
    return analytics
