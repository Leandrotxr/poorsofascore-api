import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { mensagemDe } from '../api'
import { POR_PAGINA, useFiltrosUrl } from '../hooks'
import type { Pagina } from '../types'
import type { NomeIcone } from './Icone'
import { Carregando, ErroCarregar, Paginacao, Vazio } from './ui'

/**
 * Esqueleto de toda aba: filtros no topo, lista paginada pelo servidor e, por cima,
 * a gaveta da rota filha (painel, novo, editar) via <Outlet />.
 */
export function ListaPaginada<T>({
  consulta,
  filtros,
  filtrando,
  rotulo,
  vazio,
  carregando,
  children,
}: {
  consulta: UseQueryResult<Pagina<T>>
  /** Busca, chips... */
  filtros: ReactNode
  /** Há algum filtro ativo? (muda a mensagem de lista vazia) */
  filtrando: boolean
  /** Singular e plural: ['equipe', 'equipes'] */
  rotulo: [string, string]
  vazio: { icone: NomeIcone; titulo: string; texto: ReactNode }
  carregando?: ReactNode
  children: (itens: T[]) => ReactNode
}) {
  const { pagina, irPara } = useFiltrosUrl()
  const { data, isPending, isError, error, isPlaceholderData } = consulta

  let conteudo: ReactNode
  if (isPending) conteudo = carregando ?? <Carregando />
  else if (isError) conteudo = <ErroCarregar mensagem={mensagemDe(error)} />
  else if (data.total === 0 && !filtrando)
    conteudo = (
      <Vazio icone={vazio.icone} titulo={vazio.titulo}>
        {vazio.texto}
      </Vazio>
    )
  else if (data.items.length === 0)
    conteudo =
      pagina > 1 ? (
        // Ex.: era a última página e o último item foi excluído
        <Vazio icone="busca" titulo="Esta página está vazia">
          <button type="button" onClick={() => irPara(1)} className="font-semibold text-tinta underline">
            Voltar para a primeira página
          </button>
        </Vazio>
      ) : (
        <Vazio icone="busca" titulo={`Nenhum(a) ${rotulo[0]} com esses filtros`} />
      )
  else
    conteudo = (
      <div className={`transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`} aria-busy={isPlaceholderData}>
        {children(data.items)}
      </div>
    )

  return (
    <div className="space-y-5">
      {filtros}
      {data && data.total > 0 && (
        <Paginacao total={data.total} pagina={pagina} porPagina={POR_PAGINA} onMudar={irPara} rotulo={rotulo} />
      )}
      {conteudo}
      {data && data.total > POR_PAGINA && (
        <Paginacao total={data.total} pagina={pagina} porPagina={POR_PAGINA} onMudar={irPara} rotulo={rotulo} />
      )}
      <Outlet />
    </div>
  )
}

/** Card clicável das listas: abre o painel da entidade mantendo os filtros da URL. */
export function CardLink({ id, indice, children }: { id: number; indice: number; children: ReactNode }) {
  const { search } = useLocation()
  return (
    <Link
      to={{ pathname: String(id), search }}
      style={{ animationDelay: `${Math.min(indice, 8) * 40}ms` }}
      className="group block animate-rise rounded-3xl border border-borda bg-white p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 focus-visible:ring-2 focus-visible:ring-ceu-medio focus-visible:outline-none"
    >
      {children}
    </Link>
  )
}

/** Grade de cards das listas. */
export function Grade({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
}
