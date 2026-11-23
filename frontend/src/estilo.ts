import type { NomeRecurso } from './api'
import type { NomeIcone } from './components/Icone'
import type { Abrangencia, FormatoCampeonato, FuncaoArbitro, Posicao, StatusPartida, TipoEvento } from './types'

// Classes completas (o Tailwind só gera classes que aparecem inteiras no código).
// As cores ficam definidas em index.css (@theme).
export const TONS = {
  menta: { fundo: 'bg-menta', medio: 'bg-menta-medio', texto: 'text-menta-forte' },
  ceu: { fundo: 'bg-ceu', medio: 'bg-ceu-medio', texto: 'text-ceu-forte' },
  lavanda: { fundo: 'bg-lavanda', medio: 'bg-lavanda-medio', texto: 'text-lavanda-forte' },
  pessego: { fundo: 'bg-pessego', medio: 'bg-pessego-medio', texto: 'text-pessego-forte' },
  manteiga: { fundo: 'bg-manteiga', medio: 'bg-manteiga-medio', texto: 'text-manteiga-forte' },
  rosa: { fundo: 'bg-rosa', medio: 'bg-rosa-medio', texto: 'text-rosa-forte' },
  agua: { fundo: 'bg-agua', medio: 'bg-agua-medio', texto: 'text-agua-forte' },
}

export type Tom = keyof typeof TONS

const ORDEM: Tom[] = ['pessego', 'ceu', 'menta', 'lavanda', 'manteiga', 'rosa', 'agua']

/** Cor fixa por id: a mesma equipe/pessoa tem sempre a mesma cor. */
export function nomeTomDe(seed: number): Tom {
  return ORDEM[Math.abs(seed) % ORDEM.length]
}

export function tomDe(seed: number) {
  return TONS[nomeTomDe(seed)]
}

/** Cor e ícone de cada entidade (abas, cards do topo, gavetas). */
export const VISUAL: Record<NomeRecurso, { tom: Tom; icone: NomeIcone; rotulo: string }> = {
  federacoes: { tom: 'agua', icone: 'globo', rotulo: 'Federações' },
  campeonatos: { tom: 'menta', icone: 'trofeu', rotulo: 'Campeonatos' },
  partidas: { tom: 'rosa', icone: 'bola', rotulo: 'Partidas' },
  equipes: { tom: 'pessego', icone: 'escudo', rotulo: 'Equipes' },
  jogadores: { tom: 'ceu', icone: 'pessoas', rotulo: 'Jogadores' },
  tecnicos: { tom: 'lavanda', icone: 'prancheta', rotulo: 'Técnicos' },
  arbitros: { tom: 'manteiga', icone: 'cartao', rotulo: 'Árbitros' },
}

export const POS: Record<Posicao, { rotulo: string; tom: Tom }> = {
  GOLEIRO: { rotulo: 'Goleiro', tom: 'manteiga' },
  ZAGUEIRO: { rotulo: 'Zagueiro', tom: 'ceu' },
  LATERAL: { rotulo: 'Lateral', tom: 'agua' },
  VOLANTE: { rotulo: 'Volante', tom: 'lavanda' },
  MEIA: { rotulo: 'Meia', tom: 'rosa' },
  ATACANTE: { rotulo: 'Atacante', tom: 'pessego' },
}

export const FUNCAO: Record<FuncaoArbitro, { rotulo: string; tom: Tom }> = {
  CENTRAL: { rotulo: 'Central', tom: 'pessego' },
  ASSISTENTE: { rotulo: 'Assistente', tom: 'agua' },
  VAR: { rotulo: 'VAR', tom: 'lavanda' },
}

export const ABRANGENCIA: Record<Abrangencia, { rotulo: string; tom: Tom }> = {
  MUNDIAL: { rotulo: 'Mundial', tom: 'ceu' },
  CONTINENTAL: { rotulo: 'Continental', tom: 'lavanda' },
  NACIONAL: { rotulo: 'Nacional', tom: 'menta' },
  ESTADUAL: { rotulo: 'Estadual', tom: 'manteiga' },
}

export const FORMATO: Record<FormatoCampeonato, { rotulo: string; tom: Tom }> = {
  PONTOS_CORRIDOS: { rotulo: 'Pontos corridos', tom: 'ceu' },
  MATA_MATA: { rotulo: 'Mata-mata', tom: 'rosa' },
  GRUPOS_E_MATA_MATA: { rotulo: 'Grupos + mata-mata', tom: 'lavanda' },
}

export const STATUS: Record<StatusPartida, { rotulo: string; tom: Tom }> = {
  AGENDADA: { rotulo: 'Agendada', tom: 'ceu' },
  EM_ANDAMENTO: { rotulo: 'Em andamento', tom: 'manteiga' },
  ENCERRADA: { rotulo: 'Encerrada', tom: 'menta' },
}

export const EVENTO: Record<TipoEvento, { rotulo: string; simbolo: string }> = {
  GOL: { rotulo: 'Gol', simbolo: '⚽' },
  GOL_CONTRA: { rotulo: 'Gol contra', simbolo: '⚽' },
  CARTAO_AMARELO: { rotulo: 'Cartão amarelo', simbolo: '🟨' },
  CARTAO_VERMELHO: { rotulo: 'Cartão vermelho', simbolo: '🟥' },
}

/** "2026-04-12" -> "12/04/2026" */
export function formatarDataCurta(iso: string): string {
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

/** Data e hora com fuso (da API) -> "dom., 12/04 · 16:00" no horário local */
export function formatarDataHora(iso: string): string {
  const data = new Date(iso)
  const dia = data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${dia} · ${hora}`
}

/** "2026-04-12T19:00:00Z" -> "2026-04-12T16:00" (valor de <input type="datetime-local"> no fuso local) */
export function paraDataHoraLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/** "2026-04-12" -> "12 de abr." (sem fuso: a data da API não tem hora) */
function formatarData(iso: string, comAno = false): string {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    ...(comAno ? { year: 'numeric' } : {}),
  })
}

export function formatarPeriodo(inicio: string | null, fim: string | null): string | null {
  if (inicio && fim) return `${formatarData(inicio)} – ${formatarData(fim, true)}`
  if (inicio) return `a partir de ${formatarData(inicio, true)}`
  if (fim) return `até ${formatarData(fim, true)}`
  return null
}

export function formatarCnpj(cnpj: string): string {
  const d = cnpj.replace(/\D/g, '')
  if (d.length !== 14) return cnpj
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

export function plural(n: number, singular: string, pluralForma: string): string {
  return `${n} ${n === 1 ? singular : pluralForma}`
}
