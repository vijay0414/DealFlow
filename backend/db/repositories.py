from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_
from db.models import User, DealerProfile, Product, Order, NegotiationHistory, DealerAnalytics, PurchaseOrder
from uuid import UUID

# User
async def get_user_by_password(db: AsyncSession, password: str) -> dict | None:
    res = await db.execute(select(User).where(User.password == password))
    user = res.scalars().first()
    return _user_to_dict(user) if user else None

async def get_user_by_id(db: AsyncSession, user_id: UUID) -> dict | None:
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalars().first()
    return _user_to_dict(user) if user else None

async def get_user_by_email(db: AsyncSession, email: str) -> dict | None:
    res = await db.execute(select(User).where(User.email == email))
    user = res.scalars().first()
    return _user_to_dict(user) if user else None

async def create_user(db: AsyncSession, name: str, email: str, role: str, password: str) -> dict:
    user = User(name=name, email=email, role=role, password=password)
    db.add(user)
    await db.flush()
    return _user_to_dict(user)

async def list_users(db: AsyncSession) -> list[dict]:
    res = await db.execute(select(User))
    users = res.scalars().all()
    return [{"id": str(u.id), "name": u.name, "email": u.email, "role": u.role, "is_active": u.is_active, "created_at": str(u.created_at)} for u in users]

def _user_to_dict(u) -> dict:
    return {"id": str(u.id), "name": u.name, "email": u.email, "role": u.role, "password": u.password, "is_active": u.is_active, "created_at": str(u.created_at)}

# DealerProfile
async def get_dealer_profile(db: AsyncSession, user_id: UUID) -> dict | None:
    res = await db.execute(select(DealerProfile).where(DealerProfile.user_id == user_id))
    p = res.scalars().first()
    if p:
        return {"id": str(p.id), "user_id": str(p.user_id), "company_name": p.company_name, "location": p.location, "reliability_score": float(p.reliability_score), "fulfillment_rate": float(p.fulfillment_rate), "base_delivery_days": p.base_delivery_days, "created_at": str(p.created_at)}
    return None

async def create_dealer_profile(db: AsyncSession, user_id: UUID, company_name: str, location: str, reliability_score: float, fulfillment_rate: float, base_delivery_days: int) -> dict:
    p = DealerProfile(user_id=user_id, company_name=company_name, location=location, reliability_score=reliability_score, fulfillment_rate=fulfillment_rate, base_delivery_days=base_delivery_days)
    db.add(p)
    await db.flush()
    return await get_dealer_profile(db, user_id)

async def update_dealer_profile(db: AsyncSession, user_id: UUID, **updates) -> dict | None:
    res = await db.execute(select(DealerProfile).where(DealerProfile.user_id == user_id))
    p = res.scalars().first()
    if not p: return None
    for k, v in updates.items():
        if v is not None and hasattr(p, k):
            setattr(p, k, v)
    await db.flush()
    return await get_dealer_profile(db, user_id)

# Product
async def create_product(db: AsyncSession, dealer_id: UUID, name: str, category: str, unit_price: float, bulk_discount_pct: float, min_order_qty: int, stock_available: int, specs: dict = None) -> dict:
    p = Product(dealer_id=dealer_id, name=name, category=category, unit_price=unit_price, bulk_discount_pct=bulk_discount_pct, min_order_qty=min_order_qty, stock_available=stock_available, specs=specs)
    db.add(p)
    await db.flush()
    return _product_to_dict(p)

async def get_product_by_id(db: AsyncSession, product_id: UUID) -> dict | None:
    res = await db.execute(select(Product).where(Product.id == product_id))
    p = res.scalars().first()
    return _product_to_dict(p) if p else None

async def list_dealer_products(db: AsyncSession, dealer_id: UUID, active_only: bool = True) -> list[dict]:
    q = select(Product).where(Product.dealer_id == dealer_id)
    if active_only: q = q.where(Product.is_active == True)
    res = await db.execute(q)
    return [_product_to_dict(p) for p in res.scalars().all()]

async def update_product(db: AsyncSession, product_id: UUID, dealer_id: UUID, **updates) -> dict | None:
    res = await db.execute(select(Product).where(Product.id == product_id))
    p = res.scalars().first()
    if not p: return None
    if p.dealer_id != dealer_id: raise ValueError("Not yours")
    for k, v in updates.items():
        if v is not None and hasattr(p, k):
            setattr(p, k, v)
    await db.flush()
    return _product_to_dict(p)

async def deactivate_product(db: AsyncSession, product_id: UUID, dealer_id: UUID) -> bool:
    res = await db.execute(select(Product).where(Product.id == product_id))
    p = res.scalars().first()
    if not p: return False
    if p.dealer_id != dealer_id: raise ValueError("Not yours")
    p.is_active = False
    await db.flush()
    return True

def _product_to_dict(p) -> dict:
    return {"id": str(p.id), "dealer_id": str(p.dealer_id), "name": p.name, "category": p.category, "unit_price": float(p.unit_price), "bulk_discount_pct": float(p.bulk_discount_pct), "min_order_qty": p.min_order_qty, "stock_available": p.stock_available, "specs": p.specs, "is_active": p.is_active, "created_at": str(p.created_at)}

# Search
async def search_products(db: AsyncSession, category: str, max_price: float | None, min_quantity: int) -> list[dict]:
    q = select(Product, DealerProfile).join(DealerProfile, DealerProfile.user_id == Product.dealer_id).join(User, User.id == Product.dealer_id).where(
        or_(
            Product.category.ilike(f"%{category}%"),
            Product.name.ilike(f"%{category}%"),
            DealerProfile.company_name.ilike(f"%{category}%")
        ),
        Product.stock_available >= min_quantity,
        Product.is_active == True,
        User.is_active == True
    )
    if max_price is not None:
        q = q.where(Product.unit_price <= max_price)
    q = q.order_by(Product.unit_price.asc()).limit(20)
    res = await db.execute(q)
    results = []
    for p, dp in res.all():
        results.append(_flat_product_dealer(p, dp))
    return results

async def get_products_by_ids(db: AsyncSession, product_ids: list[UUID]) -> list[dict]:
    q = select(Product, DealerProfile).join(DealerProfile, DealerProfile.user_id == Product.dealer_id).where(Product.id.in_(product_ids))
    res = await db.execute(q)
    return [_flat_product_dealer(p, dp) for p, dp in res.all()]

async def get_dealer_for_product(db: AsyncSession, product_id: UUID) -> dict | None:
    q = select(Product, DealerProfile).join(DealerProfile, DealerProfile.user_id == Product.dealer_id).where(Product.id == product_id)
    res = await db.execute(q)
    row = res.first()
    if not row: return None
    return _flat_product_dealer(row[0], row[1])

def _flat_product_dealer(p, dp) -> dict:
    return {
        "id": str(p.id),
        "product_id": str(p.id),
        "dealer_id": str(p.dealer_id),
        "name": p.name,
        "category": p.category,
        "unit_price": float(p.unit_price),
        "bulk_discount_pct": float(p.bulk_discount_pct),
        "min_order_qty": p.min_order_qty,
        "stock_available": p.stock_available,
        "is_active": p.is_active,
        "company_name": dp.company_name,
        "location": dp.location,
        "reliability_score": float(dp.reliability_score),
        "fulfillment_rate": float(dp.fulfillment_rate),
        "base_delivery_days": dp.base_delivery_days
    }

# Order
async def create_order(db: AsyncSession, buyer_id: UUID, query_text: str) -> dict:
    o = Order(buyer_id=buyer_id, query_text=query_text)
    db.add(o)
    await db.flush()
    return _order_to_dict(o)

async def get_order(db: AsyncSession, order_id: UUID) -> dict | None:
    res = await db.execute(select(Order).where(Order.id == order_id))
    o = res.scalars().first()
    return _order_to_dict(o) if o else None

async def get_orders_by_buyer(db: AsyncSession, buyer_id: UUID, limit=20) -> list[dict]:
    res = await db.execute(select(Order).where(Order.buyer_id == buyer_id).order_by(Order.created_at.desc()).limit(limit))
    return [_order_to_dict(o) for o in res.scalars().all()]

async def update_order_result(db: AsyncSession, order_id: UUID, result_json: dict, status: str) -> dict | None:
    res = await db.execute(select(Order).where(Order.id == order_id))
    o = res.scalars().first()
    if not o: return None
    o.result_json = result_json
    o.status = status
    await db.flush()
    return _order_to_dict(o)

def _order_to_dict(o) -> dict:
    return {"id": str(o.id), "order_id": str(o.id), "buyer_id": str(o.buyer_id), "query_text": o.query_text, "result_json": o.result_json, "status": o.status, "created_at": str(o.created_at)}

# NegotiationHistory
async def append_negotiation(db: AsyncSession, order_id: UUID, message: str, response: str) -> dict:
    n = NegotiationHistory(order_id=order_id, message=message, response=response)
    db.add(n)
    await db.flush()
    return {"id": str(n.id), "order_id": str(n.order_id), "message": n.message, "response": n.response, "created_at": str(n.created_at)}

async def get_negotiations(db: AsyncSession, order_id: UUID) -> list[dict]:
    res = await db.execute(select(NegotiationHistory).where(NegotiationHistory.order_id == order_id).order_by(NegotiationHistory.created_at.asc()))
    return [{"id": str(n.id), "order_id": str(n.order_id), "message": n.message, "response": n.response, "created_at": str(n.created_at)} for n in res.scalars().all()]

# DealerAnalytics
async def log_recommendation(db: AsyncSession, dealer_id: UUID, order_id: UUID, query_text: str, product_id: UUID, rank: int) -> None:
    a = DealerAnalytics(dealer_id=dealer_id, order_id=order_id, query_text=query_text, product_id=product_id, was_recommended=True, recommended_rank=rank)
    db.add(a)
    await db.flush()

async def get_dealer_analytics(db: AsyncSession, dealer_id: UUID) -> dict:
    c_res = await db.execute(select(func.count(DealerAnalytics.id)).where(DealerAnalytics.dealer_id == dealer_id, DealerAnalytics.was_recommended == True))
    count = c_res.scalar() or 0
    
    a_res = await db.execute(select(func.avg(DealerAnalytics.recommended_rank)).where(DealerAnalytics.dealer_id == dealer_id, DealerAnalytics.was_recommended == True))
    avg_rank = float(a_res.scalar() or 0.0)
    
    r_res = await db.execute(select(DealerAnalytics).where(DealerAnalytics.dealer_id == dealer_id, DealerAnalytics.was_recommended == True).order_by(DealerAnalytics.created_at.desc()).limit(10))
    recent = [{"query_text": r.query_text, "recommended_rank": r.recommended_rank, "created_at": str(r.created_at)} for r in r_res.scalars().all()]
    
    return {"total_recommendations": count, "average_rank": avg_rank, "recent_recommendations": recent}

# PurchaseOrder
async def create_purchase_order(db: AsyncSession, buyer_id: UUID, dealer_id: UUID, product_id: UUID, quantity: int, total_price: float) -> dict:
    po = PurchaseOrder(buyer_id=buyer_id, dealer_id=dealer_id, product_id=product_id, quantity=quantity, total_price=total_price)
    db.add(po)
    await db.flush()
    # Eager load relationships for the initial return doesn't work this simply, so we fetch it again nicely:
    return await get_purchase_order(db, po.id)

async def get_purchase_order(db: AsyncSession, po_id: UUID) -> dict | None:
    # also fetch the buyer, dealer, and product names
    q = select(PurchaseOrder, User, DealerProfile, Product).join(
        User, User.id == PurchaseOrder.buyer_id
    ).join(
        DealerProfile, DealerProfile.user_id == PurchaseOrder.dealer_id
    ).join(
        Product, Product.id == PurchaseOrder.product_id
    ).where(PurchaseOrder.id == po_id)
    res = await db.execute(q)
    row = res.first()
    if not row: return None
    po, buyer, dp, prod = row
    
    return {
        "id": str(po.id),
        "buyer_id": str(po.buyer_id),
        "dealer_id": str(po.dealer_id),
        "product_id": str(po.product_id),
        "quantity": po.quantity,
        "total_price": float(po.total_price),
        "status": po.status,
        "created_at": str(po.created_at),
        "buyer_name": buyer.name,
        "dealer_name": dp.company_name,
        "product_name": prod.name
    }

async def get_purchase_orders_by_buyer(db: AsyncSession, buyer_id: UUID) -> list[dict]:
    q = select(PurchaseOrder, User, DealerProfile, Product).join(
        User, User.id == PurchaseOrder.buyer_id
    ).join(
        DealerProfile, DealerProfile.user_id == PurchaseOrder.dealer_id
    ).join(
        Product, Product.id == PurchaseOrder.product_id
    ).where(PurchaseOrder.buyer_id == buyer_id).order_by(PurchaseOrder.created_at.desc())
    res = await db.execute(q)
    
    results = []
    for po, buyer, dp, prod in res.all():
        results.append({
            "id": str(po.id), "buyer_id": str(po.buyer_id), "dealer_id": str(po.dealer_id),
            "product_id": str(po.product_id), "quantity": po.quantity, "total_price": float(po.total_price),
            "status": po.status, "created_at": str(po.created_at),
            "buyer_name": buyer.name, "dealer_name": dp.company_name, "product_name": prod.name
        })
    return results

async def get_purchase_orders_by_dealer(db: AsyncSession, dealer_id: UUID) -> list[dict]:
    q = select(PurchaseOrder, User, DealerProfile, Product).join(
        User, User.id == PurchaseOrder.buyer_id
    ).join(
        DealerProfile, DealerProfile.user_id == PurchaseOrder.dealer_id
    ).join(
        Product, Product.id == PurchaseOrder.product_id
    ).where(PurchaseOrder.dealer_id == dealer_id).order_by(PurchaseOrder.created_at.desc())
    res = await db.execute(q)
    
    results = []
    for po, buyer, dp, prod in res.all():
        results.append({
            "id": str(po.id), "buyer_id": str(po.buyer_id), "dealer_id": str(po.dealer_id),
            "product_id": str(po.product_id), "quantity": po.quantity, "total_price": float(po.total_price),
            "status": po.status, "created_at": str(po.created_at),
            "buyer_name": buyer.name, "dealer_name": dp.company_name, "product_name": prod.name
        })
    return results

async def update_purchase_order_status(db: AsyncSession, po_id: UUID, status: str) -> dict | None:
    res = await db.execute(select(PurchaseOrder).where(PurchaseOrder.id == po_id))
    po = res.scalars().first()
    if not po: return None
    po.status = status
    await db.flush()
    return await get_purchase_order(db, po.id)
