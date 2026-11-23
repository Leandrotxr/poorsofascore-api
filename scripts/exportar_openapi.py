"""
Gera o openapi.json da API sem precisar subir o servidor.
O front usa esse arquivo para gerar os tipos TypeScript (npm run tipos).

    python scripts/exportar_openapi.py            # escreve em frontend/openapi.json
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app

destino = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / "frontend" / "openapi.json"
destino.write_text(json.dumps(app.openapi(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"OpenAPI salvo em {destino}")
