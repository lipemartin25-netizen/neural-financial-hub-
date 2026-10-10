import pytest
import uuid
import jwt
from fastapi.testclient import TestClient
from app.main import app
from app.auth.deps import JWT_SECRET, JWT_ALGORITHM

client = TestClient(app)

DEFAULT_USER_ID = uuid.uuid4()
DEFAULT_TOKEN = jwt.encode({"sub": str(DEFAULT_USER_ID), "email": "dev@neurafin.com"}, JWT_SECRET, algorithm=JWT_ALGORITHM)
DEFAULT_AUTH_HEADER = {"Authorization": f"Bearer {DEFAULT_TOKEN}"}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "neurafin-api"
    assert data["version"] == "1.0.0"

def test_system_status():
    response = client.get("/api/v1/system/status")
    assert response.status_code == 200
    data = response.json()
    assert data["online"] is True
    assert "Fase" in data["phase"]

def test_list_sectors_authenticated():
    response = client.get("/api/v1/documents/sectors", headers=DEFAULT_AUTH_HEADER)
    assert response.status_code == 200
    sectors = response.json()
    assert len(sectors) >= 5
    sector_names = [s["name"] for s in sectors]
    assert "Financeiro" in sector_names
    assert "Comprovantes" in sector_names
    assert "Revisar" in sector_names

def test_upload_document_flow_authenticated():
    file_payload = {"file": ("extrato_bancario.txt", b"Extrato de conta corrente banco pix transferencia", "text/plain")}
    response = client.post("/api/v1/documents/upload", headers=DEFAULT_AUTH_HEADER, files=file_payload)
    assert response.status_code == 202
    data = response.json()
    assert data["file_name"] == "extrato_bancario.txt"
    assert data["status"] == "pending_processing"
    assert data["user_id"] == str(DEFAULT_USER_ID)

def test_auth_generate_token():
    payload = {"email": "novo.usuario@neurafin.com"}
    response = client.post("/api/v1/auth/token", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["email"] == "novo.usuario@neurafin.com"
    assert "user_id" in data

def test_process_jobs_updates_document():
    # 1. Faz upload de documento
    file_payload = {"file": ("recibo_consulta.txt", b"Consulta medica e receita clinica Saude doutor CRM", "text/plain")}
    res_up = client.post("/api/v1/documents/upload", headers=DEFAULT_AUTH_HEADER, files=file_payload)
    assert res_up.status_code == 202
    doc_id = res_up.json()["id"]

    # 2. Executa processamento
    res_job = client.post("/api/v1/documents/process-jobs", headers=DEFAULT_AUTH_HEADER)
    assert res_job.status_code == 200
    assert res_job.json()["processed_jobs"] >= 1

    # 3. Lista documentos e verifica se o status foi atualizado
    res_list = client.get("/api/v1/documents", headers=DEFAULT_AUTH_HEADER)
    assert res_list.status_code == 200
    docs = res_list.json()
    doc = next(d for d in docs if d["id"] == doc_id)
    assert doc["status"] == "ready"
    assert doc["confidence_score"] >= 0.60
    assert doc["suggested_sector_id"] is not None

