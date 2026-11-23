import { describe, expect, it } from 'vitest'
import { formatarDataCurta, paraDataHoraLocal } from '../estilo'
import { calcularIdade, erroNascimento } from '../validacao'

describe('idade', () => {
  const ref = new Date(2026, 5, 15) // 15/06/2026

  it('só conta o ano depois do aniversário (mesma regra da API)', () => {
    expect(calcularIdade('2000-06-16', ref)).toBe(25)
    expect(calcularIdade('2000-06-15', ref)).toBe(26)
    expect(calcularIdade('2000-01-01', ref)).toBe(26)
  })
})

describe('erroNascimento', () => {
  const faixa = { min: 14, max: 60 }
  const anosAtras = (anos: number) => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - anos)
    d.setDate(d.getDate() - 1)
    return d.toISOString().slice(0, 10)
  }

  it('aceita idade dentro da faixa', () => {
    expect(erroNascimento(anosAtras(25), faixa)).toBeNull()
  })

  it('recusa vazio, fora da faixa e futuro', () => {
    expect(erroNascimento('', faixa)).toBe('Campo obrigatório')
    expect(erroNascimento(anosAtras(13), faixa)).toMatch(/entre 14 e 60/)
    expect(erroNascimento(anosAtras(61), faixa)).toMatch(/entre 14 e 60/)
    expect(erroNascimento(anosAtras(-2), faixa)).toBe('Não pode estar no futuro')
  })
})

describe('datas de partida', () => {
  it('formata data curta', () => {
    expect(formatarDataCurta('2026-04-12')).toBe('12/04/2026')
  })

  it('converte para o valor do input datetime-local (ida e volta)', () => {
    const local = '2026-04-12T16:30'
    expect(paraDataHoraLocal(new Date(local).toISOString())).toBe(local)
    expect(paraDataHoraLocal(null)).toBe('')
  })
})
