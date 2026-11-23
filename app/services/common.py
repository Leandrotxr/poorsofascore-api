from typing import TypeVar

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.db.base import Base

M = TypeVar("M", bound=Base)


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
