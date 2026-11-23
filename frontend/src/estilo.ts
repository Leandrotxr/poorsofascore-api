import type { Abrangencia, FormatoCampeonato, FuncaoArbitro, Posicao } from './types'

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

/** Para busca: ignora maiúsculas e acentos ("joao" encontra "João"). */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

export function plural(n: number, singular: string, pluralForma: string): string {
  return `${n} ${n === 1 ? singular : pluralForma}`
}
