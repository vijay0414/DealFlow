from fastapi import Header, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from db.connection import get_db
from db.repositories import get_user_by_email

async def get_current_user(
    x_password: str = Header(None, alias="X-Password"),
    x_user_email: str = Header(None, alias="X-User-Email"),
    db: AsyncSession = Depends(get_db)
) -> dict:
    if not x_password or not x_user_email:
        raise HTTPException(status_code=403, detail="Missing X-Password or X-User-Email header")
        
    user = await get_user_by_email(db, x_user_email)
    
    if not user or user["password"] != x_password:
        raise HTTPException(status_code=403, detail="Invalid credentials via header")
        
    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="Account disabled")
        
    return user

async def require_dealer(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "dealer":
        raise HTTPException(status_code=403, detail="Dealer access required")
    return user

async def require_buyer(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "buyer":
        raise HTTPException(status_code=403, detail="Buyer access required")
    return user
