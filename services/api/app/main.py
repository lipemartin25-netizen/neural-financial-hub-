from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Neurafin Hub API",
    version="1.0.0",
    description="API compartilhada para gestão de documentos, OCR e finanças do Neurafin Hub."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str

class SystemStatusResponse(BaseModel):
    online: bool
    phase: str

@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="ok",
        service="neurafin-api",
        version="1.0.0"
    )

@app.get("/api/v1/system/status", response_model=SystemStatusResponse)
def get_system_status():
    return SystemStatusResponse(
        online=True,
        phase="Fase 0 - Bootstrap"
    )
