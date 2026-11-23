import { describe, expect, it } from 'vitest'
import { ApiError, erroDaResposta, querystring } from '../api/cliente'

describe('querystring', () => {
  it('ignora valores vazios, nulos e false', () => {
    expect(querystring({ nome: 'fla', sem_tecnico: false, federacao_id: null, posicao: undefined, q: '' })).toBe(
      '?nome=fla',
    )
  })

  it('mantém zero e true', () => {
    expect(querystring({ skip: 0, sem_equipe: true })).toBe('?skip=0&sem_equipe=true')
  })

  it('codifica caracteres especiais', () => {
    expect(querystring({ nome: 'São Paulo' })).toBe('?nome=S%C3%A3o+Paulo')
  })

  it('devolve vazio sem filtros', () => {
    expect(querystring({})).toBe('')
  })
})

describe('erroDaResposta', () => {
  it('usa a mensagem de regra de negócio', () => {
    const e = erroDaResposta(409, { detail: 'Já existe uma equipe com esse CNPJ' })
    expect(e).toBeInstanceOf(ApiError)
    expect(e.status).toBe(409)
    expect(e.message).toBe('Já existe uma equipe com esse CNPJ')
  })

  it('separa os erros 422 por campo e traduz as mensagens do Pydantic', () => {
    const e = erroDaResposta(422, {
      detail: [
        { loc: ['body', 'idade'], msg: 'x', type: 'greater_than_equal', ctx: { ge: 14 } },
        { loc: ['body', 'cpf'], msg: 'Value error, CPF inválido', type: 'value_error' },
        { loc: ['body', 'nome'], msg: 'x', type: 'missing' },
      ],
    })
    expect(e.campos).toEqual({ idade: 'Mínimo: 14', cpf: 'CPF inválido', nome: 'Campo obrigatório' })
    expect(e.message).toBe('Confira os campos destacados')
  })

  it('usa erros fora do corpo (ex.: query string) como mensagem geral', () => {
    const e = erroDaResposta(422, { detail: [{ loc: ['query', 'limit'], msg: 'x', type: 'less_than_equal', ctx: { le: 100 } }] })
    expect(e.message).toBe('Máximo: 100')
    expect(e.campos).toEqual({})
  })

  it('cai no status quando o corpo não é o esperado', () => {
    expect(erroDaResposta(500, null).message).toBe('Erro 500')
  })
})
