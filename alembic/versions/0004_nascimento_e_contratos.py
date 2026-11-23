"""data de nascimento no lugar da idade + histórico de contratos (jogador e técnico)

Revision ID: 0004
Revises: 0003
Create Date: 2026-11-23
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# tabela -> faixa de idade do CHECK antigo (usada só no downgrade)
PESSOAS = {"jogador": (14, 60), "tecnico": (18, 100), "arbitro": (18, 65)}
ATIVO = sa.text("fim IS NULL")


def _timestamps() -> list[sa.Column]:
    return [
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def upgrade() -> None:
    # 1) idade -> data_nascimento. Para quem já existe, a data é ESTIMADA (hoje menos a idade);
    #    dá para corrigir depois pela edição.
    for tabela in PESSOAS:
        op.add_column(tabela, sa.Column("data_nascimento", sa.Date(), nullable=True))
        op.execute(f"UPDATE {tabela} SET data_nascimento = (CURRENT_DATE - make_interval(years => idade))::date")
        op.alter_column(tabela, "data_nascimento", nullable=False)
        op.drop_constraint(op.f(f"ck_{tabela}_idade_valida"), tabela, type_="check")
        op.drop_column(tabela, "idade")

    # 2) histórico de contratos
    op.create_table(
        "contrato_jogador",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("jogador_id", sa.Integer(), nullable=False),
        sa.Column("equipe_id", sa.Integer(), nullable=False),
        sa.Column("inicio", sa.Date(), nullable=False),
        sa.Column("fim", sa.Date(), nullable=True),
        sa.Column("numero_camisa", sa.Integer(), nullable=True),
        *_timestamps(),
        sa.PrimaryKeyConstraint("id", name="pk_contrato_jogador"),
        sa.ForeignKeyConstraint(
            ["jogador_id"], ["jogador.id"], name="fk_contrato_jogador_jogador_id_jogador", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["equipe_id"], ["equipe.id"], name="fk_contrato_jogador_equipe_id_equipe", ondelete="CASCADE"
        ),
        sa.CheckConstraint("fim IS NULL OR fim >= inicio", name=op.f("ck_contrato_jogador_periodo_valido")),
        sa.CheckConstraint(
            "numero_camisa IS NULL OR numero_camisa BETWEEN 1 AND 99", name=op.f("ck_contrato_jogador_numero_valido")
        ),
    )
    op.create_index("ix_contrato_jogador_jogador_id", "contrato_jogador", ["jogador_id"])
    op.create_index("ix_contrato_jogador_equipe_id", "contrato_jogador", ["equipe_id"])
    op.create_index(
        "uq_contrato_jogador_ativo", "contrato_jogador", ["jogador_id"], unique=True, postgresql_where=ATIVO
    )
    op.create_index(
        "uq_contrato_jogador_camisa",
        "contrato_jogador",
        ["equipe_id", "numero_camisa"],
        unique=True,
        postgresql_where=sa.text("fim IS NULL AND numero_camisa IS NOT NULL"),
    )

    op.create_table(
        "contrato_tecnico",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tecnico_id", sa.Integer(), nullable=False),
        sa.Column("equipe_id", sa.Integer(), nullable=False),
        sa.Column("inicio", sa.Date(), nullable=False),
        sa.Column("fim", sa.Date(), nullable=True),
        *_timestamps(),
        sa.PrimaryKeyConstraint("id", name="pk_contrato_tecnico"),
        sa.ForeignKeyConstraint(
            ["tecnico_id"], ["tecnico.id"], name="fk_contrato_tecnico_tecnico_id_tecnico", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["equipe_id"], ["equipe.id"], name="fk_contrato_tecnico_equipe_id_equipe", ondelete="CASCADE"
        ),
        sa.CheckConstraint("fim IS NULL OR fim >= inicio", name=op.f("ck_contrato_tecnico_periodo_valido")),
    )
    op.create_index("ix_contrato_tecnico_tecnico_id", "contrato_tecnico", ["tecnico_id"])
    op.create_index("ix_contrato_tecnico_equipe_id", "contrato_tecnico", ["equipe_id"])
    op.create_index(
        "uq_contrato_tecnico_ativo", "contrato_tecnico", ["tecnico_id"], unique=True, postgresql_where=ATIVO
    )
    op.create_index(
        "uq_contrato_tecnico_equipe_ativa", "contrato_tecnico", ["equipe_id"], unique=True, postgresql_where=ATIVO
    )

    # 3) quem já tinha equipe ganha um contrato ativo começando hoje (a data real não era guardada)
    op.execute(
        "INSERT INTO contrato_jogador (jogador_id, equipe_id, inicio) "
        "SELECT id, equipe_id, CURRENT_DATE FROM jogador WHERE equipe_id IS NOT NULL"
    )
    op.execute(
        "INSERT INTO contrato_tecnico (tecnico_id, equipe_id, inicio) "
        "SELECT id, equipe_id, CURRENT_DATE FROM tecnico WHERE equipe_id IS NOT NULL"
    )


def downgrade() -> None:
    for indice, tabela in [
        ("uq_contrato_tecnico_equipe_ativa", "contrato_tecnico"),
        ("uq_contrato_tecnico_ativo", "contrato_tecnico"),
        ("ix_contrato_tecnico_equipe_id", "contrato_tecnico"),
        ("ix_contrato_tecnico_tecnico_id", "contrato_tecnico"),
        ("uq_contrato_jogador_camisa", "contrato_jogador"),
        ("uq_contrato_jogador_ativo", "contrato_jogador"),
        ("ix_contrato_jogador_equipe_id", "contrato_jogador"),
        ("ix_contrato_jogador_jogador_id", "contrato_jogador"),
    ]:
        op.drop_index(indice, table_name=tabela)
    op.drop_table("contrato_tecnico")
    op.drop_table("contrato_jogador")

    for tabela, (minimo, maximo) in PESSOAS.items():
        op.add_column(tabela, sa.Column("idade", sa.Integer(), nullable=True))
        # Limita à faixa antiga: quem passou do máximo desde o cadastro não quebraria o CHECK.
        op.execute(
            f"UPDATE {tabela} SET idade = LEAST({maximo}, GREATEST({minimo}, "
            "date_part('year', age(data_nascimento))::int))"
        )
        op.alter_column(tabela, "idade", nullable=False)
        op.create_check_constraint(op.f(f"ck_{tabela}_idade_valida"), tabela, f"idade BETWEEN {minimo} AND {maximo}")
        op.drop_column(tabela, "data_nascimento")
