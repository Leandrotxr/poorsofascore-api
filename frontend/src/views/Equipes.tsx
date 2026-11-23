import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { api, consultas, mensagemDe } from '../api'
import { Adicionar, BuscaRemota } from '../components/Busca'
import {
  AcoesGaveta,
  BotaoRemover,
  Gaveta,
  GavetaEstado,
  Linha,
  LinkEntidade,
  SecaoGaveta,
  VazioPequeno,
} from '../components/Gaveta'
import { Icone } from '../components/Icone'
import { CardLink, Grade, ListaPaginada } from '../components/Lista'
import { LinhaPartida } from '../components/Partida'
import { Avatar, CampoBusca, DistribuicaoPosicoes, Etiqueta, PosBadge, Rotulo } from '../components/ui'
import { formatarCnpj, nomeTomDe, plural } from '../estilo'
import { useAcao, useFiltrosUrl, useIdRota, useNavegarNaAba, type Executar } from '../hooks'
import { POSICOES, type Equipe, type Jogador } from '../types'

export function EquipesLista() {
  const f = useFiltrosUrl()
  const q = f.ler('q')
  const consulta = useQuery(consultas.equipes({ nome: q || undefined, skip: f.skip, limit: f.limit }))

  return (
    <ListaPaginada
      consulta={consulta}
      filtrando={!!q}
      rotulo={['equipe', 'equipes']}
      vazio={{ icone: 'escudo', titulo: 'Nenhuma equipe cadastrada', texto: 'Use o botão Nova equipe para cadastrar a primeira.' }}
      filtros={<CampoBusca valor={q} onBuscar={(v) => f.mudar('q', v)} placeholder="Buscar equipe…" />}
    >
      {(equipes) => (
        <Grade>
          {equipes.map((e, i) => (
            <CardLink key={e.id} id={e.id} indice={i}>
              <div className="flex items-center gap-4">
                <Avatar nome={e.nome} seed={e.id} tamanho="lg" quadrado />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-bold">{e.nome}</h3>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Icone nome="pin" className="size-3.5" />
                      {e.sede}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Icone nome="calendario" className="size-3.5" />
                      {e.fundacao}
                    </span>
                  </p>
                </div>
                {e.federacao && (
                  <span title={e.federacao.nome}>
                    <Etiqueta tom={nomeTomDe(e.federacao.id)}>{e.federacao.sigla}</Etiqueta>
                  </span>
                )}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-fundo px-3 py-2.5">
                  <Rotulo>Técnico</Rotulo>
                  <p className="mt-0.5 truncate text-sm font-semibold">
                    {e.tecnico ? e.tecnico.nome : <span className="font-normal text-slate-400">Sem técnico</span>}
                  </p>
                </div>
                <div className="rounded-2xl bg-fundo px-3 py-2.5">
                  <Rotulo>Elenco</Rotulo>
                  <p className="mt-0.5 text-sm font-semibold">{plural(e.jogadores.length, 'jogador', 'jogadores')}</p>
                </div>
              </div>

              <DistribuicaoPosicoes jogadores={e.jogadores} className="mt-4" />

              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="font-mono text-slate-400">{formatarCnpj(e.cnpj)}</span>
                <span className="font-semibold text-slate-500 opacity-0 transition group-hover:opacity-100">
                  Gerenciar →
                </span>
              </div>
            </CardLink>
          ))}
        </Grade>
      )}
    </ListaPaginada>
  )
}

export function EquipePainel() {
  const id = useIdRota()
  const navegar = useNavegarNaAba()
  const fechar = () => navegar()
  const { data: equipe, error } = useQuery(consultas.equipe(id))
  const { executar, ocupado } = useAcao()

  if (!equipe) return <GavetaEstado tom="pessego" erro={error ? mensagemDe(error) : undefined} onFechar={fechar} />

  const { tecnico, jogadores, campeonatos } = equipe
  return (
    <Gaveta
      tom={nomeTomDe(equipe.id)}
      icone={<Avatar nome={equipe.nome} seed={equipe.id} tamanho="lg" quadrado className="bg-white/70!" />}
      titulo={equipe.nome}
      subtitulo={`${equipe.sede} · fundado em ${equipe.fundacao}`}
      onFechar={fechar}
      acoes={
        <AcoesGaveta
          tom={nomeTomDe(equipe.id)}
          rotulo={`a equipe ${equipe.nome}`}
          consequencia="Os jogadores e o técnico ficam sem equipe, e as inscrições em campeonatos são removidas."
          excluir={() => api.equipes.remover(equipe.id)}
          aoExcluir={fechar}
        />
      }
    >
      <SecaoGaveta titulo="Federação">
        {equipe.federacao ? (
          <div className="mt-2 flex items-center gap-3 rounded-2xl bg-fundo p-3">
            <Avatar nome={equipe.federacao.nome} seed={equipe.federacao.id} texto={equipe.federacao.sigla} quadrado />
            <LinkEntidade para={`/federacoes/${equipe.federacao.id}`}>{equipe.federacao.nome}</LinkEntidade>
          </div>
        ) : (
          <VazioPequeno>Não filiada. Filie pelo painel de uma federação.</VazioPequeno>
        )}
      </SecaoGaveta>

      <SecaoGaveta titulo="Técnico">
        {tecnico ? (
          <ul className="mt-2">
            <Linha
              acao={
                <BotaoRemover
                  rotulo={`Remover ${tecnico.nome} do comando`}
                  ocupado={ocupado}
                  onClick={() => void executar(() => api.equipes.removerTecnico(equipe.id), `${tecnico.nome} deixou o comando`)}
                />
              }
            >
              <Avatar nome={tecnico.nome} seed={tecnico.id + 3} />
              <div className="min-w-0 flex-1">
                <LinkEntidade para={`/tecnicos/${tecnico.id}`}>{tecnico.nome}</LinkEntidade>
                <p className="text-sm text-slate-500">
                  {tecnico.idade} anos · {tecnico.nacionalidade}
                </p>
              </div>
            </Linha>
          </ul>
        ) : (
          <VazioPequeno>Nenhum técnico definido</VazioPequeno>
        )}
        <Adicionar
          rotulo={tecnico ? 'Trocar técnico' : 'Definir técnico'}
          chave="tecnicos-livres"
          buscar={(nome, limit) => api.tecnicos.listar({ nome, limit, sem_equipe: true }).then((p) => p.items)}
          vazio="Nenhum técnico sem equipe. Cadastre um na aba Técnicos."
          ocupado={ocupado}
          item={(t) => (
            <>
              <Avatar nome={t.nome} seed={t.id + 3} tamanho="sm" />
              <span className="font-medium">{t.nome}</span>
              <span className="text-xs text-slate-400">{t.idade} anos</span>
            </>
          )}
          onEscolher={(t) => executar(() => api.equipes.definirTecnico(equipe.id, t.id), `${t.nome} agora comanda ${equipe.nome}`)}
        />
      </SecaoGaveta>

      <SecaoGaveta titulo="Elenco" extra={plural(jogadores.length, 'jogador', 'jogadores')}>
        <DistribuicaoPosicoes jogadores={jogadores} className="mt-2" />
        {jogadores.length === 0 ? (
          <VazioPequeno>Nenhum jogador contratado</VazioPequeno>
        ) : (
          <div className="mt-4 space-y-4">
            {POSICOES.map((p) => {
              const daPosicao = jogadores.filter((j) => j.posicao === p)
              if (daPosicao.length === 0) return null
              return (
                <div key={p}>
                  <PosBadge posicao={p} />
                  <ul className="mt-2 space-y-1">
                    {daPosicao.map((j) => (
                      <Linha
                        key={j.id}
                        acao={
                          <BotaoRemover
                            rotulo={`Dispensar ${j.nome}`}
                            ocupado={ocupado}
                            onClick={() => void executar(() => api.equipes.dispensar(equipe.id, j.id), `${j.nome} foi dispensado`)}
                          />
                        }
                      >
                        <span className="w-6 text-right font-mono text-xs font-semibold text-slate-400" title="Número da camisa">
                          {j.numero_camisa ?? ''}
                        </span>
                        <Avatar nome={j.nome} seed={j.id} tamanho="sm" />
                        <LinkEntidade para={`/jogadores/${j.id}`}>{j.nome}</LinkEntidade>
                        <span className="text-sm text-slate-500">{j.idade} anos</span>
                      </Linha>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
        <ContratarJogador equipe={equipe} executar={executar} ocupado={ocupado} />
      </SecaoGaveta>

      <PartidasDaEquipe equipeId={equipe.id} />

      <SecaoGaveta titulo="Campeonatos" extra={plural(campeonatos.length, 'campeonato', 'campeonatos')}>
        {campeonatos.length === 0 ? (
          <VazioPequeno>Não disputa nenhum campeonato. Inscreva pelo painel de um campeonato.</VazioPequeno>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {campeonatos.map((c) => (
              <Link
                key={c.id}
                to={`/campeonatos/${c.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-menta px-3 py-1 text-sm font-semibold text-menta-forte hover:bg-menta-medio"
              >
                <Icone nome="trofeu" className="size-3.5" />
                {c.nome} {c.temporada}
              </Link>
            ))}
          </div>
        )}
      </SecaoGaveta>

      <SecaoGaveta titulo="CNPJ">
        <p className="mt-1 font-mono text-sm text-slate-600">{formatarCnpj(equipe.cnpj)}</p>
      </SecaoGaveta>
    </Gaveta>
  )
}

/**
 * Contratar em dois passos: escolher um agente livre e, opcionalmente, informar o número
 * da camisa e a data de início do contrato (sem data, a API usa hoje).
 */
function ContratarJogador({ equipe, executar, ocupado }: { equipe: Equipe; executar: Executar; ocupado: boolean }) {
  const [aberto, setAberto] = useState(false)
  const [jogador, setJogador] = useState<Jogador | null>(null)
  const [numero, setNumero] = useState('')
  const [inicio, setInicio] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  const fechar = () => {
    setAberto(false)
    setJogador(null)
    setNumero('')
    setInicio('')
    setErro(null)
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3.5 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-tinta hover:bg-fundo hover:text-tinta"
      >
        <Icone nome="mais" />
        Contratar jogador
      </button>
    )
  }

  async function contratar() {
    if (!jogador) return
    const n = numero ? Number(numero) : null
    if (n !== null && (!Number.isInteger(n) || n < 1 || n > 99)) return setErro('Número entre 1 e 99')
    setErro(null)
    const ok = await executar(
      () => api.equipes.contratar(equipe.id, jogador.id, { numero_camisa: n, inicio: inicio || null }),
      `${jogador.nome} contratado${n ? ` com a camisa ${n}` : ''}`,
    )
    if (ok) fechar()
  }

  const campo =
    'mt-1 w-full rounded-xl border border-borda bg-white px-3 py-2 text-sm outline-none focus:border-ceu-medio focus:ring-4 focus:ring-ceu'
  return (
    <div className="mt-3 animate-fade-in rounded-2xl border border-borda bg-fundo/60 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{jogador ? `Contratar ${jogador.nome}` : 'Contratar jogador'}</p>
        <button
          type="button"
          onClick={fechar}
          aria-label="Cancelar"
          className="grid size-7 place-items-center rounded-full text-slate-400 hover:bg-white hover:text-tinta"
        >
          <Icone nome="fechar" className="size-4" />
        </button>
      </div>
      {!jogador ? (
        <BuscaRemota<Jogador>
          chave="agentes-livres"
          buscar={(nome, limit) => api.jogadores.listar({ nome, limit, sem_equipe: true }).then((p) => p.items)}
          vazio="Nenhum agente livre. Dispense um jogador de outra equipe ou cadastre um na aba Jogadores."
          item={(j) => (
            <>
              <Avatar nome={j.nome} seed={j.id} tamanho="sm" />
              <span className="font-medium">{j.nome}</span>
              <PosBadge posicao={j.posicao} />
            </>
          )}
          onEscolher={setJogador}
        />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void contratar()
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold text-slate-500">
              Nº da camisa
              <input
                autoFocus
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                inputMode="numeric"
                placeholder="Opcional"
                className={campo}
              />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Início
              <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className={campo} />
            </label>
          </div>
          {erro && <p className="text-xs font-medium text-rosa-forte">{erro}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={ocupado}
              className="inline-flex items-center gap-1.5 rounded-full bg-tinta px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-tinta/85 disabled:opacity-60"
            >
              <Icone nome="check" /> Contratar
            </button>
            <button
              type="button"
              onClick={() => setJogador(null)}
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-500 hover:text-tinta"
            >
              Escolher outro
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function PartidasDaEquipe({ equipeId }: { equipeId: number }) {
  const { data } = useQuery(consultas.partidas({ equipe_id: equipeId, limit: 5 }))
  if (!data || data.total === 0) return null
  return (
    <SecaoGaveta titulo="Partidas" extra={plural(data.total, 'partida', 'partidas')}>
      <div className="mt-2 space-y-2">
        {data.items.map((p) => (
          <LinhaPartida key={p.id} partida={p} mostrarCampeonato />
        ))}
      </div>
    </SecaoGaveta>
  )
}
