from typing import Annotated

from fastapi import Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db

DbSession = Annotated[Session, Depends(get_db)]
Skip = Annotated[int, Query(ge=0, description="Quantos registros pular")]
Limit = Annotated[int, Query(ge=1, le=100, description="Máximo de registros por página")]
