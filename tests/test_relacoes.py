"""Testes das relações Equipe 1:N Jogadores e Equipe 1:1 Técnico."""


# ---------------- 1:N  Equipe -> Jogadores ----------------


def test_contratar_varios_jogadores(client, nova_equipe, novo_jogador):
    equipe = nova_equipe()
    j1 = novo_jogador(nome="Arrascaeta")
    j2 = novo_jogador(nome="Pedro", posicao="ATACANTE")

    client.put(f"/equipes/{equipe['id']}/jogadores/{j1['id']}")
    r = client.put(f"/equipes/{equipe['id']}/jogadores/{j2['id']}")

    assert r.status_code == 200
    assert {j["nome"] for j in r.json()["jogadores"]} == {"Arrascaeta", "Pedro"}
    assert client.get(f"/jogadores/{j1['id']}").json()["equipe"]["nome"] == "Flamengo"


def test_jogador_nao_pode_estar_em_duas_equipes(client, nova_equipe, novo_jogador):
    fla, pal = nova_equipe("Flamengo"), nova_equipe("Palmeiras")
    j = novo_jogador()
    client.put(f"/equipes/{fla['id']}/jogadores/{j['id']}")

    r = client.put(f"/equipes/{pal['id']}/jogadores/{j['id']}")
    assert r.status_code == 409


def test_dispensar_jogador(client, nova_equipe, novo_jogador):
    equipe, j = nova_equipe(), novo_jogador()
    client.put(f"/equipes/{equipe['id']}/jogadores/{j['id']}")

    r = client.delete(f"/equipes/{equipe['id']}/jogadores/{j['id']}")
    assert r.status_code == 200 and r.json()["jogadores"] == []
    assert client.get(f"/jogadores/{j['id']}").json()["equipe"] is None


def test_dispensar_jogador_de_outra_equipe_falha(client, nova_equipe, novo_jogador):
    equipe, j = nova_equipe(), novo_jogador()
    assert client.delete(f"/equipes/{equipe['id']}/jogadores/{j['id']}").status_code == 422


def test_filtro_sem_equipe(client, nova_equipe, novo_jogador):
    equipe = nova_equipe()
    j1, _ = novo_jogador(nome="Contratado"), novo_jogador(nome="Livre")
    client.put(f"/equipes/{equipe['id']}/jogadores/{j1['id']}")

    livres = client.get("/jogadores", params={"sem_equipe": True}).json()
    assert [j["nome"] for j in livres] == ["Livre"]


def test_apagar_equipe_libera_jogadores_e_tecnico(client, nova_equipe, novo_jogador, novo_tecnico):
    equipe, j, t = nova_equipe(), novo_jogador(), novo_tecnico()
    client.put(f"/equipes/{equipe['id']}/jogadores/{j['id']}")
    client.put(f"/equipes/{equipe['id']}/tecnico/{t['id']}")

    assert client.delete(f"/equipes/{equipe['id']}").status_code == 204
    assert client.get(f"/jogadores/{j['id']}").json()["equipe"] is None
    assert client.get(f"/tecnicos/{t['id']}").json()["equipe"] is None


# ---------------- 1:1  Equipe -> Técnico ----------------


def test_definir_tecnico(client, nova_equipe, novo_tecnico):
    equipe, t = nova_equipe(), novo_tecnico()
    r = client.put(f"/equipes/{equipe['id']}/tecnico/{t['id']}")

    assert r.status_code == 200
    assert r.json()["tecnico"]["nome"] == "Filipe Luís"
    assert client.get(f"/tecnicos/{t['id']}").json()["equipe"]["id"] == equipe["id"]


def test_trocar_tecnico_libera_o_anterior(client, nova_equipe, novo_tecnico):
    equipe = nova_equipe()
    antigo, novo = novo_tecnico("Tite"), novo_tecnico("Filipe Luís")
    client.put(f"/equipes/{equipe['id']}/tecnico/{antigo['id']}")

    r = client.put(f"/equipes/{equipe['id']}/tecnico/{novo['id']}")
    assert r.status_code == 200
    assert r.json()["tecnico"]["nome"] == "Filipe Luís"
    assert client.get(f"/tecnicos/{antigo['id']}").json()["equipe"] is None


def test_tecnico_nao_comanda_duas_equipes(client, nova_equipe, novo_tecnico):
    fla, pal = nova_equipe("Flamengo"), nova_equipe("Palmeiras")
    t = novo_tecnico()
    client.put(f"/equipes/{fla['id']}/tecnico/{t['id']}")

    assert client.put(f"/equipes/{pal['id']}/tecnico/{t['id']}").status_code == 409


def test_remover_tecnico(client, nova_equipe, novo_tecnico):
    equipe, t = nova_equipe(), novo_tecnico()
    client.put(f"/equipes/{equipe['id']}/tecnico/{t['id']}")

    r = client.delete(f"/equipes/{equipe['id']}/tecnico")
    assert r.status_code == 200 and r.json()["tecnico"] is None
    assert client.delete(f"/equipes/{equipe['id']}/tecnico").status_code == 422
