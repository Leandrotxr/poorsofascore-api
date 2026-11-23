import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.pessoa_juridica.base import PessoaJuridica

if TYPE_CHECKING:
    from app.models.competicao.campeonato import Campeonato
    from app.models.pessoa_fisica.arbitro import Arbitro
    from app.models.pessoa_juridica.equipe import Equipe


class Abrangencia(str, enum.Enum):
    MUNDIAL = "MUNDIAL"          # FIFA
    CONTINENTAL = "CONTINENTAL"  # UEFA, CONMEBOL
    NACIONAL = "NACIONAL"        # CBF
    ESTADUAL = "ESTADUAL"        # FERJ, FPF


class Federacao(PessoaJuridica):
    __tablename__ = "federacao"

    sigla: Mapped[str] = mapped_column(String(20), unique=True)
    abrangencia: Mapped[Abrangencia] = mapped_column(Enum(Abrangencia, native_enum=False, length=20))
    # Opcional: só entidades brasileiras têm CNPJ. O Postgres aceita vários NULLs em coluna UNIQUE.
    cnpj: Mapped[str | None] = mapped_column(String(14), unique=True)

    # 1:N -> uma federação tem várias equipes filiadas e vários árbitros
    equipes: Mapped[list["Equipe"]] = relationship(back_populates="federacao", order_by="Equipe.nome")
    arbitros: Mapped[list["Arbitro"]] = relationship(back_populates="federacao", order_by="Arbitro.nome")

    # 1:N -> campeonatos que a federação organiza
    campeonatos: Mapped[list["Campeonato"]] = relationship(
        back_populates="federacao", order_by="Campeonato.temporada.desc()"
    )
