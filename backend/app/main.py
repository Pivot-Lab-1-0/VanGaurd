from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.init_db import init_db
from app.api.routes import match, problems

app = FastAPI(
    title="Vanguard API",
    description="The Verified Impact Pipeline",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(problems.router)
app.include_router(match.router)

@app.on_event("startup")
async def on_startup():
    init_db()

@app.get("/health")
def health_check():
    return {"status": "Vanguard is live 🚀", "version": "0.1.0"}