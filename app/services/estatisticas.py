"""Classificação e artilharia de um campeonato, calculadas a partir das partidas e dos gols."""

from dataclasses import dataclass, field

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import NotFoundError
from app.models import Campeonato, Equipe, EventoPartida, Jogador, Partida, StatusPartida, TipoEvento

PONTOS_VITORIA, PONTOS_EMPATE = 3, 1


@dataclass
class Linha:
    equipe: Equipe
    vitorias: int = 0
    empates: int = 0
    derrotas: int = 0
    gols_pro: int = 0
    gols_contra: int = 0
    posicao: int = field(default=0)

    @property
    def jogos(self) -> int:
        return self.vitorias + self.empates + self.derrotas

    @property
    def pontos(self) -> int:
        return self.vitorias * PONTOS_VITORIA + self.empates * PONTOS_EMPATE

    @property
    def saldo(self) -> int:
        return self.gols_pro - self.gols_contra

    @property
    def aproveitamento(self) -> float:
        possiveis = self.jogos * PONTOS_VITORIA
        return round(100 * self.pontos / possiveis, 1) if possiveis else 0.0

    def registrar(self, feitos: int, sofridos: int) -> None:
        self.gols_pro += feitos
        self.gols_contra += sofridos
        if feitos > sofridos:
            self.vitorias += 1
        elif feitos == sofridos:
            self.empates += 1
        else:
            self.derrotas += 1


def classificacao(db: Session, campeonato_id: int) -> list[Linha]:
    """
    Tabela com todas as equipes inscritas (mesmo sem jogos). Só partidas ENCERRADAS contam.
    Critérios de desempate: pontos, vitórias, saldo, gols pró e, por fim, nome.
    """
    campeonato = db.scalar(
        select(Campeonato)
        .where(Campeonato.id == campeonato_id)
        .options(selectinload(Campeonato.equipes), selectinload(Campeonato.partidas).selectinload(Partida.eventos))
    )
    if campeonato is None:
        raise NotFoundError(f"Campeonato {campeonato_id} não encontrado(a)")

    linhas = {e.id: Linha(equipe=e) for e in campeonato.equipes}
    for p in campeonato.partidas:
        if p.status != StatusPartida.ENCERRADA:
            continue
        gm, gv = p.gols_mandante, p.gols_visitante
        # Uma equipe removida do campeonato depois de jogar não entra na tabela.
        if p.mandante_id in linhas:
            linhas[p.mandante_id].registrar(gm, gv)
        if p.visitante_id in linhas:
            linhas[p.visitante_id].registrar(gv, gm)

    tabela = sorted(
        linhas.values(),
        key=lambda linha: (-linha.pontos, -linha.vitorias, -linha.saldo, -linha.gols_pro, linha.equipe.nome),
    )
    for i, linha in enumerate(tabela, start=1):
        linha.posicao = i
    return tabela


@dataclass
class LinhaArtilharia:
    jogador: Jogador
    equipe: Equipe
    gols: int


def artilheiros(db: Session, campeonato_id: int, limite: int = 20) -> list[LinhaArtilharia]:
    """Gols (sem contar gols contra) de partidas já iniciadas, por jogador e equipe."""
    if db.get(Campeonato, campeonato_id) is None:
        raise NotFoundError(f"Campeonato {campeonato_id} não encontrado(a)")
    gols = func.count(EventoPartida.id).label("gols")
    linhas = db.execute(
        select(Jogador, Equipe, gols)
        .join(EventoPartida, EventoPartida.jogador_id == Jogador.id)
        .join(Equipe, Equipe.id == EventoPartida.equipe_id)
        .join(Partida, Partida.id == EventoPartida.partida_id)
        .where(
            Partida.campeonato_id == campeonato_id,
            Partida.status != StatusPartida.AGENDADA,
            EventoPartida.tipo == TipoEvento.GOL,
        )
        .group_by(Jogador.id, Equipe.id)
        .order_by(gols.desc(), Jogador.nome)
        .limit(limite)
    ).all()
    return [LinhaArtilharia(jogador=j, equipe=e, gols=n) for j, e, n in linhas]
