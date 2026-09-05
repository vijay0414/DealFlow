const BASE_URL = "";

function getPassword(): string | null {
    return localStorage.getItem("dealflow_password");
}

async function request<T>(
    method: string,
    path: string,
    body?: unknown
): Promise<T> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    const password = getPassword();
    const userStr = localStorage.getItem("dealflow_user");
    if (password) headers["X-Password"] = password;
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user.email) headers["X-User-Email"] = user.email;
        } catch { }
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("dealflow_password");
        localStorage.removeItem("dealflow_user");
        window.location.href = "/login";
        throw new Error("Unauthorized");
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.detail || data.message || `HTTP ${res.status}`);
    }

    return data as T;
}

export function login(email: string, password: string) {
    return request<{ user: unknown; password: string }>("POST", "/api/auth/login", { email, password });
}

export function register(name: string, email: string, role: string, password: string) {
    return request<{ user: unknown; password: string }>("POST", "/api/auth/register", { name, email, role, password });
}

export function searchProducts(query: string) {
    return request<unknown>("POST", "/api/search", { query });
}

export function negotiate(orderId: string, message: string) {
    return request<unknown>("POST", "/api/negotiate", { order_id: orderId, message });
}

export function getOrderHistory() {
    return request<{ orders: unknown[] }>("GET", "/api/history");
}

export function getOrderDetail(orderId: string) {
    return request<unknown>("GET", `/api/history/${orderId}`);
}

export function getDealerProfile() {
    return request<unknown>("GET", "/api/dealer/profile");
}

export function createDealerProfile(data: unknown) {
    return request<unknown>("POST", "/api/dealer/profile", data);
}

export function updateDealerProfile(data: unknown) {
    return request<unknown>("PUT", "/api/dealer/profile", data);
}

export function getProducts() {
    return request<unknown[]>("GET", "/api/dealer/products");
}

export function createProduct(data: unknown) {
    return request<unknown>("POST", "/api/dealer/products", data);
}

export function updateProduct(productId: string, data: unknown) {
    return request<unknown>("PUT", `/api/dealer/products/${productId}`, data);
}

export function deactivateProduct(productId: string) {
    return request<unknown>("PATCH", `/api/dealer/products/${productId}/deactivate`);
}

export function getAnalytics() {
    return request<unknown>("GET", "/api/dealer/analytics");
}

export function createPurchaseOrder(productId: string, quantity: number) {
    return request<unknown>("POST", "/api/purchases", { product_id: productId, quantity });
}

export function getBuyerPurchases() {
    return request<unknown[]>("GET", "/api/purchases/buyer");
}

export function getDealerPurchases() {
    return request<unknown[]>("GET", "/api/purchases/dealer");
}

export function updatePurchaseStatus(poId: string, status: string) {
    return request<unknown>("PATCH", `/api/purchases/${poId}/status`, { status });
}
