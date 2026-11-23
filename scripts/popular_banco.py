"""
Popula o banco (o do DATABASE_URL do .env) com um conjunto pequeno de dados de exemplo:
2 federações, 6 equipes, ~30 jogadores, técnicos, árbitros, 2 campeonatos e algumas partidas
com gols e cartões (assim a classificação e a artilharia já aparecem no painel).

    python scripts/popular_banco.py

Usa os services da API, então passa pelas mesmas regras (inscrição, contratos, placar).
Reaproveita o que já existir (mesma sigla, nome ou CPF) e não roda duas vezes:
se o "Brasileirão Série A 2026" já existir, ele para sem mexer em nada.
CPFs e CNPJs são gerados (válidos, mas fictícios).
"""

import sys
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models import (
    Abrangencia,
    Arbitro,
    Campeonato,
    Equipe,
    Federacao,
    FormatoCampeonato,
    FuncaoArbitro,
    Jogador,
    Posicao,
    StatusPartida,
    Tecnico,
    TipoEvento,
)
from app.schemas import (
    ArbitroCreate,
    CampeonatoCreate,
    ContratoJogadorCreate,
    ContratoTecnicoCreate,
    EquipeCreate,
    EventoCreate,
    FederacaoCreate,
    JogadorCreate,
    PartidaCreate,
    PartidaUpdate,
    TecnicoCreate,
)
from app.services import arbitros, campeonatos, equipes, federacoes, jogadores, partidas, tecnicos

FUSO = ZoneInfo("America/Sao_Paulo")

# ---------- geradores de documentos válidos (fictícios) ----------


def gerar_cpf(n: int) -> str:
    d = [int(x) for x in f"{n:09d}"]
    for t in (9, 10):
        d.append(sum(d[i] * (t + 1 - i) for i in range(t)) * 10 % 11 % 10)
    return "".join(map(str, d))


def gerar_cnpj(n: int) -> str:
    d = [int(x) for x in f"{n:08d}0001"]
    for pesos in ([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]):
        r = sum(a * b for a, b in zip(d, pesos, strict=False)) % 11
        d.append(0 if r < 2 else 11 - r)
    return "".join(map(str, d))


_seq = iter(range(700_000_001, 800_000_000))


def proximo_cpf() -> str:
    return gerar_cpf(next(_seq))


# ---------- dados ----------

EQUIPES = [  # nome, fundação, sede
    ("Flamengo", 1895, "Rio de Janeiro"),
    ("Palmeiras", 1914, "São Paulo"),
    ("Botafogo", 1904, "Rio de Janeiro"),
    ("São Paulo", 1930, "São Paulo"),
    ("Grêmio", 1903, "Porto Alegre"),
    ("Fortaleza", 1918, "Fortaleza"),
]

P = Posicao
ELENCOS: dict[str, list[tuple[str, Posicao, int, int]]] = {  # nome, posição, camisa, ano de nascimento
    "Flamengo": [
        ("Rossi", P.GOLEIRO, 1, 1995),
        ("Léo Pereira", P.ZAGUEIRO, 4, 1996),
        ("Ayrton Lucas", P.LATERAL, 6, 1997),
        ("Pulgar", P.VOLANTE, 5, 1994),
        ("Pedro", P.ATACANTE, 9, 1997),
    ],
    "Palmeiras": [
        ("Weverton", P.GOLEIRO, 21, 1987),
        ("Gustavo Gómez", P.ZAGUEIRO, 15, 1993),
        ("Piquerez", P.LATERAL, 22, 1998),
        ("Raphael Veiga", P.MEIA, 23, 1995),
        ("Flaco López", P.ATACANTE, 42, 2000),
    ],
    "Botafogo": [
        ("John", P.GOLEIRO, 24, 1996),
        ("Alexander Barboza", P.ZAGUEIRO, 20, 1995),
        ("Vitinho", P.LATERAL, 2, 1999),
        ("Savarino", P.MEIA, 10, 1996),
        ("Igor Jesus", P.ATACANTE, 99, 2001),
    ],
    "São Paulo": [
        ("Rafael", P.GOLEIRO, 23, 1989),
        ("Arboleda", P.ZAGUEIRO, 5, 1991),
        ("Wendell", P.LATERAL, 18, 1993),
        ("Oscar", P.MEIA, 8, 1991),
        ("Calleri", P.ATACANTE, 9, 1993),
    ],
    "Grêmio": [
        ("Tiago Volpi", P.GOLEIRO, 1, 1990),
        ("Kannemann", P.ZAGUEIRO, 4, 1991),
        ("Marlon", P.LATERAL, 23, 1997),
        ("Cristaldo", P.MEIA, 10, 1996),
        ("Braithwaite", P.ATACANTE, 22, 1991),
    ],
    "Fortaleza": [
        ("João Ricardo", P.GOLEIRO, 1, 1988),
        ("Kuscevic", P.ZAGUEIRO, 4, 1996),
        ("Bruno Pacheco", P.LATERAL, 6, 1991),
        ("Pochettino", P.MEIA, 10, 1996),
        ("Lucero", P.ATACANTE, 9, 1991),
    ],
}

AGENTES_LIVRES = [("Hulk", P.ATACANTE, 1986), ("Diego Costa", P.ATACANTE, 1988), ("Fernandinho", P.VOLANTE, 1985)]

TECNICOS = [  # nome, nacionalidade, ano de nascimento, equipe (None = sem clube)
    ("Abel Ferreira", "Português", 1978, "Palmeiras"),
    ("Renato Paiva", "Português", 1970, "Botafogo"),
    ("Hernán Crespo", "Argentino", 1975, "São Paulo"),
    ("Mano Menezes", "Brasileiro", 1962, "Grêmio"),
    ("Juan Pablo Vojvoda", "Argentino", 1975, "Fortaleza"),
    ("Tite", "Brasileiro", 1961, None),
]

ARBITROS = [
    ("Wilton Pereira Sampaio", FuncaoArbitro.CENTRAL, 1981),
    ("Raphael Claus", FuncaoArbitro.CENTRAL, 1979),
    ("Bruno Arleu de Araújo", FuncaoArbitro.CENTRAL, 1984),
    ("Rodolpho Toski Marques", FuncaoArbitro.VAR, 1985),
]

# Brasileirão: rodada, mandante, visitante, dia/mês e hora, status, lances (minuto, tipo, jogador)
G, GC, CA, CV = TipoEvento.GOL, TipoEvento.GOL_CONTRA, TipoEvento.CARTAO_AMARELO, TipoEvento.CARTAO_VERMELHO
E, A, F = StatusPartida.ENCERRADA, StatusPartida.EM_ANDAMENTO, StatusPartida.AGENDADA
PARTIDAS = [
    (1, "Flamengo", "Palmeiras", (4, 12, 16), E, [(23, G, "Pedro"), (51, G, "Raphael Veiga"), (77, G, "Pedro")]),
    (1, "Botafogo", "São Paulo", (4, 12, 18), E, [(12, G, "Igor Jesus"), (40, CA, "Arboleda"), (88, G, "Savarino")]),
    (1, "Grêmio", "Fortaleza", (4, 13, 16), E, [(35, G, "Lucero"), (60, G, "Braithwaite"), (90, CV, "Kannemann")]),
    (
        2,
        "Palmeiras",
        "Botafogo",
        (4, 19, 16),
        E,
        [(8, G, "Flaco López"), (30, G, "Flaco López"), (70, G, "Igor Jesus")],
    ),
    (2, "São Paulo", "Grêmio", (4, 19, 18), E, [(55, G, "Calleri"), (81, GC, "Kannemann")]),
    (2, "Fortaleza", "Flamengo", (4, 20, 16), A, [(17, G, "Pedro"), (33, CA, "Pulgar")]),
    (3, "Flamengo", "Botafogo", (11, 29, 21), F, []),
    (3, "Palmeiras", "Grêmio", (11, 30, 16), F, []),
    (3, "São Paulo", "Fortaleza", (11, 30, 18), F, []),
]
LOCAIS = {
    "Flamengo": "Maracanã",
    "Palmeiras": "Allianz Parque",
    "Botafogo": "Nilton Santos",
    "São Paulo": "MorumBIS",
    "Grêmio": "Arena do Grêmio",
    "Fortaleza": "Castelão",
}

# ---------- helpers "acha ou cria" ----------


def federacao(db: Session, sigla: str, nome: str, abrangencia: Abrangencia, fundacao: int, sede: str) -> Federacao:
    existente = db.scalar(select(Federacao).where(Federacao.sigla == sigla))
    if existente:
        return existente
    return federacoes.criar(
        db, FederacaoCreate(nome=nome, sigla=sigla, abrangencia=abrangencia, fundacao=fundacao, sede=sede)
    )


def equipe(db: Session, nome: str, fundacao: int, sede: str, n: int) -> Equipe:
    existente = db.scalar(select(Equipe).where(Equipe.nome == nome))
    if existente:
        return existente
    return equipes.criar(db, EquipeCreate(nome=nome, fundacao=fundacao, sede=sede, cnpj=gerar_cnpj(n)))


def jogador(db: Session, nome: str, posicao: Posicao, ano: int, nacionalidade: str = "Brasileiro") -> Jogador:
    existente = db.scalar(select(Jogador).where(Jogador.nome == nome))
    if existente:
        return existente
    dados = JogadorCreate(
        nome=nome,
        cpf=proximo_cpf(),
        data_nascimento=date(ano, 3, 15),
        nacionalidade=nacionalidade,
        posicao=posicao,
    )
    return jogadores.criar(db, dados)


def popular(db: Session) -> None:
    if db.scalar(select(Campeonato.id).where(Campeonato.nome == "Brasileirão Série A", Campeonato.temporada == 2026)):
        print("O Brasileirão Série A 2026 já existe: o banco já foi populado. Nada foi alterado.")
        return

    cbf = federacao(db, "CBF", "Confederação Brasileira de Futebol", Abrangencia.NACIONAL, 1914, "Rio de Janeiro")
    conmebol = federacao(
        db, "CONMEBOL", "Confederação Sul-Americana de Futebol", Abrangencia.CONTINENTAL, 1916, "Luque"
    )

    times = {nome: equipe(db, nome, fundacao, sede, 40_000_000 + i) for i, (nome, fundacao, sede) in enumerate(EQUIPES)}
    for t in times.values():
        if t.federacao_id is None:
            federacoes.filiar_equipe(db, cbf.id, t.id)

    # Elencos: contrato desde janeiro/2026, com número da camisa
    for time, elenco in ELENCOS.items():
        for nome, posicao, camisa, ano in elenco:
            j = jogador(db, nome, posicao, ano)
            if j.equipe_id is None:
                equipes.contratar_jogador(
                    db, times[time].id, j.id, ContratoJogadorCreate(inicio=date(2026, 1, 10), numero_camisa=camisa)
                )
    for nome, posicao, ano in AGENTES_LIVRES:
        jogador(db, nome, posicao, ano)

    # Um histórico com transferência: Gerson saiu do Flamengo em junho/2025 e foi para o Botafogo
    gerson = jogador(db, "Gerson", P.VOLANTE, 1997)
    if gerson.equipe_id is None and not gerson.contratos:
        equipes.contratar_jogador(
            db, times["Flamengo"].id, gerson.id, ContratoJogadorCreate(inicio=date(2023, 1, 5), numero_camisa=8)
        )
        equipes.dispensar_jogador(db, times["Flamengo"].id, gerson.id)  # fecha hoje...
        db.refresh(gerson)
        gerson.contratos[0].fim = date(2025, 6, 30)  # ...e ajustamos a data de saída para o exemplo
        db.commit()
        equipes.contratar_jogador(
            db, times["Botafogo"].id, gerson.id, ContratoJogadorCreate(inicio=date(2025, 7, 1), numero_camisa=8)
        )

    for nome, nacionalidade, ano, clube in TECNICOS:
        tec = db.scalar(select(Tecnico).where(Tecnico.nome == nome)) or tecnicos.criar(
            db,
            TecnicoCreate(nome=nome, cpf=proximo_cpf(), data_nascimento=date(ano, 5, 20), nacionalidade=nacionalidade),
        )
        if clube and tec.equipe_id is None and times[clube].tecnico is None:
            equipes.definir_tecnico(db, times[clube].id, tec.id, ContratoTecnicoCreate(inicio=date(2025, 12, 1)))

    juizes = []
    for nome, funcao, ano in ARBITROS:
        a = db.scalar(select(Arbitro).where(Arbitro.nome == nome)) or arbitros.criar(
            db,
            ArbitroCreate(
                nome=nome, cpf=proximo_cpf(), data_nascimento=date(ano, 8, 1), nacionalidade="Brasileiro", funcao=funcao
            ),
        )
        if a.federacao_id is None:
            federacoes.vincular_arbitro(db, cbf.id, a.id)
        if funcao == FuncaoArbitro.CENTRAL:
            juizes.append(a)

    # Campeonatos
    brasileirao = campeonatos.criar(
        db,
        CampeonatoCreate(
            nome="Brasileirão Série A",
            temporada=2026,
            formato=FormatoCampeonato.PONTOS_CORRIDOS,
            data_inicio=date(2026, 4, 12),
            data_fim=date(2026, 12, 6),
            federacao_id=cbf.id,
        ),
    )
    for t in times.values():
        campeonatos.inscrever_equipe(db, brasileirao.id, t.id)

    libertadores = campeonatos.criar(
        db,
        CampeonatoCreate(
            nome="Copa Libertadores",
            temporada=2026,
            formato=FormatoCampeonato.GRUPOS_E_MATA_MATA,
            data_inicio=date(2026, 2, 4),
            data_fim=date(2026, 11, 28),
            federacao_id=conmebol.id,
        ),
    )
    for nome in ("Flamengo", "Palmeiras", "Botafogo", "São Paulo"):
        campeonatos.inscrever_equipe(db, libertadores.id, times[nome].id)

    # Partidas do Brasileirão (o placar sai dos gols registrados)
    nomes = {j.nome: j.id for j in db.scalars(select(Jogador))}
    for i, (rodada, mandante, visitante, (mes, dia, hora), status, lances) in enumerate(PARTIDAS):
        p = partidas.criar(
            db,
            PartidaCreate(
                campeonato_id=brasileirao.id,
                rodada=rodada,
                mandante_id=times[mandante].id,
                visitante_id=times[visitante].id,
                data_hora=datetime(2026, mes, dia, hora, tzinfo=FUSO),
                local=LOCAIS[mandante],
                arbitro_id=juizes[i % len(juizes)].id,
            ),
        )
        if status != StatusPartida.AGENDADA:
            partidas.atualizar(db, p.id, PartidaUpdate(status=StatusPartida.EM_ANDAMENTO))
            for minuto, tipo, autor in lances:
                partidas.adicionar_evento(db, p.id, EventoCreate(tipo=tipo, minuto=minuto, jogador_id=nomes[autor]))
            if status == StatusPartida.ENCERRADA:
                partidas.atualizar(db, p.id, PartidaUpdate(status=StatusPartida.ENCERRADA))

    # Uma partida agendada na Libertadores
    partidas.criar(
        db,
        PartidaCreate(
            campeonato_id=libertadores.id,
            rodada=1,
            mandante_id=times["Palmeiras"].id,
            visitante_id=times["Flamengo"].id,
            data_hora=datetime(2026, 11, 28, 17, tzinfo=FUSO),
            local="Estádio Monumental (Lima)",
        ),
    )

    print("Banco populado:")
    for linha in campeonatos_resumo(db):
        print("  " + linha)


def campeonatos_resumo(db: Session) -> list[str]:
    from app.services import estatisticas

    brasileirao = db.scalar(select(Campeonato).where(Campeonato.nome == "Brasileirão Série A"))
    assert brasileirao is not None
    return [
        f"{linha.posicao}º {linha.equipe.nome}: {linha.pontos} pts ({linha.jogos} jogos, saldo {linha.saldo:+d})"
        for linha in estatisticas.classificacao(db, brasileirao.id)
    ]


if __name__ == "__main__":
    with SessionLocal() as sessao:
        popular(sessao)
