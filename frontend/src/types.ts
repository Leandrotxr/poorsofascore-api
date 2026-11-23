// Tipos da API, gerados a partir do OpenAPI (src/api/schema.ts, via `npm run tipos`).
// Aqui só damos nomes curtos. Se a API mudar e os tipos forem regerados, o TypeScript acusa
// cada lugar do front que precisa acompanhar.
import type { components, operations } from './api/schema'

type S = components['schemas']
type Query<Op extends keyof operations> = NonNullable<operations[Op]['parameters']['query']>

export type Posicao = S['Posicao']
export type FuncaoArbitro = S['FuncaoArbitro']
export type Abrangencia = S['Abrangencia']
export type FormatoCampeonato = S['FormatoCampeonato']

// `satisfies` garante que as listas só têm valores que existem no enum da API.
export const POSICOES = ['GOLEIRO', 'ZAGUEIRO', 'LATERAL', 'VOLANTE', 'MEIA', 'ATACANTE'] as const satisfies readonly Posicao[]
export const FUNCOES = ['CENTRAL', 'ASSISTENTE', 'VAR'] as const satisfies readonly FuncaoArbitro[]
export const ABRANGENCIAS = ['MUNDIAL', 'CONTINENTAL', 'NACIONAL', 'ESTADUAL'] as const satisfies readonly Abrangencia[]
export const FORMATOS = ['PONTOS_CORRIDOS', 'MATA_MATA', 'GRUPOS_E_MATA_MATA'] as const satisfies readonly FormatoCampeonato[]

export type EquipeResumo = S['EquipeResumo']
export type FederacaoResumo = S['FederacaoResumo']
export type JogadorResumo = S['JogadorResumo']

export type Federacao = S['FederacaoDetalhe']
export type Equipe = S['EquipeDetalhe']
export type Campeonato = S['CampeonatoOut']
export type Jogador = S['JogadorOut']
export type Tecnico = S['TecnicoOut']
export type Arbitro = S['ArbitroOut']
export type Resumo = S['Resumo']

export interface Pagina<T> {
  items: T[]
  total: number
  skip: number
  limit: number
}

// Corpos de criação (POST) e edição (PATCH)
export type NovaFederacao = S['FederacaoCreate']
export type NovaEquipe = S['EquipeCreate']
export type NovoCampeonato = S['CampeonatoCreate']
export type NovoJogador = S['JogadorCreate']
export type NovoTecnico = S['TecnicoCreate']
export type NovoArbitro = S['ArbitroCreate']

export type EdicaoFederacao = S['FederacaoUpdate']
export type EdicaoEquipe = S['EquipeUpdate']
export type EdicaoCampeonato = S['CampeonatoUpdate']
export type EdicaoJogador = S['JogadorUpdate']
export type EdicaoTecnico = S['TecnicoUpdate']
export type EdicaoArbitro = S['ArbitroUpdate']

// Filtros das listagens (query string)
export type FiltrosFederacoes = Query<'listar_federacoes_federacoes_get'>
export type FiltrosCampeonatos = Query<'listar_campeonatos_campeonatos_get'>
export type FiltrosEquipes = Query<'listar_equipes_equipes_get'>
export type FiltrosJogadores = Query<'listar_jogadores_jogadores_get'>
export type FiltrosTecnicos = Query<'listar_tecnicos_tecnicos_get'>
export type FiltrosArbitros = Query<'listar_arbitros_arbitros_get'>
