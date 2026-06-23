# TechMentor AI Professor

An Autonomous Multi-Agent Learning, Assessment, and Placement Preparation Platform designed for M.Tech AI standards.

## Architecture

*   **Frontend**: Next.js, Tailwind CSS, Framer Motion
*   **Backend**: FastAPI, Python
*   **Database**: PostgreSQL (via SQLAlchemy)
*   **Vector Database**: ChromaDB
*   **Agent Framework**: CrewAI
*   **Orchestration**: Docker Compose

## Core Innovation

Instead of relying on manual user selection, this platform creates a **Student Digital Twin** and autonomously orchestrates 9 specialized AI agents (Professor, Research, Teaching, Quiz, Evaluation, Reflection, Planner, Interview Panel, Memory) to guide the student's learning journey.

## Setup Instructions

### Prerequisites
*   Docker & Docker Compose
*   Node.js (v18+)
*   Python 3.11+
*   LLM API Keys (e.g., OpenAI `OPENAI_API_KEY`)

### Local Development

1.  **Start Databases**
    ```bash
    docker-compose up -d
    ```
    This spins up PostgreSQL on `localhost:5432` and ChromaDB on `localhost:8000`.

2.  **Start Backend (FastAPI)**
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn app.main:app --reload --port 8080
    ```
    API will be available at `http://localhost:8080/docs`.

3.  **Start Frontend (Next.js)**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    UI will be available at `http://localhost:3000`.

## Deployment Guide

*   **Frontend**: Ready to be deployed to Vercel or Hugging Face Spaces. Ensure `.env` is configured with the backend API URL.
*   **Backend**: Can be containerized and deployed to Render, Railway, or AWS.
*   **Databases**: Use Supabase for PostgreSQL in production and a managed Vector DB (like Pinecone) or a self-hosted ChromaDB instance.
