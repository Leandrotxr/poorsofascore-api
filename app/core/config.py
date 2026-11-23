from functools import lru_cache
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

CHAVE_DE_DESENVOLVIMENTO = "chave-de-desenvolvimento-insegura-troque-em-producao"


class Settings(BaseSettings):
    """Configurações lidas de variáveis de ambiente ou do arquivo .env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Poor SofaScore API"
    debug: bool = False
    ambiente: Literal["desenvolvimento", "producao"] = "desenvolvimento"
    database_url: str = "postgresql+psycopg://sofascore_app:troque_esta_senha@localhost:5432/poorsofascore"
    cors_origins: str = "http://localhost:5173"

    # Autenticação (JWT). Em produção a chave é obrigatória e precisa ser longa e aleatória:
    #   python -c "import secrets; print(secrets.token_urlsafe(48))"
    secret_key: str = CHAVE_DE_DESENVOLVIMENTO
    token_expira_minutos: int = 8 * 60

    @model_validator(mode="after")
    def _producao_segura(self):
        if self.ambiente == "producao" and (self.secret_key == CHAVE_DE_DESENVOLVIMENTO or len(self.secret_key) < 32):
            raise ValueError("Em produção defina SECRET_KEY com pelo menos 32 caracteres aleatórios")
        return self

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
