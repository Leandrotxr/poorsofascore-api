"""Paginação, filtros das listagens e o resumo com os totais."""


def test_paginacao_traz_total_e_respeita_skip_limit(client, novo_jogador):
    for nome in ["Ana", "Bia", "Caio", "Davi", "Eva"]:
        novo_jogador(nome=nome)

    r = client.get("/jogadores", params={"skip": 2, "limit": 2}).json()
    assert r["total"] == 5
    assert (r["skip"], r["limit"]) == (2, 2)
    assert [j["nome"] for j in r["items"]] == ["Caio", "Davi"]


def test_total_considera_os_filtros(client, novo_jogador):
    novo_jogador(nome="Pedro", posicao="ATACANTE")
    novo_jogador(nome="Gerson", posicao="VOLANTE")
    novo_jogador(nome="Bruno Henrique", posicao="ATACANTE")

    r = client.get("/jogadores", params={"posicao": "ATACANTE", "limit": 1}).json()
    assert r["total"] == 2
    assert len(r["items"]) == 1


def test_limite_maximo_por_pagina(client):
    assert client.get("/equipes", params={"limit": 101}).status_code == 422


def test_lista_de_equipes_traz_tecnico_e_elenco(client, nova_equipe, novo_jogador, novo_tecnico):
    fla = nova_equipe()
    j, t = novo_jogador(), novo_tecnico()
    client.put(f"/equipes/{fla['id']}/jogadores/{j['id']}")
    client.put(f"/equipes/{fla['id']}/tecnico/{t['id']}")

    [equipe] = client.get("/equipes").json()["items"]
    assert equipe["tecnico"]["nome"] == t["nome"]
    assert [x["posicao"] for x in equipe["jogadores"]] == ["MEIA"]


def test_filtros_de_equipe_sem_federacao_e_sem_tecnico(client, nova_federacao, nova_equipe, novo_tecnico):
    cbf = nova_federacao()
    fla, pal = nova_equipe(), nova_equipe(nome="Palmeiras")
    client.put(f"/federacoes/{cbf['id']}/equipes/{fla['id']}")
    client.put(f"/equipes/{pal['id']}/tecnico/{novo_tecnico()['id']}")

    def nomes(**params):
        return [e["nome"] for e in client.get("/equipes", params=params).json()["items"]]

    assert nomes(sem_federacao=True) == ["Palmeiras"]
    assert nomes(federacao_id=cbf["id"]) == ["Flamengo"]
    assert nomes(sem_tecnico=True) == ["Flamengo"]


def test_filtro_de_jogadores_por_equipe(client, nova_equipe, novo_jogador):
    fla = nova_equipe()
    j = novo_jogador(nome="Contratado")
    novo_jogador(nome="Livre")
    client.put(f"/equipes/{fla['id']}/jogadores/{j['id']}")

    r = client.get("/jogadores", params={"equipe_id": fla["id"]}).json()
    assert [x["nome"] for x in r["items"]] == ["Contratado"]


def test_filtro_de_arbitros_por_federacao(client, nova_federacao, novo_arbitro):
    cbf = nova_federacao()
    a = novo_arbitro(nome="Vinculado")
    novo_arbitro(nome="Livre")
    client.put(f"/federacoes/{cbf['id']}/arbitros/{a['id']}")

    r = client.get("/arbitros", params={"federacao_id": cbf["id"]}).json()
    assert [x["nome"] for x in r["items"]] == ["Vinculado"]


def test_resumo(client, nova_federacao, nova_equipe, novo_jogador, novo_campeonato):
    assert client.get("/resumo").json() == {
        "federacoes": 0,
        "campeonatos": 0,
        "equipes": 0,
        "jogadores": 0,
        "tecnicos": 0,
        "arbitros": 0,
    }
    cbf = nova_federacao()
    novo_campeonato(cbf["id"])
    nova_equipe()
    novo_jogador()
    novo_jogador(nome="Outro")

    r = client.get("/resumo").json()
    assert (r["federacoes"], r["campeonatos"], r["equipes"], r["jogadores"], r["tecnicos"]) == (1, 1, 1, 2, 0)
