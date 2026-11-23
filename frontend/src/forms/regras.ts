import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api, ApiError, mensagemDe } from '../api'
import { useAviso, useNavegarNaAba, type Mensagem } from '../hooks'

export type Erros = Record<string, string>

export interface Resultado {
  /** Registro criado/editado: a gaveta abre o painel dele depois de salvar */
  id: number
  mensagem: Mensagem
}

/**
 * Cuida do envio: valida no front, trava o botão, mostra os erros da API por campo,
 * atualiza as consultas e abre o painel do registro salvo.
 */
export function useEnvio() {
  const qc = useQueryClient()
  const avisar = useAviso()
  const navegar = useNavegarNaAba()
  const [enviando, setEnviando] = useState(false)
  const [erros, setErros] = useState<Erros>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)

  async function enviar(validar: () => Erros, acao: () => Promise<Resultado>) {
    const locais = validar()
    setErros(locais)
    setErroGeral(null)
    if (Object.keys(locais).length > 0) return

    setEnviando(true)
    try {
      const { id, mensagem } = await acao()
      await qc.invalidateQueries()
      avisar(mensagem)
      navegar(String(id))
    } catch (e) {
      if (e instanceof ApiError) setErros(e.campos)
      setErroGeral(mensagemDe(e))
    } finally {
      setEnviando(false)
    }
  }

  return { enviando, erros, erroGeral, enviar }
}

/**
 * Depois de criar, faz o vínculo opcional (contratar, filiar...). Se só o vínculo falhar,
 * o registro já existe: avisa isso em vez de fingir que nada aconteceu.
 */
export async function vincularDepois(
  criado: string,
  vinculo: (() => Promise<unknown>) | null,
  feito: string,
): Promise<Mensagem> {
  if (!vinculo) return { tipo: 'ok', texto: `${criado} cadastrado(a)` }
  try {
    await vinculo()
    return { tipo: 'ok', texto: `${criado} cadastrado(a) e ${feito}` }
  } catch (e) {
    return { tipo: 'erro', texto: `${criado} foi cadastrado(a), mas não deu para concluir o vínculo: ${mensagemDe(e)}` }
  }
}

export const exigir = (valor: string, campo: string, erros: Erros) => {
  if (!valor.trim()) erros[campo] = 'Campo obrigatório'
}

export function exigirFaixa(valor: string, campo: string, faixa: { min: number; max: number }, erros: Erros) {
  if (!valor.trim()) return void (erros[campo] = 'Campo obrigatório')
  const n = Number(valor)
  if (!Number.isInteger(n)) erros[campo] = 'Informe um número inteiro'
  else if (n < faixa.min || n > faixa.max) erros[campo] = `Entre ${faixa.min} e ${faixa.max}`
}

export const opcoesDe = <T extends string>(lista: readonly T[], mapa: Record<T, { rotulo: string }>) =>
  lista.map((v) => ({ valor: v, rotulo: mapa[v].rotulo }))

// ---------- Buscas usadas nos campos de seleção ----------

export const buscarFederacoes = (nome: string, limit: number) =>
  api.federacoes.listar({ nome, limit }).then((p) => p.items)

export const rotuloFederacao = (f: { sigla: string; nome: string }) => `${f.sigla} · ${f.nome}`

export const buscarEquipes = (nome: string, limit: number) => api.equipes.listar({ nome, limit }).then((p) => p.items)
