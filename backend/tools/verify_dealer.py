from google.genai import types
from sqlalchemy.ext.asyncio import AsyncSession
from db.repositories import get_dealer_for_product
import uuid

declaration = types.FunctionDeclaration(
    name="verify_dealer",
    description="Verify a dealer's trustworthiness using a product ID. Returns reliability score, fulfillment rate, and a verdict.",
    parameters=types.Schema(
        type="OBJECT",
        properties={
            "product_id": types.Schema(type="STRING", description="The product ID to verify the dealer for")
        },
        required=["product_id"]
    )
)

async def execute(db: AsyncSession, params: dict) -> dict:
    try:
        pid = uuid.UUID(params["product_id"])
        dealer = await get_dealer_for_product(db, pid)
        if not dealer:
            return {"error": "Dealer or product not found"}
            
        score = dealer["reliability_score"]
        if score >= 0.8:
            verdict = "trusted"
            reason = "High reliability score indicating strong fulfillment history."
        elif score >= 0.6:
            verdict = "caution"
            reason = "Moderate reliability. Some risks of delays or minor issues."
        else:
            verdict = "avoid"
            reason = "Low reliability. High risk of poor fulfillment."
            
        return {
            "dealer_id": dealer["dealer_id"],
            "company_name": dealer["company_name"],
            "reliability_score": score,
            "fulfillment_rate": dealer["fulfillment_rate"],
            "verdict": verdict,
            "reason": reason
        }
    except Exception as e:
        return {"error": str(e)}
