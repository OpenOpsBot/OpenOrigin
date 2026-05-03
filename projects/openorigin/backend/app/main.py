from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import brain, lab, ops

app = FastAPI(title="OpenOrigin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(brain.router, prefix="/api")
app.include_router(lab.router, prefix="/api")
app.include_router(ops.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"message": "OpenOrigin API"}