from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
import uuid
from datetime import datetime, timezone, timedelta
import jwt

from app.auth.deps import JWT_SECRET, JWT_ALGORITHM

router = APIRouter(prefix="/auth", tags=["Autenticação"])

class TokenRequest(BaseModel):
    email: str
    user_id: str | None = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str

# Mapeamento determinístico de usuários padrão de demonstração para facilitar testes e isolamento
DEMO_USERS = {
    "usuario.a@neurafin.com": "a0000000-0000-0000-0000-000000000001",
    "usuario.b@neurafin.com": "b0000000-0000-0000-0000-000000000002",
}

@router.post("/token", response_model=TokenResponse)
def generate_token(req: TokenRequest):
    """
    Gera token JWT assinado para autenticação nas APIs do Neurafin Hub.
    Permite autenticação com usuários pré-definidos de teste ou novos usuários.
    """
    email_clean = req.email.strip().lower()
    if not email_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email é obrigatório."
        )

    if req.user_id:
        try:
            uid = str(uuid.UUID(req.user_id))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de user_id inválido. Deve ser um UUID."
            )
    elif email_clean in DEMO_USERS:
        uid = DEMO_USERS[email_clean]
    else:
        # Gera UUID v5 baseado no email para consistência
        uid = str(uuid.uuid5(uuid.NAMESPACE_DNS, email_clean))

    payload = {
        "sub": uid,
        "email": email_clean,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }

    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=uid,
        email=email_clean
    )
