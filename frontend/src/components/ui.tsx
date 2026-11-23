import { useEffect, useState, type ReactNode } from 'react'
import { plural, POS, TONS, tomDe, type Tom } from '../estilo'
import { useDebounce } from '../hooks'
import { POSICOES, type Posicao } from '../types'
import { Icone, type NomeIcone } from './Icone'

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

// ---------- Etiquetas ----------

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
export function DistribuicaoPosicoes({
  jogadores,
  className = '',
}: {
  jogadores: { posicao: Posicao }[]
  className?: string
}) {
  if (jogadores.length === 0) {
    return <div className={`h-2 rounded-full bg-borda ${className}`} title="Elenco vazio" />
  }
  const contagem = new Map<Posicao, number>()
  for (const j of jogadores) contagem.set(j.posicao, (contagem.get(j.posicao) ?? 0) + 1)

  return (
    <div className={`flex h-2 gap-0.5 overflow-hidden rounded-full ${className}`}>
      {POSICOES.filter((p) => contagem.has(p)).map((p) => (
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
  valor: number | undefined
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
      <p className={`mt-3 text-4xl font-extrabold ${t.texto}`}>{valor ?? '–'}</p>
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

export function ErroCarregar({ mensagem }: { mensagem: string }) {
  return (
    <div role="alert" className="flex items-center gap-2 rounded-2xl bg-rosa px-4 py-3 text-sm text-rosa-forte">
      <Icone nome="alerta" className="size-4 shrink-0" />
      Não foi possível carregar: {mensagem}
    </div>
  )
}

export function Carregando({ altura = 'h-48', quantidade = 6 }: { altura?: string; quantidade?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: quantidade }, (_, i) => (
        <div key={i} className={`${altura} animate-pulse rounded-3xl bg-borda/60`} />
      ))}
    </div>
  )
}

export function Rotulo({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{children}</p>
}

export function Codigo({ children }: { children: ReactNode }) {
  return <code className="rounded-md bg-fundo px-1.5 py-0.5 font-mono text-xs text-tinta">{children}</code>
}

/** Botão de filtro em forma de pílula. */
export function Chip({
  ativo,
  onClick,
  classeAtivo = 'border border-tinta bg-tinta text-white',
  children,
}: {
  ativo: boolean
  onClick: () => void
  classeAtivo?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
        ativo ? classeAtivo : 'border border-borda bg-white text-slate-600 hover:bg-fundo'
      }`}
    >
      {children}
    </button>
  )
}

export function LinhaChips({ children }: { children: ReactNode }) {
  return <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">{children}</div>
}

// ---------- Busca e paginação ----------

/** Campo de busca que só avisa a mudança depois que a pessoa para de digitar. */
export function CampoBusca({
  valor,
  onBuscar,
  placeholder = 'Buscar por nome…',
}: {
  valor: string
  onBuscar: (v: string) => void
  placeholder?: string
}) {
  const [texto, setTexto] = useState(valor)
  const [valorAnterior, setValorAnterior] = useState(valor)
  const atrasado = useDebounce(texto)

  // A URL é a fonte da verdade: se ela mudar por fora (voltar do navegador), o campo acompanha.
  // (ajuste durante a renderização, como recomenda a doc do React, em vez de um useEffect)
  if (valor !== valorAnterior) {
    setValorAnterior(valor)
    if (valor !== texto.trim()) setTexto(valor)
  }
  useEffect(() => {
    if (atrasado.trim() !== valor) onBuscar(atrasado.trim())
  }, [atrasado]) // eslint-disable-line react-hooks/exhaustive-deps -- só reage ao texto digitado

  return (
    <label className="relative block flex-1">
      <span className="sr-only">{placeholder}</span>
      <Icone nome="busca" className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-borda bg-white py-3 pr-4 pl-11 text-sm transition outline-none placeholder:text-slate-400 focus:border-ceu-medio focus:ring-4 focus:ring-ceu"
      />
    </label>
  )
}

export function Paginacao({
  total,
  pagina,
  porPagina,
  onMudar,
  rotulo,
}: {
  total: number
  pagina: number
  porPagina: number
  onMudar: (p: number) => void
  rotulo: [string, string]
}) {
  const paginas = Math.max(1, Math.ceil(total / porPagina))
  const inicio = total === 0 ? 0 : (pagina - 1) * porPagina + 1
  const fim = Math.min(total, pagina * porPagina)
  const botao =
    'inline-flex items-center gap-1 rounded-full border border-borda bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-fundo disabled:opacity-40 disabled:hover:bg-white'

  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
      <span>
        {total === 0 ? plural(0, ...rotulo) : `${inicio}–${fim} de ${plural(total, ...rotulo)}`}
      </span>
      {paginas > 1 && (
        <div className="flex items-center gap-2">
          <button type="button" className={botao} disabled={pagina <= 1} onClick={() => onMudar(pagina - 1)}>
            <Icone nome="esquerda" /> Anterior
          </button>
          <span className="px-1 font-semibold text-tinta">
            {pagina} / {paginas}
          </span>
          <button type="button" className={botao} disabled={pagina >= paginas} onClick={() => onMudar(pagina + 1)}>
            Próxima <Icone nome="direita" />
          </button>
        </div>
      )}
    </nav>
  )
}
