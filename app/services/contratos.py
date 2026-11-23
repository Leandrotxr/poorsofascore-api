"""
Regras dos contratos (histórico de passagens por equipes).

Invariante: `jogador.equipe_id` (o atalho "equipe atual") e o contrato ATIVO sempre andam juntos.
Por isso só estas funções mexem nos dois; as rotas de contratar/dispensar/definir técnico as chamam.
"""

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.datas import hoje
from app.core.exceptions import BusinessRuleError, ConflictError
from app.models import ContratoJogador, ContratoTecnico, Equipe, Jogador, Tecnico
from app.services.common import obter_ou_404


def _conferir_inicio(db: Session, coluna_pessoa, modelo, pessoa_id: int, inicio: date) -> None:
    """O novo contrato não pode começar antes do fim do anterior (sem passagens sobrepostas)."""
    ultimo_fim = db.scalar(select(func.max(modelo.fim)).where(coluna_pessoa == pessoa_id))
    if ultimo_fim and inicio < ultimo_fim:
        raise BusinessRuleError(
            f"O contrato não pode começar antes de {ultimo_fim:%d/%m/%Y}, quando terminou o anterior"
        )


# ---------- Jogador ----------


def abrir_contrato_jogador(
    db: Session, jogador: Jogador, equipe: Equipe, inicio: date | None, numero_camisa: int | None
) -> None:
    inicio = inicio or hoje()
    _conferir_inicio(db, ContratoJogador.jogador_id, ContratoJogador, jogador.id, inicio)
    if numero_camisa is not None:
        dono = db.scalar(
            select(Jogador.nome)
            .join(ContratoJogador, ContratoJogador.jogador_id == Jogador.id)
            .where(
                ContratoJogador.equipe_id == equipe.id,
                ContratoJogador.numero_camisa == numero_camisa,
                ContratoJogador.fim.is_(None),
            )
        )
        if dono:
            raise ConflictError(f"A camisa {numero_camisa} do {equipe.nome} já é de {dono}")

    db.add(ContratoJogador(jogador=jogador, equipe=equipe, inicio=inicio, numero_camisa=numero_camisa))
    jogador.equipe = equipe


def encerrar_contrato_jogador(db: Session, jogador: Jogador) -> None:
    contrato = db.scalar(
        select(ContratoJogador).where(ContratoJogador.jogador_id == jogador.id, ContratoJogador.fim.is_(None))
    )
    if contrato:
        contrato.fim = max(hoje(), contrato.inicio)
    jogador.equipe = None


def contratos_do_jogador(db: Session, jogador_id: int) -> list[ContratoJogador]:
    jogador = obter_ou_404(db, Jogador, jogador_id, "Jogador")
    return list(jogador.contratos)


# ---------- Técnico ----------


def abrir_contrato_tecnico(db: Session, tecnico: Tecnico, equipe: Equipe, inicio: date | None) -> None:
    inicio = inicio or hoje()
    _conferir_inicio(db, ContratoTecnico.tecnico_id, ContratoTecnico, tecnico.id, inicio)
    db.add(ContratoTecnico(tecnico=tecnico, equipe=equipe, inicio=inicio))
    tecnico.equipe = equipe


def encerrar_contrato_tecnico(db: Session, tecnico: Tecnico) -> None:
    contrato = db.scalar(
        select(ContratoTecnico).where(ContratoTecnico.tecnico_id == tecnico.id, ContratoTecnico.fim.is_(None))
    )
    if contrato:
        contrato.fim = max(hoje(), contrato.inicio)
    tecnico.equipe = None


def contratos_do_tecnico(db: Session, tecnico_id: int) -> list[ContratoTecnico]:
    tecnico = obter_ou_404(db, Tecnico, tecnico_id, "Técnico")
    return list(tecnico.contratos)
