from google.genai import types
from sqlalchemy.ext.asyncio import AsyncSession
from db.repositories import search_products

declaration = types.FunctionDeclaration(
    name="search_products",
    description="Search for products by category, product name, or dealer name with optional price and quantity filters. Returns matching products with dealer info.",
    parameters=types.Schema(
        type="OBJECT",
        properties={
            "product_type": types.Schema(type="STRING", description="Search query: Category, product name (e.g. 'wireless earbuds'), or dealer name"),
            "min_quantity": types.Schema(type="INTEGER", description="Minimum quantity required"),
            "max_unit_price": types.Schema(type="NUMBER", description="Maximum unit price (optional)")
        },
        required=["product_type", "min_quantity"]
    )
)

async def execute(db: AsyncSession, params: dict) -> dict:
    try:
        results = await search_products(
            db, 
            category=params.get("product_type", ""), 
            max_price=params.get("max_unit_price"), 
            min_quantity=params.get("min_quantity", 1)
        )
        return {"products": results, "count": len(results)}
    except Exception as e:
        return {"error": str(e)}
