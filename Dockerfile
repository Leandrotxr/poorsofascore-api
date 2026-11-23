# Imagem da API. Build:  docker build -t poorsofascore-api .
# Ao subir, aplica as migrações, cria o 1º admin (se ADMIN_EMAIL/ADMIN_SENHA estiverem definidos
# e o banco não tiver usuários) e inicia o servidor.

FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Dependências primeiro: a camada fica em cache enquanto o requirements.txt não mudar.
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY alembic.ini ./
COPY alembic ./alembic
COPY app ./app
COPY scripts ./scripts
COPY docker/iniciar.sh ./iniciar.sh

# Não roda como root.
RUN useradd --create-home --uid 10001 api && chmod +x iniciar.sh
USER api

ENV AMBIENTE=producao
EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=5 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2)"

CMD ["./iniciar.sh"]
