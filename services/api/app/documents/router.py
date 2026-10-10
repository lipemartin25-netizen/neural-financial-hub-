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

router = APIRouter(prefix="/documents", tags=["Documentos"])

# Repositório isolado por usuário em memória (preparado para multi-tenant real)
# Cada chave é o UUID do usuário; os dados de uma conta nunca se misturam com os de outra
USER_SECTORS: dict[uuid.UUID, list[dict]] = {}
USER_DOCUMENTS: dict[uuid.UUID, list[dict]] = {}
USER_FILES: dict[uuid.UUID, dict[uuid.UUID, bytes]] = {}

def _get_user_sectors(user_id: uuid.UUID) -> list[dict]:
    if user_id not in USER_SECTORS:
        # Inicializa com setores padrão se for o primeiro acesso da conta
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
    """Retorna os setores disponíveis exclusivamente para a conta autenticada."""
    return _get_user_sectors(current_user.id)


@router.post("/sectors", response_model=SectorResponse, status_code=status.HTTP_201_CREATED)
def create_sector(
    sector_in: SectorCreate,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Cria um setor personalizado no domínio exclusivo do usuário autenticado."""
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
    """Lista documentos privados da conta autenticada. Nenhuma outra conta tem visibilidade."""
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
    Ingestão privada e autenticada:
    1. Vincula estritamente ao user_id do token autenticado.
    2. Armazena bytes em cofre privado isolado por usuário.
    3. Nenhum link público permanente é gerado.
    """
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Arquivo vazio não é permitido.")

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
    
    return doc


@router.get("/{document_id}/download")
def download_document(
    document_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Entrega segura do arquivo original:
    Valida rigorosamente se o documento pertence ao usuário autenticado.
    Retorna 404/403 se qualquer outro usuário tentar fazer o download.
    """
    user_docs = _get_user_docs(current_user.id)
    target_doc = next((d for d in user_docs if d["id"] == document_id), None)
    
    if not target_doc:
        # Não encontrado na conta autenticada (evita enumerar existência de documentos de terceiros)
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
    """Permite ao usuário autenticado corrigir ou reclassificar o setor de seu próprio documento."""
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
