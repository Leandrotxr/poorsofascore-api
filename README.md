# Poor SofaScore API (FastAPI + PostgreSQL)

API de gerenciamento de federações, campeonatos, equipes, jogadores, técnicos e árbitros.

## Relações

```
federacao  1 ──── N campeonato (campeonato.federacao_id → federacao.id, OBRIGATÓRIO: organizadora)
campeonato N ──── N equipe     (tabela de ligação campeonato_equipe, PK composta)
federacao 1 ──── N equipe    (equipe.federacao_id  → federacao.id, pode ser NULL = não filiada)
federacao 1 ──── N arbitro   (arbitro.federacao_id → federacao.id, pode ser NULL)
equipe    1 ──── N jogador   (jogador.equipe_id    → equipe.id, pode ser NULL = agente livre)
equipe    1 ──── 1 tecnico   (tecnico.equipe_id    → equipe.id, UNIQUE = no máximo 1 técnico por equipe)
```

Apagar uma federação ou equipe **não** apaga quem está ligado a ela: os vínculos viram NULL (`ON DELETE SET NULL`).
Exceções:
- **Federação que organiza campeonatos não pode ser apagada** (`ON DELETE RESTRICT`, a API responde 409).
- **Inscrições em campeonatos** somem junto com a equipe ou o campeonato (`ON DELETE CASCADE`), nunca o outro lado.

## Hierarquia das entidades

```
PessoaFisica  (abstrata: nome, cpf, idade, nacionalidade)
├── Jogador   + posicao, equipe
├── Tecnico   + equipe (1:1)
└── Arbitro   + funcao (CENTRAL, ASSISTENTE, VAR), federacao

PessoaJuridica (abstrata: nome, fundacao, sede)
├── Equipe     + cnpj (obrigatório), federacao
└── Federacao  + sigla, abrangencia (MUNDIAL, CONTINENTAL, NACIONAL, ESTADUAL), cnpj (opcional)
```

Campeonato não é pessoa física nem jurídica: fica em `app/models/competicao/`, com os atributos
nome, temporada (ano), formato (`PONTOS_CORRIDOS`, `MATA_MATA`, `GRUPOS_E_MATA_MATA`), data de início e fim (opcionais).
O par nome + temporada é único ("Brasileirão 2025" e "Brasileirão 2026" convivem).

As classes mãe são abstratas (`__abstract__ = True`): **não viram tabela**. Cada filha tem a
própria tabela com uma cópia das colunas da mãe. Consequências:
- consultas simples, sem JOIN entre tabelas de pessoas;
- o CPF é único **por papel**: a mesma pessoa pode ser jogador e, depois, técnico;
- cada filha define a sua faixa de idade (`IDADE_MINIMA`/`IDADE_MAXIMA`), usada no CHECK do banco e na validação da API.

## Estrutura

```
app/
├── main.py              # cria o FastAPI, CORS, rotas e tratamento de erros
├── core/                # config (.env), exceções, validação de CPF/CNPJ
├── db/                  # Base do SQLAlchemy e sessão
├── models/
│   ├── pessoa_fisica/   # base.py (PessoaFisica), jogador, tecnico, arbitro
│   ├── pessoa_juridica/ # base.py (PessoaJuridica), equipe, federacao
│   └── competicao/      # campeonato + tabela de ligação campeonato_equipe
├── schemas/             # entrada/saída da API (Pydantic), nas mesmas pastas dos models
├── services/            # regras de negócio (contratar, filiar, trocar técnico)
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
| GET/POST | `/federacoes` | lista (`?nome=` busca nome e sigla, `?abrangencia=`) / cria |
| GET/PATCH/DELETE | `/federacoes/{id}` | detalhe (com equipes e árbitros) / edita / apaga |
| PUT/DELETE | `/federacoes/{id}/equipes/{equipe_id}` | filia / desfilia equipe |
| PUT/DELETE | `/federacoes/{id}/arbitros/{arbitro_id}` | vincula / desvincula árbitro |
| GET/POST | `/campeonatos` | lista (`?nome=&temporada=&federacao_id=`) / cria (exige `federacao_id`) |
| GET/PATCH/DELETE | `/campeonatos/{id}` | detalhe (com organizadora e equipes) / edita / apaga |
| PUT/DELETE | `/campeonatos/{id}/equipes/{equipe_id}` | inscreve / remove equipe |
| GET/POST | `/jogadores` | lista (`?nome=&posicao=&sem_equipe=true`) / cria |
| GET/PATCH/DELETE | `/jogadores/{id}` | detalhe / edita / apaga |
| GET/POST | `/tecnicos` | lista (`?nome=&sem_equipe=true`) / cria |
| GET/PATCH/DELETE | `/tecnicos/{id}` | detalhe / edita / apaga |
| GET/POST | `/arbitros` | lista (`?nome=&funcao=&sem_federacao=true`) / cria |
| GET/PATCH/DELETE | `/arbitros/{id}` | detalhe / edita / apaga |
| GET | `/health` | API e banco no ar |

Erros seguem um formato único: `{"detail": "mensagem"}` com 404 (não encontrado),
409 (conflito, ex. CPF duplicado ou jogador já contratado) e 422 (dado inválido ou regra de negócio).

## Como adicionar uma tabela nova

1. Crie o modelo na pasta certa (`app/models/pessoa_fisica/` ou `pessoa_juridica/`), herdando da classe mãe, e exporte no `__init__.py` da pasta e em `app/models/__init__.py`.
2. `alembic revision --autogenerate -m "descricao"` → **revise** o arquivo gerado.
3. `alembic upgrade head`.

## Front-end (`frontend/`)

Painel em React + Vite + Tailwind para cadastrar, visualizar e relacionar federações, campeonatos,
equipes, jogadores, técnicos e árbitros (botão "Novo…" em cada aba; clique num card para gerenciar os vínculos).

```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173  (a API precisa estar rodando)
```

A porta 5173 é fixa porque é a origem liberada em `CORS_ORIGINS` no `.env` da API.
Se a API estiver em outro endereço, crie `frontend/.env` com `VITE_API_URL=...` (veja `frontend/.env.example`).
