import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime

from services.worker.extractors.file_extractor import extract_text_from_file
from services.worker.classification.rules_engine import classify_text
from services.api.app.schemas import DocumentStatus

# Fila assíncrona persistida de jobs
PROCESSING_JOBS_QUEUE: List[Dict[str, Any]] = []

def enqueue_document_job(document_id: uuid.UUID, user_id: uuid.UUID, file_name: str, mime_type: str, file_bytes: bytes) -> str:
    """Registra e enfileira um novo job na fila de processamento assíncrono."""
    job_id = str(uuid.uuid4())
    job = {
        "id": job_id,
        "document_id": document_id,
        "user_id": user_id,
        "file_name": file_name,
        "mime_type": mime_type,
        "file_bytes": file_bytes,
        "status": "queued",
        "attempts": 0,
        "created_at": datetime.now(),
        "result": None,
        "error": None
    }
    PROCESSING_JOBS_QUEUE.append(job)
    return job_id

def process_next_job() -> Optional[Dict[str, Any]]:
    """
    Worker que consome a fila:
    1. Executa extração de texto conforme o formato real.
    2. Aplica motor de classificação baseado em regras e confiança.
    3. Trata falhas parciais (arquivos protegidos, corrompidos ou sem texto).
    """
    pending = [j for j in PROCESSING_JOBS_QUEUE if j["status"] == "queued"]
    if not pending:
        return None

    job = pending[0]
    job["status"] = "running"
    job["attempts"] += 1

    try:
        success, text, explanatory_msg = extract_text_from_file(
            job["file_bytes"],
            job["file_name"],
            job["mime_type"]
        )

        if not success:
            # Arquivo não pôde ser lido (ex: senha, corrompido, não suportado)
            job["status"] = "failed"
            job["error"] = explanatory_msg
            job["result"] = {
                "document_status": DocumentStatus.READ_UNAVAILABLE,
                "suggested_sector": "Revisar",
                "confidence_score": 0.0,
                "extracted_text": "",
                "notes": explanatory_msg
            }
            return job

        # Extração bem-sucedida: executar classificação inteligente
        if text and len(text.strip()) > 0:
            suggested_sector, confidence = classify_text(text)
            doc_status = DocumentStatus.READY if confidence >= 0.60 else DocumentStatus.REVIEW_REQUIRED
        else:
            suggested_sector = "Revisar"
            confidence = 0.0
            doc_status = DocumentStatus.REVIEW_REQUIRED

        job["status"] = "completed"
        job["result"] = {
            "document_status": doc_status,
            "suggested_sector": suggested_sector,
            "confidence_score": confidence,
            "extracted_text": text,
            "notes": explanatory_msg
        }
        return job

    except Exception as e:
        job["status"] = "failed"
        job["error"] = str(e)
        job["result"] = {
            "document_status": DocumentStatus.ERROR,
            "suggested_sector": "Revisar",
            "confidence_score": 0.0,
            "extracted_text": "",
            "notes": f"Falha interna no processamento: {str(e)}"
        }
        return job
