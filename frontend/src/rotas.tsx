import type { ComponentType } from 'react'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { FormCampeonato } from './forms/FormCampeonato'
import { FormEquipe } from './forms/FormEquipe'
import { FormFederacao } from './forms/FormFederacao'
import { FormPartida } from './forms/FormPartida'
import { FormArbitro, FormJogador, FormTecnico } from './forms/FormPessoa'
import { Layout, NaoEncontrado } from './Layout'
import { ArbitrosLista } from './views/Arbitros'
import { CampeonatoPainel, CampeonatosLista } from './views/Campeonatos'
import { EquipePainel, EquipesLista } from './views/Equipes'
import { FederacaoPainel, FederacoesLista } from './views/Federacoes'
import { JogadoresLista } from './views/Jogadores'
import { ArbitroPainel, JogadorPainel, TecnicoPainel } from './views/PainelPessoa'
import { PartidaPainel, PartidasLista } from './views/Partidas'
import { TecnicosLista } from './views/Tecnicos'
import { FormUsuario, UsuariosPagina } from './views/Usuarios'

/**
 * Cada aba tem as mesmas 4 rotas. A lista fica sempre por baixo e as filhas abrem uma gaveta por cima:
 *   /equipes            lista (filtros e página na query string: ?q=fla&pagina=2)
 *   /equipes/novo       formulário de criação
 *   /equipes/12         painel com os vínculos
 *   /equipes/12/editar  formulário de edição
 */
function aba(path: string, Lista: ComponentType, Painel: ComponentType, Form: ComponentType): RouteObject {
  return {
    path,
    element: <Lista />,
    children: [
      { path: 'novo', element: <Form /> },
      { path: ':id', element: <Painel /> },
      { path: ':id/editar', element: <Form /> },
    ],
  }
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/equipes" replace /> },
      aba('federacoes', FederacoesLista, FederacaoPainel, FormFederacao),
      aba('campeonatos', CampeonatosLista, CampeonatoPainel, FormCampeonato),
      aba('partidas', PartidasLista, PartidaPainel, FormPartida),
      aba('equipes', EquipesLista, EquipePainel, FormEquipe),
      aba('jogadores', JogadoresLista, JogadorPainel, FormJogador),
      aba('tecnicos', TecnicosLista, TecnicoPainel, FormTecnico),
      aba('arbitros', ArbitrosLista, ArbitroPainel, FormArbitro),
      {
        path: 'usuarios',
        element: <UsuariosPagina />,
        children: [
          { path: 'novo', element: <FormUsuario /> },
          { path: ':id', element: <FormUsuario /> },
        ],
      },
      { path: '*', element: <NaoEncontrado /> },
    ],
  },
])
