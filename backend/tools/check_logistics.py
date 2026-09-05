from google.genai import types
from sqlalchemy.ext.asyncio import AsyncSession
from db.repositories import get_dealer_for_product
import uuid

declaration = types.FunctionDeclaration(
    name="check_logistics",
    description="Check shipping cost and delivery feasibility for a product to a destination.",
    parameters=types.Schema(
        type="OBJECT",
        properties={
            "product_id": types.Schema(type="STRING", description="The product ID to ship"),
            "destination": types.Schema(type="STRING", description="Destination city"),
            "quantity": types.Schema(type="INTEGER", description="Quantity to ship")
        },
        required=["product_id", "destination", "quantity"]
    )
)

INDIA_CITIES = {"mumbai", "delhi", "chennai", "kolkata", "bangalore", "hyderabad"}

async def execute(db: AsyncSession, params: dict) -> dict:
    try:
        pid = uuid.UUID(params["product_id"])
        dest = params["destination"].lower()
        qty = params["quantity"]
        
        dealer = await get_dealer_for_product(db, pid)
        if not dealer:
            return {"error": "Dealer or product not found"}
            
        origin = dealer["location"]
        origin_lower = origin.lower()
        
        # Calculate shipping base
        if origin_lower in INDIA_CITIES and dest in INDIA_CITIES:
            if origin_lower == dest:
                distance_tier = "local"
                base_shipping = 50.0
                per_unit = 0.05
                added_days = 0
            else:
                distance_tier = "domestic"
                base_shipping = 150.0
                per_unit = 0.10
                added_days = 0
        else:
            if origin_lower == dest:
                distance_tier = "local"
                base_shipping = 50.0
                per_unit = 0.05
                added_days = 0
            else:
                distance_tier = "international"
                base_shipping = 400.0  # avg between 300-500
                per_unit = 0.10
                added_days = 3
                
        shipping_cost = base_shipping + (qty * per_unit)
        
        # Calculate product cost with discount
        product_cost = dealer["unit_price"] * qty
        if qty >= dealer["min_order_qty"]:
            product_cost = (dealer["unit_price"] * (1.0 - (dealer["bulk_discount_pct"] / 100.0))) * qty
            
        total_with_shipping = product_cost + shipping_cost
        estimated_days = dealer["base_delivery_days"] + added_days
        
        return {
            "product_id": str(pid),
            "company_name": dealer["company_name"],
            "origin": origin,
            "destination": dest,
            "distance_tier": distance_tier,
            "shipping_cost": round(shipping_cost, 2),
            "product_cost": round(product_cost, 2),
            "total_with_shipping": round(total_with_shipping, 2),
            "estimated_days": estimated_days,
            "feasible": True
        }
    except Exception as e:
        return {"error": str(e)}
