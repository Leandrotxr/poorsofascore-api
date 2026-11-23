import { useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { TONS, type Tom } from '../estilo'
import { useAcao, useSessao } from '../hooks'
import { useDialogo } from './dialogo'
import { Icone } from './Icone'
import { Rotulo } from './ui'

// ---------- Painel lateral ----------

export function Gaveta({
  tom,
  icone,
  titulo,
  subtitulo,
  acoes,
  onFechar,
  larga = false,
  children,
}: {
  tom: Tom
  icone: ReactNode
  titulo: string
  subtitulo?: ReactNode
  acoes?: ReactNode
  onFechar: () => void
  /** Mais espaço para tabelas (ex.: classificação do campeonato) */
  larga?: boolean
  children: ReactNode
}) {
  const ref = useRef<HTMLElement>(null)
  useDialogo(ref, onFechar)

  const t = TONS[tom]
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 animate-fade-in bg-tinta/25 backdrop-blur-[2px]" onClick={onFechar} />
      <aside
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`relative h-full w-full ${larga ? 'max-w-2xl' : 'max-w-md'} animate-slide-in overflow-y-auto bg-white shadow-2xl shadow-black/10 outline-none`}
      >
        <header className={`relative ${t.fundo} px-6 pt-6 pb-7`}>
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            {acoes}
            <button
              type="button"
              onClick={onFechar}
              aria-label="Fechar"
              title="Fechar (Esc)"
              className={`grid size-9 place-items-center rounded-full bg-white/70 ${t.texto} transition hover:bg-white`}
            >
              <Icone nome="fechar" />
            </button>
          </div>
          {icone}
          <h2 className={`mt-4 pr-8 text-2xl font-extrabold ${t.texto}`}>{titulo}</h2>
          {subtitulo && <p className={`mt-1 text-sm font-medium ${t.texto} opacity-80`}>{subtitulo}</p>}
        </header>
        <div className="space-y-7 p-6">{children}</div>
      </aside>
    </div>
  )
}

/** Gaveta enquanto o registro carrega, ou com o erro (ex.: 404 de um link antigo). */
export function GavetaEstado({ tom, erro, onFechar }: { tom: Tom; erro?: string; onFechar: () => void }) {
  return (
    <Gaveta
      tom={tom}
      icone={<span className="block size-14 animate-pulse rounded-2xl bg-white/70" />}
      titulo={erro ? 'Não encontrado' : 'Carregando…'}
      onFechar={onFechar}
    >
      {erro ? (
        <p className="rounded-2xl bg-rosa p-4 text-sm text-rosa-forte">{erro}</p>
      ) : (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-borda/60" />
          ))}
        </div>
      )}
    </Gaveta>
  )
}

/** Ícone grande do topo da gaveta. */
export function IconeGaveta({ children }: { children: ReactNode }) {
  return <span className="grid size-14 place-items-center rounded-2xl bg-white/70">{children}</span>
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

/** Nome clicável que leva para o painel de outra entidade (ex.: do elenco para o jogador). */
export function LinkEntidade({ para, children }: { para: string; children: ReactNode }) {
  return (
    <Link to={para} className="min-w-0 flex-1 truncate font-medium hover:underline">
      {children}
    </Link>
  )
}

export function VazioPequeno({ children }: { children: ReactNode }) {
  return <p className="mt-2 rounded-2xl border border-dashed border-borda p-3 text-sm text-slate-400">{children}</p>
}

export function BotaoRemover({ rotulo, onClick, ocupado }: { rotulo: string; onClick: () => void; ocupado: boolean }) {
  const { podeEditar } = useSessao()
  if (!podeEditar) return null
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

// ---------- Editar / Excluir ----------

const BOTAO_TOPO = 'grid size-9 place-items-center rounded-full bg-white/70 transition hover:bg-white'

/** Botões do topo do painel: editar (vai para .../editar) e excluir (pede confirmação). */
export function AcoesGaveta({
  tom,
  rotulo,
  consequencia,
  excluir,
  aoExcluir,
}: {
  tom: Tom
  /** "o jogador Pedro" — usado nas mensagens */
  rotulo: string
  /** O que acontece com os vínculos ao excluir */
  consequencia: string
  excluir: () => Promise<unknown>
  aoExcluir: () => void
}) {
  const [confirmando, setConfirmando] = useState(false)
  const { search } = useLocation()
  const { podeEditar } = useSessao()
  const t = TONS[tom]
  if (!podeEditar) return null
  return (
    <>
      <Link to={{ pathname: 'editar', search }} className={`${BOTAO_TOPO} ${t.texto}`} aria-label="Editar" title="Editar">
        <Icone nome="lapis" />
      </Link>
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className={`${BOTAO_TOPO} ${t.texto} hover:text-rosa-forte`}
        aria-label="Excluir"
        title="Excluir"
      >
        <Icone nome="lixeira" />
      </button>
      {confirmando && (
        <Confirmar
          titulo={`Excluir ${rotulo}?`}
          descricao={consequencia}
          excluir={excluir}
          sucesso={`${rotulo[0].toUpperCase()}${rotulo.slice(1)} foi excluído(a)`}
          onFechar={() => setConfirmando(false)}
          aoExcluir={aoExcluir}
        />
      )}
    </>
  )
}

export function Confirmar({
  titulo,
  descricao,
  excluir,
  sucesso,
  onFechar,
  aoExcluir,
}: {
  titulo: string
  descricao: string
  excluir: () => Promise<unknown>
  sucesso: string
  onFechar: () => void
  aoExcluir: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useDialogo(ref, onFechar)
  const { executar, ocupado } = useAcao()

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-tinta/40" onClick={onFechar} />
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmar-titulo"
        aria-describedby="confirmar-descricao"
        className="relative w-full max-w-sm animate-rise rounded-3xl bg-white p-6 shadow-2xl"
      >
        <span className="grid size-11 place-items-center rounded-2xl bg-rosa text-rosa-forte">
          <Icone nome="lixeira" className="size-5" />
        </span>
        <h2 id="confirmar-titulo" className="mt-4 text-lg font-bold">
          {titulo}
        </h2>
        <p id="confirmar-descricao" className="mt-1 text-sm text-slate-500">
          {descricao} Essa ação não pode ser desfeita.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-full border border-borda px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-fundo"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={ocupado}
            onClick={async () => {
              const ok = await executar(excluir, sucesso)
              onFechar()
              if (ok) aoExcluir()
            }}
            className="inline-flex items-center gap-2 rounded-full bg-rosa-forte px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rosa-forte/85 disabled:opacity-60"
          >
            {ocupado && <Icone nome="atualizar" className="size-4 animate-spin" />}
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}
