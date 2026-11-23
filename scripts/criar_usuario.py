"""
Cria um usuário que pode alterar dados (a senha é pedida no terminal, sem aparecer na tela).

    python scripts/criar_usuario.py admin@exemplo.com "Seu Nome" --admin
    python scripts/criar_usuario.py editor@exemplo.com "Outra Pessoa"

Modo para deploy (usado pelo container): cria o PRIMEIRO admin a partir das variáveis
ADMIN_EMAIL, ADMIN_SENHA e ADMIN_NOME, só se ainda não existir nenhum usuário. Sem as
variáveis, ou com usuários já cadastrados, não faz nada.

    python scripts/criar_usuario.py --do-ambiente
"""

import argparse
import getpass
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pydantic import ValidationError
from sqlalchemy import func, select

from app.core.exceptions import AppError
from app.db.session import SessionLocal
from app.models import PapelUsuario, Usuario
from app.schemas import UsuarioCreate
from app.services import usuarios


def criar(email: str, nome: str, senha: str, papel: PapelUsuario) -> int:
    try:
        dados = UsuarioCreate(email=email, nome=nome, senha=senha, papel=papel)
    except ValidationError as e:
        for erro in e.errors():
            print(f"Erro em {erro['loc'][0]}: {erro['msg']}", file=sys.stderr)
        return 1
    with SessionLocal() as db:
        try:
            u = usuarios.criar(db, dados)
        except AppError as e:
            print(f"Erro: {e.detail}", file=sys.stderr)
            return 1
    print(f"Usuário {u.email} criado ({u.papel}).")
    return 0


def do_ambiente() -> int:
    email, senha = os.getenv("ADMIN_EMAIL"), os.getenv("ADMIN_SENHA")
    if not email or not senha:
        return 0
    with SessionLocal() as db:
        if db.scalar(select(func.count()).select_from(Usuario)):
            return 0  # já existe alguém: não mexe
    return criar(email, os.getenv("ADMIN_NOME", "Administrador"), senha, PapelUsuario.ADMIN)


def main() -> int:
    parser = argparse.ArgumentParser(description="Cria um usuário da API.")
    parser.add_argument("email", nargs="?")
    parser.add_argument("nome", nargs="?")
    parser.add_argument("--admin", action="store_true", help="papel ADMIN (gerencia usuários)")
    parser.add_argument("--do-ambiente", action="store_true", help="cria o 1º admin com ADMIN_EMAIL/ADMIN_SENHA")
    args = parser.parse_args()

    if args.do_ambiente:
        return do_ambiente()
    if not args.email or not args.nome:
        parser.error("informe e-mail e nome (ou use --do-ambiente)")

    senha = getpass.getpass("Senha (mín. 8 caracteres): ")
    if senha != getpass.getpass("Repita a senha: "):
        print("As senhas não conferem.", file=sys.stderr)
        return 1
    return criar(args.email, args.nome, senha, PapelUsuario.ADMIN if args.admin else PapelUsuario.EDITOR)


if __name__ == "__main__":
    sys.exit(main())
