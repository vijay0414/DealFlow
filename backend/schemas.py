from pydantic import BaseModel
from typing import List, Dict, Any

class SearchRequest(BaseModel):
    query: str
    user_id: str

class NegotiateRequest(BaseModel):
    order_id: str
    message: str

class TraceStep(BaseModel):
    step: int
    tool: str
    input: Dict[str, Any]
    output: Dict[str, Any]
    duration_ms: int

class AgentResponse(BaseModel):
    order_id: str
    status: str
    answer: str
    trace: List[TraceStep]
    steps_count: int

class NegotiateResponse(AgentResponse):
    negotiation_turn: int

class OrderSummary(BaseModel):
    order_id: str
    query: str
    status: str
    answer: str
    created_at: str

class OrderHistoryResponse(BaseModel):
    orders: List[OrderSummary]
    
class NegotiationTurn(BaseModel):
    message: str
    response: str
    created_at: str

class OrderDetailResponse(BaseModel):
    order_id: str
    query: str
    status: str
    answer: str
    trace: List[TraceStep]
    negotiations: List[NegotiationTurn]
    created_at: str

class ErrorResponse(BaseModel):
    detail: str
