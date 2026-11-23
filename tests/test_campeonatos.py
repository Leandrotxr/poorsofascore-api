"""Campeonatos: Federação 1:N Campeonatos e Campeonato N:N Equipes."""


# ---------------- Cadastro e Federação 1:N Campeonatos ----------------

def test_cria_campeonato_com_organizadora(client, nova_federacao, novo_campeonato):
    cbf = nova_federacao()
    c = novo_campeonato(cbf["id"], data_inicio="2026-04-12", data_fim="2026-12-06")
    assert c["federacao"]["sigla"] == "CBF" and c["equipes"] == []
    assert [x["nome"] for x in client.get(f"/federacoes/{cbf['id']}").json()["campeonatos"]] == ["Brasileirão Série A"]


def test_federacao_organizadora_obrigatoria_e_existente(client):
    base = {"nome": "Copa X", "temporada": 2026, "formato": "MATA_MATA"}
    assert client.post("/campeonatos", json=base).status_code == 422
    assert client.post("/campeonatos", json={**base, "federacao_id": 999}).status_code == 404


def test_rejeita_datas_invertidas_e_formato_invalido(client, nova_federacao):
    cbf = nova_federacao()
    base = {"nome": "Copa X", "temporada": 2026, "federacao_id": cbf["id"]}
    r = client.post("/campeonatos", json={**base, "formato": "MATA_MATA", "data_inicio": "2026-05-01", "data_fim": "2026-04-01"})
    assert r.status_code == 422
    assert client.post("/campeonatos", json={**base, "formato": "AMISTOSO"}).status_code == 422


def test_mesmo_nome_em_temporadas_diferentes(client, nova_federacao, novo_campeonato):
    cbf = nova_federacao()
    novo_campeonato(cbf["id"], temporada=2025)
    novo_campeonato(cbf["id"], temporada=2026)
    r = client.post(
        "/campeonatos",
        json={"nome": "Brasileirão Série A", "temporada": 2026, "formato": "PONTOS_CORRIDOS", "federacao_id": cbf["id"]},
    )
    assert r.status_code == 409


def test_patch_confere_datas_com_valores_salvos(client, nova_federacao, novo_campeonato):
    c = novo_campeonato(nova_federacao()["id"], data_inicio="2026-04-12")
    assert client.patch(f"/campeonatos/{c['id']}", json={"data_fim": "2026-01-01"}).status_code == 422
    assert client.patch(f"/campeonatos/{c['id']}", json={"data_fim": "2026-12-06"}).status_code == 200


def test_nao_apaga_federacao_que_organiza_campeonato(client, nova_federacao, novo_campeonato):
    cbf = nova_federacao()
    c = novo_campeonato(cbf["id"])
    assert client.delete(f"/federacoes/{cbf['id']}").status_code == 409
    client.delete(f"/campeonatos/{c['id']}")
    assert client.delete(f"/federacoes/{cbf['id']}").status_code == 204


def test_filtros(client, nova_federacao, novo_campeonato):
    cbf = nova_federacao()
    uefa = nova_federacao(nome="UEFA", sigla="UEFA", abrangencia="CONTINENTAL")
    novo_campeonato(cbf["id"], temporada=2025)
    novo_campeonato(uefa["id"], nome="Champions League", formato="GRUPOS_E_MATA_MATA")
    assert [c["nome"] for c in client.get("/campeonatos", params={"federacao_id": uefa["id"]}).json()] == ["Champions League"]
    assert [c["temporada"] for c in client.get("/campeonatos", params={"temporada": 2025}).json()] == [2025]


# ---------------- N:N  Campeonato <-> Equipes ----------------

def test_inscrever_varias_equipes(client, nova_federacao, nova_equipe, novo_campeonato):
    c = novo_campeonato(nova_federacao()["id"])
    fla, pal = nova_equipe("Flamengo"), nova_equipe("Palmeiras")
    client.put(f"/campeonatos/{c['id']}/equipes/{fla['id']}")
    r = client.put(f"/campeonatos/{c['id']}/equipes/{pal['id']}")
    assert r.status_code == 200
    assert [e["nome"] for e in r.json()["equipes"]] == ["Flamengo", "Palmeiras"]


def test_equipe_em_varios_campeonatos(client, nova_federacao, nova_equipe, novo_campeonato):
    cbf = nova_federacao()
    brasileirao, copa = novo_campeonato(cbf["id"]), novo_campeonato(cbf["id"], nome="Copa do Brasil", formato="MATA_MATA")
    fla = nova_equipe()
    client.put(f"/campeonatos/{brasileirao['id']}/equipes/{fla['id']}")
    client.put(f"/campeonatos/{copa['id']}/equipes/{fla['id']}")
    nomes = {c["nome"] for c in client.get(f"/equipes/{fla['id']}").json()["campeonatos"]}
    assert nomes == {"Brasileirão Série A", "Copa do Brasil"}


def test_nao_inscreve_duas_vezes_e_remove(client, nova_federacao, nova_equipe, novo_campeonato):
    c, fla = novo_campeonato(nova_federacao()["id"]), nova_equipe()
    client.put(f"/campeonatos/{c['id']}/equipes/{fla['id']}")
    assert client.put(f"/campeonatos/{c['id']}/equipes/{fla['id']}").status_code == 422

    r = client.delete(f"/campeonatos/{c['id']}/equipes/{fla['id']}")
    assert r.status_code == 200 and r.json()["equipes"] == []
    assert client.delete(f"/campeonatos/{c['id']}/equipes/{fla['id']}").status_code == 422


def test_apagar_equipe_ou_campeonato_remove_so_a_inscricao(client, nova_federacao, nova_equipe, novo_campeonato):
    cbf = nova_federacao()
    c1, c2 = novo_campeonato(cbf["id"]), novo_campeonato(cbf["id"], nome="Copa do Brasil", formato="MATA_MATA")
    fla, pal = nova_equipe("Flamengo"), nova_equipe("Palmeiras")
    for c in (c1, c2):
        client.put(f"/campeonatos/{c['id']}/equipes/{fla['id']}")
    client.put(f"/campeonatos/{c1['id']}/equipes/{pal['id']}")

    assert client.delete(f"/equipes/{fla['id']}").status_code == 204
    assert [e["nome"] for e in client.get(f"/campeonatos/{c1['id']}").json()["equipes"]] == ["Palmeiras"]

    assert client.delete(f"/campeonatos/{c1['id']}").status_code == 204
    assert client.get(f"/equipes/{pal['id']}").json()["campeonatos"] == []
