from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router

app = FastAPI(
    title="TechMentor AI Professor",
    description="Backend API for the Autonomous Multi-Agent Learning Platform",
    version="1.0.0",
)

# Configure CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with the specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Welcome to TechMentor AI Professor API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
