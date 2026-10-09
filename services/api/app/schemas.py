from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

# --- Enum de Estados do Documento ---
class DocumentStatus(str, Enum):
    RECEIVED = "received"
    PENDING_PROCESSING = "pending_processing"
    PROCESSING = "processing"
    READY = "ready"
    REVIEW_REQUIRED = "review_required"
    READ_UNAVAILABLE = "read_unavailable"
    ERROR = "error"
    PENDING_SYNC = "pending_sync"

# --- Setores ---
class SectorBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(default="#10b981")
    is_default: bool = False

class SectorCreate(SectorBase):
    pass

class SectorResponse(SectorBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Documentos ---
class DocumentResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    sector_id: Optional[uuid.UUID] = None
    file_name: str
    file_size: int
    mime_type: str
    status: DocumentStatus
    suggested_sector_id: Optional[uuid.UUID] = None
    confidence_score: float = 0.0
    version: int = 1
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentDetailResponse(DocumentResponse):
    raw_text: Optional[str] = None
    structured_data: Optional[Dict[str, Any]] = None
    suggested_financial_data: Optional[Dict[str, Any]] = None
    tags: List[str] = []

class DocumentUpdateSector(BaseModel):
    sector_id: uuid.UUID

# --- Finanças Manuais (Sem Open Banking) ---
class AccountType(str, Enum):
    CHECKING = "checking"
    SAVINGS = "savings"
    WALLET = "wallet"
    INVESTMENT = "investment"
    OTHER = "other"

class ManualAccountCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: AccountType = AccountType.CHECKING
    balance: float = 0.0
    color: str = "#10b981"

class ManualAccountResponse(ManualAccountCreate):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"

class TransactionCreate(BaseModel):
    account_id: uuid.UUID
    category_id: Optional[uuid.UUID] = None
    document_id: Optional[uuid.UUID] = None -- Anexo documental opcional
    type: TransactionType
    amount: float = Field(..., gt=0)
    description: str = Field(..., min_length=1, max_length=255)
    date: str -- YYYY-MM-DD
    is_confirmed_by_user: bool = True

class TransactionResponse(TransactionCreate):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

# --- Sincronização Offline Idempotente ---
class SyncOperationItem(BaseModel):
    client_operation_id: str
    entity_name: str
    entity_id: str
    operation_type: str
    payload: Dict[str, Any]
    client_timestamp: datetime

class SyncBatchRequest(BaseModel):
    operations: List[SyncOperationItem]

class SyncBatchResponse(BaseModel):
    processed_ids: List[str]
    failed_ids: List[Dict[str, str]]
    server_time: datetime
