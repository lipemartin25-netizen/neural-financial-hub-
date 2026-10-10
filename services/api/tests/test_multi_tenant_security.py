import pytest
import uuid
import jwt
from fastapi.testclient import TestClient
from app.main import app
from app.auth.deps import JWT_SECRET, JWT_ALGORITHM

client = TestClient(app)

def create_test_token(user_id: uuid.UUID, email: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

USER_A_ID = uuid.uuid4()
USER_B_ID = uuid.uuid4()

TOKEN_A = create_test_token(USER_A_ID, "usuario.a@neurafin.com")
TOKEN_B = create_test_token(USER_B_ID, "usuario.b@neurafin.com")

AUTH_HEADER_A = {"Authorization": f"Bearer {TOKEN_A}"}
AUTH_HEADER_B = {"Authorization": f"Bearer {TOKEN_B}"}

def test_unauthenticated_requests_are_rejected():
    """Garante que requisições anônimas são rigorosamente negadas com 401."""
    res_sectors = client.get("/api/v1/documents/sectors")
    assert res_sectors.status_code == 401

    res_docs = client.get("/api/v1/documents")
    assert res_docs.status_code == 401

    res_upload = client.post(
        "/api/v1/documents/upload",
        files={"file": ("doc.txt", b"conteudo", "text/plain")}
    )
    assert res_upload.status_code == 401

def test_user_can_access_own_sectors():
    """Garante que o Usuário A acessa seus setores normalmente."""
    res = client.get("/api/v1/documents/sectors", headers=AUTH_HEADER_A)
    assert res.status_code == 200
    sectors = res.json()
    assert len(sectors) >= 5

def test_cross_tenant_document_isolation():
    """
    TESTE DE SEGURANÇA MULTI-TENANT:
    1. Usuário A faz upload de um documento confidencial.
    2. Usuário B lista seus documentos: NÃO pode ver o documento do Usuário A.
    3. Usuário B tenta baixar o documento do Usuário A: DEVE ser negado (404/403).
    4. Usuário B tenta alterar o setor do documento do Usuário A: DEVE ser negado (404).
    5. Usuário A faz o download com sucesso de seu próprio documento original.
    """
    # 1. Usuário A envia documento
    file_content = b"DADOS FINANCEIROS CONFIDENCIAIS DO USUARIO A"
    upload_res = client.post(
        "/api/v1/documents/upload",
        headers=AUTH_HEADER_A,
        files={"file": ("extrato_sigiloso.txt", file_content, "text/plain")}
    )
    assert upload_res.status_code == 202
    doc_a = upload_res.json()
    doc_a_id = doc_a["id"]
    assert doc_a["user_id"] == str(USER_A_ID)

    # 2. Usuário B lista documentos (deve vir vazio para B)
    list_b_res = client.get("/api/v1/documents", headers=AUTH_HEADER_B)
    assert list_b_res.status_code == 200
    docs_b = list_b_res.json()
    assert all(d["id"] != doc_a_id for d in docs_b)

    # 3. Usuário B tenta baixar o arquivo do Usuário A usando o ID direto
    hack_res = client.get(f"/api/v1/documents/{doc_a_id}/download", headers=AUTH_HEADER_B)
    assert hack_res.status_code == 404, "Acesso cruzado detectado! Usuário B não pode acessar arquivo de A."

    # 4. Usuário B tenta alterar o setor do documento do Usuário A
    hack_patch = client.patch(
        f"/api/v1/documents/{doc_a_id}/sector",
        headers=AUTH_HEADER_B,
        json={"sector_id": str(uuid.uuid4())}
    )
    assert hack_patch.status_code == 404, "Usuário B conseguiu modificar documento de A!"

    # 5. Usuário A faz o download legítimo de seu próprio documento
    legit_dl = client.get(f"/api/v1/documents/{doc_a_id}/download", headers=AUTH_HEADER_A)
    assert legit_dl.status_code == 200
    assert legit_dl.content == file_content
