"""tabelas iniciais: equipe, jogador (N:1) e tecnico (1:1)

Revision ID: 0001
Revises:
Create Date: 2026-11-19
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

POSICOES = ("GOLEIRO", "ZAGUEIRO", "LATERAL", "VOLANTE", "MEIA", "ATACANTE")


def _timestamps() -> list[sa.Column]:
    return [
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "equipe",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(120), nullable=False),
        sa.Column("cnpj", sa.String(14), nullable=False),
        sa.Column("fundacao", sa.Integer(), nullable=False),
        sa.Column("sede", sa.String(120), nullable=False),
        *_timestamps(),
        sa.PrimaryKeyConstraint("id", name="pk_equipe"),
        sa.UniqueConstraint("nome", name="uq_equipe_nome"),
        sa.UniqueConstraint("cnpj", name="uq_equipe_cnpj"),
        sa.CheckConstraint("fundacao BETWEEN 1800 AND 2100", name="ck_equipe_fundacao_valida"),
    )

    op.create_table(
        "jogador",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(120), nullable=False),
        sa.Column("cpf", sa.String(11), nullable=False),
        sa.Column("idade", sa.Integer(), nullable=False),
        sa.Column("nacionalidade", sa.String(60), nullable=False),
        sa.Column("posicao", sa.Enum(*POSICOES, name="posicao", native_enum=False, length=20), nullable=False),
        sa.Column("equipe_id", sa.Integer(), nullable=True),
        *_timestamps(),
        sa.PrimaryKeyConstraint("id", name="pk_jogador"),
        sa.UniqueConstraint("cpf", name="uq_jogador_cpf"),
        sa.ForeignKeyConstraint(["equipe_id"], ["equipe.id"], name="fk_jogador_equipe_id_equipe", ondelete="SET NULL"),
        sa.CheckConstraint("idade BETWEEN 14 AND 60", name="ck_jogador_idade_valida"),
    )
    op.create_index("ix_jogador_nome", "jogador", ["nome"])
    op.create_index("ix_jogador_equipe_id", "jogador", ["equipe_id"])

    op.create_table(
        "tecnico",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(120), nullable=False),
        sa.Column("cpf", sa.String(11), nullable=False),
        sa.Column("idade", sa.Integer(), nullable=False),
        sa.Column("nacionalidade", sa.String(60), nullable=False),
        sa.Column("equipe_id", sa.Integer(), nullable=True),
        *_timestamps(),
        sa.PrimaryKeyConstraint("id", name="pk_tecnico"),
        sa.UniqueConstraint("cpf", name="uq_tecnico_cpf"),
        # UNIQUE em equipe_id = garantia da relação 1:1 no próprio banco
        sa.UniqueConstraint("equipe_id", name="uq_tecnico_equipe_id"),
        sa.ForeignKeyConstraint(["equipe_id"], ["equipe.id"], name="fk_tecnico_equipe_id_equipe", ondelete="SET NULL"),
        sa.CheckConstraint("idade BETWEEN 18 AND 100", name="ck_tecnico_idade_valida"),
    )
    op.create_index("ix_tecnico_nome", "tecnico", ["nome"])


def downgrade() -> None:
    op.drop_index("ix_tecnico_nome", table_name="tecnico")
    op.drop_table("tecnico")
    op.drop_index("ix_jogador_equipe_id", table_name="jogador")
    op.drop_index("ix_jogador_nome", table_name="jogador")
    op.drop_table("jogador")
    op.drop_table("equipe")
