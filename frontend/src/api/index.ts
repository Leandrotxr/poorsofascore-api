import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type * as T from '../types'
import { querystring, requisitar } from './cliente'

export { API_URL, ApiError, mensagemDe } from './cliente'

const get = <R>(caminho: string) => requisitar<R>('GET', caminho)
const acao = (metodo: 'PUT' | 'DELETE', caminho: string, corpo?: unknown) => requisitar<unknown>(metodo, caminho, corpo)

/** CRUD padrão de um recurso: GET lista/detalhe, POST, PATCH e DELETE. */
function recurso<Lista, Detalhe, Filtros extends object, Novo, Edicao>(caminho: string) {
  return {
    listar: (filtros: Filtros) => get<T.Pagina<Lista>>(`${caminho}${querystring(filtros)}`),
    obter: (id: number) => get<Detalhe>(`${caminho}/${id}`),
    criar: (dados: Novo) => requisitar<Lista>('POST', caminho, dados),
    editar: (id: number, dados: Edicao) => requisitar<Lista>('PATCH', `${caminho}/${id}`, dados),
    remover: (id: number) => requisitar<void>('DELETE', `${caminho}/${id}`),
  }
}

export const api = {
  resumo: () => get<T.Resumo>('/resumo'),

  federacoes: {
    ...recurso<T.Federacao, T.Federacao, T.FiltrosFederacoes, T.NovaFederacao, T.EdicaoFederacao>('/federacoes'),
    filiarEquipe: (id: number, equipeId: number) => acao('PUT', `/federacoes/${id}/equipes/${equipeId}`),
    desfiliarEquipe: (id: number, equipeId: number) => acao('DELETE', `/federacoes/${id}/equipes/${equipeId}`),
    vincularArbitro: (id: number, arbitroId: number) => acao('PUT', `/federacoes/${id}/arbitros/${arbitroId}`),
    desvincularArbitro: (id: number, arbitroId: number) => acao('DELETE', `/federacoes/${id}/arbitros/${arbitroId}`),
  },
  campeonatos: {
    ...recurso<T.Campeonato, T.Campeonato, T.FiltrosCampeonatos, T.NovoCampeonato, T.EdicaoCampeonato>('/campeonatos'),
    inscrever: (id: number, equipeId: number) => acao('PUT', `/campeonatos/${id}/equipes/${equipeId}`),
    classificacao: (id: number) => get<T.LinhaClassificacao[]>(`/campeonatos/${id}/classificacao`),
    artilheiros: (id: number) => get<T.Artilheiro[]>(`/campeonatos/${id}/artilheiros`),
    removerInscricao: (id: number, equipeId: number) => acao('DELETE', `/campeonatos/${id}/equipes/${equipeId}`),
  },
  equipes: {
    ...recurso<T.Equipe, T.Equipe, T.FiltrosEquipes, T.NovaEquipe, T.EdicaoEquipe>('/equipes'),
    contratar: (id: number, jogadorId: number, contrato?: T.NovoContratoJogador) =>
      acao('PUT', `/equipes/${id}/jogadores/${jogadorId}`, contrato),
    dispensar: (id: number, jogadorId: number) => acao('DELETE', `/equipes/${id}/jogadores/${jogadorId}`),
    definirTecnico: (id: number, tecnicoId: number) => acao('PUT', `/equipes/${id}/tecnico/${tecnicoId}`),
    removerTecnico: (id: number) => acao('DELETE', `/equipes/${id}/tecnico`),
  },
  jogadores: {
    ...recurso<T.Jogador, T.Jogador, T.FiltrosJogadores, T.NovoJogador, T.EdicaoJogador>('/jogadores'),
    contratos: (id: number) => get<T.ContratoJogador[]>(`/jogadores/${id}/contratos`),
  },
  tecnicos: {
    ...recurso<T.Tecnico, T.Tecnico, T.FiltrosTecnicos, T.NovoTecnico, T.EdicaoTecnico>('/tecnicos'),
    contratos: (id: number) => get<T.ContratoTecnico[]>(`/tecnicos/${id}/contratos`),
  },
  arbitros: recurso<T.Arbitro, T.Arbitro, T.FiltrosArbitros, T.NovoArbitro, T.EdicaoArbitro>('/arbitros'),
  partidas: {
    ...recurso<T.Partida, T.PartidaDetalhe, T.FiltrosPartidas, T.NovaPartida, T.EdicaoPartida>('/partidas'),
    adicionarEvento: (id: number, evento: T.NovoEvento) =>
      requisitar<T.PartidaDetalhe>('POST', `/partidas/${id}/eventos`, evento),
    removerEvento: (id: number, eventoId: number) =>
      requisitar<T.PartidaDetalhe>('DELETE', `/partidas/${id}/eventos/${eventoId}`),
  },
}

export type NomeRecurso = 'federacoes' | 'campeonatos' | 'partidas' | 'equipes' | 'jogadores' | 'tecnicos' | 'arbitros'

/**
 * Consultas do TanStack Query. As chaves seguem o padrão [recurso, 'lista', filtros] e [recurso, id].
 * Depois de qualquer alteração, o app invalida todas as consultas (ver useAcao): as entidades se
 * relacionam (contratar mexe em equipe E jogador), então invalidar tudo é o jeito simples de não
 * mostrar dado velho.
 */
export const consultas = {
  resumo: () => queryOptions({ queryKey: ['resumo'], queryFn: api.resumo }),

  federacoes: (f: T.FiltrosFederacoes) =>
    queryOptions({ queryKey: ['federacoes', 'lista', f], queryFn: () => api.federacoes.listar(f), placeholderData: keepPreviousData }),
  federacao: (id: number) => queryOptions({ queryKey: ['federacoes', id], queryFn: () => api.federacoes.obter(id) }),

  campeonatos: (f: T.FiltrosCampeonatos) =>
    queryOptions({ queryKey: ['campeonatos', 'lista', f], queryFn: () => api.campeonatos.listar(f), placeholderData: keepPreviousData }),
  campeonato: (id: number) => queryOptions({ queryKey: ['campeonatos', id], queryFn: () => api.campeonatos.obter(id) }),
  classificacao: (id: number) =>
    queryOptions({ queryKey: ['campeonatos', id, 'classificacao'], queryFn: () => api.campeonatos.classificacao(id) }),
  artilheiros: (id: number) =>
    queryOptions({ queryKey: ['campeonatos', id, 'artilheiros'], queryFn: () => api.campeonatos.artilheiros(id) }),

  partidas: (f: T.FiltrosPartidas) =>
    queryOptions({ queryKey: ['partidas', 'lista', f], queryFn: () => api.partidas.listar(f), placeholderData: keepPreviousData }),
  partida: (id: number) => queryOptions({ queryKey: ['partidas', id], queryFn: () => api.partidas.obter(id) }),

  equipes: (f: T.FiltrosEquipes) =>
    queryOptions({ queryKey: ['equipes', 'lista', f], queryFn: () => api.equipes.listar(f), placeholderData: keepPreviousData }),
  equipe: (id: number) => queryOptions({ queryKey: ['equipes', id], queryFn: () => api.equipes.obter(id) }),

  jogadores: (f: T.FiltrosJogadores) =>
    queryOptions({ queryKey: ['jogadores', 'lista', f], queryFn: () => api.jogadores.listar(f), placeholderData: keepPreviousData }),
  jogador: (id: number) => queryOptions({ queryKey: ['jogadores', id], queryFn: () => api.jogadores.obter(id) }),
  contratosJogador: (id: number) =>
    queryOptions({ queryKey: ['jogadores', id, 'contratos'], queryFn: () => api.jogadores.contratos(id) }),

  tecnicos: (f: T.FiltrosTecnicos) =>
    queryOptions({ queryKey: ['tecnicos', 'lista', f], queryFn: () => api.tecnicos.listar(f), placeholderData: keepPreviousData }),
  tecnico: (id: number) => queryOptions({ queryKey: ['tecnicos', id], queryFn: () => api.tecnicos.obter(id) }),
  contratosTecnico: (id: number) =>
    queryOptions({ queryKey: ['tecnicos', id, 'contratos'], queryFn: () => api.tecnicos.contratos(id) }),

  arbitros: (f: T.FiltrosArbitros) =>
    queryOptions({ queryKey: ['arbitros', 'lista', f], queryFn: () => api.arbitros.listar(f), placeholderData: keepPreviousData }),
  arbitro: (id: number) => queryOptions({ queryKey: ['arbitros', id], queryFn: () => api.arbitros.obter(id) }),
}
