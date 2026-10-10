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
