# Docker (rodar tudo local)

Com o Docker, um comando sobe **banco + API + front**, sem instalar Python, Node ou Postgres.
O banco do Docker é **separado** do Postgres do Homebrew: os dados de um não aparecem no outro.

## 1. Instalar (macOS)

Escolha **uma** das opções.

### Opção A: Docker Desktop (mais simples, tem interface gráfica)

1. Baixe em https://www.docker.com/products/docker-desktop/ a versão **Mac with Apple chip**
   (ou *Intel chip*, conforme o seu Mac: menu  → Sobre este Mac).
2. Abra o `.dmg`, arraste para Aplicativos e abra o **Docker**. Aceite os termos (gratuito para uso pessoal).
3. Espere o ícone da baleia na barra de menus parar de animar.

Ou pelo Homebrew: `brew install --cask docker` (depois abra o app Docker uma vez).

### Opção B: Colima (leve, só terminal, sem interface)

```bash
brew install colima docker docker-compose
mkdir -p ~/.docker/cli-plugins
ln -sfn "$(brew --prefix)/opt/docker-compose/bin/docker-compose" ~/.docker/cli-plugins/docker-compose
colima start --cpu 2 --memory 4          # precisa rodar de novo depois de reiniciar o Mac
```

### Conferir a instalação

```bash
docker --version
docker compose version
docker run --rm hello-world               # deve imprimir "Hello from Docker!"
```

## 2. Configurar o `.env`

O `docker compose` lê o `.env` da raiz. Confira estas variáveis (veja `.env.example`):

```bash
# Senhas do banco do Docker (use só letras, números, - e _)
POSTGRES_ADMIN_PASSWORD=...
APP_DB_PASSWORD=...

# Obrigatória: o container roda em modo produção
SECRET_KEY=...        # gere com: python3 -c "import secrets; print(secrets.token_urlsafe(48))"

# Primeiro administrador (criado na 1ª subida)
ADMIN_EMAIL=voce@exemplo.com
ADMIN_SENHA=uma-senha-forte
ADMIN_NOME=Seu Nome

# Portas: mude se já estiverem em uso (veja "Problemas comuns")
DB_PORTA=5433         # 5433 porque o Postgres do Homebrew já usa a 5432
API_PORTA=8000
WEB_PORTA=8080
```

## 3. Subir

```bash
docker compose up -d --build              # 1ª vez demora alguns minutos (baixa imagens e faz o build)
docker compose ps                         # os 3 serviços devem ficar "healthy"/"running"
```

| Endereço | O quê |
|---|---|
| http://localhost:8080 | o painel (entre com o `ADMIN_EMAIL`/`ADMIN_SENHA`) |
| http://localhost:8000/docs | documentação da API |

Dados de exemplo e usuários extras:

```bash
docker compose exec api python scripts/popular_banco.py
docker compose exec api python scripts/criar_usuario.py maria@exemplo.com "Maria"      # editor
```

## 4. Dia a dia

```bash
docker compose logs -f api                # acompanhar os logs da API
docker compose stop                       # parar (os dados ficam guardados)
docker compose start                      # voltar
docker compose up -d --build              # depois de mudar o código: refaz as imagens
docker compose down                       # remove os containers (os dados ficam no volume)
docker compose down -v                    # remove TUDO, inclusive o banco (cuidado!)
```

## Problemas comuns

**`Cannot connect to the Docker daemon` / `docker: command not found`**
O Docker não está rodando: abra o app Docker Desktop (ou `colima start`). Se o comando não existe,
refaça a instalação.

**`port is already allocated` / `address already in use`**
A porta já é usada por outro programa. Descubra quem: `lsof -nP -iTCP:5432 -sTCP:LISTEN`.
- 5432 → o Postgres do Homebrew. Use `DB_PORTA=5433` no `.env` (ou `brew services stop postgresql@17`).
- 8000 → o `fastapi dev` está ligado. Pare-o (Ctrl+C) ou use `API_PORTA=8001`.
- 8080 → outro serviço. Use `WEB_PORTA=8081`.
Depois: `docker compose up -d --build` (o front precisa ser refeito se `API_PORTA` mudar).

**`defina SECRET_KEY no .env` (ou POSTGRES_ADMIN_PASSWORD / APP_DB_PASSWORD)**
A variável está faltando no `.env`. Veja o passo 2.

**A API reinicia sem parar (`docker compose ps` mostra "restarting")**
Veja o motivo em `docker compose logs api`. O mais comum:
- `password authentication failed`: você mudou `APP_DB_PASSWORD` depois da 1ª subida. A senha do
  banco é definida só na criação do volume. Volte a senha antiga ou recrie o banco: `docker compose down -v`.
- `SECRET_KEY`: a chave tem menos de 32 caracteres.

**Não consigo entrar no painel**
O admin só é criado se o banco estiver vazio de usuários na subida. Crie na mão:
`docker compose exec api python scripts/criar_usuario.py voce@exemplo.com "Seu Nome" --admin`.

**O painel diz "A API não respondeu"**
Confira `docker compose ps` e http://localhost:8000/health. Se você mudou `API_PORTA` ou `WEB_PORTA`,
rode `docker compose up -d --build` para refazer o front com o endereço novo.

**Mac com chip Intel e Colima lento / sem memória**
`colima stop && colima start --cpu 2 --memory 4`.
