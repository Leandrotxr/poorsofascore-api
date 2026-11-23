"""Login, permissões (leitura pública, escrita com login, usuários só ADMIN) e configuração."""

import jwt
import pytest
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from tests.conftest import SENHA


def login(cliente, email, senha=SENHA):
    return cliente.post("/auth/login", data={"username": email, "password": senha})


# ---------- Leitura pública x escrita protegida ----------


def test_leitura_e_publica(anonimo):
    for rota in ["/equipes", "/jogadores", "/partidas", "/resumo", "/health"]:
        assert anonimo.get(rota).status_code == 200, rota


def test_escrita_sem_login_da_401(anonimo):
    r = anonimo.post("/equipes", json={"nome": "X", "cnpj": "11.222.333/0001-81", "fundacao": 2000, "sede": "SP"})
    assert r.status_code == 401
    assert r.headers["www-authenticate"] == "Bearer"
    assert "login" in r.json()["detail"]


@pytest.mark.parametrize(
    ("metodo", "rota"),
    [
        ("patch", "/jogadores/1"),
        ("delete", "/federacoes/1"),
        ("put", "/equipes/1/jogadores/1"),
        ("post", "/partidas/1/eventos"),
    ],
)
def test_todas_as_formas_de_escrita_exigem_login(anonimo, metodo, rota):
    assert getattr(anonimo, metodo)(rota).status_code == 401


def test_token_invalido_ou_adulterado(anonimo, ids_usuarios):
    assert anonimo.get("/auth/eu", headers={"Authorization": "Bearer lixo"}).status_code == 401
    falso = jwt.encode({"sub": str(ids_usuarios["admin"]), "exp": 9999999999}, "outra-chave-qualquer-com-32-bytes!!")
    assert anonimo.get("/auth/eu", headers={"Authorization": f"Bearer {falso}"}).status_code == 401


def test_token_vencido(anonimo, ids_usuarios, monkeypatch):
    from tests.conftest import autorizacao

    monkeypatch.setattr(get_settings(), "token_expira_minutos", -1)
    r = anonimo.get("/auth/eu", headers=autorizacao(ids_usuarios["editor"]))
    assert r.status_code == 401
    assert "expirada" in r.json()["detail"]


# ---------- Login ----------


def test_login_devolve_token_que_funciona(anonimo):
    r = login(anonimo, "Editor@Teste.com")  # e-mail sem diferenciar maiúsculas
    assert r.status_code == 200
    corpo = r.json()
    assert corpo["token_type"] == "bearer" and corpo["expires_in"] > 0
    assert corpo["usuario"]["papel"] == "EDITOR"

    cab = {"Authorization": f"Bearer {corpo['access_token']}"}
    assert anonimo.get("/auth/eu", headers=cab).json()["email"] == "editor@teste.com"
    r = anonimo.post(
        "/federacoes",
        headers=cab,
        json={"nome": "FERJ", "sigla": "FERJ", "abrangencia": "ESTADUAL", "fundacao": 1978, "sede": "Rio"},
    )
    assert r.status_code == 201


def test_login_errado_nao_revela_se_o_email_existe(anonimo):
    senha_errada = login(anonimo, "editor@teste.com", "errada123")
    email_errado = login(anonimo, "ninguem@teste.com")
    assert senha_errada.status_code == email_errado.status_code == 401
    assert senha_errada.json() == email_errado.json() == {"detail": "E-mail ou senha incorretos"}


def test_usuario_desativado_perde_acesso(client, anonimo, como_admin, ids_usuarios):
    editor = ids_usuarios["editor"]
    assert client.patch(f"/usuarios/{editor}", headers=como_admin, json={"ativo": False}).status_code == 200
    assert login(anonimo, "editor@teste.com").status_code == 401
    # O token antigo também para de valer na hora
    assert client.get("/auth/eu").status_code == 401


# ---------- Gestão de usuários ----------


def test_editor_nao_gerencia_usuarios(client):
    assert client.get("/usuarios").status_code == 403
    r = client.post("/usuarios", json={"email": "x@y.com", "nome": "X", "senha": "12345678"})
    assert r.status_code == 403


def test_admin_cria_usuario_que_consegue_logar(client, anonimo, como_admin):
    r = client.post(
        "/usuarios", headers=como_admin, json={"email": "Novo@Teste.com", "nome": "Novo", "senha": "segredo123"}
    )
    assert r.status_code == 201
    assert r.json() == {
        "id": r.json()["id"],
        "email": "novo@teste.com",
        "nome": "Novo",
        "papel": "EDITOR",
        "ativo": True,
    }
    assert "senha" not in r.text and "hash" not in r.text
    assert login(anonimo, "novo@teste.com", "segredo123").status_code == 200

    duplicado = client.post(
        "/usuarios", headers=como_admin, json={"email": "novo@teste.com", "nome": "Outro", "senha": "12345678"}
    )
    assert duplicado.status_code == 409


def test_validacoes_do_usuario(client, como_admin):
    curta = client.post("/usuarios", headers=como_admin, json={"email": "a@b.com", "nome": "A", "senha": "123"})
    assert curta.status_code == 422
    email = client.post(
        "/usuarios", headers=como_admin, json={"email": "nao-e-email", "nome": "AB", "senha": "12345678"}
    )
    assert email.status_code == 422


def test_trocar_senha(client, anonimo, como_admin, ids_usuarios):
    client.patch(f"/usuarios/{ids_usuarios['editor']}", headers=como_admin, json={"senha": "nova-senha-1"})
    assert login(anonimo, "editor@teste.com").status_code == 401
    assert login(anonimo, "editor@teste.com", "nova-senha-1").status_code == 200


def test_nao_fica_sem_admin(client, como_admin, ids_usuarios):
    admin = ids_usuarios["admin"]
    r = client.patch(f"/usuarios/{admin}", headers=como_admin, json={"papel": "EDITOR"})
    assert r.status_code == 422 and "único administrador" in r.json()["detail"]

    # Com outro admin ativo, o primeiro pode deixar de ser admin
    client.patch(f"/usuarios/{ids_usuarios['editor']}", headers=como_admin, json={"papel": "ADMIN"})
    assert client.patch(f"/usuarios/{admin}", headers=como_admin, json={"papel": "EDITOR"}).status_code == 200


def test_admin_nao_desativa_nem_exclui_a_propria_conta(client, como_admin, ids_usuarios):
    admin = ids_usuarios["admin"]
    r = client.patch(f"/usuarios/{admin}", headers=como_admin, json={"ativo": False})
    assert r.status_code == 422 and "própria conta" in r.json()["detail"]
    r = client.delete(f"/usuarios/{admin}", headers=como_admin)
    assert r.status_code == 422 and "própria conta" in r.json()["detail"]
    # Mas pode excluir outra pessoa
    assert client.delete(f"/usuarios/{ids_usuarios['editor']}", headers=como_admin).status_code == 204


# ---------- Trocar a própria senha ----------


def test_trocar_a_propria_senha(client, anonimo):
    r = client.put("/auth/eu/senha", json={"senha_atual": "errada", "nova_senha": "outra-senha-1"})
    assert r.status_code == 422 and "senha atual" in r.json()["detail"]
    assert client.put("/auth/eu/senha", json={"senha_atual": SENHA, "nova_senha": "curta"}).status_code == 422

    assert client.put("/auth/eu/senha", json={"senha_atual": SENHA, "nova_senha": "outra-senha-1"}).status_code == 204
    assert login(anonimo, "editor@teste.com").status_code == 401
    assert login(anonimo, "editor@teste.com", "outra-senha-1").status_code == 200


def test_trocar_senha_exige_login(anonimo):
    assert anonimo.put("/auth/eu/senha", json={"senha_atual": "a", "nova_senha": "12345678"}).status_code == 401


# ---------- Configuração ----------


def test_producao_exige_chave_secreta_forte():
    with pytest.raises(ValidationError, match="SECRET_KEY"):
        Settings(ambiente="producao", _env_file=None)
    with pytest.raises(ValidationError, match="SECRET_KEY"):
        Settings(ambiente="producao", secret_key="curta", _env_file=None)
    assert Settings(ambiente="producao", secret_key="x" * 40, _env_file=None).ambiente == "producao"
