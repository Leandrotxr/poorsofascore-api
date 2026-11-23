from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.pessoa_juridica.base import PessoaJuridica

if TYPE_CHECKING:
    from app.models.competicao.campeonato import Campeonato
    from app.models.pessoa_fisica.jogador import Jogador
    from app.models.pessoa_fisica.tecnico import Tecnico
    from app.models.pessoa_juridica.federacao import Federacao


class Equipe(PessoaJuridica):
    __tablename__ = "equipe"

    cnpj: Mapped[str] = mapped_column(String(14), unique=True)

    # N:1 -> várias equipes são filiadas a uma federação (ou a nenhuma).
    federacao_id: Mapped[int | None] = mapped_column(ForeignKey("federacao.id", ondelete="SET NULL"), index=True)
    federacao: Mapped["Federacao | None"] = relationship(back_populates="equipes")

    # 1:N -> uma equipe tem vários jogadores
    jogadores: Mapped[list["Jogador"]] = relationship(back_populates="equipe", order_by="Jogador.nome")

    # 1:1 -> uma equipe tem no máximo um técnico (uselist=False)
    tecnico: Mapped["Tecnico | None"] = relationship(back_populates="equipe", uselist=False)

    # N:N -> campeonatos que a equipe disputa (tabela de ligação campeonato_equipe)
    campeonatos: Mapped[list["Campeonato"]] = relationship(
        secondary="campeonato_equipe", back_populates="equipes", order_by="Campeonato.temporada.desc()"
    )
