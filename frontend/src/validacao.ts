// Mesmas regras da API (app/core/validators.py e limites dos models), para avisar antes de enviar.

export const LIMITES = {
  fundacao: { min: 1800, max: 2100 },
  temporada: { min: 1850, max: 2100 },
  idadeJogador: { min: 14, max: 60 },
  idadeTecnico: { min: 18, max: 100 },
  idadeArbitro: { min: 18, max: 65 },
}

export const digitos = (v: string) => v.replace(/\D/g, '')

export function validarCpf(valor: string): boolean {
  const d = digitos(valor)
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  for (const t of [9, 10]) {
    let soma = 0
    for (let i = 0; i < t; i++) soma += Number(d[i]) * (t + 1 - i)
    if (((soma * 10) % 11) % 10 !== Number(d[t])) return false
  }
  return true
}

export function validarCnpj(valor: string): boolean {
  const d = digitos(valor)
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false
  const pesos = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  for (const t of [12, 13]) {
    let soma = 0
    for (let i = 0; i < t; i++) soma += Number(d[i]) * pesos[i + 13 - t]
    const resto = soma % 11
    if ((resto < 2 ? 0 : 11 - resto) !== Number(d[t])) return false
  }
  return true
}

/** Aplica a máscara enquanto a pessoa digita: 12345678909 -> 123.456.789-09 */
export function mascaraCpf(valor: string): string {
  const d = digitos(valor).slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2')
}

/** 11222333000181 -> 11.222.333/0001-81 */
export function mascaraCnpj(valor: string): string {
  const d = digitos(valor).slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}
