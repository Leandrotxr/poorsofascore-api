import type {
  Arbitro,
  Campeonato,
  Equipe,
  Federacao,
  Jogador,
  NovaEquipe,
  NovaFederacao,
  NovoArbitro,
  NovoCampeonato,
  NovoJogador,
  NovoTecnico,
  Tecnico,
} from './types'

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

// A API aceita no máximo 100 registros por página (app/api/deps.py).
const LIMITE = 100

export class ApiError extends Error {
  status: number
  /** Erros de validação por campo (resposta 422 do FastAPI), ex.: { cpf: 'CPF inválido' } */
  campos: Record<string, string>

  constructor(status: number, message: string, campos: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.campos = campos
  }
}

interface ErroValidacao {
  loc: (string | number)[]
  msg: string
  type: string
  ctx?: Record<string, unknown>
}

/** Traduz as mensagens padrão do Pydantic; as nossas (ex.: "CPF inválido") passam direto. */
function traduzir(e: ErroValidacao): string {
  const c = e.ctx ?? {}
  switch (e.type) {
    case 'missing':
      return 'Campo obrigatório'
    case 'greater_than_equal':
      return `Mínimo: ${c.ge}`
    case 'less_than_equal':
      return `Máximo: ${c.le}`
    case 'string_too_short':
      return `Mínimo de ${c.min_length} caracteres`
    case 'string_too_long':
      return `Máximo de ${c.max_length} caracteres`
    case 'string_pattern_mismatch':
      return 'Formato inválido'
    case 'enum':
      return 'Opção inválida'
    case 'int_parsing':
    case 'int_type':
      return 'Informe um número inteiro'
    case 'date_from_datetime_parsing':
    case 'date_parsing':
      return 'Data inválida'
    default:
      return e.msg.replace(/^Value error, /, '')
  }
}

async function requisitar<T>(metodo: 'GET' | 'POST' | 'PUT' | 'DELETE', caminho: string, corpo?: unknown): Promise<T> {
  let resposta: Response
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers: corpo === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    })
  } catch {
    // fetch só lança quando não há resposta: API desligada ou bloqueio de CORS.
    throw new ApiError(0, `Não foi possível conectar à API em ${API_URL}`)
  }

  if (!resposta.ok) {
    let detalhe = `Erro ${resposta.status}`
    const campos: Record<string, string> = {}
    try {
      const json = await resposta.json()
      if (typeof json?.detail === 'string') {
        detalhe = json.detail // mensagem da regra de negócio
      } else if (Array.isArray(json?.detail)) {
        // 422 de validação: [{ loc: ['body', 'cpf'], msg, type }]
        const gerais: string[] = []
        for (const e of json.detail as ErroValidacao[]) {
          const campo = e.loc[0] === 'body' && e.loc.length > 1 ? String(e.loc[e.loc.length - 1]) : null
          if (campo) campos[campo] ??= traduzir(e)
          else gerais.push(traduzir(e))
        }
        detalhe = gerais[0] ?? 'Confira os campos destacados'
      }
    } catch {
      // corpo não é JSON
    }
    throw new ApiError(resposta.status, detalhe, campos)
  }

  return (resposta.status === 204 ? undefined : await resposta.json()) as T
}

const get = <T>(caminho: string) => requisitar<T>('GET', caminho)
const post = <T>(caminho: string, corpo: unknown) => requisitar<T>('POST', caminho, corpo)
const put = (caminho: string) => requisitar<unknown>('PUT', caminho)
const del = (caminho: string) => requisitar<unknown>('DELETE', caminho)

export const api = {
  // Listas
  federacoes: () => get<Federacao[]>(`/federacoes?limit=${LIMITE}`),
  campeonatos: () => get<Campeonato[]>(`/campeonatos?limit=${LIMITE}`),
  equipes: () => get<Equipe[]>(`/equipes?limit=${LIMITE}`),
  jogadores: () => get<Jogador[]>(`/jogadores?limit=${LIMITE}`),
  tecnicos: () => get<Tecnico[]>(`/tecnicos?limit=${LIMITE}`),
  arbitros: () => get<Arbitro[]>(`/arbitros?limit=${LIMITE}`),

  // Criação
  criarFederacao: (dados: NovaFederacao) => post<Federacao>('/federacoes', dados),
  criarCampeonato: (dados: NovoCampeonato) => post<Campeonato>('/campeonatos', dados),
  criarEquipe: (dados: NovaEquipe) => post<Equipe>('/equipes', dados),
  criarJogador: (dados: NovoJogador) => post<Jogador>('/jogadores', dados),
  criarTecnico: (dados: NovoTecnico) => post<Tecnico>('/tecnicos', dados),
  criarArbitro: (dados: NovoArbitro) => post<Arbitro>('/arbitros', dados),

  // Equipe -> Jogadores (1:N) e Técnico (1:1)
  contratarJogador: (equipeId: number, jogadorId: number) => put(`/equipes/${equipeId}/jogadores/${jogadorId}`),
  dispensarJogador: (equipeId: number, jogadorId: number) => del(`/equipes/${equipeId}/jogadores/${jogadorId}`),
  definirTecnico: (equipeId: number, tecnicoId: number) => put(`/equipes/${equipeId}/tecnico/${tecnicoId}`),
  removerTecnico: (equipeId: number) => del(`/equipes/${equipeId}/tecnico`),

  // Federação -> Equipes (1:N) e Árbitros (1:N)
  filiarEquipe: (federacaoId: number, equipeId: number) => put(`/federacoes/${federacaoId}/equipes/${equipeId}`),
  desfiliarEquipe: (federacaoId: number, equipeId: number) => del(`/federacoes/${federacaoId}/equipes/${equipeId}`),
  vincularArbitro: (federacaoId: number, arbitroId: number) => put(`/federacoes/${federacaoId}/arbitros/${arbitroId}`),
  desvincularArbitro: (federacaoId: number, arbitroId: number) =>
    del(`/federacoes/${federacaoId}/arbitros/${arbitroId}`),

  // Campeonato <-> Equipes (N:N)
  inscreverEquipe: (campeonatoId: number, equipeId: number) => put(`/campeonatos/${campeonatoId}/equipes/${equipeId}`),
  removerInscricao: (campeonatoId: number, equipeId: number) =>
    del(`/campeonatos/${campeonatoId}/equipes/${equipeId}`),
}
