"""federações e árbitros: federacao 1:N equipe, federacao 1:N arbitro

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-20
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ABRANGENCIAS = ("MUNDIAL", "CONTINENTAL", "NACIONAL", "ESTADUAL")
FUNCOES = ("CENTRAL", "ASSISTENTE", "VAR")

# A 0001 passou o nome completo para os CHECKs e a naming convention (app/db/base.py)
# prefixou de novo: no banco eles ficaram "ck_equipe_ck_equipe_fundacao_valida".
# Esta migração corrige os nomes. Daqui em diante, op.f() marca o nome como final.
CHECKS_DA_0001 = {"equipe": "fundacao_valida", "jogador": "idade_valida", "tecnico": "idade_valida"}


def _renomear_checks_da_0001(*, corrigir: bool) -> None:
    if op.get_context().dialect.name != "postgresql":
        return  # SQLite (testes) não dá nome a CHECK; nada a corrigir
    for tabela, nome in CHECKS_DA_0001.items():
        errado, certo = f"ck_{tabela}_ck_{tabela}_{nome}", f"ck_{tabela}_{nome}"
        de, para = (errado, certo) if corrigir else (certo, errado)
        op.execute(f"ALTER TABLE {tabela} RENAME CONSTRAINT {de} TO {para}")


def _timestamps() -> list[sa.Column]:
    return [
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def upgrade() -> None:
    _renomear_checks_da_0001(corrigir=True)

    op.create_table(
        "federacao",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(120), nullable=False),
        sa.Column("sigla", sa.String(20), nullable=False),
        sa.Column("abrangencia", sa.Enum(*ABRANGENCIAS, name="abrangencia", native_enum=False, length=20), nullable=False),
        sa.Column("cnpj", sa.String(14), nullable=True),
        sa.Column("fundacao", sa.Integer(), nullable=False),
        sa.Column("sede", sa.String(120), nullable=False),
        *_timestamps(),
        sa.PrimaryKeyConstraint("id", name="pk_federacao"),
        sa.UniqueConstraint("nome", name="uq_federacao_nome"),
        sa.UniqueConstraint("sigla", name="uq_federacao_sigla"),
        sa.UniqueConstraint("cnpj", name="uq_federacao_cnpj"),
        sa.CheckConstraint("fundacao BETWEEN 1800 AND 2100", name=op.f("ck_federacao_fundacao_valida")),
    )

    op.create_table(
        "arbitro",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(120), nullable=False),
        sa.Column("cpf", sa.String(11), nullable=False),
        sa.Column("idade", sa.Integer(), nullable=False),
        sa.Column("nacionalidade", sa.String(60), nullable=False),
        sa.Column("funcao", sa.Enum(*FUNCOES, name="funcaoarbitro", native_enum=False, length=20), nullable=False),
        sa.Column("federacao_id", sa.Integer(), nullable=True),
        *_timestamps(),
        sa.PrimaryKeyConstraint("id", name="pk_arbitro"),
        sa.UniqueConstraint("cpf", name="uq_arbitro_cpf"),
        sa.ForeignKeyConstraint(
            ["federacao_id"], ["federacao.id"], name="fk_arbitro_federacao_id_federacao", ondelete="SET NULL"
        ),
        sa.CheckConstraint("idade BETWEEN 18 AND 65", name=op.f("ck_arbitro_idade_valida")),
    )
    op.create_index("ix_arbitro_nome", "arbitro", ["nome"])
    op.create_index("ix_arbitro_federacao_id", "arbitro", ["federacao_id"])

    # Equipes que já existem ficam sem federação (NULL) até serem filiadas.
    with op.batch_alter_table("equipe") as batch:
        batch.add_column(sa.Column("federacao_id", sa.Integer(), nullable=True))
        batch.create_foreign_key(
            "fk_equipe_federacao_id_federacao", "federacao", ["federacao_id"], ["id"], ondelete="SET NULL"
        )
        batch.create_index("ix_equipe_federacao_id", ["federacao_id"])


def downgrade() -> None:
    with op.batch_alter_table("equipe") as batch:
        batch.drop_index("ix_equipe_federacao_id")
        batch.drop_constraint("fk_equipe_federacao_id_federacao", type_="foreignkey")
        batch.drop_column("federacao_id")

    op.drop_index("ix_arbitro_federacao_id", table_name="arbitro")
    op.drop_index("ix_arbitro_nome", table_name="arbitro")
    op.drop_table("arbitro")
    op.drop_table("federacao")

    _renomear_checks_da_0001(corrigir=False)
