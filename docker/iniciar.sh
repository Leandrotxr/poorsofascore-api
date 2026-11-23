#!/bin/sh
# Ponto de entrada do container da API.
set -e

echo "Aplicando migrações..."
alembic upgrade head

# Cria o primeiro admin a partir de ADMIN_EMAIL/ADMIN_SENHA (só se não houver nenhum usuário).
python scripts/criar_usuario.py --do-ambiente

exec fastapi run app/main.py --host 0.0.0.0 --port 8000
