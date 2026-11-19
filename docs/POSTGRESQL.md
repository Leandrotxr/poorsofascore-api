# PostgreSQL: instalação e uso correto

Há dois caminhos. **Recomendo o A (Docker)**: o banco fica isolado, igual em qualquer máquina,
e o projeto já vem configurado para ele. Use o B só se não puder usar Docker.

---

## A) Com Docker (recomendado)

### 1. Instale o Docker
- **Windows / macOS:** Docker Desktop (https://www.docker.com/products/docker-desktop/).
  No Windows, aceite habilitar o WSL 2 quando ele pedir.
- **Linux (Ubuntu):** siga https://docs.docker.com/engine/install/ubuntu/

Confira: `docker --version` e `docker compose version`.

### 2. Configure as senhas
```bash
cp .env.example .env          # Windows: copy .env.example .env
```
Gere duas senhas fortes (uma para o admin, outra para a aplicação):
```bash
python -c "import secrets; print(secrets.token_urlsafe(24))"
```
No `.env`, coloque-as em `POSTGRES_ADMIN_PASSWORD` e `APP_DB_PASSWORD`, e repita a senha
da aplicação dentro de `DATABASE_URL`.

> `token_urlsafe` só gera caracteres seguros para URL. Se você inventar uma senha com
> `@ : / # %`, ela quebra a `DATABASE_URL` (teria que ser codificada).

### 3. Suba o banco
```bash
docker compose up -d db
docker compose ps             # espere aparecer "healthy"
```
Na **primeira** subida, o script `docker/initdb/01-criar-usuario-app.sh` cria:
- o usuário `sofascore_app` (sem permissão de superusuário);
- os bancos `poorsofascore` e `poorsofascore_test`, cujo dono é esse usuário.

### 4. Crie as tabelas com o Alembic
```bash
alembic upgrade head
```

### 5. Confira se deu certo
```bash
docker exec -it poorsofascore-db psql -U sofascore_app -d poorsofascore
```
Dentro do `psql`:
```
\dt                -- lista tabelas: equipe, jogador, tecnico, alembic_version
\d tecnico         -- mostra colunas e a constraint UNIQUE de equipe_id (1:1)
\q                 -- sai
```

### Comandos do dia a dia
| Ação | Comando |
|---|---|
| Ligar | `docker compose up -d db` |
| Desligar (mantém os dados) | `docker compose stop db` |
| Ver logs | `docker compose logs -f db` |
| **Apagar tudo** (dados inclusive) | `docker compose down -v` |

Os dados ficam no volume `pgdata` e sobrevivem a reinícios e a `docker compose down` (sem `-v`).

---

## B) Instalação nativa (sem Docker)

Use a versão 17 (ou mais recente).

**Windows**
1. Baixe o instalador em https://www.postgresql.org/download/windows/
2. Na instalação: defina uma senha forte para o usuário `postgres` e mantenha a porta 5432.
   O Stack Builder no final é opcional, pode pular.
3. Adicione `C:\Program Files\PostgreSQL\17\bin` ao PATH para usar `psql` no terminal.

**macOS (Homebrew)**
```bash
brew install postgresql@17
brew services start postgresql@17
```

**Ubuntu / Debian**
```bash
sudo apt update && sudo apt install postgresql
sudo systemctl enable --now postgresql
```

### Crie o usuário e os bancos da aplicação
Entre como administrador:
- Windows: `psql -U postgres`
- macOS: `psql postgres`
- Linux: `sudo -u postgres psql`

E rode:
```sql
CREATE ROLE sofascore_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
\password sofascore_app
-- (digite a senha; assim ela não fica salva no histórico)

CREATE DATABASE poorsofascore      OWNER sofascore_app;
CREATE DATABASE poorsofascore_test OWNER sofascore_app;
REVOKE CONNECT ON DATABASE poorsofascore      FROM PUBLIC;
REVOKE CONNECT ON DATABASE poorsofascore_test FROM PUBLIC;
\q
```
Depois ajuste a `DATABASE_URL` no `.env` e rode `alembic upgrade head`.

---

## O que é "usar do jeito certo"

1. **A aplicação nunca usa o usuário `postgres`.** Ele é superusuário. Se a API for invadida
   com ele, o atacante controla o servidor inteiro. Por isso existe o `sofascore_app`.
2. **Senhas só no `.env`**, que está no `.gitignore`. Nunca no código nem no Git.
   Se uma senha vazar no Git, troque-a: apagar o commit não basta.
3. **O banco só escuta na sua máquina.** O compose publica em `127.0.0.1:5432`, não em `0.0.0.0`.
   Na instalação nativa, `listen_addresses = 'localhost'` já é o padrão. Não mude sem motivo.
4. **Autenticação SCRAM.** É o padrão desde o Postgres 14. Para conferir: `SHOW password_encryption;`
   deve mostrar `scram-sha-256`.
5. **Schema só muda por migração.** Toda alteração de tabela vira um arquivo em `alembic/versions`:
   ```bash
   alembic revision --autogenerate -m "adiciona campo X"   # gera a migração
   # abra e REVISE o arquivo gerado (o autogenerate não é perfeito)
   alembic upgrade head                                     # aplica
   alembic downgrade -1                                     # desfaz a última, se precisar
   ```
   Não crie nem altere tabelas na mão pelo pgAdmin/DBeaver, ou o banco e o código divergem.
6. **As regras ficam também no banco.** O projeto usa `UNIQUE` (CPF, CNPJ, um técnico por equipe),
   `CHECK` (idade, ano de fundação) e `FOREIGN KEY`. Mesmo que alguém escreva direto no banco,
   ele recusa dados inválidos.
7. **Banco de teste separado.** Os testes usam `poorsofascore_test`, nunca o banco principal.
8. **Faça backup.**
   ```bash
   # gerar
   docker exec poorsofascore-db pg_dump -U sofascore_app -d poorsofascore -Fc -f /tmp/backup.dump
   docker cp poorsofascore-db:/tmp/backup.dump ./backup.dump

   # restaurar
   docker cp ./backup.dump poorsofascore-db:/tmp/backup.dump
   docker exec poorsofascore-db pg_restore -U sofascore_app -d poorsofascore --clean --if-exists /tmp/backup.dump
   ```
   (Na instalação nativa: `pg_dump -U sofascore_app -d poorsofascore -Fc -f backup.dump`.)

---

## Ferramentas visuais (opcional)
**DBeaver** ou **pgAdmin**. Conecte com host `localhost`, porta `5432`, banco `poorsofascore`
e usuário `sofascore_app`. Use para **consultar**; para alterar a estrutura, use migrações.

---

## Problemas comuns

| Erro | Causa e solução |
|---|---|
| `password authentication failed` | A senha da `DATABASE_URL` não bate com `APP_DB_PASSWORD`. Ou você mudou a senha no `.env` depois da primeira subida: o script de criação só roda uma vez. Para recriar do zero, rode `docker compose down -v` (**apaga os dados**) e depois `up -d db`. |
| `port 5432 is already allocated` | Já existe um Postgres nativo rodando. Pare-o, ou troque no compose para `"127.0.0.1:5433:5432"` e use a porta `5433` na `DATABASE_URL`. |
| `connection refused` | O container não está de pé. Rode `docker compose ps` e `docker compose logs db`. |
| `relation "equipe" does not exist` | Faltou rodar `alembic upgrade head`. |
| `/docker-entrypoint-initdb.d/...sh: not found` (Windows) | O script ficou com fim de linha CRLF. O `.gitattributes` evita isso. Se acontecer, converta o arquivo para LF no VS Code e rode `docker compose down -v` e `up -d db`. |
