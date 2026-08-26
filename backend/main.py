from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from db.connection import init_db
from contextlib import asynccontextmanager
from api.search import router as search_router
from api.negotiate import router as negotiate_router
from api.history import router as history_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="DealFlow API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search_router, prefix="/api")
app.include_router(negotiate_router, prefix="/api")
app.include_router(history_router, prefix="/api")

@app.get("/")
async def health_check():
    return {"status": "ok", "service": "dealflow"}
