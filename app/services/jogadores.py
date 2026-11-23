from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.exceptions import ConflictError
from app.models import Jogador, Posicao
from app.schemas import JogadorCreate, JogadorUpdate
from app.services.common import Pagina, aplicar_parcial, commit, obter_ou_404, paginar


def listar(
    db: Session,
    *,
    nome: str | None = None,
    posicao: Posicao | None = None,
    equipe_id: int | None = None,
    sem_equipe: bool = False,
    skip: int = 0,
    limit: int = 50,
) -> Pagina[Jogador]:
    stmt = select(Jogador)
    if nome:
        stmt = stmt.where(Jogador.nome.ilike(f"%{nome}%"))
    if posicao:
        stmt = stmt.where(Jogador.posicao == posicao)
    if equipe_id:
        stmt = stmt.where(Jogador.equipe_id == equipe_id)
    if sem_equipe:
        stmt = stmt.where(Jogador.equipe_id.is_(None))
    return paginar(
        db,
        stmt,
        skip=skip,
        limit=limit,
        ordem=[Jogador.nome],
        opcoes=[joinedload(Jogador.equipe), selectinload(Jogador.contrato_atual)],
    )


def obter(db: Session, jogador_id: int) -> Jogador:
    return obter_ou_404(db, Jogador, jogador_id, "Jogador")


def criar(db: Session, dados: JogadorCreate) -> Jogador:
    if db.scalar(select(Jogador.id).where(Jogador.cpf == dados.cpf)):
        raise ConflictError("Já existe um jogador com esse CPF")
    jogador = Jogador(**dados.model_dump())
    db.add(jogador)
    commit(db, "Já existe um jogador com esse CPF")
    db.refresh(jogador)
    return jogador


def atualizar(db: Session, jogador_id: int, dados: JogadorUpdate) -> Jogador:
    jogador = obter(db, jogador_id)
    aplicar_parcial(jogador, dados.model_dump(exclude_unset=True))
    commit(db)
    db.refresh(jogador)
    return jogador


def remover(db: Session, jogador_id: int) -> None:
    db.delete(obter(db, jogador_id))
    commit(db)
