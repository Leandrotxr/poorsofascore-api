"""
Por padrão os testes rodam em SQLite em memória (rápido, sem dependências).
Para rodar contra o PostgreSQL de verdade (recomendado no CI), crie um banco de teste e use:

    TEST_DATABASE_URL=postgresql+psycopg://sofascore_app:SENHA@localhost:5432/poorsofascore_test pytest
"""

import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from tests.auxiliares import nascido_ha

TEST_URL = os.getenv("TEST_DATABASE_URL", "sqlite://")

if TEST_URL.startswith("sqlite"):
    engine = create_engine(TEST_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)

    @event.listens_for(engine, "connect")
    def _fk_on(dbapi_conn, _):  # SQLite só respeita FOREIGN KEY com este PRAGMA
        dbapi_conn.execute("PRAGMA foreign_keys=ON")
else:
    engine = create_engine(TEST_URL)

TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


@pytest.fixture()
def client():
    Base.metadata.create_all(engine)

    def _get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)


# ---------- dados de exemplo (CPFs/CNPJs válidos) ----------

CPFS = ["123.456.789-09", "987.654.321-00", "111.444.777-35", "529.982.247-25", "390.533.447-05"]
CNPJS = [
    "11.222.333/0001-81",
    "04.545.021/0001-43",
    "60.674.644/0001-97",
    "33.000.167/0001-01",
    "47.960.950/0001-21",
    "19.131.243/0001-97",
]


@pytest.fixture()
def nova_equipe(client):
    contador = iter(range(len(CNPJS)))

    def _criar(nome="Flamengo", sede="Rio de Janeiro", fundacao=1895):
        r = client.post(
            "/equipes", json={"nome": nome, "cnpj": CNPJS[next(contador)], "fundacao": fundacao, "sede": sede}
        )
        assert r.status_code == 201, r.text
        return r.json()

    return _criar


@pytest.fixture()
def novo_jogador(client):
    contador = iter(range(len(CPFS)))

    def _criar(nome="Arrascaeta", posicao="MEIA", idade=31):
        r = client.post(
            "/jogadores",
            json={
                "nome": nome,
                "cpf": CPFS[next(contador)],
                "data_nascimento": nascido_ha(idade),
                "nacionalidade": "Uruguaio",
                "posicao": posicao,
            },
        )
        assert r.status_code == 201, r.text
        return r.json()

    return _criar


@pytest.fixture()
def novo_tecnico(client):
    contador = iter(range(len(CPFS) - 1, -1, -1))  # usa CPFs do fim para não colidir com jogadores

    def _criar(nome="Filipe Luís", idade=41):
        r = client.post(
            "/tecnicos",
            json={
                "nome": nome,
                "cpf": CPFS[next(contador)],
                "data_nascimento": nascido_ha(idade),
                "nacionalidade": "Brasileiro",
            },
        )
        assert r.status_code == 201, r.text
        return r.json()

    return _criar


@pytest.fixture()
def nova_federacao(client):
    def _criar(nome="Confederação Brasileira de Futebol", sigla="CBF", abrangencia="NACIONAL", **extra):
        r = client.post(
            "/federacoes",
            json={
                "nome": nome,
                "sigla": sigla,
                "abrangencia": abrangencia,
                "fundacao": 1914,
                "sede": "Rio de Janeiro",
                **extra,
            },
        )
        assert r.status_code == 201, r.text
        return r.json()

    return _criar


@pytest.fixture()
def novo_arbitro(client):
    contador = iter(range(len(CPFS)))  # CPF é único por papel: pode repetir o de um jogador

    def _criar(nome="Wilton Pereira Sampaio", funcao="CENTRAL", idade=43):
        r = client.post(
            "/arbitros",
            json={
                "nome": nome,
                "cpf": CPFS[next(contador)],
                "data_nascimento": nascido_ha(idade),
                "nacionalidade": "Brasileiro",
                "funcao": funcao,
            },
        )
        assert r.status_code == 201, r.text
        return r.json()

    return _criar


@pytest.fixture()
def novo_campeonato(client):
    def _criar(federacao_id, nome="Brasileirão Série A", temporada=2026, formato="PONTOS_CORRIDOS", **extra):
        r = client.post(
            "/campeonatos",
            json={"nome": nome, "temporada": temporada, "formato": formato, "federacao_id": federacao_id, **extra},
        )
        assert r.status_code == 201, r.text
        return r.json()

    return _criar
