import { useQuery } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { mensagemDe } from '../api'
import { useDebounce, useSessao } from '../hooks'
import { Icone } from './Icone'

const LIMITE_BUSCA = 20

interface Opcao {
  id: number
  nome: string
}

/**
 * Lista pesquisável que busca no servidor (não depende de ter tudo carregado na tela).
 * `buscar` recebe o texto digitado e devolve os primeiros resultados.
 */
export function BuscaRemota<T extends Opcao>({
  chave,
  buscar,
  item,
  onEscolher,
  desabilitar,
  vazio,
  ocupado = false,
  autoFocus = true,
}: {
  /** Identifica a busca no cache, ex.: "agentes-livres" */
  chave: string
  buscar: (nome: string, limite: number) => Promise<T[]>
  item: (c: T) => ReactNode
  onEscolher: (c: T) => void
  desabilitar?: (c: T) => boolean
  vazio: string
  ocupado?: boolean
  autoFocus?: boolean
}) {
  const [texto, setTexto] = useState('')
  const nome = useDebounce(texto.trim())
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['busca', chave, nome],
    queryFn: () => buscar(nome, LIMITE_BUSCA),
  })

  return (
    <div>
      <input
        autoFocus={autoFocus}
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar pelo nome…"
        aria-label="Buscar pelo nome"
        className="w-full rounded-xl border border-borda bg-white px-3 py-2 text-sm outline-none focus:border-ceu-medio focus:ring-4 focus:ring-ceu"
      />
      <ul className="mt-2 max-h-60 space-y-1 overflow-y-auto" aria-live="polite">
        {isPending && <li className="px-2 py-1.5 text-sm text-slate-400">Buscando…</li>}
        {isError && <li className="px-2 py-1.5 text-sm text-rosa-forte">{mensagemDe(error)}</li>}
        {data?.map((c) => {
          const bloqueado = desabilitar?.(c) ?? false
          return (
            <li key={c.id}>
              <button
                type="button"
                disabled={ocupado || bloqueado}
                onClick={() => onEscolher(c)}
                className="flex w-full items-center gap-3 rounded-xl bg-white px-2 py-1.5 text-left transition hover:ring-2 hover:ring-ceu-medio disabled:opacity-50 disabled:hover:ring-0"
              >
                {item(c)}
                <Icone nome={bloqueado ? 'check' : 'mais'} className="ml-auto size-4 shrink-0 text-slate-400" />
              </button>
            </li>
          )
        })}
        {data?.length === 0 && (
          <li className="px-2 py-1.5 text-sm text-slate-500">{nome ? 'Ninguém com esse nome' : vazio}</li>
        )}
        {data?.length === LIMITE_BUSCA && (
          <li className="px-2 pt-1 text-xs text-slate-400">Mostrando os {LIMITE_BUSCA} primeiros. Digite para refinar.</li>
        )}
      </ul>
    </div>
  )
}

/** Botão que abre uma busca de candidatos; escolher um dispara a ação (contratar, filiar...). */
export function Adicionar<T extends Opcao>({
  rotulo,
  onEscolher,
  ...busca
}: Omit<Parameters<typeof BuscaRemota<T>>[0], 'onEscolher'> & {
  rotulo: string
  onEscolher: (c: T) => Promise<unknown>
}) {
  const [aberto, setAberto] = useState(false)
  const { podeEditar } = useSessao()

  if (!podeEditar) return null
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

  return (
    <div className="mt-3 animate-fade-in rounded-2xl border border-borda bg-fundo/60 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{rotulo}</p>
        <button
          type="button"
          onClick={() => setAberto(false)}
          aria-label="Cancelar"
          className="grid size-7 place-items-center rounded-full text-slate-400 hover:bg-white hover:text-tinta"
        >
          <Icone nome="fechar" className="size-4" />
        </button>
      </div>
      <BuscaRemota
        {...busca}
        onEscolher={async (c) => {
          await onEscolher(c)
          setAberto(false)
        }}
      />
    </div>
  )
}

/** Campo de formulário que escolhe UM registro buscando no servidor (ex.: a equipe do jogador). */
export function SelecaoRemota<T extends Opcao>({
  valor,
  onChange,
  nenhum,
  rotuloDe = (c) => c.nome,
  ...busca
}: Omit<Parameters<typeof BuscaRemota<T>>[0], 'onEscolher' | 'autoFocus'> & {
  valor: T | null
  onChange: (c: T | null) => void
  /** Texto quando nada foi escolhido */
  nenhum: string
  rotuloDe?: (c: T) => string
}) {
  const [buscando, setBuscando] = useState(false)

  if (buscando) {
    return (
      <div className="mt-1.5 rounded-xl border border-borda bg-fundo/60 p-2">
        <BuscaRemota
          {...busca}
          onEscolher={(c) => {
            onChange(c)
            setBuscando(false)
          }}
        />
        <button
          type="button"
          onClick={() => setBuscando(false)}
          className="mt-2 text-xs font-semibold text-slate-500 hover:text-tinta"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-borda bg-white px-3 py-2 text-sm">
      <span className={`flex-1 truncate ${valor ? 'font-medium' : 'text-slate-400'}`}>
        {valor ? rotuloDe(valor) : nenhum}
      </span>
      {valor && (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Limpar"
          className="grid size-6 place-items-center rounded-full text-slate-400 hover:bg-fundo hover:text-tinta"
        >
          <Icone nome="fechar" className="size-3.5" />
        </button>
      )}
      <button
        type="button"
        onClick={() => setBuscando(true)}
        className="rounded-full border border-borda px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-fundo"
      >
        {valor ? 'Trocar' : 'Escolher'}
      </button>
    </div>
  )
}
