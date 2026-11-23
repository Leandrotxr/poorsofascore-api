import enum

from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class PapelUsuario(enum.StrEnum):
    EDITOR = "EDITOR"  # cadastra, edita e apaga dados
    ADMIN = "ADMIN"  # tudo do editor + gerencia usuários


class Usuario(TimestampMixin, Base):
    """
    Quem pode ALTERAR dados. A leitura da API continua pública.
    A senha nunca é guardada: só o hash (Argon2).
    """

    __tablename__ = "usuario"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True)  # sempre em minúsculas
    nome: Mapped[str] = mapped_column(String(120))
    senha_hash: Mapped[str] = mapped_column(String(255))
    papel: Mapped[PapelUsuario] = mapped_column(
        Enum(PapelUsuario, native_enum=False, length=20), default=PapelUsuario.EDITOR
    )
    ativo: Mapped[bool] = mapped_column(default=True)
