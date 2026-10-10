from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import Response
from typing import List, Optional
import uuid
from datetime import datetime

from app.auth.deps import get_current_user, AuthenticatedUser
from app.schemas import (
    SectorResponse, SectorCreate,
    DocumentResponse, DocumentStatus, DocumentUpdateSector
)
from services.worker.pipeline import enqueue_document_job, process_next_job

router = APIRouter(prefix="/documents", tags=["Documentos"])

USER_SECTORS: dict[uuid.UUID, list[dict]] = {}
USER_DOCUMENTS: dict[uuid.UUID, list[dict]] = {}
USER_FILES: dict[uuid.UUID, dict[uuid.UUID, bytes]] = {}

def _get_user_sectors(user_id: uuid.UUID) -> list[dict]:
    if user_id not in USER_SECTORS:
        USER_SECTORS[user_id] = [
            {"id": uuid.uuid4(), "user_id": user_id, "name": "Financeiro", "color": "#10b981", "is_default": True, "created_at": datetime.now(), "updated_at": datetime.now()},
            {"id": uuid.uuid4(), "user_id": user_id, "name": "Comprovantes", "color": "#c9a858", "is_default": True, "created_at": datetime.now(), "updated_at": datetime.now()},
            {"id": uuid.uuid4(), "user_id": user_id, "name": "Contratos", "color": "#3b82f6", "is_default": True, "created_at": datetime.now(), "updated_at": datetime.now()},
            {"id": uuid.uuid4(), "user_id": user_id, "name": "Saúde", "color": "#ec4899", "is_default": True, "created_at": datetime.now(), "updated_at": datetime.now()},
            {"id": uuid.uuid4(), "user_id": user_id, "name": "Revisar", "color": "#f97316", "is_default": True, "created_at": datetime.now(), "updated_at": datetime.now()},
        ]
    return USER_SECTORS[user_id]

def _get_user_docs(user_id: uuid.UUID) -> list[dict]:
    if user_id not in USER_DOCUMENTS:
        USER_DOCUMENTS[user_id] = []
    return USER_DOCUMENTS[user_id]

def _get_user_files(user_id: uuid.UUID) -> dict[uuid.UUID, bytes]:
    if user_id not in USER_FILES:
        USER_FILES[user_id] = {}
    return USER_FILES[user_id]


@router.get("/sectors", response_model=List[SectorResponse])
def list_sectors(current_user: AuthenticatedUser = Depends(get_current_user)):
    return _get_user_sectors(current_user.id)


@router.post("/sectors", response_model=SectorResponse, status_code=status.HTTP_201_CREATED)
def create_sector(
    sector_in: SectorCreate,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    sectors = _get_user_sectors(current_user.id)
    new_sector = {
        "id": uuid.uuid4(),
        "user_id": current_user.id,
        "name": sector_in.name,
        "color": sector_in.color,
        "is_default": sector_in.is_default,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    sectors.append(new_sector)
    return new_sector


@router.get("", response_model=List[DocumentResponse])
def list_documents(
    sector_id: Optional[uuid.UUID] = None,
    doc_status: Optional[DocumentStatus] = None,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    docs = _get_user_docs(current_user.id)
    if sector_id:
        docs = [d for d in docs if d["sector_id"] == sector_id]
    if doc_status:
        docs = [d for d in docs if d["status"] == doc_status]
    return docs


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    file: UploadFile = File(...),
    sector_id: Optional[str] = Form(None),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Ingestão assíncrona robusta:
    1. Valida tamanho do arquivo.
    2. Persiste cópia binária no cofre privado.
    3. Registra documento em estado 'pending_processing'.
    4. Enfileira job assíncrono para o worker.
    """
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Arquivo vazio não é permitido.")

    # Limite máximo de segurança inicial: 25MB
    if len(file_bytes) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Tamanho de arquivo excede o limite máximo permitido (25MB).")

    sec_id = uuid.UUID(sector_id) if sector_id else None
    doc_id = uuid.uuid4()
    
    doc = {
        "id": doc_id,
        "user_id": current_user.id,
        "sector_id": sec_id,
        "file_name": file.filename or "documento_sem_nome",
        "file_size": len(file_bytes),
        "mime_type": file.content_type or "application/octet-stream",
        "status": DocumentStatus.PENDING_PROCESSING,
        "suggested_sector_id": None,
        "confidence_score": 0.0,
        "version": 1,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    _get_user_docs(current_user.id).append(doc)
    _get_user_files(current_user.id)[doc_id] = file_bytes
    
    # Enfileira processamento assíncrono real
    enqueue_document_job(
        document_id=doc_id,
        user_id=current_user.id,
        file_name=doc["file_name"],
        mime_type=doc["mime_type"],
        file_bytes=file_bytes
    )
    
    return doc


@router.get("/{document_id}/download")
def download_document(
    document_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    user_docs = _get_user_docs(current_user.id)
    target_doc = next((d for d in user_docs if d["id"] == document_id), None)
    
    if not target_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento não encontrado ou acesso não autorizado."
        )
        
    file_bytes = _get_user_files(current_user.id).get(document_id)
    if not file_bytes:
        raise HTTPException(status_code=404, detail="Conteúdo do arquivo não localizado.")

    return Response(
        content=file_bytes,
        media_type=target_doc["mime_type"],
        headers={
            "Content-Disposition": f'attachment; filename="{target_doc["file_name"]}"'
        }
    )


@router.patch("/{document_id}/sector", response_model=DocumentResponse)
def update_document_sector(
    document_id: uuid.UUID,
    body: DocumentUpdateSector,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    user_docs = _get_user_docs(current_user.id)
    for d in user_docs:
        if d["id"] == document_id:
            d["sector_id"] = body.sector_id
            d["status"] = DocumentStatus.READY
            d["updated_at"] = datetime.now()
            return d
            
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Documento não encontrado ou acesso não autorizado."
    )


@router.post("/process-jobs", status_code=status.HTTP_200_OK)
def trigger_process_jobs(
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Executa o ciclo do worker assíncrono para os jobs pendentes,
    atualizando honestamente o status, score de confiança e setor sugerido de cada documento.
    """
    processed_count = 0
    while True:
        job = process_next_job()
        if not job:
            break
        processed_count += 1
        
        user_id = job["user_id"]
        doc_id = job["document_id"]
        result = job.get("result", {})
        
        user_docs = _get_user_docs(user_id)
        user_sectors = _get_user_sectors(user_id)
        
        target_doc = next((d for d in user_docs if d["id"] == doc_id), None)
        if target_doc and result:
            target_doc["status"] = result.get("document_status", DocumentStatus.REVIEW_REQUIRED)
            target_doc["confidence_score"] = result.get("confidence_score", 0.0)
            
            suggested_name = result.get("suggested_sector")
            if suggested_name:
                matched_sec = next((s for s in user_sectors if s["name"].lower() == suggested_name.lower()), None)
                if matched_sec:
                    target_doc["suggested_sector_id"] = matched_sec["id"]
                    if target_doc["sector_id"] is None and target_doc["status"] == DocumentStatus.READY:
                        target_doc["sector_id"] = matched_sec["id"]
            
            target_doc["updated_at"] = datetime.now()

    return {
        "status": "success",
        "processed_jobs": processed_count,
        "message": f"{processed_count} jobs processados pelo worker."
    }

