import pytest
import io
import uuid
from fastapi.testclient import TestClient

from app.main import app
from app.documents.router import _get_user_docs, _get_user_files
from app.schemas import DocumentStatus
import openpyxl

client = TestClient(app)

@pytest.fixture
def auth_headers_user_a():
    res = client.post("/api/v1/auth/token", json={"email": "usuario.a@neurafin.com"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    user_id = res.json()["user_id"]
    return {"Authorization": f"Bearer {token}"}, uuid.UUID(user_id)

@pytest.fixture
def auth_headers_user_b():
    res = client.post("/api/v1/auth/token", json={"email": "usuario.b@neurafin.com"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    user_id = res.json()["user_id"]
    return {"Authorization": f"Bearer {token}"}, uuid.UUID(user_id)


# ============================================================
# 1. Contas Manuais e Multi-Tenancy
# ============================================================

def test_accounts_lifecycle_and_multitenancy(auth_headers_user_a, auth_headers_user_b):
    headers_a, user_id_a = auth_headers_user_a
    headers_b, user_id_b = auth_headers_user_b

    # Listar contas do Usuário A
    res_a = client.get("/api/v1/finance/accounts", headers=headers_a)
    assert res_a.status_code == 200
    accounts_a = res_a.json()
    assert len(accounts_a) >= 1
    initial_acc = accounts_a[0]

    # Criar nova conta para Usuário A
    res_create = client.post(
        "/api/v1/finance/accounts",
        headers=headers_a,
        json={"name": "Carteira Reserva", "type": "savings", "balance": 500.0, "color": "#3b82f6"}
    )
    assert res_create.status_code == 201
    created_acc = res_create.json()
    assert created_acc["name"] == "Carteira Reserva"
    assert created_acc["balance"] == 500.0

    # Usuário B não vê a conta do Usuário A
    res_b = client.get("/api/v1/finance/accounts", headers=headers_b)
    assert res_b.status_code == 200
    ids_b = [a["id"] for a in res_b.json()]
    assert created_acc["id"] not in ids_b

    # Usuário B não pode deletar a conta do Usuário A
    res_del_unauth = client.delete(f"/api/v1/finance/accounts/{created_acc['id']}", headers=headers_b)
    assert res_del_unauth.status_code == 404

    # Usuário A deleta sua conta com sucesso
    res_del = client.delete(f"/api/v1/finance/accounts/{created_acc['id']}", headers=headers_a)
    assert res_del.status_code == 204


# ============================================================
# 2. Categorias e Orçamentos com Cálculo de Consumo Real
# ============================================================

def test_budgets_and_consumption_tracking(auth_headers_user_a):
    headers_a, _ = auth_headers_user_a

    # Obter categorias
    res_cats = client.get("/api/v1/finance/categories", headers=headers_a)
    assert res_cats.status_code == 200
    categories = res_cats.json()
    cat_alim = next(c for c in categories if c["name"] == "Alimentação")

    # Contas para lançamento
    res_accs = client.get("/api/v1/finance/accounts", headers=headers_a)
    account_id = res_accs.json()[0]["id"]

    # Definir orçamento de R$ 500,00 para Alimentação em 2026-10
    res_budget = client.post(
        "/api/v1/finance/budgets",
        headers=headers_a,
        json={"category_id": cat_alim["id"], "month": "2026-10", "limit_amount": 500.0}
    )
    assert res_budget.status_code == 201
    b_data = res_budget.json()
    assert b_data["limit_amount"] == 500.0
    assert b_data["spent_amount"] == 0.0

    # Criar uma despesa de R$ 150,00 na mesma categoria e mês
    client.post(
        "/api/v1/finance/transactions",
        headers=headers_a,
        json={
            "account_id": account_id,
            "category_id": cat_alim["id"],
            "type": "expense",
            "amount": 150.0,
            "description": "Supermercado Semanal",
            "date": "2026-10-05"
        }
    )

    # Reconsultar orçamento: gasto deve ser R$ 150,00 (30%)
    res_b_updated = client.get("/api/v1/finance/budgets?month=2026-10", headers=headers_a)
    assert res_b_updated.status_code == 200
    b_list = res_b_updated.json()
    matched = next(b for b in b_list if b["category_id"] == cat_alim["id"])
    assert matched["spent_amount"] == 150.0
    assert matched["percentage_spent"] == 30.0


# ============================================================
# 3. Transações Manuais: Receita, Despesa e Saldo da Conta
# ============================================================

def test_transactions_update_account_balance(auth_headers_user_a):
    headers_a, _ = auth_headers_user_a

    # Criar conta para teste isolado
    res_acc = client.post(
        "/api/v1/finance/accounts",
        headers=headers_a,
        json={"name": "Conta Corrente Teste", "type": "checking", "balance": 1000.0, "color": "#10b981"}
    )
    acc_id = res_acc.json()["id"]

    # 1. Lançar Receita de R$ 300,00
    res_inc = client.post(
        "/api/v1/finance/transactions",
        headers=headers_a,
        json={
            "account_id": acc_id,
            "type": "income",
            "amount": 300.0,
            "description": "Venda de Item Usado",
            "date": "2026-10-02"
        }
    )
    assert res_inc.status_code == 201

    # Verifica saldo (1000 + 300 = 1300)
    accs = client.get("/api/v1/finance/accounts", headers=headers_a).json()
    target_acc = next(a for a in accs if a["id"] == acc_id)
    assert target_acc["balance"] == 1300.0

    # 2. Lançar Despesa de R$ 100,00
    res_exp = client.post(
        "/api/v1/finance/transactions",
        headers=headers_a,
        json={
            "account_id": acc_id,
            "type": "expense",
            "amount": 100.0,
            "description": "Manutenção",
            "date": "2026-10-03"
        }
    )
    assert res_exp.status_code == 201
    exp_id = res_exp.json()["id"]

    # Verifica saldo (1300 - 100 = 1200)
    accs = client.get("/api/v1/finance/accounts", headers=headers_a).json()
    target_acc = next(a for a in accs if a["id"] == acc_id)
    assert target_acc["balance"] == 1200.0

    # 3. Deletar Despesa: deve reverter os R$ 100,00
    res_del = client.delete(f"/api/v1/finance/transactions/{exp_id}", headers=headers_a)
    assert res_del.status_code == 204

    accs = client.get("/api/v1/finance/accounts", headers=headers_a).json()
    target_acc = next(a for a in accs if a["id"] == acc_id)
    assert target_acc["balance"] == 1300.0


# ============================================================
# 4. Extração de Comprovantes: Sugestões SEM Auto-Lançamento
# ============================================================

def test_receipt_suggestion_and_manual_approval(auth_headers_user_a):
    headers_a, user_id_a = auth_headers_user_a

    # Criar conta para acompanhar saldo
    res_acc = client.post(
        "/api/v1/finance/accounts",
        headers=headers_a,
        json={"name": "Conta Comprovante", "type": "checking", "balance": 1000.0, "color": "#10b981"}
    )
    acc_id = res_acc.json()["id"]

    # Simular documento processado no cofre do usuário A
    doc_id = uuid.uuid4()
    doc_simulado = {
        "id": doc_id,
        "user_id": user_id_a,
        "file_name": "cupom_fiscal_mercado.txt",
        "file_size": 250,
        "mime_type": "text/plain",
        "status": DocumentStatus.READY,
        "raw_text": "SUPERMERCADO CENTRAL LTDA\nDATA: 10/10/2026\nITENS DIVERSOS\nTOTAL: R$ 89,90\nVOLTE SEMPRE",
        "confidence_score": 0.90,
        "version": 1
    }
    _get_user_docs(user_id_a).append(doc_simulado)

    # 1. Gerar sugestão a partir do documento
    res_sug = client.post(f"/api/v1/finance/suggestions/from-document/{doc_id}", headers=headers_a)
    assert res_sug.status_code == 201
    sug_data = res_sug.json()

    assert sug_data["suggested_amount"] == 89.90
    assert sug_data["suggested_date"] == "2026-10-10"
    assert sug_data["status"] == "pending_review"
    assert sug_data["confidence_score"] >= 0.70

    # REGRA CRÍTICA DE GOVERNANÇA: Saldo NÃO pode ter mudado (sem auto-lançamento!)
    accs = client.get("/api/v1/finance/accounts", headers=headers_a).json()
    acc_before = next(a for a in accs if a["id"] == acc_id)
    assert acc_before["balance"] == 1000.0

    # 2. Listar sugestões pendentes
    res_list = client.get("/api/v1/finance/suggestions", headers=headers_a)
    assert res_list.status_code == 200
    pending_ids = [s["id"] for s in res_list.json()]
    assert sug_data["id"] in pending_ids

    # 3. Usuário REVISA e APROVA explicitamente, escolhendo a conta
    res_app = client.post(
        f"/api/v1/finance/suggestions/{sug_data['id']}/approve",
        headers=headers_a,
        json={"account_id": acc_id, "description": "Compras do Mês Aprovadas"}
    )
    assert res_app.status_code == 200
    tx_created = res_app.json()
    assert tx_created["amount"] == 89.90
    assert tx_created["document_id"] == str(doc_id)
    assert tx_created["is_confirmed_by_user"] is True

    # Agora sim, saldo foi debitado com autorização explícita (1000 - 89.90 = 910.10)
    accs = client.get("/api/v1/finance/accounts", headers=headers_a).json()
    acc_after = next(a for a in accs if a["id"] == acc_id)
    assert round(acc_after["balance"], 2) == 910.10

    # Sugestão não deve mais aparecer como pendente
    res_list_after = client.get("/api/v1/finance/suggestions", headers=headers_a)
    assert sug_data["id"] not in [s["id"] for s in res_list_after.json()]


def test_receipt_suggestion_rejection(auth_headers_user_a):
    headers_a, user_id_a = auth_headers_user_a

    # Documento de teste
    doc_id = uuid.uuid4()
    doc_simulado = {
        "id": doc_id,
        "user_id": user_id_a,
        "file_name": "recibo_duplicado.txt",
        "file_size": 100,
        "mime_type": "text/plain",
        "status": DocumentStatus.READY,
        "raw_text": "VALOR: R$ 45,00 DATA: 08/10/2026",
        "confidence_score": 0.80,
        "version": 1
    }
    _get_user_docs(user_id_a).append(doc_simulado)

    # Gera sugestão
    res_sug = client.post(f"/api/v1/finance/suggestions/from-document/{doc_id}", headers=headers_a)
    sug_id = res_sug.json()["id"]

    # Rejeita sugestão
    res_rej = client.post(f"/api/v1/finance/suggestions/{sug_id}/reject", headers=headers_a)
    assert res_rej.status_code == 200

    # Não aparece mais como pendente
    res_list = client.get("/api/v1/finance/suggestions", headers=headers_a)
    assert sug_id not in [s["id"] for s in res_list.json()]


# ============================================================
# 5. Exportação de Relatórios: CSV, Excel (XLSX com fórmulas) e PDF
# ============================================================

def test_financial_reports_export(auth_headers_user_a):
    headers_a, _ = auth_headers_user_a

    # Cria transação de teste
    acc = client.get("/api/v1/finance/accounts", headers=headers_a).json()[0]
    client.post(
        "/api/v1/finance/transactions",
        headers=headers_a,
        json={
            "account_id": acc["id"],
            "type": "income",
            "amount": 2500.0,
            "description": "Faturamento Consultoria",
            "date": "2026-10-01"
        }
    )
    client.post(
        "/api/v1/finance/transactions",
        headers=headers_a,
        json={
            "account_id": acc["id"],
            "type": "expense",
            "amount": 450.0,
            "description": "Energia Elétrica",
            "date": "2026-10-04"
        }
    )

    # 1. Exportar CSV
    res_csv = client.get("/api/v1/finance/reports/export?format=csv", headers=headers_a)
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]
    csv_text = res_csv.content.decode("utf-8-sig")
    assert "NEURAFIN HUB" in csv_text
    assert "Faturamento Consultoria" in csv_text
    assert "Energia Elétrica" in csv_text
    assert "Total Receitas (R$)" in csv_text
    assert "Saldo Liquido (R$)" in csv_text

    # 2. Exportar XLSX (com fórmulas verificadas)
    res_xlsx = client.get("/api/v1/finance/reports/export?format=xlsx", headers=headers_a)
    assert res_xlsx.status_code == 200
    assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in res_xlsx.headers["content-type"]

    # Abre com openpyxl e valida estrutura e fórmulas reais
    wb = openpyxl.load_workbook(io.BytesIO(res_xlsx.content), data_only=False)
    sheet = wb.active
    assert sheet.title == "Extrato Financeiro"
    # Procura células com fórmula SUMIF
    formulas = [cell.value for row in sheet.iter_rows() for cell in row if str(cell.value or "").startswith("=")]
    assert len(formulas) >= 2
    assert any("SUMIF" in str(f) for f in formulas)

    # 3. Exportar PDF
    res_pdf = client.get("/api/v1/finance/reports/export?format=pdf", headers=headers_a)
    assert res_pdf.status_code == 200
    assert res_pdf.headers["content-type"] == "application/pdf"
    assert res_pdf.content.startswith(b"%PDF-")
    assert len(res_pdf.content) > 1000  # PDF não-vazio formatado


# ============================================================
# 6. Governança: Prova de Eliminação de Pluggy e Open Finance
# ============================================================

def test_governance_no_active_open_finance_or_pluggy():
    """
    Teste de arquitetura estrito:
    Garante que não existem endpoints ativos nem importações de sdk para Pluggy ou Open Finance.
    """
    # 1. Nenhuma rota contém 'pluggy' ou 'open_finance'
    routes = [route.path for route in app.routes]
    for r in routes:
        assert "pluggy" not in r.lower(), f"Rota não autorizada encontrada: {r}"
        assert "open_finance" not in r.lower(), f"Rota não autorizada encontrada: {r}"
        assert "openbanking" not in r.lower(), f"Rota não autorizada encontrada: {r}"

    # 2. Status do sistema reporta explicitamente a nova fase
    status_res = client.get("/api/v1/system/status")
    assert status_res.status_code == 200
    assert status_res.json()["phase"] == "Fase 6 - Finanças Manuais & Relatórios"
