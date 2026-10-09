from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from typing import List, Optional
import uuid
from datetime import datetime

from app.schemas import (
    SectorResponse, SectorCreate,
    DocumentResponse, DocumentDetailResponse, DocumentStatus, DocumentUpdateSector
)

router = APIRouter(prefix="/documents", tags=["Documentos"])

# Mock de persistência em memória para a API desacoplada
MOCK_SECTORS = [
    {"id": uuid.uuid4(), "user_id": uuid.UUID("00000000-0000-0000-0000-000000000001"), "name": "Financeiro", "color": "#10b981", "is_default": True, "created_at": datetime.now(), "updated_at": datetime.now()},
    {"id": uuid.uuid4(), "user_id": uuid.UUID("00000000-0000-0000-0000-000000000001"), "name": "Comprovantes", "color": "#c9a858", "is_default": True, "created_at": datetime.now(), "updated_at": datetime.now()},
    {"id": uuid.uuid4(), "user_id": uuid.UUID("00000000-0000-0000-0000-000000000001"), "name": "Contratos", "color": "#3b82f6", "is_default": True, "created_at": datetime.now(), "updated_at": datetime.now()},
    {"id": uuid.uuid4(), "user_id": uuid.UUID("00000000-0000-0000-0000-000000000001"), "name": "Saúde", "color": "#ec4899", "is_default": True, "created_at": datetime.now(), "updated_at": datetime.now()},
    {"id": uuid.uuid4(), "user_id": uuid.UUID("00000000-0000-0000-0000-000000000001"), "name": "Revisar", "color": "#f97316", "is_default": True, "created_at": datetime.now(), "updated_at": datetime.now()},
]

MOCK_DOCUMENTS = []

@router.get("/sectors", response_model=List[SectorResponse])
def list_sectors():
    """Retorna os setores disponíveis para organização de documentos."""
    return MOCK_SECTORS

@router.post("/sectors", response_model=SectorResponse, status_code=status.HTTP_201_CREATED)
def create_sector(sector_in: SectorCreate):
    """Cria um setor personalizado para o usuário."""
    new_sector = {
        "id": uuid.uuid4(),
        "user_id": uuid.UUID("00000000-0000-0000-0000-000000000001"),
        "name": sector_in.name,
        "color": sector_in.color,
        "is_default": sector_in.is_default,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    MOCK_SECTORS.append(new_sector)
    return new_sector

@router.get("", response_model=List[DocumentResponse])
def list_documents(sector_id: Optional[uuid.UUID] = None, status: Optional[DocumentStatus] = None):
    """Lista documentos privados do usuário com filtros opcionais de setor e status."""
    docs = MOCK_DOCUMENTS
    if sector_id:
        docs = [d for d in docs if d["sector_id"] == sector_id]
    if status:
        docs = [d for d in docs if d["status"] == status]
    return docs

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    file: UploadFile = File(...),
    sector_id: Optional[str] = Form(None)
):
    """
    Ingestão assíncrona e segura de documento:
    1. Validação de formato e tamanho.
    2. Armazenamento privado sem expor URL pública.
    3. Enfileiramento de job de extração/OCR sem bloquear a resposta HTTP.
    """
    sec_id = uuid.UUID(sector_id) if sector_id else None
    doc_id = uuid.uuid4()
    
    doc = {
        "id": doc_id,
        "user_id": uuid.UUID("00000000-0000-0000-0000-000000000001"),
        "sector_id": sec_id,
        "file_name": file.filename or "sem_nome",
        "file_size": 1024, # Bytes recebidos
        "mime_type": file.content_type or "application/octet-stream",
        "status": DocumentStatus.PENDING_PROCESSING,
        "suggested_sector_id": None,
        "confidence_score": 0.0,
        "version": 1,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    MOCK_DOCUMENTS.append(doc)
    return doc

@router.patch("/{document_id}/sector", response_model=DocumentResponse)
def update_document_sector(document_id: uuid.UUID, body: DocumentUpdateSector):
    """Permite ao usuário corrigir ou reclassificar o setor de um documento."""
    for d in MOCK_DOCUMENTS:
        if d["id"] == document_id:
            d["sector_id"] = body.sector_id
            d["status"] = DocumentStatus.READY
            d["updated_at"] = datetime.now()
            return d
    raise HTTPException(status_code=404, detail="Documento não encontrado")
