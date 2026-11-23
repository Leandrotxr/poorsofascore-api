from pydantic import BaseModel, Field

from app.schemas.saida import CONFIG_SAIDA


class Pagina[T](BaseModel):
    """Envelope das listagens: os itens da página e o total com os filtros aplicados."""

    model_config = CONFIG_SAIDA

    items: list[T]
    total: int = Field(description="Quantos registros existem com os filtros aplicados (todas as páginas)")
    skip: int
    limit: int
