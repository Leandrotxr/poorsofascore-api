import { describe, expect, it } from 'vitest'
import { formatarCnpj, formatarPeriodo, nomeTomDe, plural } from '../estilo'

describe('formatação', () => {
  it('formata CNPJ guardado só com dígitos', () => {
    expect(formatarCnpj('11222333000181')).toBe('11.222.333/0001-81')
    expect(formatarCnpj('123')).toBe('123')
  })

  it('escreve o período do campeonato', () => {
    expect(formatarPeriodo(null, null)).toBeNull()
    expect(formatarPeriodo('2026-04-12', null)).toMatch(/^a partir de 12/)
    expect(formatarPeriodo(null, '2026-12-06')).toMatch(/^até 06/)
    expect(formatarPeriodo('2026-04-12', '2026-12-06')).toContain('–')
  })

  it('flexiona o plural', () => {
    expect(plural(1, 'equipe', 'equipes')).toBe('1 equipe')
    expect(plural(0, 'equipe', 'equipes')).toBe('0 equipes')
  })

  it('dá sempre a mesma cor para o mesmo id', () => {
    expect(nomeTomDe(5)).toBe(nomeTomDe(5))
    expect(nomeTomDe(-3)).toBeDefined()
  })
})
