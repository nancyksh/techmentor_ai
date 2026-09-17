import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (registers tables on Base.metadata)
from app.api.endpoints import router as api_router
from app.core.database import Base, engine

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup so a fresh database (e.g. a new Render instance) works immediately
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="TechMentor AI API",
    description="Backend for CORTEX: AI coding room, mock interviews and an adaptive quiz tutor.",
    version="1.1.0",
    lifespan=lifespan,
)

# Only the deployed frontend may call the API; "*" is allowed for local development only.
_frontend_origin = os.getenv("FRONTEND_ORIGIN")
allowed_origins = [origin.strip() for origin in _frontend_origin.split(",")] if _frontend_origin else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=bool(_frontend_origin),  # browsers reject credentials with a wildcard origin
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "TechMentor AI API is running. See /docs for the endpoints."}


@app.get("/health")
@app.head("/health")
async def health_check():
    return {"status": "ok"}
