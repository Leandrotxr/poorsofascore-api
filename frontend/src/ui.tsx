import { useEffect, useState, type ReactNode } from 'react'
import { normalizar, POS, TONS, tomDe, type Tom } from './estilo'
import type { Jogador, Posicao } from './types'

// ---------- Ícones (traço no estilo Lucide, sem dependência extra) ----------

const ICONES = {
  escudo: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  pessoas: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  prancheta: (
    <>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 12h6M9 16h4" />
    </>
  ),
  livre: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="m17 8 5 5M22 8l-5 5" />
    </>
  ),
  busca: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  atualizar: (
    <>
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  calendario: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  bandeira: (
    <>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <path d="M4 22v-7" />
    </>
  ),
  fechar: <path d="M18 6 6 18M6 6l12 12" />,
  alerta: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </>
  ),
  externo: <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />,
  mais: <path d="M12 5v14M5 12h14" />,
  check: <path d="M20 6 9 17l-5-5" />,
  globo: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>
  ),
  trofeu: (
    <>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </>
  ),
  cartao: <rect x="6" y="3" width="12" height="18" rx="2" transform="rotate(12 12 12)" />,
}

export type NomeIcone = keyof typeof ICONES

export function Icone({ nome, className = 'size-4' }: { nome: NomeIcone; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICONES[nome]}
    </svg>
  )
}

// ---------- Avatar com iniciais ----------

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/)
  const ini = partes.length > 1 ? partes[0][0] + partes[partes.length - 1][0] : nome.slice(0, 2)
  return ini.toUpperCase()
}

const TAMANHOS = {
  sm: 'size-9 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-14 text-lg',
}

export function Avatar({
  nome,
  seed,
  tamanho = 'md',
  quadrado = false,
  texto,
  className = '',
}: {
  nome: string
  seed: number
  texto?: string
  tamanho?: keyof typeof TAMANHOS
  quadrado?: boolean
  className?: string
}) {
  const tom = tomDe(seed)
  return (
    <div
      className={`${TAMANHOS[tamanho]} ${quadrado ? 'rounded-2xl' : 'rounded-full'} grid shrink-0 place-items-center ${tom.fundo} ${tom.texto} font-bold ${className}`}
    >
      {texto ?? iniciais(nome)}
    </div>
  )
}

// ---------- Posição ----------

export function Etiqueta({ tom, children }: { tom: Tom; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONS[tom].fundo} ${TONS[tom].texto}`}
    >
      {children}
    </span>
  )
}

export function PosBadge({ posicao }: { posicao: Posicao }) {
  return <Etiqueta tom={POS[posicao].tom}>{POS[posicao].rotulo}</Etiqueta>
}

/** Barra com a quantidade de jogadores por posição. */
export function DistribuicaoPosicoes({ jogadores, className = '' }: { jogadores: Jogador[]; className?: string }) {
  if (jogadores.length === 0) {
    return <div className={`h-2 rounded-full bg-borda ${className}`} title="Elenco vazio" />
  }
  const contagem = new Map<Posicao, number>()
  for (const j of jogadores) contagem.set(j.posicao, (contagem.get(j.posicao) ?? 0) + 1)

  return (
    <div className={`flex h-2 gap-0.5 overflow-hidden rounded-full ${className}`}>
      {(Object.keys(POS) as Posicao[])
        .filter((p) => contagem.has(p))
        .map((p) => (
          <div
            key={p}
            className={TONS[POS[p].tom].medio}
            style={{ flexGrow: contagem.get(p) }}
            title={`${POS[p].rotulo}: ${contagem.get(p)}`}
          />
        ))}
    </div>
  )
}

// ---------- Blocos ----------

export function StatCard({
  rotulo,
  valor,
  icone,
  tom,
  atraso = 0,
}: {
  rotulo: string
  valor: number
  icone: NomeIcone
  tom: Tom
  atraso?: number
}) {
  const t = TONS[tom]
  return (
    <div className={`animate-rise rounded-3xl ${t.fundo} p-5`} style={{ animationDelay: `${atraso}ms` }}>
      <div className="flex items-center justify-between">
        <p className={`text-sm font-semibold ${t.texto}`}>{rotulo}</p>
        <span className={`grid size-9 place-items-center rounded-xl bg-white/70 ${t.texto}`}>
          <Icone nome={icone} className="size-[18px]" />
        </span>
      </div>
      <p className={`mt-3 text-4xl font-extrabold ${t.texto}`}>{valor}</p>
    </div>
  )
}

export function Vazio({ icone, titulo, children }: { icone: NomeIcone; titulo: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-borda bg-white/60 px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-menta text-menta-forte">
        <Icone nome={icone} className="size-7" />
      </span>
      <h3 className="mt-4 text-lg font-bold">{titulo}</h3>
      {children && <div className="mt-2 max-w-md text-sm text-slate-500">{children}</div>}
    </div>
  )
}

export function Rotulo({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{children}</p>
}

export function Codigo({ children }: { children: ReactNode }) {
  return <code className="rounded-md bg-fundo px-1.5 py-0.5 font-mono text-xs text-tinta">{children}</code>
}

// ---------- Painel lateral ----------

export function Gaveta({
  tom,
  icone,
  titulo,
  subtitulo,
  onFechar,
  children,
}: {
  tom: Tom
  icone: ReactNode
  titulo: string
  subtitulo: ReactNode
  onFechar: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const aoTeclar = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onFechar()
    }
    window.addEventListener('keydown', aoTeclar)
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflowAnterior
    }
  }, [onFechar])

  const t = TONS[tom]
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 animate-fade-in bg-tinta/25 backdrop-blur-[2px]" onClick={onFechar} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="relative h-full w-full max-w-md animate-slide-in overflow-y-auto bg-white shadow-2xl shadow-black/10"
      >
        <header className={`relative ${t.fundo} px-6 pt-6 pb-7`}>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className={`absolute top-4 right-4 grid size-9 place-items-center rounded-full bg-white/70 ${t.texto} transition hover:bg-white`}
          >
            <Icone nome="fechar" />
          </button>
          {icone}
          <h2 className={`mt-4 pr-8 text-2xl font-extrabold ${t.texto}`}>{titulo}</h2>
          <p className={`mt-1 text-sm font-medium ${t.texto} opacity-80`}>{subtitulo}</p>
        </header>
        <div className="space-y-7 p-6">{children}</div>
      </aside>
    </div>
  )
}

export function SecaoGaveta({ titulo, extra, children }: { titulo: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline justify-between">
        <Rotulo>{titulo}</Rotulo>
        {extra && <span className="text-xs text-slate-400">{extra}</span>}
      </div>
      {children}
    </section>
  )
}

export function Linha({ children, acao }: { children: ReactNode; acao?: ReactNode }) {
  return (
    <li className="group flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-fundo">
      {children}
      {acao}
    </li>
  )
}

export function VazioPequeno({ children }: { children: ReactNode }) {
  return <p className="mt-2 rounded-2xl border border-dashed border-borda p-3 text-sm text-slate-400">{children}</p>
}

// ---------- Ações ----------

export function BotaoRemover({ rotulo, onClick, ocupado }: { rotulo: string; onClick: () => void; ocupado: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={ocupado}
      aria-label={rotulo}
      title={rotulo}
      className="grid size-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-rosa hover:text-rosa-forte disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
    >
      <Icone nome="fechar" className="size-4" />
    </button>
  )
}

/** Botão que abre uma lista pesquisável de candidatos; clicar num candidato dispara a ação. */
export function Adicionar<T extends { id: number; nome: string }>({
  rotulo,
  candidatos,
  vazio,
  item,
  onEscolher,
  ocupado,
}: {
  rotulo: string
  candidatos: T[]
  vazio: string
  item: (c: T) => ReactNode
  onEscolher: (c: T) => Promise<void>
  ocupado: boolean
}) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3.5 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-tinta hover:bg-fundo hover:text-tinta"
      >
        <Icone nome="mais" />
        {rotulo}
      </button>
    )
  }

  const q = normalizar(busca)
  const lista = candidatos.filter((c) => !q || normalizar(c.nome).includes(q))
  const fechar = () => {
    setAberto(false)
    setBusca('')
  }

  return (
    <div className="mt-3 animate-fade-in rounded-2xl border border-borda bg-fundo/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{rotulo}</p>
        <button
          type="button"
          onClick={fechar}
          aria-label="Cancelar"
          className="grid size-7 place-items-center rounded-full text-slate-400 hover:bg-white hover:text-tinta"
        >
          <Icone nome="fechar" className="size-4" />
        </button>
      </div>

      {candidatos.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">{vazio}</p>
      ) : (
        <>
          <input
            autoFocus
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar…"
            className="mt-2 w-full rounded-xl border border-borda bg-white px-3 py-2 text-sm outline-none focus:border-ceu-medio focus:ring-4 focus:ring-ceu"
          />
          <ul className="mt-2 max-h-60 space-y-1 overflow-y-auto">
            {lista.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={async () => {
                    await onEscolher(c)
                    fechar()
                  }}
                  className="flex w-full items-center gap-3 rounded-xl bg-white px-2 py-1.5 text-left transition hover:ring-2 hover:ring-ceu-medio disabled:opacity-50"
                >
                  {item(c)}
                  <Icone nome="mais" className="ml-auto size-4 shrink-0 text-slate-400" />
                </button>
              </li>
            ))}
            {lista.length === 0 && <li className="px-2 py-1.5 text-sm text-slate-500">Ninguém com esse nome</li>}
          </ul>
        </>
      )}
    </div>
  )
}

// ---------- Notificação ----------

export interface Mensagem {
  tipo: 'ok' | 'erro'
  texto: string
}

export function Aviso({ mensagem, onFechar }: { mensagem: Mensagem; onFechar: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onFechar, mensagem.tipo === 'erro' ? 6000 : 3500)
    return () => window.clearTimeout(t)
  }, [mensagem, onFechar])

  const erro = mensagem.tipo === 'erro'
  return (
    <div
      role={erro ? 'alert' : 'status'}
      className={`fixed bottom-5 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-rise items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg shadow-black/10 ${
        erro ? 'bg-rosa text-rosa-forte' : 'bg-menta text-menta-forte'
      }`}
    >
      <Icone nome={erro ? 'alerta' : 'check'} className="size-5 shrink-0" />
      <span className="flex-1">{mensagem.texto}</span>
      <button type="button" onClick={onFechar} aria-label="Fechar aviso" className="opacity-70 hover:opacity-100">
        <Icone nome="fechar" className="size-4" />
      </button>
    </div>
  )
}
