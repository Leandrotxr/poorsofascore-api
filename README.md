# Poor SofaScore API (FastAPI + PostgreSQL)

API de gerenciamento de federações, campeonatos, partidas, equipes, jogadores, técnicos e árbitros,
com placar, classificação e artilharia calculados a partir dos lances.

## Relações

```
federacao  1 ──── N campeonato (campeonato.federacao_id → federacao.id, OBRIGATÓRIO: organizadora)
campeonato N ──── N equipe     (tabela de ligação campeonato_equipe, PK composta)
federacao 1 ──── N equipe    (equipe.federacao_id  → federacao.id, pode ser NULL = não filiada)
federacao 1 ──── N arbitro   (arbitro.federacao_id → federacao.id, pode ser NULL)
equipe    1 ──── N jogador   (jogador.equipe_id    → equipe.id, pode ser NULL = agente livre)
equipe    1 ──── 1 tecnico   (tecnico.equipe_id    → equipe.id, UNIQUE = no máximo 1 técnico por equipe)

jogador   1 ──── N contrato_jogador (histórico: equipe, início, fim, nº da camisa)
tecnico   1 ──── N contrato_tecnico (histórico: equipe, início, fim)

campeonato 1 ──── N partida        (mandante e visitante: equipes inscritas; árbitro central opcional)
partida    1 ──── N evento_partida (GOL, GOL_CONTRA, CARTAO_AMARELO, CARTAO_VERMELHO: minuto, jogador, equipe)
```

### Contratos

`jogador.equipe_id` continua sendo a "equipe atual"; o histórico fica em `contrato_jogador` (e `contrato_tecnico`).
Contratar abre um contrato, dispensar fecha (preenche `fim`). Só `app/services/contratos.py` mexe nos dois,
então eles nunca se contradizem. O banco garante com **índices únicos parciais** (`WHERE fim IS NULL`):
- no máximo um contrato ativo por jogador/técnico, e um técnico ativo por equipe;
- a mesma camisa não fica com dois jogadores ativos da mesma equipe (a API responde 409 dizendo de quem é).

Um contrato novo não pode começar antes do fim do anterior nem no futuro.

### Partidas

O **placar não é coluna**: é calculado dos eventos de gol (gol contra conta para o adversário). Cada evento
grava a equipe, então excluir um jogador (o evento fica com `jogador = null`) não muda placares antigos.
- A partida nasce `AGENDADA`; lances só depois de `EM_ANDAMENTO`; só `ENCERRADA` conta na classificação.
- Classificação: 3 pontos por vitória, 1 por empate; desempate por vitórias, saldo, gols pró e nome.
- Artilharia: gols de partidas iniciadas, sem gols contra.

Apagar uma federação ou equipe **não** apaga quem está ligado a ela: os vínculos viram NULL (`ON DELETE SET NULL`).
Exceções:
- **Federação que organiza campeonatos não pode ser apagada** (`ON DELETE RESTRICT`, a API responde 409).
- **Inscrições em campeonatos** somem junto com a equipe ou o campeonato (`ON DELETE CASCADE`), nunca o outro lado.
- **Equipe com partidas não pode ser apagada** nem sair de um campeonato em que jogou (`RESTRICT`, 409).
- **Apagar um campeonato apaga as partidas dele**; apagar um jogador ou equipe apaga o histórico de contratos dele(a).

## Hierarquia das entidades

```
PessoaFisica  (abstrata: nome, cpf, data_nascimento, nacionalidade; idade é calculada)
├── Jogador   + posicao, equipe, contratos
├── Tecnico   + equipe (1:1), contratos
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
- cada filha define a sua faixa de idade (`IDADE_MINIMA`/`IDADE_MAXIMA`), conferida pela API no cadastro e na edição.
  Guardamos a **data de nascimento**, não a idade (que ficaria desatualizada). Por isso a faixa não é CHECK no banco:
  ela depende da data de hoje, e quem foi cadastrado com 59 anos continua válido depois dos 60.

## Estrutura

```
app/
├── main.py              # cria o FastAPI, CORS, rotas e tratamento de erros
├── core/                # config (.env), exceções, validação de CPF/CNPJ
├── db/                  # Base do SQLAlchemy e sessão
├── models/
│   ├── pessoa_fisica/   # base.py (PessoaFisica), jogador, tecnico, arbitro
│   ├── pessoa_juridica/ # base.py (PessoaJuridica), equipe, federacao
│   ├── competicao/      # campeonato, campeonato_equipe, partida e evento_partida
│   └── contratos/       # histórico de contratos de jogador e técnico
├── schemas/             # entrada/saída da API (Pydantic), nas mesmas pastas dos models
├── services/            # regras de negócio (contratos, partidas, classificação e artilharia)
└── api/routes/          # endpoints HTTP
alembic/versions/        # migrações do banco
docker/initdb/           # cria o usuário da aplicação no Postgres
tests/                   # pytest
```

## Como rodar

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt   # produção: requirements.txt
pre-commit install                 # roda lint/format/tipos a cada commit

cp .env.example .env               # Windows: copy .env.example .env  → depois troque as senhas
docker compose up -d db            # sobe o PostgreSQL (ver docs/POSTGRESQL.md)
alembic upgrade head               # cria as tabelas
python scripts/popular_banco.py     # opcional: dados de exemplo (equipes, partidas, classificação)
fastapi dev app/main.py            # API em http://localhost:8000
```

Documentação interativa: **http://localhost:8000/docs**

## Testes

```bash
pytest                                     # SQLite em memória (rápido)
TEST_DATABASE_URL=postgresql+psycopg://sofascore_app:SENHA@localhost:5432/poorsofascore_test pytest
```

## Qualidade de código

As ferramentas ficam configuradas no `pyproject.toml` e rodam sozinhas no `pre-commit` e no CI.

```bash
ruff check . --fix        # lint (imports, bugs comuns, sintaxe moderna)
ruff format .             # formatação
mypy                      # checagem de tipos em app/
pytest --cov              # testes + cobertura (mínimo de 85%)
alembic check             # confere se os models batem com as migrações
pre-commit run --all-files
```

### CI (GitHub Actions)

A cada push na `main` e em todo pull request, o `.github/workflows/ci.yml` roda:

- **API:** ruff, mypy, as migrações do zero (`upgrade`, `check`, `downgrade` e `upgrade` de novo) e os testes
  no **PostgreSQL 17** com cobertura e também no SQLite;
- **Front-end:** confere se os tipos gerados batem com a API, ESLint, Vitest e `npm run build` (TypeScript + Vite).

O Dependabot (`.github/dependabot.yml`) abre um PR mensal com as atualizações de dependências.

## Endpoints

| Método | Rota | O que faz |
|---|---|---|
| GET/POST | `/equipes` | lista (`?nome=&federacao_id=&sem_federacao=true&sem_tecnico=true`, já com técnico, elenco e campeonatos) / cria |
| GET/PATCH/DELETE | `/equipes/{id}` | detalhe com técnico e elenco / edita / apaga |
| PUT | `/equipes/{id}/jogadores/{jogador_id}` | contrata jogador (corpo opcional: `numero_camisa`, `inicio`) |
| DELETE | `/equipes/{id}/jogadores/{jogador_id}` | dispensa jogador (encerra o contrato) |
| PUT | `/equipes/{id}/tecnico/{tecnico_id}` | define técnico, encerrando o contrato do atual (corpo opcional: `inicio`) |
| DELETE | `/equipes/{id}/tecnico` | remove técnico |
| GET/POST | `/federacoes` | lista (`?nome=` busca nome e sigla, `?abrangencia=`, já com equipes, árbitros e campeonatos) / cria |
| GET/PATCH/DELETE | `/federacoes/{id}` | detalhe (com equipes e árbitros) / edita / apaga |
| PUT/DELETE | `/federacoes/{id}/equipes/{equipe_id}` | filia / desfilia equipe |
| PUT/DELETE | `/federacoes/{id}/arbitros/{arbitro_id}` | vincula / desvincula árbitro |
| GET/POST | `/campeonatos` | lista (`?nome=&temporada=&federacao_id=`) / cria (exige `federacao_id`) |
| GET/PATCH/DELETE | `/campeonatos/{id}` | detalhe (com organizadora e equipes) / edita / apaga |
| PUT/DELETE | `/campeonatos/{id}/equipes/{equipe_id}` | inscreve / remove equipe |
| GET | `/campeonatos/{id}/classificacao` | tabela (só partidas encerradas) |
| GET | `/campeonatos/{id}/artilheiros` | 20 maiores goleadores |
| GET/POST | `/partidas` | lista (`?campeonato_id=&equipe_id=&rodada=&status=`) / agenda |
| GET/PATCH/DELETE | `/partidas/{id}` | detalhe com placar e lances / edita (inclusive o `status`) / apaga |
| POST | `/partidas/{id}/eventos` | registra gol, gol contra ou cartão (`tipo`, `minuto`, `jogador_id`) |
| DELETE | `/partidas/{id}/eventos/{evento_id}` | remove o lance |
| GET/POST | `/jogadores` | lista (`?nome=&posicao=&equipe_id=&sem_equipe=true`) / cria |
| GET/PATCH/DELETE | `/jogadores/{id}` | detalhe (com nº da camisa atual) / edita / apaga |
| GET | `/jogadores/{id}/contratos` | histórico de equipes |
| GET/POST | `/tecnicos` | lista (`?nome=&sem_equipe=true`) / cria |
| GET/PATCH/DELETE | `/tecnicos/{id}` | detalhe / edita / apaga |
| GET | `/tecnicos/{id}/contratos` | histórico de equipes comandadas |
| GET/POST | `/arbitros` | lista (`?nome=&funcao=&federacao_id=&sem_federacao=true`) / cria |
| GET/PATCH/DELETE | `/arbitros/{id}` | detalhe / edita / apaga |
| GET | `/resumo` | total de registros de cada entidade (cards do painel) |
| GET | `/health` | API e banco no ar |

Toda listagem é paginada (`?skip=0&limit=50`, máximo 100) e responde num envelope com o total:

```json
{ "items": [ ... ], "total": 130, "skip": 0, "limit": 50 }
```

Erros seguem um formato único: `{"detail": "mensagem"}` com 404 (não encontrado),
409 (conflito, ex. CPF duplicado ou jogador já contratado) e 422 (dado inválido ou regra de negócio).

## Como adicionar uma tabela nova

1. Crie o modelo na pasta certa (`app/models/pessoa_fisica/` ou `pessoa_juridica/`), herdando da classe mãe, e exporte no `__init__.py` da pasta e em `app/models/__init__.py`.
2. `alembic revision --autogenerate -m "descricao"` → **revise** o arquivo gerado.
3. `alembic upgrade head`.

## Front-end (`frontend/`)

Painel em **React 19 + Vite + Tailwind**, com **React Router** (cada tela tem URL própria) e **TanStack Query**
(cache e atualização automática depois de cada alteração).

```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173  (a API precisa estar rodando)
```

A porta 5173 é fixa porque é a origem liberada em `CORS_ORIGINS` no `.env` da API.
Se a API estiver em outro endereço, crie `frontend/.env` com `VITE_API_URL=...` (veja `frontend/.env.example`).

### Rotas

Cada aba (`federacoes`, `campeonatos`, `partidas`, `equipes`, `jogadores`, `tecnicos`, `arbitros`) tem as mesmas rotas.
A lista fica por baixo e as outras abrem uma gaveta lateral por cima:

| Rota | Tela |
|---|---|
| `/equipes?q=fla&pagina=2` | lista com busca, filtros e paginação feitas na API (sobrevivem ao F5 e podem ser compartilhadas) |
| `/equipes/novo` | cadastro |
| `/equipes/12` | painel com os vínculos (contratar, filiar, inscrever…) e os botões editar/excluir |
| `/equipes/12/editar` | edição |

### Estrutura

```
src/
├── api/
│   ├── schema.ts      # GERADO a partir do OpenAPI da API (não editar à mão)
│   ├── cliente.ts     # fetch + tradução dos erros (422 por campo, 409 de regra de negócio)
│   └── index.ts       # funções da API e consultas do TanStack Query
├── types.ts           # nomes curtos para os tipos gerados
├── rotas.tsx          # mapa de rotas
├── Layout.tsx         # cabeçalho, totais, abas e rodapé
├── hooks.ts           # filtros na URL, ações com aviso, navegação das gavetas
├── components/        # gaveta, busca remota, paginação, ícones…
├── views/             # lista + painel de cada entidade
├── forms/             # formulários (o mesmo serve para criar e editar)
└── testes/            # Vitest
```

### Tipos gerados da API

Os tipos do front vêm do OpenAPI da API, então uma mudança num schema Pydantic aparece como erro
de TypeScript no front. Depois de mudar a API, com o `.venv` ativado:

```bash
cd frontend
npm run tipos:atualizar            # exporta frontend/openapi.json e regera src/api/schema.ts
```

O CI falha se esses arquivos estiverem desatualizados.

### Scripts

```bash
npm run lint                       # ESLint
npm test                           # Vitest
npm run build                      # TypeScript + build de produção
```
