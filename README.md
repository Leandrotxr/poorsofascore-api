# Poor SofaScore API (FastAPI + PostgreSQL)

API de gerenciamento de equipes, jogadores e técnicos.

## Relações

```
equipe 1 ──── N jogador      (jogador.equipe_id → equipe.id, pode ser NULL = agente livre)
equipe 1 ──── 1 tecnico      (tecnico.equipe_id → equipe.id, UNIQUE = no máximo 1 técnico por equipe)
```

Apagar uma equipe **não** apaga jogadores nem técnico: eles ficam sem equipe (`ON DELETE SET NULL`).

## Estrutura

```
app/
├── main.py              # cria o FastAPI, CORS, rotas e tratamento de erros
├── core/                # config (.env), exceções, validação de CPF/CNPJ
├── db/                  # Base do SQLAlchemy e sessão
├── models/              # tabelas (Equipe, Jogador, Tecnico)
├── schemas/             # entrada/saída da API (Pydantic) — nunca expõe a entidade direto
├── services/            # regras de negócio (contratar, dispensar, trocar técnico)
└── api/routes/          # endpoints HTTP
alembic/versions/        # migrações do banco
docker/initdb/           # cria o usuário da aplicação no Postgres
tests/                   # pytest
```

## Como rodar

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # Windows: copy .env.example .env  → depois troque as senhas
docker compose up -d db            # sobe o PostgreSQL (ver docs/POSTGRESQL.md)
alembic upgrade head               # cria as tabelas
fastapi dev app/main.py            # API em http://localhost:8000
```

Documentação interativa: **http://localhost:8000/docs**

## Testes

```bash
pytest                                     # SQLite em memória (rápido)
TEST_DATABASE_URL=postgresql+psycopg://sofascore_app:SENHA@localhost:5432/poorsofascore_test pytest
```

## Endpoints

| Método | Rota | O que faz |
|---|---|---|
| GET/POST | `/equipes` | lista (filtro `?nome=`, paginação `?skip=&limit=`) / cria |
| GET/PATCH/DELETE | `/equipes/{id}` | detalhe com técnico e elenco / edita / apaga |
| PUT | `/equipes/{id}/jogadores/{jogador_id}` | contrata jogador |
| DELETE | `/equipes/{id}/jogadores/{jogador_id}` | dispensa jogador |
| PUT | `/equipes/{id}/tecnico/{tecnico_id}` | define técnico (substitui o atual) |
| DELETE | `/equipes/{id}/tecnico` | remove técnico |
| GET/POST | `/jogadores` | lista (`?nome=&posicao=&sem_equipe=true`) / cria |
| GET/PATCH/DELETE | `/jogadores/{id}` | detalhe / edita / apaga |
| GET/POST | `/tecnicos` | lista (`?nome=&sem_equipe=true`) / cria |
| GET/PATCH/DELETE | `/tecnicos/{id}` | detalhe / edita / apaga |
| GET | `/health` | API e banco no ar |

Erros seguem um formato único: `{"detail": "mensagem"}` com 404 (não encontrado),
409 (conflito, ex. CPF duplicado ou jogador já contratado) e 422 (dado inválido ou regra de negócio).

## Como adicionar uma tabela nova

1. Crie o modelo em `app/models/` e importe em `app/models/__init__.py`.
2. `alembic revision --autogenerate -m "descricao"` → **revise** o arquivo gerado.
3. `alembic upgrade head`.
