from app.schemas.competicao import CampeonatoCreate, CampeonatoOut, CampeonatoUpdate
from app.schemas.pessoa_fisica import (
    ArbitroCreate, ArbitroOut, ArbitroUpdate,
    JogadorCreate, JogadorOut, JogadorUpdate,
    TecnicoCreate, TecnicoOut, TecnicoUpdate,
)
from app.schemas.pessoa_juridica import (
    EquipeCreate, EquipeDetalhe, EquipeOut, EquipeUpdate,
    FederacaoCreate, FederacaoDetalhe, FederacaoOut, FederacaoUpdate,
)

__all__ = [
    "ArbitroCreate", "ArbitroOut", "ArbitroUpdate",
    "CampeonatoCreate", "CampeonatoOut", "CampeonatoUpdate",
    "EquipeCreate", "EquipeDetalhe", "EquipeOut", "EquipeUpdate",
    "FederacaoCreate", "FederacaoDetalhe", "FederacaoOut", "FederacaoUpdate",
    "JogadorCreate", "JogadorOut", "JogadorUpdate",
    "TecnicoCreate", "TecnicoOut", "TecnicoUpdate",
]
