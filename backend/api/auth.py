from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from schemas import LoginRequest, LoginResponse, UserInfo, RegisterRequest
from db.connection import get_db
from db.repositories import get_user_by_email, create_user

router = APIRouter(prefix="/api/auth")

@router.post("/register", response_model=LoginResponse, status_code=201)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    if req.role not in ["buyer", "dealer"]:
        raise HTTPException(status_code=422, detail="Role must be 'buyer' or 'dealer'")
        
    existing = await get_user_by_email(db, req.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    try:
        user = await create_user(db, req.name, req.email, req.role, req.password)
    except Exception as e:
        await db.rollback()
        if "unique constraint" in str(e).lower() or "integrityerror" in str(type(e)).lower():
            raise HTTPException(status_code=400, detail="Email already exists")
        raise
    
    return LoginResponse(
        user=UserInfo(id=user["id"], name=user["name"], email=user["email"], role=user["role"]),
        password=user["password"]
    )

@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(db, req.email)
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return LoginResponse(
        user=UserInfo(id=user["id"], name=user["name"], email=user["email"], role=user["role"]),
        password=user["password"]
    )
