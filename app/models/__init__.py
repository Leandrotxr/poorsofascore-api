# Importar todos os modelos aqui garante que o SQLAlchemy e o Alembic os enxerguem.
from app.models.equipe import Equipe
from app.models.jogador import Jogador, Posicao
from app.models.tecnico import Tecnico

__all__ = ["Equipe", "Jogador", "Posicao", "Tecnico"]
