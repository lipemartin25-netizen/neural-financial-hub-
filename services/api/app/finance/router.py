from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from typing import List, Optional, Dict
import uuid
from datetime import datetime

from app.auth.deps import get_current_user, AuthenticatedUser
from app.schemas import (
    ManualAccountCreate, ManualAccountResponse,
    CategoryCreate, CategoryResponse,
    BudgetCreate, BudgetResponse,
    TransactionCreate, TransactionResponse, TransactionType,
    TransactionSuggestionResponse, SuggestionStatus, ApproveSuggestionRequest,
    FinancialSummaryResponse
)
from app.documents.router import _get_user_docs
from app.finance.extraction import extract_receipt_suggestion
from app.finance.reports import (
    generate_csv_report, generate_excel_report, generate_pdf_report
)

router = APIRouter(prefix="/finance", tags=["Finanças Manuais & Relatórios"])

# Armazenamento em memória isolado por tenant (user_id)
USER_ACCOUNTS: Dict[uuid.UUID, List[dict]] = {}
USER_CATEGORIES: Dict[uuid.UUID, List[dict]] = {}
USER_BUDGETS: Dict[uuid.UUID, List[dict]] = {}
USER_TRANSACTIONS: Dict[uuid.UUID, List[dict]] = {}
USER_SUGGESTIONS: Dict[uuid.UUID, List[dict]] = {}

DEFAULT_CATEGORY_NAMES = [
    ("Alimentação", "#10b981"),
    ("Moradia", "#3b82f6"),
    ("Transporte", "#f59e0b"),
    ("Saúde", "#ec4899"),
    ("Lazer", "#8b5cf6"),
    ("Salário", "#059669"),
    ("Serviços", "#64748b"),
    ("Outros", "#94a3b8")
]

def _get_user_accounts(user_id: uuid.UUID) -> List[dict]:
    if user_id not in USER_ACCOUNTS:
        USER_ACCOUNTS[user_id] = [
            {
                "id": uuid.uuid4(),
                "user_id": user_id,
                "name": "Conta Corrente Principal",
                "type": "checking",
                "balance": 1500.0,
                "color": "#10b981",
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
        ]
    return USER_ACCOUNTS[user_id]

def _get_user_categories(user_id: uuid.UUID) -> List[dict]:
    if user_id not in USER_CATEGORIES:
        USER_CATEGORIES[user_id] = [
            {
                "id": uuid.uuid4(),
                "user_id": user_id,
                "name": name,
                "color": color,
                "icon": None,
                "created_at": datetime.now()
            }
            for name, color in DEFAULT_CATEGORY_NAMES
        ]
    return USER_CATEGORIES[user_id]

def _get_user_budgets(user_id: uuid.UUID) -> List[dict]:
    if user_id not in USER_BUDGETS:
        USER_BUDGETS[user_id] = []
    return USER_BUDGETS[user_id]

def _get_user_transactions(user_id: uuid.UUID) -> List[dict]:
    if user_id not in USER_TRANSACTIONS:
        USER_TRANSACTIONS[user_id] = []
    return USER_TRANSACTIONS[user_id]

def _get_user_suggestions(user_id: uuid.UUID) -> List[dict]:
    if user_id not in USER_SUGGESTIONS:
        USER_SUGGESTIONS[user_id] = []
    return USER_SUGGESTIONS[user_id]


# ============================================================
# Contas Manuais
# ============================================================

@router.get("/accounts", response_model=List[ManualAccountResponse])
def list_accounts(current_user: AuthenticatedUser = Depends(get_current_user)):
    return _get_user_accounts(current_user.id)

@router.post("/accounts", response_model=ManualAccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(body: ManualAccountCreate, current_user: AuthenticatedUser = Depends(get_current_user)):
    accounts = _get_user_accounts(current_user.id)
    acc = {
        "id": uuid.uuid4(),
        "user_id": current_user.id,
        "name": body.name,
        "type": body.type.value,
        "balance": float(body.balance),
        "color": body.color,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    accounts.append(acc)
    return acc

@router.delete("/accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(account_id: uuid.UUID, current_user: AuthenticatedUser = Depends(get_current_user)):
    accounts = _get_user_accounts(current_user.id)
    target = next((a for a in accounts if a["id"] == account_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Conta não encontrada ou acesso negado.")
    accounts.remove(target)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ============================================================
# Categorias
# ============================================================

@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(current_user: AuthenticatedUser = Depends(get_current_user)):
    return _get_user_categories(current_user.id)

@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(body: CategoryCreate, current_user: AuthenticatedUser = Depends(get_current_user)):
    categories = _get_user_categories(current_user.id)
    cat = {
        "id": uuid.uuid4(),
        "user_id": current_user.id,
        "name": body.name,
        "color": body.color,
        "icon": body.icon,
        "created_at": datetime.now()
    }
    categories.append(cat)
    return cat


# ============================================================
# Orçamentos com Acompanhamento Real de Consumo
# ============================================================

@router.get("/budgets", response_model=List[BudgetResponse])
def list_budgets(month: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$"), current_user: AuthenticatedUser = Depends(get_current_user)):
    budgets = _get_user_budgets(current_user.id)
    transactions = _get_user_transactions(current_user.id)
    
    current_month = month or datetime.now().strftime("%Y-%m")
    active_budgets = [b for b in budgets if b["month"] == current_month]

    results = []
    for b in active_budgets:
        # Soma despesas ocorridas no mesmo mês e categoria
        cat_id = b["category_id"]
        spent = sum(
            float(t["amount"]) for t in transactions
            if t["type"] == "expense"
            and t.get("category_id") == cat_id
            and t["date"].startswith(current_month)
        )
        pct = (spent / b["limit_amount"]) * 100 if b["limit_amount"] > 0 else 0.0
        results.append({
            **b,
            "spent_amount": round(spent, 2),
            "percentage_spent": round(pct, 1)
        })
    return results

@router.post("/budgets", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_budget(body: BudgetCreate, current_user: AuthenticatedUser = Depends(get_current_user)):
    budgets = _get_user_budgets(current_user.id)
    existing = next((b for b in budgets if b["category_id"] == body.category_id and b["month"] == body.month), None)
    
    if existing:
        existing["limit_amount"] = body.limit_amount
        budget_obj = existing
    else:
        budget_obj = {
            "id": uuid.uuid4(),
            "user_id": current_user.id,
            "category_id": body.category_id,
            "month": body.month,
            "limit_amount": body.limit_amount,
            "created_at": datetime.now()
        }
        budgets.append(budget_obj)

    # Recalcula gasto
    transactions = _get_user_transactions(current_user.id)
    spent = sum(
        float(t["amount"]) for t in transactions
        if t["type"] == "expense"
        and t.get("category_id") == body.category_id
        and t["date"].startswith(body.month)
    )
    pct = (spent / body.limit_amount) * 100 if body.limit_amount > 0 else 0.0
    return {
        **budget_obj,
        "spent_amount": round(spent, 2),
        "percentage_spent": round(pct, 1)
    }


# ============================================================
# Lançamentos Manuais / Transações
# ============================================================

@router.get("/transactions", response_model=List[TransactionResponse])
def list_transactions(
    account_id: Optional[uuid.UUID] = None,
    category_id: Optional[uuid.UUID] = None,
    type: Optional[TransactionType] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    txs = _get_user_transactions(current_user.id)
    filtered = txs
    if account_id:
        filtered = [t for t in filtered if t["account_id"] == account_id]
    if category_id:
        filtered = [t for t in filtered if t.get("category_id") == category_id]
    if type:
        filtered = [t for t in filtered if t["type"] == type.value]
    if start_date:
        filtered = [t for t in filtered if t["date"] >= start_date]
    if end_date:
        filtered = [t for t in filtered if t["date"] <= end_date]
    
    # Ordenar por data decrescente
    return sorted(filtered, key=lambda t: t["date"], reverse=True)

@router.post("/transactions", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(body: TransactionCreate, current_user: AuthenticatedUser = Depends(get_current_user)):
    accounts = _get_user_accounts(current_user.id)
    account = next((a for a in accounts if a["id"] == body.account_id), None)
    if not account:
        raise HTTPException(status_code=400, detail="Conta informada não existe para este usuário.")

    tx = {
        "id": uuid.uuid4(),
        "user_id": current_user.id,
        "account_id": body.account_id,
        "category_id": body.category_id,
        "document_id": body.document_id,
        "type": body.type.value,
        "amount": float(body.amount),
        "description": body.description,
        "date": body.date,
        "is_confirmed_by_user": body.is_confirmed_by_user,
        "created_at": datetime.now()
    }

    # Atualiza saldo da conta correspondente
    if body.type == TransactionType.INCOME:
        account["balance"] += body.amount
    elif body.type == TransactionType.EXPENSE:
        account["balance"] -= body.amount
    account["updated_at"] = datetime.now()

    _get_user_transactions(current_user.id).append(tx)
    return tx

@router.delete("/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(transaction_id: uuid.UUID, current_user: AuthenticatedUser = Depends(get_current_user)):
    txs = _get_user_transactions(current_user.id)
    tx = next((t for t in txs if t["id"] == transaction_id), None)
    if not tx:
        raise HTTPException(status_code=404, detail="Transação não encontrada ou acesso negado.")

    # Reverte o impacto no saldo da conta
    accounts = _get_user_accounts(current_user.id)
    account = next((a for a in accounts if a["id"] == tx["account_id"]), None)
    if account:
        if tx["type"] == "income":
            account["balance"] -= tx["amount"]
        elif tx["type"] == "expense":
            account["balance"] += tx["amount"]
        account["updated_at"] = datetime.now()

    txs.remove(tx)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ============================================================
# Sugestões de Comprovantes (Revisão Obrigatória / Sem Auto-lançamento)
# ============================================================

@router.post("/suggestions/from-document/{document_id}", response_model=TransactionSuggestionResponse, status_code=status.HTTP_201_CREATED)
def generate_suggestion_from_document(
    document_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Extrai sugestões financeiras a partir do texto de um documento do cofre privado.
    IMPORTANTE: Este método NÃO cria transações nem afeta o saldo bancário.
    Cria unicamente uma sugestão pendente para revisão humana explícita.
    """
    user_docs = _get_user_docs(current_user.id)
    doc = next((d for d in user_docs if d["id"] == document_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não localizado no cofre privado.")

    extracted = extract_receipt_suggestion(
        text=doc.get("raw_text", ""),
        file_name=doc.get("file_name", "")
    )

    # Identifica ID de categoria compatível
    categories = _get_user_categories(current_user.id)
    matched_cat = next(
        (c for c in categories if c["name"].lower() == extracted["suggested_category_name"].lower()),
        None
    )

    suggestion = {
        "id": uuid.uuid4(),
        "user_id": current_user.id,
        "document_id": document_id,
        "suggested_type": extracted["suggested_type"],
        "suggested_amount": extracted["suggested_amount"],
        "suggested_description": extracted["suggested_description"],
        "suggested_date": extracted["suggested_date"],
        "suggested_category_id": matched_cat["id"] if matched_cat else None,
        "confidence_score": extracted["confidence_score"],
        "status": SuggestionStatus.PENDING_REVIEW.value,
        "created_at": datetime.now()
    }

    _get_user_suggestions(current_user.id).append(suggestion)
    return suggestion

@router.get("/suggestions", response_model=List[TransactionSuggestionResponse])
def list_pending_suggestions(current_user: AuthenticatedUser = Depends(get_current_user)):
    suggestions = _get_user_suggestions(current_user.id)
    return [s for s in suggestions if s["status"] == SuggestionStatus.PENDING_REVIEW.value]

@router.post("/suggestions/{suggestion_id}/approve", response_model=TransactionResponse)
def approve_suggestion(
    suggestion_id: uuid.UUID,
    body: ApproveSuggestionRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Aprova explicitamente uma sugestão após conferência do usuário.
    Apenas nesta ação a transação é criada e o saldo da conta é afetado.
    """
    suggestions = _get_user_suggestions(current_user.id)
    suggestion = next((s for s in suggestions if s["id"] == suggestion_id), None)
    if not suggestion:
        raise HTTPException(status_code=404, detail="Sugestão não encontrada.")
    if suggestion["status"] != SuggestionStatus.PENDING_REVIEW.value:
        raise HTTPException(status_code=400, detail="Esta sugestão já foi revisada e finalizada.")

    # Valida conta
    accounts = _get_user_accounts(current_user.id)
    account = next((a for a in accounts if a["id"] == body.account_id), None)
    if not account:
        raise HTTPException(status_code=400, detail="Conta informada é inválida.")

    # Cria transação com overrides do usuário se informados
    amount = body.amount if body.amount is not None else suggestion["suggested_amount"]
    description = body.description if body.description is not None else suggestion["suggested_description"]
    date_str = body.date if body.date is not None else suggestion["suggested_date"]
    category_id = body.category_id or suggestion["suggested_category_id"]

    tx = {
        "id": uuid.uuid4(),
        "user_id": current_user.id,
        "account_id": body.account_id,
        "category_id": category_id,
        "document_id": suggestion["document_id"],
        "type": suggestion["suggested_type"],
        "amount": float(amount),
        "description": description,
        "date": date_str,
        "is_confirmed_by_user": True,
        "created_at": datetime.now()
    }

    if suggestion["suggested_type"] == "income":
        account["balance"] += amount
    else:
        account["balance"] -= amount
    account["updated_at"] = datetime.now()

    _get_user_transactions(current_user.id).append(tx)
    suggestion["status"] = SuggestionStatus.APPROVED.value

    return tx

@router.post("/suggestions/{suggestion_id}/reject", status_code=status.HTTP_200_OK)
def reject_suggestion(
    suggestion_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    suggestions = _get_user_suggestions(current_user.id)
    suggestion = next((s for s in suggestions if s["id"] == suggestion_id), None)
    if not suggestion:
        raise HTTPException(status_code=404, detail="Sugestão não encontrada.")

    suggestion["status"] = SuggestionStatus.REJECTED.value
    return {"message": "Sugestão rejeitada com sucesso. Nenhum lançamento financeiro foi gerado."}


# ============================================================
# Resumo Financeiro Consolidado
# ============================================================

@router.get("/summary", response_model=FinancialSummaryResponse)
def get_financial_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    txs = _get_user_transactions(current_user.id)
    categories = {str(c["id"]): c["name"] for c in _get_user_categories(current_user.id)}

    filtered = txs
    if start_date:
        filtered = [t for t in filtered if t["date"] >= start_date]
    if end_date:
        filtered = [t for t in filtered if t["date"] <= end_date]

    total_income = sum(float(t["amount"]) for t in filtered if t["type"] == "income")
    total_expense = sum(float(t["amount"]) for t in filtered if t["type"] == "expense")
    net_balance = total_income - total_expense

    by_category: Dict[str, float] = {}
    for t in filtered:
        if t["type"] == "expense":
            c_name = categories.get(str(t.get("category_id")), "Outros")
            by_category[c_name] = round(by_category.get(c_name, 0.0) + float(t["amount"]), 2)

    return FinancialSummaryResponse(
        total_income=round(total_income, 2),
        total_expense=round(total_expense, 2),
        net_balance=round(net_balance, 2),
        transaction_count=len(filtered),
        by_category=by_category
    )


# ============================================================
# Geração e Exportação de Relatórios (CSV, Excel e PDF)
# ============================================================

@router.get("/reports/export")
def export_financial_report(
    format: str = Query("csv", pattern=r"^(csv|xlsx|pdf)$"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Gera relatório financeiro oficial consolidado:
    - csv: delimitado por ponto-e-vírgula com resumo.
    - xlsx: planilha Excel com fórmulas reais SUMIF e formatação contábil.
    - pdf: documento PDF institucional estilizado com selo de governança privada.
    """
    txs = _get_user_transactions(current_user.id)
    if start_date:
        txs = [t for t in txs if t["date"] >= start_date]
    if end_date:
        txs = [t for t in txs if t["date"] <= end_date]

    accounts_map = {str(a["id"]): a["name"] for a in _get_user_accounts(current_user.id)}
    categories_map = {str(c["id"]): c["name"] for c in _get_user_categories(current_user.id)}

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    if format == "csv":
        csv_content = generate_csv_report(txs, accounts_map, categories_map)
        return Response(
            content=csv_content.encode("utf-8-sig"),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="neurafin_relatorio_{timestamp}.csv"'}
        )

    elif format == "xlsx":
        xlsx_bytes = generate_excel_report(txs, accounts_map, categories_map)
        return Response(
            content=xlsx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="neurafin_relatorio_{timestamp}.xlsx"'}
        )

    elif format == "pdf":
        pdf_bytes = generate_pdf_report(txs, accounts_map, categories_map)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="neurafin_relatorio_{timestamp}.pdf"'}
        )
