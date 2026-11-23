import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { mensagemDe, type NomeRecurso } from './api'
import type { Usuario } from './types'

export const POR_PAGINA = 24

// ---------- Avisos (toast) ----------

export interface Mensagem {
  tipo: 'ok' | 'erro'
  texto: string
}

export const AvisoContexto = createContext<(m: Mensagem) => void>(() => {})

export const useAviso = () => useContext(AvisoContexto)

// ---------- Sessão (login) ----------

export interface Sessao {
  usuario: Usuario | null
  /** Logado (EDITOR ou ADMIN): pode criar, editar e excluir. Sem login, o app fica só leitura. */
  podeEditar: boolean
  abrirLogin: () => void
  sair: () => void
}

export const SessaoContexto = createContext<Sessao>({
  usuario: null,
  podeEditar: false,
  abrirLogin: () => {},
  sair: () => {},
})

export const useSessao = () => useContext(SessaoContexto)

// ---------- Ações na API ----------

/**
 * Executa uma alteração na API, avisa o resultado e invalida as consultas (a tela se atualiza sozinha).
 * `executar` devolve true se deu certo, para quem precisa navegar depois (ex.: após excluir).
 */
export function useAcao() {
  const qc = useQueryClient()
  const avisar = useAviso()
  const mutacao = useMutation({
    mutationFn: ({ acao }: { acao: () => Promise<unknown>; sucesso: string }) => acao(),
    onSuccess: (_d, { sucesso }) => avisar({ tipo: 'ok', texto: sucesso }),
    onError: (e) => avisar({ tipo: 'erro', texto: mensagemDe(e) }),
    onSettled: () => qc.invalidateQueries(),
  })
  const { mutateAsync } = mutacao

  const executar = useCallback(
    (acao: () => Promise<unknown>, sucesso: string) =>
      mutateAsync({ acao, sucesso }).then(
        () => true,
        () => false,
      ),
    [mutateAsync],
  )
  return { executar, ocupado: mutacao.isPending }
}

export type Executar = ReturnType<typeof useAcao>['executar']

// ---------- Filtros e página na URL ----------

/**
 * Lê e grava filtros na query string (?q=fla&pagina=2). Assim a busca sobrevive ao F5,
 * dá para compartilhar o link e o botão "voltar" funciona.
 */
export function useFiltrosUrl() {
  const [params, setParams] = useSearchParams()
  const pagina = Math.max(1, Number(params.get('pagina')) || 1)

  const ler = (chave: string) => params.get(chave) ?? ''

  /** Muda um filtro e volta para a página 1 (valor vazio remove o filtro). */
  const mudar = (chave: string, valor: string) =>
    setParams(
      (atual) => {
        const novo = new URLSearchParams(atual)
        if (valor) novo.set(chave, valor)
        else novo.delete(chave)
        if (chave !== 'pagina') novo.delete('pagina')
        return novo
      },
      { replace: true },
    )

  const irPara = (p: number) => mudar('pagina', p > 1 ? String(p) : '')

  return { ler, mudar, pagina, irPara, skip: (pagina - 1) * POR_PAGINA, limit: POR_PAGINA }
}

/** Valor que só muda depois de `ms` sem alterações (para não chamar a API a cada tecla). */
export function useDebounce<T>(valor: T, ms = 300): T {
  const [atrasado, setAtrasado] = useState(valor)
  useEffect(() => {
    const t = window.setTimeout(() => setAtrasado(valor), ms)
    return () => window.clearTimeout(t)
  }, [valor, ms])
  return atrasado
}

// ---------- Navegação das gavetas (painel, formulários) ----------

/** A aba atual vem do primeiro trecho da URL: /equipes/12 -> "equipes". */
export function useAba(): NomeRecurso {
  const { pathname } = useLocation()
  return (pathname.split('/')[1] || 'equipes') as NomeRecurso
}

/** Id da rota (/equipes/:id). NaN quando não há id (ex.: /equipes/novo). */
export function useIdRota(): number {
  const { id } = useParams()
  return Number(id)
}

/** Navega dentro da aba atual mantendo os filtros da lista (?q=...&pagina=...). */
export function useNavegarNaAba() {
  const navigate = useNavigate()
  const aba = useAba()
  const { search } = useLocation()
  return useCallback(
    (sufixo = '') => navigate({ pathname: `/${aba}${sufixo ? `/${sufixo}` : ''}`, search }),
    [navigate, aba, search],
  )
}
