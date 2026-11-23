from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.deps import DbSession
from app.api.routes import arbitros, campeonatos, equipes, federacoes, jogadores, partidas, resumo, tecnicos
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="API de gerenciamento de federações, campeonatos, equipes, jogadores, técnicos e árbitros.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(federacoes.router)
app.include_router(campeonatos.router)
app.include_router(partidas.router)
app.include_router(equipes.router)
app.include_router(jogadores.router)
app.include_router(tecnicos.router)
app.include_router(arbitros.router)
app.include_router(resumo.router)


@app.get("/health", tags=["Infra"])
def health(db: DbSession):
    """Confere se a API está no ar e se o banco responde."""
    db.execute(text("SELECT 1"))
    return {"status": "ok"}
