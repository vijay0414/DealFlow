export interface User {
    id: string;
    name: string;
    email: string;
    role: "dealer" | "buyer";
}

export interface LoginRequest {
    email: string;
    api_key: string;
}

export interface LoginResponse {
    user: User;
    api_key: string;
}

export interface TraceStep {
    step: number;
    tool: string;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
    duration_ms: number;
}

export interface AgentResponse {
    order_id: string;
    status: string;
    answer: string;
    trace: TraceStep[];
    steps_count: number;
}

export interface NegotiateResponse extends AgentResponse {
    negotiation_turn: number;
}

export interface OrderSummary {
    order_id: string;
    query: string;
    status: string;
    answer: string;
    created_at: string;
}

export interface NegotiationTurn {
    message: string;
    response: string;
    created_at: string;
}

export interface OrderDetail {
    order_id: string;
    query: string;
    status: string;
    answer: string;
    trace: TraceStep[];
    negotiations: NegotiationTurn[];
    created_at: string;
}

export interface Product {
    id: string;
    name: string;
    category: string;
    unit_price: number;
    bulk_discount_pct: number;
    min_order_qty: number;
    stock_available: number;
    specs: Record<string, unknown> | null;
    is_active: boolean;
    dealer_id: string;
    created_at: string;
}

export interface DealerProfile {
    id: string;
    company_name: string;
    location: string;
    reliability_score: number;
    fulfillment_rate: number;
    base_delivery_days: number;
}

export interface RecentRecommendation {
    query_text: string;
    recommended_rank: number;
    created_at: string;
}

export interface Analytics {
    total_recommendations: number;
    average_rank: number;
    recent_recommendations: RecentRecommendation[];
}

export interface PurchaseOrder {
    id: string;
    buyer_id: string;
    dealer_id: string;
    product_id: string;
    quantity: number;
    total_price: number;
    status: string;
    created_at: string;
    buyer_name?: string;
    dealer_name?: string;
    product_name?: string;
}
