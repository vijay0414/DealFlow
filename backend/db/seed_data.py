from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

async def seed_if_empty(db: AsyncSession):
    res = await db.execute(text("SELECT COUNT(*) FROM users;"))
    count = res.scalar()
    if count > 0:
        return
        
    await db.execute(text("""
        INSERT INTO users (name, email, role, api_key, is_active) VALUES
        ('Rahul Sharma', 'rahul@audiotech.com', 'dealer', 'del-key-001', true),
        ('Wei Chen', 'wei@szcableking.com', 'dealer', 'del-key-002', true),
        ('Priya Patel', 'priya@delhidesk.com', 'dealer', 'del-key-003', true),
        ('Amit Kumar', 'amit@company.com', 'buyer', 'buy-key-001', true),
        ('Sneha Reddy', 'sneha@startup.io', 'buyer', 'buy-key-002', true);
    """))

    await db.execute(text("""
        INSERT INTO dealer_profiles (user_id, company_name, location, reliability_score, fulfillment_rate, base_delivery_days)
        SELECT id, 'ShenZhen AudioTech', 'Shenzhen', 0.92, 0.95, 12 FROM users WHERE email='rahul@audiotech.com'
        UNION ALL
        SELECT id, 'SZ CableKing', 'Shenzhen', 0.88, 0.90, 10 FROM users WHERE email='wei@szcableking.com'
        UNION ALL
        SELECT id, 'Delhi DeskPro', 'Delhi', 0.90, 0.93, 2 FROM users WHERE email='priya@delhidesk.com';
    """))

    await db.execute(text("""
        INSERT INTO products (dealer_id, name, category, unit_price, bulk_discount_pct, min_order_qty, stock_available, is_active)
        SELECT id, 'Wireless Earbuds X1', 'earbuds', 8.50, 12.0, 200, 5000, true FROM users WHERE email='rahul@audiotech.com'
        UNION ALL
        SELECT id, 'Wireless Earbuds Pro', 'earbuds', 12.00, 8.0, 100, 3000, true FROM users WHERE email='rahul@audiotech.com'
        UNION ALL
        SELECT id, 'Mechanical Keyboard K1', 'keyboards', 18.00, 10.0, 100, 2000, true FROM users WHERE email='rahul@audiotech.com'
        UNION ALL
        SELECT id, 'USB-C Cable 1m', 'cables', 0.80, 15.0, 500, 50000, true FROM users WHERE email='wei@szcableking.com'
        UNION ALL
        SELECT id, 'USB-C Cable 2m', 'cables', 1.20, 12.0, 300, 40000, true FROM users WHERE email='wei@szcableking.com'
        UNION ALL
        SELECT id, 'HDMI Cable 2m', 'cables', 2.50, 10.0, 200, 20000, true FROM users WHERE email='wei@szcableking.com'
        UNION ALL
        SELECT id, 'Webcam HD 1080p', 'webcams', 10.00, 8.0, 100, 2500, true FROM users WHERE email='wei@szcableking.com'
        UNION ALL
        SELECT id, 'Laptop Stand Adjustable', 'stands', 12.00, 8.0, 50, 500, true FROM users WHERE email='priya@delhidesk.com'
        UNION ALL
        SELECT id, 'Monitor Stand Riser', 'stands', 8.00, 5.0, 30, 300, true FROM users WHERE email='priya@delhidesk.com'
        UNION ALL
        SELECT id, 'TWS Earbuds Basic', 'earbuds', 11.00, 0.0, 100, 2000, true FROM users WHERE email='priya@delhidesk.com';
    """))
    
    await db.commit()
