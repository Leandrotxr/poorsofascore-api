from datetime import datetime

from pydantic import BaseModel, Field, model_validator

from app.models import EventoPartida, StatusPartida, TipoEvento
from app.schemas.resumos import ArbitroResumo, CampeonatoResumo, EquipeResumo, PessoaResumo
from app.schemas.saida import CONFIG_SAIDA

# ---------- Partida ----------


class PartidaCreate(BaseModel):
    campeonato_id: int
    rodada: int = Field(ge=1, description="Rodada (pontos corridos) ou fase (mata-mata)")
    mandante_id: int
    visitante_id: int
    data_hora: datetime | None = None
    local: str | None = Field(default=None, max_length=120)
    arbitro_id: int | None = Field(default=None, description="Árbitro central")

    @model_validator(mode="after")
    def _equipes_distintas(self):
        if self.mandante_id == self.visitante_id:
            raise ValueError("Mandante e visitante precisam ser equipes diferentes")
        return self


class PartidaUpdate(BaseModel):
    """PATCH: tudo opcional. As regras que dependem do banco (inscrição, eventos) ficam no service."""

    rodada: int | None = Field(default=None, ge=1)
    mandante_id: int | None = None
    visitante_id: int | None = None
    data_hora: datetime | None = None
    local: str | None = Field(default=None, max_length=120)
    arbitro_id: int | None = None
    status: StatusPartida | None = None


class PartidaOut(BaseModel):
    model_config = CONFIG_SAIDA
    id: int
    campeonato: CampeonatoResumo
    rodada: int
    data_hora: datetime | None
    local: str | None
    status: StatusPartida
    mandante: EquipeResumo
    visitante: EquipeResumo
    arbitro: ArbitroResumo | None
    gols_mandante: int = Field(description="Calculado a partir dos eventos de gol")
    gols_visitante: int


# ---------- Eventos ----------


class EventoCreate(BaseModel):
    tipo: TipoEvento
    minuto: int = Field(ge=0, le=EventoPartida.MINUTO_MAXIMO)
    jogador_id: int = Field(description="A equipe do evento é a equipe atual do jogador")


class EventoOut(BaseModel):
    model_config = CONFIG_SAIDA
    id: int
    tipo: TipoEvento
    minuto: int
    equipe: EquipeResumo
    jogador: PessoaResumo | None = Field(description="Vazio se o jogador foi excluído depois")


class PartidaDetalhe(PartidaOut):
    eventos: list[EventoOut]


# ---------- Estatísticas do campeonato ----------


class LinhaClassificacao(BaseModel):
    model_config = CONFIG_SAIDA
    posicao: int
    equipe: EquipeResumo
    pontos: int
    jogos: int
    vitorias: int
    empates: int
    derrotas: int
    gols_pro: int
    gols_contra: int
    saldo: int
    aproveitamento: float = Field(description="Percentual dos pontos possíveis (0 a 100)")


class Artilheiro(BaseModel):
    model_config = CONFIG_SAIDA
    jogador: PessoaResumo
    equipe: EquipeResumo
    gols: int
