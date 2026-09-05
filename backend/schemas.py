from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any

class LoginRequest(BaseModel):
    email: str
    password: str

class UserInfo(BaseModel):
    id: str
    name: str
    email: str
    role: str
    model_config = ConfigDict(from_attributes=True)

class LoginResponse(BaseModel):
    user: UserInfo
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    role: str
    password: str

class CreateProfileRequest(BaseModel):
    company_name: str
    location: str
    reliability_score: float
    fulfillment_rate: float
    base_delivery_days: int

class UpdateProfileRequest(BaseModel):
    company_name: Optional[str] = None
    location: Optional[str] = None
    reliability_score: Optional[float] = None
    fulfillment_rate: Optional[float] = None
    base_delivery_days: Optional[int] = None

class CreateProductRequest(BaseModel):
    name: str
    category: str
    unit_price: float
    bulk_discount_pct: float = 0.0
    min_order_qty: int = 1
    stock_available: int
    specs: Optional[Dict[str, Any]] = None

class UpdateProductRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit_price: Optional[float] = None
    bulk_discount_pct: Optional[float] = None
    min_order_qty: Optional[int] = None
    stock_available: Optional[int] = None
    specs: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class SearchRequest(BaseModel):
    query: str

class NegotiateRequest(BaseModel):
    order_id: str
    message: str

class ProfileResponse(BaseModel):
    id: str
    company_name: str
    location: str
    reliability_score: float
    fulfillment_rate: float
    base_delivery_days: int
    model_config = ConfigDict(from_attributes=True)

class ProductResponse(BaseModel):
    id: str
    name: str
    category: str
    unit_price: float
    bulk_discount_pct: float
    min_order_qty: int
    stock_available: int
    specs: Optional[Dict[str, Any]] = None
    is_active: bool
    dealer_name: Optional[str] = None
    created_at: str
    model_config = ConfigDict(from_attributes=True)

class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    count: int

class TraceStep(BaseModel):
    step: int
    tool: str
    input: Dict[str, Any]
    output: Dict[str, Any]
    duration_ms: int
    model_config = ConfigDict(from_attributes=True)

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
    model_config = ConfigDict(from_attributes=True)

class OrderHistoryResponse(BaseModel):
    orders: List[OrderSummary]

class NegotiationTurn(BaseModel):
    message: str
    response: str
    created_at: str
    model_config = ConfigDict(from_attributes=True)

class OrderDetailResponse(BaseModel):
    order_id: str
    query: str
    status: str
    answer: str
    trace: List[TraceStep]
    negotiations: List[NegotiationTurn]
    created_at: str

class RecentRecommendation(BaseModel):
    query_text: str
    recommended_rank: int
    created_at: str

class AnalyticsResponse(BaseModel):
    total_recommendations: int
    average_rank: float
    recent_recommendations: List[RecentRecommendation]
    model_config = ConfigDict(from_attributes=True)

class ErrorResponse(BaseModel):
    detail: str

class SimpleResponse(BaseModel):
    deactivated: Optional[bool] = None

class CreatePurchaseOrderRequest(BaseModel):
    product_id: str
    quantity: int

class UpdatePurchaseOrderStatusRequest(BaseModel):
    status: str

class PurchaseOrderResponse(BaseModel):
    id: str
    buyer_id: str
    dealer_id: str
    product_id: str
    quantity: int
    total_price: float
    status: str
    created_at: str
    buyer_name: Optional[str] = None
    dealer_name: Optional[str] = None
    product_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
