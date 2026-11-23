from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any

from sqlalchemy import Select, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.orm.interfaces import ORMOption

from app.core.exceptions import ConflictError, NotFoundError
from app.db.base import Base


@dataclass
class Pagina[M]:
    """Resultado de uma listagem paginada (vira o schema `Pagina[...]` na resposta)."""

    items: list[M]
    total: int
    skip: int
    limit: int


def paginar(
    db: Session,
    stmt: Select[Any],
    *,
    skip: int,
    limit: int,
    ordem: Sequence[Any],
    opcoes: Sequence[ORMOption] = (),
) -> Pagina[Any]:
    """
    Conta o total com os filtros de `stmt` e busca só a página pedida.
    O COUNT roda sem os `opcoes` de carregamento (JOINs desnecessários para contar).
    """
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = list(db.scalars(stmt.options(*opcoes).order_by(*ordem).offset(skip).limit(limit)))
    return Pagina(items=items, total=total, skip=skip, limit=limit)


def obter_ou_404[M: Base](db: Session, modelo: type[M], id_: int, rotulo: str) -> M:
    obj = db.get(modelo, id_)
    if obj is None:
        raise NotFoundError(f"{rotulo} {id_} não encontrado(a)")
    return obj


def commit(db: Session, msg_conflito: str = "Registro conflita com dados existentes") -> None:
    """Commit que transforma violação de UNIQUE/FK do banco em 409, em vez de 500."""
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError(msg_conflito) from exc


def aplicar_parcial(obj: Base, dados: dict) -> None:
    for campo, valor in dados.items():
        setattr(obj, campo, valor)
