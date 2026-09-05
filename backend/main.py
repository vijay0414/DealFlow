from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from db.connection import init_db
from db.seed_data import seed_if_empty
from db.connection import async_session
from contextlib import asynccontextmanager

from api.auth import router as auth_router
from api.dealer import router as dealer_router
from api.search import router as search_router
from api.negotiate import router as negotiate_router
from api.history import router as history_router
from api.purchases import router as purchases_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup DB
    await init_db()
    # Seed data (disabled as requested)
    # async with async_session() as session:
    #     await seed_if_empty(session)
    yield
    # Shutdown

app = FastAPI(title="DealFlow API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(dealer_router)
app.include_router(search_router)
app.include_router(negotiate_router)
app.include_router(history_router)
app.include_router(purchases_router)

@app.get("/")
async def health_check():
    return {"status": "ok", "service": "dealflow", "version": "1.0.0"}
