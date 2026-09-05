from tools.search_suppliers import MOCK_SUPPLIERS

SCHEMA = {
    "name": "verify_supplier",
    "description": "Verifies supplier trust, reliability, and fulfillment rate.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "supplier_id": {"type": "STRING", "description": "The supplier ID to verify"}
        },
        "required": ["supplier_id"]
    }
}

async def execute(params: dict) -> dict:
    try:
        sid = params.get("supplier_id")
        suppliers = {s["id"]: s for s in MOCK_SUPPLIERS}
        if sid not in suppliers:
            return {"error": "Supplier not found"}
            
        s = suppliers[sid]
        score = s["reliability_score"]
        
        if score >= 0.8:
            verdict = "trusted"
            reason = "High reliability score and good fulfillment history."
        elif score >= 0.6:
            verdict = "caution"
            reason = "Moderate reliability score. Expect possible delays or quality variances."
        else:
            verdict = "avoid"
            reason = "Low reliability score. High risk of fulfillment failure."
            
        return {
            "supplier_id": sid,
            "reliability_score": score,
            "fulfillment_rate": s["fulfillment_rate"],
            "verdict": verdict,
            "reason": reason
        }
    except Exception as e:
        return {"error": str(e)}
