// Cliente HTTP: faz a requisição, traduz os erros da API e expõe ApiError com os erros por campo.

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

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

export interface ErroValidacao {
  loc: (string | number)[]
  msg: string
  type: string
  ctx?: Record<string, unknown>
}

/** Traduz as mensagens padrão do Pydantic; as nossas (ex.: "CPF inválido") passam direto. */
export function traduzir(e: ErroValidacao): string {
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

/** Converte o corpo de erro da API em ApiError (mensagem geral + erros por campo). */
export function erroDaResposta(status: number, corpo: unknown): ApiError {
  let detalhe = `Erro ${status}`
  const campos: Record<string, string> = {}
  const det = (corpo as { detail?: unknown } | null)?.detail
  if (typeof det === 'string') {
    detalhe = det // mensagem da regra de negócio
  } else if (Array.isArray(det)) {
    // 422 de validação: [{ loc: ['body', 'cpf'], msg, type }]
    const gerais: string[] = []
    for (const e of det as ErroValidacao[]) {
      const campo = e.loc[0] === 'body' && e.loc.length > 1 ? String(e.loc[e.loc.length - 1]) : null
      if (campo) campos[campo] ??= traduzir(e)
      else gerais.push(traduzir(e))
    }
    detalhe = gerais[0] ?? 'Confira os campos destacados'
  }
  return new ApiError(status, detalhe, campos)
}

/** { nome: 'fla', sem_tecnico: false, skip: 0 } -> "?nome=fla&skip=0" (ignora vazios e false) */
export function querystring(params: object = {}): string {
  const qs = new URLSearchParams()
  for (const [chave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === null || valor === '' || valor === false) continue
    qs.set(chave, String(valor))
  }
  const s = qs.toString()
  return s ? `?${s}` : ''
}

type Metodo = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export async function requisitar<T>(metodo: Metodo, caminho: string, corpo?: unknown): Promise<T> {
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
    let corpoErro: unknown = null
    try {
      corpoErro = await resposta.json()
    } catch {
      // corpo não é JSON
    }
    throw erroDaResposta(resposta.status, corpoErro)
  }

  return (resposta.status === 204 ? undefined : await resposta.json()) as T
}

export const mensagemDe = (e: unknown) => (e instanceof Error ? e.message : String(e))
