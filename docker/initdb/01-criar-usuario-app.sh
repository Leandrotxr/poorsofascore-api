#!/bin/sh
# Roda UMA vez, na primeira inicialização do volume do Postgres.
# Cria um usuário da aplicação SEM superpoderes, dono apenas dos seus bancos.
set -eu

psql -v ON_ERROR_STOP=1 \
     -v app_user="$APP_DB_USER" \
     -v app_pass="$APP_DB_PASSWORD" \
     -v app_db="$APP_DB_NAME" \
     -v app_db_test="${APP_DB_NAME}_test" \
     --username "$POSTGRES_USER" --dbname postgres <<'EOSQL'
CREATE ROLE :"app_user" LOGIN PASSWORD :'app_pass'
  NOSUPERUSER NOCREATEDB NOCREATEROLE;

CREATE DATABASE :"app_db" OWNER :"app_user";
CREATE DATABASE :"app_db_test" OWNER :"app_user";

-- Só o dono conecta (por padrão, qualquer usuário pode conectar em qualquer banco)
REVOKE CONNECT ON DATABASE :"app_db" FROM PUBLIC;
REVOKE CONNECT ON DATABASE :"app_db_test" FROM PUBLIC;
EOSQL
