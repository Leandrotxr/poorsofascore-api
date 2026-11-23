"""Partidas, eventos (gols e cartões), classificação e artilharia."""

import pytest


@pytest.fixture()
def cenario(client, nova_federacao, nova_equipe, novo_jogador, novo_campeonato):
    """Campeonato com Flamengo, Palmeiras e Grêmio inscritos e um atacante em cada um dos dois primeiros."""
    cbf = nova_federacao()
    camp = novo_campeonato(cbf["id"])
    fla, pal, gre = nova_equipe(), nova_equipe(nome="Palmeiras"), nova_equipe(nome="Grêmio")
    for e in (fla, pal, gre):
        client.put(f"/campeonatos/{camp['id']}/equipes/{e['id']}")
    pedro, flaco = novo_jogador(nome="Pedro", posicao="ATACANTE"), novo_jogador(nome="Flaco López", posicao="ATACANTE")
    client.put(f"/equipes/{fla['id']}/jogadores/{pedro['id']}")
    client.put(f"/equipes/{pal['id']}/jogadores/{flaco['id']}")
    return {"camp": camp, "fla": fla, "pal": pal, "gre": gre, "pedro": pedro, "flaco": flaco}


def criar_partida(client, c, mandante, visitante, rodada=1):
    r = client.post(
        "/partidas",
        json={
            "campeonato_id": c["camp"]["id"],
            "rodada": rodada,
            "mandante_id": c[mandante]["id"],
            "visitante_id": c[visitante]["id"],
        },
    )
    assert r.status_code == 201, r.text
    return r.json()


def gol(client, partida, jogador, minuto=10, tipo="GOL"):
    r = client.post(
        f"/partidas/{partida['id']}/eventos", json={"tipo": tipo, "minuto": minuto, "jogador_id": jogador["id"]}
    )
    assert r.status_code == 201, r.text
    return r.json()


def status(client, partida, novo):
    r = client.patch(f"/partidas/{partida['id']}", json={"status": novo})
    assert r.status_code == 200, r.text
    return r.json()


# ---------- Partidas ----------


def test_partida_nasce_agendada_e_zerada(client, cenario):
    p = criar_partida(client, cenario, "fla", "pal")
    assert p["status"] == "AGENDADA"
    assert (p["gols_mandante"], p["gols_visitante"]) == (0, 0)
    assert p["mandante"]["nome"] == "Flamengo" and p["campeonato"]["temporada"] == 2026


def test_equipes_precisam_ser_diferentes_e_inscritas(client, cenario, nova_equipe):
    base = {"campeonato_id": cenario["camp"]["id"], "rodada": 1}
    fla = cenario["fla"]["id"]
    assert client.post("/partidas", json={**base, "mandante_id": fla, "visitante_id": fla}).status_code == 422

    fora = nova_equipe(nome="Bahia")
    r = client.post("/partidas", json={**base, "mandante_id": fla, "visitante_id": fora["id"]})
    assert r.status_code == 422
    assert "Bahia não está inscrita" in r.json()["detail"]


def test_evento_so_depois_de_comecar(client, cenario):
    p = criar_partida(client, cenario, "fla", "pal")
    r = client.post(
        f"/partidas/{p['id']}/eventos", json={"tipo": "GOL", "minuto": 5, "jogador_id": cenario["pedro"]["id"]}
    )
    assert r.status_code == 422
    assert "ainda não começou" in r.json()["detail"]


def test_placar_vem_dos_gols_inclusive_gol_contra(client, cenario):
    p = criar_partida(client, cenario, "fla", "pal")
    status(client, p, "EM_ANDAMENTO")
    gol(client, p, cenario["pedro"], 10)
    gol(client, p, cenario["pedro"], 50)
    gol(client, p, cenario["flaco"], 70)
    r = gol(client, p, cenario["flaco"], 89, tipo="GOL_CONTRA")  # gol contra do Palmeiras = gol do Flamengo

    assert (r["gols_mandante"], r["gols_visitante"]) == (3, 1)
    assert [e["minuto"] for e in r["eventos"]] == [10, 50, 70, 89]
    assert r["eventos"][0]["jogador"]["nome"] == "Pedro"


def test_cartao_nao_muda_placar_e_jogador_de_fora_nao_entra(client, cenario, novo_jogador):
    p = criar_partida(client, cenario, "fla", "pal")
    status(client, p, "EM_ANDAMENTO")
    r = gol(client, p, cenario["pedro"], 30, tipo="CARTAO_AMARELO")
    assert (r["gols_mandante"], r["gols_visitante"]) == (0, 0)

    livre = novo_jogador(nome="Sem clube")
    r = client.post(f"/partidas/{p['id']}/eventos", json={"tipo": "GOL", "minuto": 1, "jogador_id": livre["id"]})
    assert r.status_code == 422


def test_remover_evento_corrige_placar(client, cenario):
    p = criar_partida(client, cenario, "fla", "pal")
    status(client, p, "EM_ANDAMENTO")
    r = gol(client, p, cenario["pedro"])
    r = client.delete(f"/partidas/{p['id']}/eventos/{r['eventos'][0]['id']}")
    assert r.status_code == 200 and r.json()["gols_mandante"] == 0


def test_placar_sobrevive_a_exclusao_do_jogador(client, cenario):
    p = criar_partida(client, cenario, "fla", "pal")
    status(client, p, "EM_ANDAMENTO")
    gol(client, p, cenario["pedro"])
    client.delete(f"/jogadores/{cenario['pedro']['id']}")

    r = client.get(f"/partidas/{p['id']}").json()
    assert r["gols_mandante"] == 1
    assert r["eventos"][0]["jogador"] is None and r["eventos"][0]["equipe"]["nome"] == "Flamengo"


def test_regras_de_edicao(client, cenario):
    p = criar_partida(client, cenario, "fla", "pal")
    status(client, p, "EM_ANDAMENTO")
    gol(client, p, cenario["pedro"])
    # Com eventos: não troca equipes nem volta para AGENDADA
    assert client.patch(f"/partidas/{p['id']}", json={"visitante_id": cenario["gre"]["id"]}).status_code == 422
    assert client.patch(f"/partidas/{p['id']}", json={"status": "AGENDADA"}).status_code == 422
    r = client.patch(f"/partidas/{p['id']}", json={"local": "Maracanã", "rodada": 2})
    assert r.status_code == 200 and r.json()["local"] == "Maracanã"


def test_filtros_da_listagem(client, cenario):
    criar_partida(client, cenario, "fla", "pal", rodada=1)
    criar_partida(client, cenario, "pal", "gre", rodada=2)

    def ids(**params):
        return [
            (p["mandante"]["nome"], p["visitante"]["nome"])
            for p in client.get("/partidas", params=params).json()["items"]
        ]

    assert ids(campeonato_id=cenario["camp"]["id"]) == [("Flamengo", "Palmeiras"), ("Palmeiras", "Grêmio")]
    assert ids(equipe_id=cenario["gre"]["id"]) == [("Palmeiras", "Grêmio")]
    assert ids(rodada=1) == [("Flamengo", "Palmeiras")]


def test_equipe_com_partidas_nao_pode_ser_apagada_nem_desinscrita(client, cenario):
    criar_partida(client, cenario, "fla", "pal")
    r = client.delete(f"/equipes/{cenario['fla']['id']}")
    assert r.status_code == 409 and "partidas" in r.json()["detail"]
    r = client.delete(f"/campeonatos/{cenario['camp']['id']}/equipes/{cenario['fla']['id']}")
    assert r.status_code == 409
    # A equipe sem jogos ainda pode sair
    assert client.delete(f"/campeonatos/{cenario['camp']['id']}/equipes/{cenario['gre']['id']}").status_code == 200


def test_apagar_campeonato_apaga_partidas(client, cenario):
    p = criar_partida(client, cenario, "fla", "pal")
    assert client.delete(f"/campeonatos/{cenario['camp']['id']}").status_code == 204
    assert client.get(f"/partidas/{p['id']}").status_code == 404


# ---------- Classificação e artilharia ----------


def test_classificacao(client, cenario):
    # Rodada 1: Flamengo 2 x 1 Palmeiras (encerrada)
    p1 = criar_partida(client, cenario, "fla", "pal", rodada=1)
    status(client, p1, "EM_ANDAMENTO")
    gol(client, p1, cenario["pedro"], 10)
    gol(client, p1, cenario["pedro"], 20)
    gol(client, p1, cenario["flaco"], 30)
    status(client, p1, "ENCERRADA")
    # Rodada 2: Palmeiras 0 x 0 Grêmio (encerrada)
    p2 = criar_partida(client, cenario, "pal", "gre", rodada=2)
    status(client, p2, "EM_ANDAMENTO")
    status(client, p2, "ENCERRADA")
    # Em andamento: não conta na tabela
    p3 = criar_partida(client, cenario, "gre", "fla", rodada=3)
    status(client, p3, "EM_ANDAMENTO")

    tabela = client.get(f"/campeonatos/{cenario['camp']['id']}/classificacao").json()
    resumo = [(t["posicao"], t["equipe"]["nome"], t["pontos"], t["jogos"], t["saldo"]) for t in tabela]
    assert resumo == [
        (1, "Flamengo", 3, 1, 1),
        (2, "Grêmio", 1, 1, 0),  # empata em pontos com o Palmeiras, mas tem saldo melhor
        (3, "Palmeiras", 1, 2, -1),
    ]
    assert tabela[0]["aproveitamento"] == 100.0
    assert (tabela[2]["vitorias"], tabela[2]["empates"], tabela[2]["derrotas"]) == (0, 1, 1)


def test_classificacao_sem_jogos_lista_todas_zeradas(client, cenario):
    tabela = client.get(f"/campeonatos/{cenario['camp']['id']}/classificacao").json()
    assert [t["equipe"]["nome"] for t in tabela] == [
        "Flamengo",
        "Grêmio",
        "Palmeiras",
    ]  # empate total: ordem alfabética
    assert all(t["pontos"] == 0 and t["aproveitamento"] == 0 for t in tabela)


def test_artilharia_ignora_gol_contra_e_partida_agendada(client, cenario):
    p = criar_partida(client, cenario, "fla", "pal")
    status(client, p, "EM_ANDAMENTO")
    gol(client, p, cenario["pedro"], 10)
    gol(client, p, cenario["pedro"], 20)
    gol(client, p, cenario["flaco"], 30)
    gol(client, p, cenario["flaco"], 40, tipo="GOL_CONTRA")

    art = client.get(f"/campeonatos/{cenario['camp']['id']}/artilheiros").json()
    assert [(a["jogador"]["nome"], a["equipe"]["nome"], a["gols"]) for a in art] == [
        ("Pedro", "Flamengo", 2),
        ("Flaco López", "Palmeiras", 1),
    ]


def test_estatisticas_de_campeonato_inexistente(client):
    assert client.get("/campeonatos/999/classificacao").status_code == 404
    assert client.get("/campeonatos/999/artilheiros").status_code == 404


def test_resumo_conta_partidas(client, cenario):
    criar_partida(client, cenario, "fla", "pal")
    assert client.get("/resumo").json()["partidas"] == 1
