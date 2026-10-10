import re
import pytest
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid

# Validar se o Pydantic schemas compila limpo sem warnings
from app.schemas import (
    SectorResponse, SectorCreate,
    DocumentResponse, DocumentDetailResponse, DocumentStatus,
    ManualAccountResponse, TransactionResponse
)

def test_pydantic_schema_serialization():
    doc_id = uuid.uuid4()
    user_id = uuid.uuid4()
    
    doc = DocumentResponse(
        id=doc_id,
        user_id=user_id,
        sector_id=None,
        file_name="comprovante_pix.pdf",
        file_size=2048,
        mime_type="application/pdf",
        status=DocumentStatus.RECEIVED,
        suggested_sector_id=None,
        confidence_score=0.95,
        version=1,
        created_at="2026-10-09T20:00:00",
        updated_at="2026-10-09T20:00:00"
    )
    assert doc.file_name == "comprovante_pix.pdf"
    assert doc.status == DocumentStatus.RECEIVED
    assert doc.confidence_score == 0.95
