import { useIsFetching, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { API_URL, consultas, mensagemDe, type NomeRecurso } from './api'
import { Icone } from './components/Icone'
import { Codigo, StatCard } from './components/ui'
import { VISUAL } from './estilo'
import { useAba } from './hooks'

const ABAS: NomeRecurso[] = ['federacoes', 'campeonatos', 'partidas', 'equipes', 'jogadores', 'tecnicos', 'arbitros']

const NOVO: Record<NomeRecurso, string> = {
  federacoes: 'Nova federação',
  campeonatos: 'Novo campeonato',
  partidas: 'Nova partida',
  equipes: 'Nova equipe',
  jogadores: 'Novo jogador',
  tecnicos: 'Novo técnico',
  arbitros: 'Novo árbitro',
}

export function Layout() {
  const qc = useQueryClient()
  const aba = useAba()
  const { search } = useLocation()
  const resumo = useQuery(consultas.resumo())
  const buscando = useIsFetching() > 0
  const atualizadoEm = resumo.dataUpdatedAt ? new Date(resumo.dataUpdatedAt) : null
  const abaValida = ABAS.includes(aba)

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 py-6 sm:py-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-menta text-menta-forte">
              <Icone nome="escudo" className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                Poor <span className="text-menta-forte">SofaScore</span>
              </h1>
              <p className="text-xs text-slate-500 sm:text-sm">Federações, campeonatos, equipes e pessoas</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <StatusApi carregando={resumo.isPending} online={resumo.isSuccess && !resumo.isError} />
            <button
              type="button"
              onClick={() => void qc.invalidateQueries()}
              disabled={buscando}
              title={atualizadoEm ? `Atualizado às ${atualizadoEm.toLocaleTimeString('pt-BR')}` : undefined}
              className="inline-flex items-center gap-2 rounded-full border border-borda bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-fundo disabled:opacity-60"
            >
              <Icone nome="atualizar" className={`size-4 ${buscando ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </header>

        {resumo.isError && !resumo.data ? (
          <ErroConexao mensagem={mensagemDe(resumo.error)} onTentar={() => void resumo.refetch()} />
        ) : (
          <main>
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 xl:grid-cols-7">
              {ABAS.map((a, i) => (
                <StatCard
                  key={a}
                  rotulo={VISUAL[a].rotulo}
                  valor={resumo.data?.[a]}
                  icone={VISUAL[a].icone}
                  tom={VISUAL[a].tom}
                  atraso={i * 30}
                />
              ))}
            </section>

            <div className="mt-10 mb-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <nav aria-label="Entidades" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <div className="inline-flex gap-1 rounded-2xl border border-borda bg-white p-1">
                  {ABAS.map((a) => (
                    <NavLink
                      key={a}
                      to={`/${a}`}
                      className={({ isActive }) =>
                        `flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                          isActive ? 'bg-tinta text-white' : 'text-slate-500 hover:bg-fundo hover:text-tinta'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icone nome={VISUAL[a].icone} />
                          {VISUAL[a].rotulo}
                          <span className={`rounded-full px-2 text-xs ${isActive ? 'bg-white/20' : 'bg-fundo'}`}>
                            {resumo.data?.[a] ?? '–'}
                          </span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </nav>
              {abaValida && (
                <Link
                  to={{ pathname: `/${aba}/novo`, search }}
                  className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-tinta px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-tinta/85 xl:self-auto"
                >
                  <Icone nome="mais" /> {NOVO[aba]}
                </Link>
              )}
            </div>

            <Outlet />
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
    </div>
  )
}

export function NaoEncontrado() {
  return (
    <div className="mx-auto mt-8 max-w-xl rounded-3xl border border-borda bg-white p-8 text-center">
      <h2 className="text-lg font-bold">Página não encontrada</h2>
      <p className="mt-2 text-sm text-slate-500">O endereço não existe ou mudou.</p>
      <Link to="/" className="mt-6 inline-block rounded-full bg-tinta px-5 py-2.5 text-sm font-semibold text-white">
        Ir para o início
      </Link>
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
    <span
      role="status"
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${cor}`}
    >
      <span className="relative flex size-2">
        {online && <span className={`absolute inline-flex size-full animate-ping rounded-full ${ponto} opacity-50`} />}
        <span className={`relative inline-flex size-2 rounded-full ${ponto}`} />
      </span>
      {texto}
    </span>
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
          <span className="font-semibold text-tinta">1.</span> Ligue o banco: <Codigo>docker compose up -d db</Codigo>
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
