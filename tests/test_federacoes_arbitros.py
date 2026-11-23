"""Federações e árbitros: cadastros e as relações Federação 1:N Equipes e Federação 1:N Árbitros."""


# ---------------- Cadastros ----------------


def test_cria_federacao_sem_cnpj_e_sigla_maiuscula(client):
    r = client.post(
        "/federacoes",
        json={
            "nome": "Fédération Internationale de Football Association",
            "sigla": "fifa",
            "abrangencia": "MUNDIAL",
            "fundacao": 1904,
            "sede": "Zurique",
        },
    )
    assert r.status_code == 201, r.text
    assert r.json()["sigla"] == "FIFA" and r.json()["cnpj"] is None


def test_federacao_com_cnpj_valido_e_invalido(nova_federacao, client):
    assert nova_federacao(cnpj="60.674.644/0001-97")["cnpj"] == "60674644000197"
    r = client.post(
        "/federacoes",
        json={
            "nome": "Outra",
            "sigla": "OUT",
            "abrangencia": "ESTADUAL",
            "fundacao": 1941,
            "sede": "SP",
            "cnpj": "11.111.111/1111-11",
        },
    )
    assert r.status_code == 422


def test_rejeita_sigla_duplicada_e_abrangencia_invalida(client, nova_federacao):
    nova_federacao()
    base = {"nome": "Outra Confederação", "fundacao": 1914, "sede": "RJ"}
    assert client.post("/federacoes", json={**base, "sigla": "cbf", "abrangencia": "NACIONAL"}).status_code == 409
    assert client.post("/federacoes", json={**base, "sigla": "XYZ", "abrangencia": "GALACTICA"}).status_code == 422


def test_filtro_federacao_por_abrangencia_e_sigla(client, nova_federacao):
    nova_federacao()
    nova_federacao(nome="Union of European Football Associations", sigla="UEFA", abrangencia="CONTINENTAL")
    assert [f["sigla"] for f in client.get("/federacoes", params={"abrangencia": "CONTINENTAL"}).json()["items"]] == [
        "UEFA"
    ]
    assert [f["sigla"] for f in client.get("/federacoes", params={"nome": "uef"}).json()["items"]] == ["UEFA"]


def test_arbitro_cpf_mascarado_e_validacoes(client, novo_arbitro):
    assert novo_arbitro()["cpf"] == "***.***.***-09"
    base = {"nome": "Fulano", "cpf": "529.982.247-25", "nacionalidade": "BR"}
    assert client.post("/arbitros", json={**base, "idade": 30, "funcao": "BANDEIRINHA"}).status_code == 422
    assert client.post("/arbitros", json={**base, "idade": 17, "funcao": "VAR"}).status_code == 422


def test_mesmo_cpf_pode_ser_jogador_e_arbitro(novo_jogador, novo_arbitro):
    """A classe mãe é abstrata: cada papel tem sua tabela, então o CPF é único por papel."""
    assert novo_jogador()["cpf"] == novo_arbitro()["cpf"]


# ---------------- 1:N  Federação -> Equipes ----------------


def test_filiar_equipe(client, nova_federacao, nova_equipe):
    cbf, fla = nova_federacao(), nova_equipe()
    r = client.put(f"/federacoes/{cbf['id']}/equipes/{fla['id']}")

    assert r.status_code == 200
    assert [e["nome"] for e in r.json()["equipes"]] == ["Flamengo"]
    assert client.get(f"/equipes/{fla['id']}").json()["federacao"] == {
        "id": cbf["id"],
        "nome": cbf["nome"],
        "sigla": "CBF",
    }


def test_equipe_nao_pode_estar_em_duas_federacoes(client, nova_federacao, nova_equipe):
    cbf, uefa = nova_federacao(), nova_federacao(nome="UEFA", sigla="UEFA", abrangencia="CONTINENTAL")
    fla = nova_equipe()
    client.put(f"/federacoes/{cbf['id']}/equipes/{fla['id']}")

    assert client.put(f"/federacoes/{uefa['id']}/equipes/{fla['id']}").status_code == 409
    assert client.put(f"/federacoes/{cbf['id']}/equipes/{fla['id']}").status_code == 422


def test_desfiliar_equipe(client, nova_federacao, nova_equipe):
    cbf, fla = nova_federacao(), nova_equipe()
    client.put(f"/federacoes/{cbf['id']}/equipes/{fla['id']}")

    r = client.delete(f"/federacoes/{cbf['id']}/equipes/{fla['id']}")
    assert r.status_code == 200 and r.json()["equipes"] == []
    assert client.get(f"/equipes/{fla['id']}").json()["federacao"] is None
    assert client.delete(f"/federacoes/{cbf['id']}/equipes/{fla['id']}").status_code == 422


# ---------------- 1:N  Federação -> Árbitros ----------------


def test_vincular_varios_arbitros(client, nova_federacao, novo_arbitro):
    cbf = nova_federacao()
    a1, a2 = novo_arbitro(), novo_arbitro(nome="Bruno Pires", funcao="ASSISTENTE")
    client.put(f"/federacoes/{cbf['id']}/arbitros/{a1['id']}")
    r = client.put(f"/federacoes/{cbf['id']}/arbitros/{a2['id']}")

    assert {a["funcao"] for a in r.json()["arbitros"]} == {"CENTRAL", "ASSISTENTE"}
    assert client.get(f"/arbitros/{a1['id']}").json()["federacao"]["sigla"] == "CBF"


def test_filtro_arbitros_sem_federacao_e_por_funcao(client, nova_federacao, novo_arbitro):
    cbf = nova_federacao()
    a1 = novo_arbitro(nome="Vinculado")
    novo_arbitro(nome="Livre", funcao="VAR")
    client.put(f"/federacoes/{cbf['id']}/arbitros/{a1['id']}")

    assert [a["nome"] for a in client.get("/arbitros", params={"sem_federacao": True}).json()["items"]] == ["Livre"]
    assert [a["nome"] for a in client.get("/arbitros", params={"funcao": "VAR"}).json()["items"]] == ["Livre"]


def test_apagar_federacao_libera_equipes_e_arbitros(client, nova_federacao, nova_equipe, novo_arbitro):
    cbf, fla, arb = nova_federacao(), nova_equipe(), novo_arbitro()
    client.put(f"/federacoes/{cbf['id']}/equipes/{fla['id']}")
    client.put(f"/federacoes/{cbf['id']}/arbitros/{arb['id']}")

    assert client.delete(f"/federacoes/{cbf['id']}").status_code == 204
    assert client.get(f"/equipes/{fla['id']}").json()["federacao"] is None
    assert client.get(f"/arbitros/{arb['id']}").json()["federacao"] is None
