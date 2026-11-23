"""Data de nascimento (idade calculada) e histórico de contratos de jogadores e técnicos."""

from datetime import date, timedelta

from app.core.datas import calcular_idade
from tests.auxiliares import nascido_ha

# ---------- Idade ----------


def test_calcular_idade_so_conta_depois_do_aniversario():
    assert calcular_idade(date(2000, 6, 15), referencia=date(2026, 6, 14)) == 25
    assert calcular_idade(date(2000, 6, 15), referencia=date(2026, 6, 15)) == 26


def test_idade_sai_calculada(novo_jogador):
    j = novo_jogador(idade=31)
    assert j["idade"] == 31
    assert j["data_nascimento"] == nascido_ha(31)


def test_faixa_etaria_e_conferida_na_entrada(client):
    base = {"nome": "Fulano", "cpf": "123.456.789-09", "nacionalidade": "BR", "posicao": "MEIA"}
    r = client.post("/jogadores", json={**base, "data_nascimento": nascido_ha(13)})
    assert r.status_code == 422
    assert "entre 14 e 60 anos" in r.json()["detail"][0]["msg"]

    futuro = (date.today() + timedelta(days=1)).isoformat()
    assert client.post("/jogadores", json={**base, "data_nascimento": futuro}).status_code == 422


def test_editar_data_de_nascimento(client, novo_jogador):
    j = novo_jogador()
    r = client.patch(f"/jogadores/{j['id']}", json={"data_nascimento": nascido_ha(20)})
    assert r.status_code == 200
    assert r.json()["idade"] == 20


# ---------- Contratos de jogador ----------


def test_contratar_abre_contrato_e_dispensar_fecha(client, nova_equipe, novo_jogador):
    fla = nova_equipe()
    j = novo_jogador()
    r = client.put(f"/equipes/{fla['id']}/jogadores/{j['id']}", json={"numero_camisa": 10})
    assert r.status_code == 200
    assert r.json()["jogadores"][0]["numero_camisa"] == 10
    assert client.get(f"/jogadores/{j['id']}").json()["numero_camisa"] == 10

    [contrato] = client.get(f"/jogadores/{j['id']}/contratos").json()
    assert contrato["equipe"]["nome"] == "Flamengo"
    assert contrato["inicio"] == date.today().isoformat()
    assert contrato["fim"] is None

    client.delete(f"/equipes/{fla['id']}/jogadores/{j['id']}")
    [contrato] = client.get(f"/jogadores/{j['id']}/contratos").json()
    assert contrato["fim"] == date.today().isoformat()
    assert client.get(f"/jogadores/{j['id']}").json()["numero_camisa"] is None


def test_historico_guarda_varias_passagens(client, nova_equipe, novo_jogador):
    fla, pal = nova_equipe(), nova_equipe(nome="Palmeiras")
    j = novo_jogador()
    ontem = (date.today() - timedelta(days=30)).isoformat()
    client.put(f"/equipes/{fla['id']}/jogadores/{j['id']}", json={"inicio": ontem})
    client.delete(f"/equipes/{fla['id']}/jogadores/{j['id']}")
    client.put(f"/equipes/{pal['id']}/jogadores/{j['id']}")

    historico = client.get(f"/jogadores/{j['id']}/contratos").json()
    assert [c["equipe"]["nome"] for c in historico] == ["Palmeiras", "Flamengo"]  # mais recente primeiro
    assert historico[0]["fim"] is None and historico[1]["fim"] is not None


def test_contratar_sem_corpo_continua_funcionando(client, nova_equipe, novo_jogador):
    fla, j = nova_equipe(), novo_jogador()
    assert client.put(f"/equipes/{fla['id']}/jogadores/{j['id']}").status_code == 200


def test_camisa_repetida_na_mesma_equipe(client, nova_equipe, novo_jogador):
    fla = nova_equipe()
    a, b = novo_jogador(nome="Arrascaeta"), novo_jogador(nome="Gerson")
    client.put(f"/equipes/{fla['id']}/jogadores/{a['id']}", json={"numero_camisa": 10})
    r = client.put(f"/equipes/{fla['id']}/jogadores/{b['id']}", json={"numero_camisa": 10})
    assert r.status_code == 409
    assert "já é de Arrascaeta" in r.json()["detail"]

    # Depois que o dono sai, a camisa fica livre
    client.delete(f"/equipes/{fla['id']}/jogadores/{a['id']}")
    assert client.put(f"/equipes/{fla['id']}/jogadores/{b['id']}", json={"numero_camisa": 10}).status_code == 200


def test_camisa_invalida_e_inicio_no_futuro(client, nova_equipe, novo_jogador):
    fla, j = nova_equipe(), novo_jogador()
    url = f"/equipes/{fla['id']}/jogadores/{j['id']}"
    assert client.put(url, json={"numero_camisa": 100}).status_code == 422
    amanha = (date.today() + timedelta(days=1)).isoformat()
    assert client.put(url, json={"inicio": amanha}).status_code == 422


def test_contrato_nao_sobrepoe_o_anterior(client, nova_equipe, novo_jogador):
    fla, pal = nova_equipe(), nova_equipe(nome="Palmeiras")
    j = novo_jogador()
    client.put(f"/equipes/{fla['id']}/jogadores/{j['id']}")
    client.delete(f"/equipes/{fla['id']}/jogadores/{j['id']}")  # termina hoje

    antes = (date.today() - timedelta(days=10)).isoformat()
    r = client.put(f"/equipes/{pal['id']}/jogadores/{j['id']}", json={"inicio": antes})
    assert r.status_code == 422
    assert "não pode começar antes" in r.json()["detail"]


def test_apagar_jogador_apaga_o_historico(client, nova_equipe, novo_jogador):
    fla, j = nova_equipe(), novo_jogador()
    client.put(f"/equipes/{fla['id']}/jogadores/{j['id']}")
    assert client.delete(f"/jogadores/{j['id']}").status_code == 204
    assert client.get(f"/jogadores/{j['id']}/contratos").status_code == 404


# ---------- Contratos de técnico ----------


def test_trocar_tecnico_fecha_o_contrato_do_anterior(client, nova_equipe, novo_tecnico):
    fla = nova_equipe()
    t1, t2 = novo_tecnico(nome="Tite"), novo_tecnico(nome="Filipe Luís")
    client.put(f"/equipes/{fla['id']}/tecnico/{t1['id']}")
    client.put(f"/equipes/{fla['id']}/tecnico/{t2['id']}")

    [antigo] = client.get(f"/tecnicos/{t1['id']}/contratos").json()
    [atual] = client.get(f"/tecnicos/{t2['id']}/contratos").json()
    assert antigo["fim"] == date.today().isoformat()
    assert atual["fim"] is None and atual["equipe"]["nome"] == "Flamengo"

    client.delete(f"/equipes/{fla['id']}/tecnico")
    [atual] = client.get(f"/tecnicos/{t2['id']}/contratos").json()
    assert atual["fim"] is not None
