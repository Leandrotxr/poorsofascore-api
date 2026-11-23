import { useCallback, useEffect, useMemo, useState } from 'react'
import { API_URL, api } from './api'
import type { Arbitro, Campeonato, Equipe, Federacao, Jogador, Tecnico } from './types'
import { Aviso, Codigo, Icone, StatCard, type Mensagem, type NomeIcone } from './ui'
import { ArbitrosView } from './views/Arbitros'
import { CampeonatoDrawer, CampeonatosView } from './views/Campeonatos'
import { EquipeDrawer, EquipesView, type Executar } from './views/Equipes'
import { FederacaoDrawer, FederacoesView } from './views/Federacoes'
import { FormularioCriacao, NOVO, type Entidade } from './views/Formularios'
import { JogadoresView } from './views/Jogadores'
import { TecnicosView } from './views/Tecnicos'

type Aba = Entidade

interface Dados {
  federacoes: Federacao[]
  campeonatos: Campeonato[]
  equipes: Equipe[]
  jogadores: Jogador[]
  tecnicos: Tecnico[]
  arbitros: Arbitro[]
}

type Painel = { tipo: 'equipe' | 'federacao' | 'campeonato'; id: number } | null

/** Agrupa itens pelo id do "dono" (equipe, federação). Itens sem dono ficam de fora. */
function agrupar<T>(itens: T[], dono: (item: T) => { id: number } | null): Map<number, T[]> {
  const mapa = new Map<number, T[]>()
  for (const item of itens) {
    const d = dono(item)
    if (d) mapa.set(d.id, [...(mapa.get(d.id) ?? []), item])
  }
  return mapa
}

export default function App() {
  const [dados, setDados] = useState<Dados | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null)
  const [aba, setAba] = useState<Aba>('equipes')
  const [painel, setPainel] = useState<Painel>(null)
  const [mensagem, setMensagem] = useState<Mensagem | null>(null)
  const [criando, setCriando] = useState<Entidade | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const [federacoes, campeonatos, equipes, jogadores, tecnicos, arbitros] = await Promise.all([
        api.federacoes(),
        api.campeonatos(),
        api.equipes(),
        api.jogadores(),
        api.tecnicos(),
        api.arbitros(),
      ])
      setDados({ federacoes, campeonatos, equipes, jogadores, tecnicos, arbitros })
      setErro(null)
      setAtualizadoEm(new Date())
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  // Ações de vincular/desvincular: chama a API, recarrega tudo e avisa o resultado.
  const executar: Executar = useCallback(
    async (acao, sucesso) => {
      setOcupado(true)
      try {
        await acao()
        await carregar()
        setMensagem({ tipo: 'ok', texto: sucesso })
      } catch (e) {
        setMensagem({ tipo: 'erro', texto: e instanceof Error ? e.message : String(e) })
      } finally {
        setOcupado(false)
      }
    },
    [carregar],
  )

  // Depois de cadastrar: fecha o formulário, recarrega e avisa.
  const aoCriar = useCallback(
    async (m: Mensagem) => {
      setCriando(null)
      await carregar()
      setMensagem(m)
    },
    [carregar],
  )

  // Relações montadas a partir das listas (sem uma requisição por equipe/federação).
  const rel = useMemo(() => {
    const d = dados ?? { federacoes: [], campeonatos: [], equipes: [], jogadores: [], tecnicos: [], arbitros: [] }
    // N:N: cada campeonato traz suas equipes; aqui invertemos para "campeonatos de cada equipe".
    const campeonatosDeEquipe = new Map<number, Campeonato[]>()
    for (const c of d.campeonatos)
      for (const e of c.equipes) campeonatosDeEquipe.set(e.id, [...(campeonatosDeEquipe.get(e.id) ?? []), c])

    const tecnicoDe = new Map(d.tecnicos.filter((t) => t.equipe).map((t) => [t.equipe!.id, t]))
    return {
      campeonatosDeEquipe,
      campeonatosDeFederacao: agrupar(d.campeonatos, (c) => c.federacao),
      equipesSemTecnico: d.equipes.filter((e) => !tecnicoDe.has(e.id)),
      elenco: agrupar(d.jogadores, (j) => j.equipe),
      tecnicoDe,
      equipesDe: agrupar(d.equipes, (e) => e.federacao),
      arbitrosDe: agrupar(d.arbitros, (a) => a.federacao),
      agentesLivres: d.jogadores.filter((j) => !j.equipe),
      tecnicosLivres: d.tecnicos.filter((t) => !t.equipe),
      equipesSemFederacao: d.equipes.filter((e) => !e.federacao),
      arbitrosSemFederacao: d.arbitros.filter((a) => !a.federacao),
    }
  }, [dados])

  const fecharPainel = useCallback(() => setPainel(null), [])
  const fecharMensagem = useCallback(() => setMensagem(null), [])
  const fecharCriacao = useCallback(() => setCriando(null), [])
  const campeonatoAberto =
    painel?.tipo === 'campeonato' ? dados?.campeonatos.find((c) => c.id === painel.id) : undefined
  const equipeAberta = painel?.tipo === 'equipe' ? dados?.equipes.find((e) => e.id === painel.id) : undefined
  const federacaoAberta =
    painel?.tipo === 'federacao' ? dados?.federacoes.find((f) => f.id === painel.id) : undefined

  const abas: { id: Aba; rotulo: string; icone: NomeIcone; total: number }[] = [
    { id: 'federacoes', rotulo: 'Federações', icone: 'globo', total: dados?.federacoes.length ?? 0 },
    { id: 'campeonatos', rotulo: 'Campeonatos', icone: 'trofeu', total: dados?.campeonatos.length ?? 0 },
    { id: 'equipes', rotulo: 'Equipes', icone: 'escudo', total: dados?.equipes.length ?? 0 },
    { id: 'jogadores', rotulo: 'Jogadores', icone: 'pessoas', total: dados?.jogadores.length ?? 0 },
    { id: 'tecnicos', rotulo: 'Técnicos', icone: 'prancheta', total: dados?.tecnicos.length ?? 0 },
    { id: 'arbitros', rotulo: 'Árbitros', icone: 'cartao', total: dados?.arbitros.length ?? 0 },
  ]

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 py-6 sm:py-8">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-menta text-menta-forte">
              <Icone nome="escudo" className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                Poor <span className="text-menta-forte">SofaScore</span>
              </h1>
              <p className="text-xs text-slate-500 sm:text-sm">Federações, campeonatos, equipes e pessoas</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusApi carregando={carregando && !dados} online={!!dados && !erro} />
            <button
              type="button"
              onClick={() => void carregar()}
              disabled={carregando}
              title={atualizadoEm ? `Atualizado às ${atualizadoEm.toLocaleTimeString('pt-BR')}` : undefined}
              className="inline-flex items-center gap-2 rounded-full border border-borda bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-fundo disabled:opacity-60"
            >
              <Icone nome="atualizar" className={`size-4 ${carregando ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </header>

        {erro && !dados ? (
          <ErroConexao mensagem={erro} onTentar={() => void carregar()} />
        ) : !dados ? (
          <Carregando />
        ) : (
          <main>
            {erro && (
              <div className="mb-6 flex items-center gap-2 rounded-2xl bg-rosa px-4 py-3 text-sm text-rosa-forte">
                <Icone nome="alerta" className="size-4 shrink-0" />
                Falha ao atualizar ({erro}). Mostrando os últimos dados carregados.
              </div>
            )}

            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
              <StatCard rotulo="Federações" valor={dados.federacoes.length} icone="globo" tom="agua" />
              <StatCard rotulo="Campeonatos" valor={dados.campeonatos.length} icone="trofeu" tom="menta" atraso={30} />
              <StatCard rotulo="Equipes" valor={dados.equipes.length} icone="escudo" tom="pessego" atraso={60} />
              <StatCard rotulo="Jogadores" valor={dados.jogadores.length} icone="pessoas" tom="ceu" atraso={90} />
              <StatCard rotulo="Técnicos" valor={dados.tecnicos.length} icone="prancheta" tom="lavanda" atraso={120} />
              <StatCard rotulo="Árbitros" valor={dados.arbitros.length} icone="cartao" tom="manteiga" atraso={150} />
            </section>

            <div className="mt-10 mb-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <nav className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <div className="inline-flex gap-1 rounded-2xl border border-borda bg-white p-1">
                  {abas.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAba(a.id)}
                      aria-pressed={aba === a.id}
                      className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                        aba === a.id ? 'bg-tinta text-white' : 'text-slate-500 hover:bg-fundo hover:text-tinta'
                      }`}
                    >
                      <Icone nome={a.icone} />
                      {a.rotulo}
                      <span className={`rounded-full px-2 text-xs ${aba === a.id ? 'bg-white/20' : 'bg-fundo'}`}>
                        {a.total}
                      </span>
                    </button>
                  ))}
                </div>
              </nav>
              <button
                type="button"
                onClick={() => setCriando(aba)}
                className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-tinta px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-tinta/85 xl:self-auto"
              >
                <Icone nome="mais" /> {NOVO[aba]}
              </button>
            </div>

            {aba === 'federacoes' && (
              <FederacoesView
                federacoes={dados.federacoes}
                equipesDe={rel.equipesDe}
                arbitrosDe={rel.arbitrosDe}
                onAbrir={(id) => setPainel({ tipo: 'federacao', id })}
              />
            )}
            {aba === 'campeonatos' && (
              <CampeonatosView
                campeonatos={dados.campeonatos}
                onAbrir={(id) => setPainel({ tipo: 'campeonato', id })}
              />
            )}
            {aba === 'equipes' && (
              <EquipesView
                equipes={dados.equipes}
                elenco={rel.elenco}
                tecnicoDe={rel.tecnicoDe}
                onAbrir={(id) => setPainel({ tipo: 'equipe', id })}
              />
            )}
            {aba === 'jogadores' && <JogadoresView jogadores={dados.jogadores} equipes={dados.equipes} />}
            {aba === 'tecnicos' && <TecnicosView tecnicos={dados.tecnicos} />}
            {aba === 'arbitros' && <ArbitrosView arbitros={dados.arbitros} />}
          </main>
        )}

        <footer className="mt-16 flex flex-wrap items-center justify-between gap-2 border-t border-borda pt-6 text-xs text-slate-400">
          <span>
            Dados de <span className="font-mono">{API_URL}</span>
            {atualizadoEm && ` · atualizado às ${atualizadoEm.toLocaleTimeString('pt-BR')}`}
          </span>
          <a
            href={`${API_URL}/docs`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-tinta"
          >
            Documentação da API <Icone nome="externo" className="size-3" />
          </a>
        </footer>
      </div>

      {equipeAberta && (
        <EquipeDrawer
          equipe={equipeAberta}
          jogadores={rel.elenco.get(equipeAberta.id) ?? []}
          tecnico={rel.tecnicoDe.get(equipeAberta.id)}
          agentesLivres={rel.agentesLivres}
          tecnicosLivres={rel.tecnicosLivres}
          campeonatos={rel.campeonatosDeEquipe.get(equipeAberta.id) ?? []}
          executar={executar}
          ocupado={ocupado}
          onFechar={fecharPainel}
        />
      )}

      {federacaoAberta && (
        <FederacaoDrawer
          federacao={federacaoAberta}
          equipes={rel.equipesDe.get(federacaoAberta.id) ?? []}
          arbitros={rel.arbitrosDe.get(federacaoAberta.id) ?? []}
          equipesLivres={rel.equipesSemFederacao}
          arbitrosLivres={rel.arbitrosSemFederacao}
          campeonatos={rel.campeonatosDeFederacao.get(federacaoAberta.id) ?? []}
          executar={executar}
          ocupado={ocupado}
          onFechar={fecharPainel}
        />
      )}

      {campeonatoAberto && dados && (
        <CampeonatoDrawer
          campeonato={campeonatoAberto}
          equipes={dados.equipes}
          executar={executar}
          ocupado={ocupado}
          onFechar={fecharPainel}
        />
      )}

      {criando && dados && (
        <FormularioCriacao
          entidade={criando}
          contexto={{ federacoes: dados.federacoes, equipes: dados.equipes, equipesSemTecnico: rel.equipesSemTecnico }}
          onFechar={fecharCriacao}
          onCriado={aoCriar}
        />
      )}

      {mensagem && <Aviso mensagem={mensagem} onFechar={fecharMensagem} />}
    </div>
  )
}

function StatusApi({ carregando, online }: { carregando: boolean; online: boolean }) {
  const [texto, cor, ponto] = carregando
    ? ['Conectando…', 'bg-manteiga text-manteiga-forte', 'bg-manteiga-medio']
    : online
      ? ['API online', 'bg-menta text-menta-forte', 'bg-menta-forte']
      : ['API offline', 'bg-rosa text-rosa-forte', 'bg-rosa-forte']

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${cor}`}>
      <span className="relative flex size-2">
        {online && <span className={`absolute inline-flex size-full animate-ping rounded-full ${ponto} opacity-50`} />}
        <span className={`relative inline-flex size-2 rounded-full ${ponto}`} />
      </span>
      {texto}
    </span>
  )
}

function Carregando() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-[116px] animate-pulse rounded-3xl bg-borda/60" />
      ))}
    </div>
  )
}

function ErroConexao({ mensagem, onTentar }: { mensagem: string; onTentar: () => void }) {
  return (
    <div className="mx-auto mt-8 max-w-xl animate-rise rounded-3xl border border-borda bg-white p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-rosa text-rosa-forte">
          <Icone nome="alerta" className="size-6" />
        </span>
        <div>
          <h2 className="text-lg font-bold">A API não respondeu</h2>
          <p className="text-sm text-slate-500">{mensagem}</p>
        </div>
      </div>

      <ol className="mt-6 space-y-3 text-sm text-slate-600">
        <li>
          <span className="font-semibold text-tinta">1.</span> Ligue o banco:{' '}
          <Codigo>brew services start postgresql@17</Codigo>
        </li>
        <li>
          <span className="font-semibold text-tinta">2.</span> Aplique as migrações: <Codigo>alembic upgrade head</Codigo>
        </li>
        <li>
          <span className="font-semibold text-tinta">3.</span> Suba a API, na pasta do projeto:{' '}
          <Codigo>fastapi dev app/main.py</Codigo>
        </li>
        <li>
          <span className="font-semibold text-tinta">4.</span> Confira no <code className="font-mono">.env</code> da API:{' '}
          <Codigo>CORS_ORIGINS=http://localhost:5173</Codigo>
        </li>
      </ol>

      <button
        type="button"
        onClick={onTentar}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-tinta px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-tinta/85"
      >
        <Icone nome="atualizar" /> Tentar de novo
      </button>
    </div>
  )
}
