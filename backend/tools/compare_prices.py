from google.genai import types
from sqlalchemy.ext.asyncio import AsyncSession
from db.repositories import get_products_by_ids
import uuid

declaration = types.FunctionDeclaration(
    name="compare_prices",
    description="Compare total costs for specific products at a given quantity, including bulk discounts. Returns ranked comparison.",
    parameters=types.Schema(
        type="OBJECT",
        properties={
            "product_ids": types.Schema(
                type="ARRAY",
                items=types.Schema(type="STRING"),
                description="List of product IDs to compare"
            ),
            "quantity": types.Schema(type="INTEGER", description="Quantity to purchase")
        },
        required=["product_ids", "quantity"]
    )
)

async def execute(db: AsyncSession, params: dict) -> dict:
    try:
        pids = [uuid.UUID(pid) for pid in params.get("product_ids", [])]
        quantity = params.get("quantity", 0)
        
        products = await get_products_by_ids(db, pids)
        comparison = []
        
        for p in products:
            original_price = p["unit_price"]
            discount_applied = False
            discounted_price = original_price
            
            if quantity >= p["min_order_qty"]:
                discounted_price = original_price * (1.0 - (p["bulk_discount_pct"] / 100.0))
                if p["bulk_discount_pct"] > 0:
                    discount_applied = True
                    
            total_cost = discounted_price * quantity
            
            comparison.append({
                "product_id": p["id"],
                "name": p["name"],
                "company_name": p["company_name"],
                "original_price": round(original_price, 2),
                "discounted_price": round(discounted_price, 2),
                "discount_applied": discount_applied,
                "total_cost": round(total_cost, 2),
                "location": p["location"]
            })
            
        comparison.sort(key=lambda x: x["total_cost"])
        
        return {"comparison": comparison}
    except Exception as e:
        return {"error": str(e)}
