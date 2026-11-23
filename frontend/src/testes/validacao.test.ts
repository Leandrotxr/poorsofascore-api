import { describe, expect, it } from 'vitest'
import { mascaraCnpj, mascaraCpf, validarCnpj, validarCpf } from '../validacao'

// Os mesmos CPFs/CNPJs válidos usados nos testes da API (tests/conftest.py).
describe('CPF', () => {
  it.each(['123.456.789-09', '12345678909', '529.982.247-25'])('aceita %s', (cpf) => {
    expect(validarCpf(cpf)).toBe(true)
  })

  it.each(['123.456.789-00', '111.111.111-11', '123', ''])('rejeita %s', (cpf) => {
    expect(validarCpf(cpf)).toBe(false)
  })

  it('aplica a máscara enquanto digita', () => {
    expect(mascaraCpf('123')).toBe('123')
    expect(mascaraCpf('1234567')).toBe('123.456.7')
    expect(mascaraCpf('12345678909')).toBe('123.456.789-09')
    expect(mascaraCpf('123456789091234')).toBe('123.456.789-09') // corta o excesso
  })
})

describe('CNPJ', () => {
  it.each(['11.222.333/0001-81', '04545021000143', '60.674.644/0001-97'])('aceita %s', (cnpj) => {
    expect(validarCnpj(cnpj)).toBe(true)
  })

  it.each(['11.222.333/0001-80', '11.111.111/1111-11', '123'])('rejeita %s', (cnpj) => {
    expect(validarCnpj(cnpj)).toBe(false)
  })

  it('aplica a máscara', () => {
    expect(mascaraCnpj('11222333000181')).toBe('11.222.333/0001-81')
  })
})
