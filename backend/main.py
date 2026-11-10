
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.auth import router as auth_router
from routes.projects import router as projects_router
from routes.journals import router as journals_router
from routes.documents import router as documents_router
from routes.knowledge import router as knowledge_router
from routes.handovers import router as handovers_router
from routes.support import router as support_router


app = FastAPI(
    title="KnowFlow API",
    description="Project Knowledge Management and Intelligent Handover Platform",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(journals_router)
app.include_router(documents_router)
app.include_router(knowledge_router)
app.include_router(handovers_router)
app.include_router(support_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to KnowFlow API",
        "status": "running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
