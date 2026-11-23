// Espelham os schemas de saída da API (app/schemas/**).

export type Posicao = 'GOLEIRO' | 'ZAGUEIRO' | 'LATERAL' | 'VOLANTE' | 'MEIA' | 'ATACANTE'
export const POSICOES: Posicao[] = ['GOLEIRO', 'ZAGUEIRO', 'LATERAL', 'VOLANTE', 'MEIA', 'ATACANTE']

export type FuncaoArbitro = 'CENTRAL' | 'ASSISTENTE' | 'VAR'
export const FUNCOES: FuncaoArbitro[] = ['CENTRAL', 'ASSISTENTE', 'VAR']

export type Abrangencia = 'MUNDIAL' | 'CONTINENTAL' | 'NACIONAL' | 'ESTADUAL'
export const ABRANGENCIAS: Abrangencia[] = ['MUNDIAL', 'CONTINENTAL', 'NACIONAL', 'ESTADUAL']

export type FormatoCampeonato = 'PONTOS_CORRIDOS' | 'MATA_MATA' | 'GRUPOS_E_MATA_MATA'
export const FORMATOS: FormatoCampeonato[] = ['PONTOS_CORRIDOS', 'MATA_MATA', 'GRUPOS_E_MATA_MATA']

export interface EquipeResumo {
  id: number
  nome: string
}

export interface FederacaoResumo {
  id: number
  nome: string
  sigla: string
}

export interface Federacao {
  id: number
  nome: string
  sigla: string
  abrangencia: Abrangencia
  cnpj: string | null
  fundacao: number
  sede: string
}

export interface Equipe {
  id: number
  nome: string
  cnpj: string
  fundacao: number
  sede: string
  federacao: FederacaoResumo | null
}

export interface Jogador {
  id: number
  nome: string
  cpf: string // já vem mascarado da API: ***.***.***-09
  idade: number
  nacionalidade: string
  posicao: Posicao
  equipe: EquipeResumo | null
}

export interface Tecnico {
  id: number
  nome: string
  cpf: string
  idade: number
  nacionalidade: string
  equipe: EquipeResumo | null
}

export interface Arbitro {
  id: number
  nome: string
  cpf: string
  idade: number
  nacionalidade: string
  funcao: FuncaoArbitro
  federacao: FederacaoResumo | null
}

export interface Campeonato {
  id: number
  nome: string
  temporada: number
  formato: FormatoCampeonato
  data_inicio: string | null // "2026-04-12"
  data_fim: string | null
  federacao: FederacaoResumo
  equipes: EquipeResumo[]
}

// ---------- Corpos de criação (POST) ----------

export interface NovaFederacao {
  nome: string
  sigla: string
  abrangencia: Abrangencia
  fundacao: number
  sede: string
  cnpj: string | null
}

export interface NovaEquipe {
  nome: string
  cnpj: string
  fundacao: number
  sede: string
}

interface NovaPessoa {
  nome: string
  cpf: string
  idade: number
  nacionalidade: string
}

export type NovoJogador = NovaPessoa & { posicao: Posicao }
export type NovoTecnico = NovaPessoa
export type NovoArbitro = NovaPessoa & { funcao: FuncaoArbitro }

export interface NovoCampeonato {
  nome: string
  temporada: number
  formato: FormatoCampeonato
  data_inicio: string | null
  data_fim: string | null
  federacao_id: number
}
