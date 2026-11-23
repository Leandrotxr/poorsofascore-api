"""Hash de senha (Argon2) e tokens de acesso (JWT assinado com HS256)."""

from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash

from app.core.config import get_settings

_hash = PasswordHash.recommended()  # Argon2id
ALGORITMO = "HS256"

# Hash de uma senha qualquer: usado para gastar o mesmo tempo quando o e-mail não existe,
# assim o tempo de resposta do login não revela quais e-mails estão cadastrados.
HASH_FALSO = _hash.hash("senha-que-nao-existe")


def gerar_hash(senha: str) -> str:
    return _hash.hash(senha)


def conferir_senha(senha: str, senha_hash: str) -> bool:
    return _hash.verify(senha, senha_hash)


def criar_token(usuario_id: int) -> tuple[str, int]:
    """Devolve o token e quantos segundos ele vale."""
    cfg = get_settings()
    duracao = timedelta(minutes=cfg.token_expira_minutos)
    agora = datetime.now(UTC)
    token = jwt.encode({"sub": str(usuario_id), "iat": agora, "exp": agora + duracao}, cfg.secret_key, ALGORITMO)
    return token, int(duracao.total_seconds())


def ler_token(token: str) -> int | None:
    """Id do usuário dono do token, ou None se o token for inválido ou estiver vencido."""
    try:
        dados = jwt.decode(
            token, get_settings().secret_key, algorithms=[ALGORITMO], options={"require": ["exp", "sub"]}
        )
        return int(dados["sub"])
    except (jwt.PyJWTError, ValueError):
        return None
