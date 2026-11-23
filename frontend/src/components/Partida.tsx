import { Link, useLocation } from 'react-router'
import { formatarDataHora, STATUS } from '../estilo'
import type { Partida } from '../types'
import { Avatar, Etiqueta } from './ui'

/** "2 x 1", ou "x" enquanto a partida não começou. */
export function Placar({ partida, grande = false }: { partida: Partida; grande?: boolean }) {
  const tamanho = grande ? 'text-5xl' : 'text-lg'
  if (partida.status === 'AGENDADA') {
    return <span className={`${tamanho} font-bold text-slate-300`}>×</span>
  }
  return (
    <span className={`${tamanho} font-extrabold tabular-nums`}>
      {partida.gols_mandante} <span className="text-slate-300">×</span> {partida.gols_visitante}
    </span>
  )
}

/** Uma partida numa lista: rodada/data, as duas equipes, o placar e o status. */
export function LinhaPartida({ partida, mostrarCampeonato = false }: { partida: Partida; mostrarCampeonato?: boolean }) {
  const { pathname, search } = useLocation()
  // Dentro da aba Partidas o link é relativo (mantém os filtros); fora dela vai direto para /partidas/:id.
  const destino = pathname.startsWith('/partidas') ? { pathname: `/partidas/${partida.id}`, search } : `/partidas/${partida.id}`
  const st = STATUS[partida.status]
  return (
    <Link
      to={destino}
      className="group grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-borda bg-white px-4 py-3 transition hover:shadow-md hover:shadow-black/5 focus-visible:ring-2 focus-visible:ring-ceu-medio focus-visible:outline-none"
    >
      <div className="col-span-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        {mostrarCampeonato && (
          <span className="font-semibold text-tinta">
            {partida.campeonato.nome} {partida.campeonato.temporada}
          </span>
        )}
        <span>Rodada {partida.rodada}</span>
        {partida.data_hora && <span>{formatarDataHora(partida.data_hora)}</span>}
        {partida.local && <span className="truncate">{partida.local}</span>}
        <span className="ml-auto">
          <Etiqueta tom={st.tom}>{st.rotulo}</Etiqueta>
        </span>
      </div>
      <div className="flex min-w-0 items-center justify-end gap-2 text-right">
        <span className="truncate font-semibold">{partida.mandante.nome}</span>
        <Avatar nome={partida.mandante.nome} seed={partida.mandante.id} tamanho="sm" quadrado />
      </div>
      <Placar partida={partida} />
      <div className="flex min-w-0 items-center gap-2">
        <Avatar nome={partida.visitante.nome} seed={partida.visitante.id} tamanho="sm" quadrado />
        <span className="truncate font-semibold">{partida.visitante.nome}</span>
      </div>
    </Link>
  )
}
