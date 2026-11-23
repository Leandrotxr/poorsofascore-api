import type { FormEvent, ReactNode } from 'react'
import { Icone } from '../components/Icone'
import { GavetaEstado, Gaveta, IconeGaveta } from '../components/Gaveta'
import { mensagemDe, type NomeRecurso } from '../api'
import { VISUAL } from '../estilo'

/** Título das gavetas de formulário. */
const TITULOS: Record<NomeRecurso, { novo: string; editar: string }> = {
  federacoes: { novo: 'Nova federação', editar: 'Editar federação' },
  campeonatos: { novo: 'Novo campeonato', editar: 'Editar campeonato' },
  partidas: { novo: 'Nova partida', editar: 'Editar partida' },
  equipes: { novo: 'Nova equipe', editar: 'Editar equipe' },
  jogadores: { novo: 'Novo jogador', editar: 'Editar jogador' },
  tecnicos: { novo: 'Novo técnico', editar: 'Editar técnico' },
  arbitros: { novo: 'Novo árbitro', editar: 'Editar árbitro' },
}

/**
 * Gaveta de criação/edição. Na edição, espera o registro carregar antes de montar o formulário
 * (assim os campos já nascem preenchidos).
 */
export function GavetaFormulario({
  entidade,
  editando,
  carregado,
  erro,
  onFechar,
  children,
}: {
  entidade: NomeRecurso
  editando: boolean
  carregado: boolean
  erro: unknown
  onFechar: () => void
  children: ReactNode
}) {
  const v = VISUAL[entidade]
  if (editando && !carregado) {
    return <GavetaEstado tom={v.tom} erro={erro ? mensagemDe(erro) : undefined} onFechar={onFechar} />
  }
  return (
    <Gaveta
      tom={v.tom}
      icone={
        <IconeGaveta>
          <Icone nome={v.icone} className="size-7" />
        </IconeGaveta>
      }
      titulo={TITULOS[entidade][editando ? 'editar' : 'novo']}
      subtitulo="Campos com * são obrigatórios"
      onFechar={onFechar}
    >
      {children}
    </Gaveta>
  )
}

export function Campo({
  rotulo,
  erro,
  dica,
  obrigatorio,
  children,
}: {
  rotulo: string
  erro?: string
  dica?: string
  obrigatorio?: boolean
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">
        {rotulo}
        {obrigatorio && <span className="text-rosa-forte"> *</span>}
      </span>
      {children}
      {erro ? (
        <span className="mt-1 block text-xs font-medium text-rosa-forte">{erro}</span>
      ) : (
        dica && <span className="mt-1 block text-xs text-slate-400">{dica}</span>
      )}
    </label>
  )
}

const entrada = (erro?: string) =>
  `mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-4 disabled:bg-fundo disabled:text-slate-500 ${
    erro ? 'border-rosa-medio focus:ring-rosa' : 'border-borda focus:border-ceu-medio focus:ring-ceu'
  }`

export function Texto({
  valor,
  onChange,
  erro,
  ...resto
}: {
  valor: string
  onChange: (v: string) => void
  erro?: string
  placeholder?: string
  inputMode?: 'numeric' | 'text'
  type?: string
  autoFocus?: boolean
  disabled?: boolean
}) {
  return (
    <input
      {...resto}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={!!erro}
      className={entrada(erro)}
    />
  )
}

export function Selecao<T extends string>({
  valor,
  onChange,
  opcoes,
  erro,
}: {
  valor: T
  onChange: (v: T) => void
  opcoes: { valor: T; rotulo: string }[]
  erro?: string
}) {
  return (
    <select
      value={valor}
      onChange={(e) => onChange(e.target.value as T)}
      aria-invalid={!!erro}
      className={entrada(erro)}
    >
      {opcoes.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.rotulo}
        </option>
      ))}
    </select>
  )
}

export function Formulario({
  onSubmit,
  onCancelar,
  enviando,
  erroGeral,
  editando,
  children,
}: {
  onSubmit: () => void
  onCancelar: () => void
  enviando: boolean
  erroGeral: string | null
  editando: boolean
  children: ReactNode
}) {
  return (
    <form
      noValidate
      onSubmit={(e: FormEvent) => {
        e.preventDefault()
        onSubmit()
      }}
      className="space-y-4"
    >
      {children}
      <div className="space-y-3 border-t border-borda pt-5">
        {erroGeral && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-rosa px-3 py-2.5 text-sm text-rosa-forte">
            <Icone nome="alerta" className="mt-0.5 size-4 shrink-0" />
            {erroGeral}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-full border border-borda px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-fundo"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex items-center gap-2 rounded-full bg-tinta px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-tinta/85 disabled:opacity-60"
          >
            <Icone nome={enviando ? 'atualizar' : 'check'} className={`size-4 ${enviando ? 'animate-spin' : ''}`} />
            {editando ? 'Salvar' : 'Cadastrar'}
          </button>
        </div>
      </div>
    </form>
  )
}
