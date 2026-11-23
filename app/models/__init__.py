# Importar todos os modelos aqui garante que o SQLAlchemy e o Alembic os enxerguem.
from app.models.competicao import Campeonato, FormatoCampeonato, campeonato_equipe
from app.models.pessoa_fisica import Arbitro, FuncaoArbitro, Jogador, PessoaFisica, Posicao, Tecnico
from app.models.pessoa_juridica import Abrangencia, Equipe, Federacao, PessoaJuridica

__all__ = [
    "Abrangencia", "Arbitro", "Campeonato", "FormatoCampeonato", "campeonato_equipe", "Equipe", "Federacao", "FuncaoArbitro",
    "Jogador", "PessoaFisica", "PessoaJuridica", "Posicao", "Tecnico",
]
