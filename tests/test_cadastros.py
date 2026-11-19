def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_cria_equipe_e_normaliza_cnpj(client, nova_equipe):
    equipe = nova_equipe()
    assert equipe["cnpj"] == "11222333000181"
    assert client.get("/equipes").json()[0]["nome"] == "Flamengo"


def test_rejeita_cnpj_invalido(client):
    r = client.post("/equipes", json={"nome": "X FC", "cnpj": "11.111.111/1111-11", "fundacao": 2000, "sede": "SP"})
    assert r.status_code == 422


def test_rejeita_nome_de_equipe_duplicado(client, nova_equipe):
    nova_equipe(nome="Palmeiras")
    r = client.post(
        "/equipes", json={"nome": "Palmeiras", "cnpj": "04.545.021/0001-43", "fundacao": 1914, "sede": "SP"}
    )
    assert r.status_code == 409


def test_cpf_sai_mascarado(novo_jogador):
    assert novo_jogador()["cpf"] == "***.***.***-09"


def test_rejeita_cpf_invalido_e_idade_fora_da_faixa(client):
    base = {"nome": "Fulano", "idade": 25, "nacionalidade": "BR", "posicao": "MEIA"}
    assert client.post("/jogadores", json={**base, "cpf": "123.456.789-00"}).status_code == 422
    assert client.post("/jogadores", json={**base, "cpf": "123.456.789-09", "idade": -1}).status_code == 422


def test_rejeita_posicao_invalida(client):
    r = client.post(
        "/jogadores",
        json={"nome": "Fulano", "cpf": "123.456.789-09", "idade": 25, "nacionalidade": "BR", "posicao": "PIVO"},
    )
    assert r.status_code == 422


def test_rejeita_cpf_duplicado(client, novo_jogador):
    novo_jogador()
    r = client.post(
        "/jogadores",
        json={"nome": "Outro", "cpf": "12345678909", "idade": 22, "nacionalidade": "BR", "posicao": "ZAGUEIRO"},
    )
    assert r.status_code == 409


def test_patch_altera_so_o_enviado(client, novo_jogador):
    j = novo_jogador()
    r = client.patch(f"/jogadores/{j['id']}", json={"idade": 32})
    assert r.status_code == 200
    assert r.json()["idade"] == 32 and r.json()["nome"] == "Arrascaeta"


def test_404_padronizado(client):
    r = client.get("/equipes/999")
    assert r.status_code == 404
    assert "não encontrado" in r.json()["detail"]


def test_filtro_por_nome(client, novo_jogador):
    novo_jogador(nome="Pedro", posicao="ATACANTE")
    novo_jogador(nome="Gerson", posicao="VOLANTE")
    nomes = [j["nome"] for j in client.get("/jogadores", params={"nome": "ped"}).json()]
    assert nomes == ["Pedro"]
