# Importar todos os modelos aqui garante que o SQLAlchemy e o Alembic os enxerguem.
from app.models.competicao import (
    Campeonato,
    EventoPartida,
    FormatoCampeonato,
    Partida,
    StatusPartida,
    TipoEvento,
    campeonato_equipe,
)
from app.models.contratos import ContratoJogador, ContratoTecnico
from app.models.pessoa_fisica import Arbitro, FuncaoArbitro, Jogador, PessoaFisica, Posicao, Tecnico
from app.models.pessoa_juridica import Abrangencia, Equipe, Federacao, PessoaJuridica

__all__ = [
    "Abrangencia",
    "Arbitro",
    "Campeonato",
    "ContratoJogador",
    "ContratoTecnico",
    "Equipe",
    "EventoPartida",
    "Federacao",
    "FormatoCampeonato",
    "FuncaoArbitro",
    "Jogador",
    "Partida",
    "PessoaFisica",
    "PessoaJuridica",
    "Posicao",
    "StatusPartida",
    "Tecnico",
    "TipoEvento",
    "campeonato_equipe",
]
