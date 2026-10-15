import os
import uuid
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from pydantic import BaseModel

security_scheme = HTTPBearer(auto_error=False)

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
JWT_SECRET = os.getenv("JWT_SECRET")

# Em produção, JWT_SECRET é estritamente obrigatório
if not JWT_SECRET:
    if ENVIRONMENT in ["production", "prod"]:
        raise RuntimeError("FATAL: JWT_SECRET não configurado no ambiente de produção.")
    JWT_SECRET = "neurafin-dev-insecure-secret-key-change-me"

JWT_ALGORITHM = "HS256"

class AuthenticatedUser(BaseModel):
    id: uuid.UUID
    email: str

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> AuthenticatedUser:
    """
    Valida o Bearer Token emitido pelo provedor de autenticação (JWT).
    Rejeita requisições anônimas ou com tokens inválidos/expirados com 401 Unauthorized.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticação obrigatória. Token não fornecido.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token, 
            JWT_SECRET, 
            algorithms=[JWT_ALGORITHM],
            options={"require": ["sub"]}
        )
        user_id_str = payload.get("sub") or payload.get("user_id")
        email = payload.get("email", "")
        
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: identificador de usuário ausente.",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return AuthenticatedUser(
            id=uuid.UUID(str(user_id_str)),
            email=email
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.PyJWTError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido ou não autorizado: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
