from pydantic import BaseModel, Field, ConfigDict
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
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

# --- Documentos ---
class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
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

class DocumentDetailResponse(DocumentResponse):
    raw_text: Optional[str] = None
    structured_data: Optional[Dict[str, Any]] = None
    suggested_financial_data: Optional[Dict[str, Any]] = None
    tags: List[str] = []

class DocumentUpdateSector(BaseModel):
    sector_id: uuid.UUID

# --- Finanças Manuais (Sem Open Banking / Sem Pluggy) ---
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
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = "#64748b"
    icon: Optional[str] = None

class CategoryResponse(CategoryCreate):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

class BudgetCreate(BaseModel):
    category_id: uuid.UUID
    month: str = Field(..., pattern=r"^\d{4}-\d{2}$")  # YYYY-MM
    limit_amount: float = Field(..., gt=0)

class BudgetResponse(BudgetCreate):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    spent_amount: float = 0.0
    percentage_spent: float = 0.0
    created_at: datetime

class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"

class TransactionCreate(BaseModel):
    account_id: uuid.UUID
    category_id: Optional[uuid.UUID] = None
    document_id: Optional[uuid.UUID] = None  # Anexo documental opcional
    type: TransactionType
    amount: float = Field(..., gt=0)
    description: str = Field(..., min_length=1, max_length=255)
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")  # YYYY-MM-DD
    is_confirmed_by_user: bool = True

class TransactionResponse(TransactionCreate):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

# --- Sugestões de Comprovantes (Sem Auto-lançamento) ---
class SuggestionStatus(str, Enum):
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"

class TransactionSuggestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    document_id: uuid.UUID
    suggested_type: TransactionType
    suggested_amount: float
    suggested_description: str
    suggested_date: str
    suggested_category_id: Optional[uuid.UUID] = None
    confidence_score: float = 0.0
    status: SuggestionStatus = SuggestionStatus.PENDING_REVIEW
    created_at: datetime

class ApproveSuggestionRequest(BaseModel):
    account_id: uuid.UUID
    category_id: Optional[uuid.UUID] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[str] = None

class FinancialSummaryResponse(BaseModel):
    total_income: float
    total_expense: float
    net_balance: float
    transaction_count: int
    by_category: Dict[str, float]

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
