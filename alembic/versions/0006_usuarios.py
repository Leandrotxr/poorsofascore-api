"""usuários (login para alterar dados; a leitura continua pública)

Revision ID: 0006
Revises: 0005
Create Date: 2026-11-23
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

PAPEIS = ("EDITOR", "ADMIN")


def upgrade() -> None:
    op.create_table(
        "usuario",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(254), nullable=False),
        sa.Column("nome", sa.String(120), nullable=False),
        sa.Column("senha_hash", sa.String(255), nullable=False),
        sa.Column("papel", sa.Enum(*PAPEIS, name="papelusuario", native_enum=False, length=20), nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_usuario"),
        sa.UniqueConstraint("email", name="uq_usuario_email"),
    )


def downgrade() -> None:
    op.drop_table("usuario")
