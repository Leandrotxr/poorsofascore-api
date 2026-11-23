import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api, consultas, mensagemDe } from '../api'
import { AcoesGaveta, BotaoRemover, Gaveta, GavetaEstado, IconeGaveta, Linha, LinkEntidade, SecaoGaveta, VazioPequeno } from '../components/Gaveta'
import { Icone } from '../components/Icone'
import { ListaPaginada } from '../components/Lista'
import { LinhaPartida, Placar } from '../components/Partida'
import { Avatar, Chip, Etiqueta, LinhaChips, Rotulo } from '../components/ui'
import { EVENTO, formatarDataHora, STATUS } from '../estilo'
import { useAcao, useFiltrosUrl, useIdRota, useNavegarNaAba, type Executar } from '../hooks'
import { STATUS_PARTIDA, TIPOS_EVENTO, type PartidaDetalhe, type StatusPartida, type TipoEvento } from '../types'

export function PartidasLista() {
  const f = useFiltrosUrl()
  const campeonatoId = Number(f.ler('campeonato_id')) || undefined
  const status = (f.ler('status') || undefined) as StatusPartida | undefined
  const consulta = useQuery(
    consultas.partidas({ campeonato_id: campeonatoId, status, skip: f.skip, limit: f.limit }),
  )
  // Para o filtro por campeonato (são poucos; a lista inteira cabe num <select>).
  const campeonatos = useQuery(consultas.campeonatos({ limit: 100 }))

  return (
    <ListaPaginada
      consulta={consulta}
      filtrando={!!campeonatoId || !!status}
      rotulo={['partida', 'partidas']}
      vazio={{
        icone: 'bola',
        titulo: 'Nenhuma partida cadastrada',
        texto: 'Use o botão Nova partida. As duas equipes precisam estar inscritas no campeonato.',
      }}
      carregando={<div className="h-64 animate-pulse rounded-3xl bg-borda/60" />}
      filtros={
        <>
          <select
            value={f.ler('campeonato_id')}
            onChange={(e) => f.mudar('campeonato_id', e.target.value)}
            aria-label="Filtrar por campeonato"
            className="w-full rounded-2xl border border-borda bg-white px-4 py-3 text-sm outline-none focus:border-ceu-medio focus:ring-4 focus:ring-ceu sm:w-auto"
          >
            <option value="">Todos os campeonatos</option>
            {campeonatos.data?.items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} {c.temporada}
              </option>
            ))}
          </select>
          <LinhaChips>
            <Chip ativo={!status} onClick={() => f.mudar('status', '')}>
              Todos os status
            </Chip>
            {STATUS_PARTIDA.map((s) => (
              <Chip key={s} ativo={status === s} onClick={() => f.mudar('status', s)}>
                {STATUS[s].rotulo}
              </Chip>
            ))}
          </LinhaChips>
        </>
      }
    >
      {(partidas) => (
        <div className="space-y-3">
          {partidas.map((p) => (
            <LinhaPartida key={p.id} partida={p} mostrarCampeonato={!campeonatoId} />
          ))}
        </div>
      )}
    </ListaPaginada>
  )
}

/** Próximo passo do status (o botão principal do painel). */
const PROXIMO: Record<StatusPartida, { para: StatusPartida; rotulo: string; aviso: string } | null> = {
  AGENDADA: { para: 'EM_ANDAMENTO', rotulo: 'Iniciar partida', aviso: 'Partida iniciada' },
  EM_ANDAMENTO: { para: 'ENCERRADA', rotulo: 'Encerrar partida', aviso: 'Partida encerrada: já conta na classificação' },
  ENCERRADA: { para: 'EM_ANDAMENTO', rotulo: 'Reabrir', aviso: 'Partida reaberta' },
}

export function PartidaPainel() {
  const id = useIdRota()
  const navegar = useNavegarNaAba()
  const fechar = () => navegar()
  const { data: partida, error } = useQuery(consultas.partida(id))
  const { executar, ocupado } = useAcao()

  if (!partida) return <GavetaEstado tom="rosa" erro={error ? mensagemDe(error) : undefined} onFechar={fechar} />

  const st = STATUS[partida.status]
  const proximo = PROXIMO[partida.status]
  const titulo = `${partida.mandante.nome} × ${partida.visitante.nome}`

  return (
    <Gaveta
      tom="rosa"
      icone={
        <IconeGaveta>
          <Icone nome="bola" className="size-7" />
        </IconeGaveta>
      }
      titulo={titulo}
      subtitulo={`${partida.campeonato.nome} ${partida.campeonato.temporada} · Rodada ${partida.rodada}`}
      onFechar={fechar}
      acoes={
        <AcoesGaveta
          tom="rosa"
          rotulo={`a partida ${titulo}`}
          consequencia="Os gols e cartões dela também são apagados, e a classificação é recalculada."
          excluir={() => api.partidas.remover(partida.id)}
          aoExcluir={fechar}
        />
      }
    >
      <section className="rounded-3xl bg-fundo p-5" aria-label="Placar">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
          <EquipePlacar nome={partida.mandante.nome} id={partida.mandante.id} papel="Mandante" />
          <Placar partida={partida} grande />
          <EquipePlacar nome={partida.visitante.nome} id={partida.visitante.id} papel="Visitante" />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Etiqueta tom={st.tom}>{st.rotulo}</Etiqueta>
          {proximo && (
            <button
              type="button"
              disabled={ocupado}
              onClick={() => void executar(() => api.partidas.editar(partida.id, { status: proximo.para }), proximo.aviso)}
              className="inline-flex items-center gap-1.5 rounded-full bg-tinta px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-tinta/85 disabled:opacity-60"
            >
              {proximo.rotulo}
            </button>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-fundo px-3 py-2.5">
          <Rotulo>Quando</Rotulo>
          <p className="mt-0.5 text-sm font-semibold">
            {partida.data_hora ? formatarDataHora(partida.data_hora) : <span className="font-normal text-slate-400">A definir</span>}
          </p>
        </div>
        <div className="rounded-2xl bg-fundo px-3 py-2.5">
          <Rotulo>Local</Rotulo>
          <p className="mt-0.5 truncate text-sm font-semibold">
            {partida.local ?? <span className="font-normal text-slate-400">A definir</span>}
          </p>
        </div>
        <div className="col-span-2 rounded-2xl bg-fundo px-3 py-2.5">
          <Rotulo>Árbitro</Rotulo>
          <p className="mt-0.5 text-sm font-semibold">
            {partida.arbitro ? (
              <LinkEntidade para={`/arbitros/${partida.arbitro.id}`}>{partida.arbitro.nome}</LinkEntidade>
            ) : (
              <span className="font-normal text-slate-400">Não definido</span>
            )}
          </p>
        </div>
      </div>

      <SecaoGaveta titulo="Lances" extra={partida.eventos.length ? `${partida.eventos.length}` : undefined}>
        {partida.eventos.length === 0 ? (
          <VazioPequeno>
            {partida.status === 'AGENDADA' ? 'Inicie a partida para registrar gols e cartões.' : 'Nenhum lance registrado.'}
          </VazioPequeno>
        ) : (
          <ul className="mt-2 space-y-1">
            {partida.eventos.map((e) => (
              <Linha
                key={e.id}
                acao={
                  <BotaoRemover
                    rotulo={`Remover ${EVENTO[e.tipo].rotulo.toLowerCase()} de ${e.jogador?.nome ?? 'jogador excluído'}`}
                    ocupado={ocupado}
                    onClick={() => void executar(() => api.partidas.removerEvento(partida.id, e.id), 'Lance removido')}
                  />
                }
              >
                <span className="w-9 shrink-0 text-right font-mono text-sm font-semibold text-slate-500">{e.minuto}'</span>
                <span aria-hidden="true">{EVENTO[e.tipo].simbolo}</span>
                <div className="min-w-0 flex-1">
                  {e.jogador ? (
                    <LinkEntidade para={`/jogadores/${e.jogador.id}`}>{e.jogador.nome}</LinkEntidade>
                  ) : (
                    <span className="text-slate-400">Jogador excluído</span>
                  )}
                  <p className="text-xs text-slate-500">
                    {EVENTO[e.tipo].rotulo} · {e.equipe.nome}
                  </p>
                </div>
              </Linha>
            ))}
          </ul>
        )}
        {partida.status !== 'AGENDADA' && <NovoLance partida={partida} executar={executar} ocupado={ocupado} />}
      </SecaoGaveta>
    </Gaveta>
  )
}

function EquipePlacar({ nome, id, papel }: { nome: string; id: number; papel: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      <Avatar nome={nome} seed={id} tamanho="lg" quadrado />
      <LinkEntidade para={`/equipes/${id}`}>
        <span className="block truncate text-sm font-bold">{nome}</span>
      </LinkEntidade>
      <span className="text-[11px] tracking-wider text-slate-400 uppercase">{papel}</span>
    </div>
  )
}

/** Formulário curto para registrar um gol ou cartão. Os jogadores vêm dos elencos atuais das duas equipes. */
function NovoLance({ partida, executar, ocupado }: { partida: PartidaDetalhe; executar: Executar; ocupado: boolean }) {
  const [tipo, setTipo] = useState<TipoEvento>('GOL')
  const [minuto, setMinuto] = useState('')
  const [jogadorId, setJogadorId] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const elencoMandante = useQuery(consultas.jogadores({ equipe_id: partida.mandante.id, limit: 100 }))
  const elencoVisitante = useQuery(consultas.jogadores({ equipe_id: partida.visitante.id, limit: 100 }))

  async function registrar() {
    const m = Number(minuto)
    if (!minuto || !Number.isInteger(m) || m < 0 || m > 130) return setErro('Minuto entre 0 e 130')
    if (!jogadorId) return setErro('Escolha o jogador')
    setErro(null)
    const ok = await executar(
      () => api.partidas.adicionarEvento(partida.id, { tipo, minuto: m, jogador_id: Number(jogadorId) }),
      `${EVENTO[tipo].rotulo} registrado`,
    )
    if (ok) {
      setMinuto('')
      setJogadorId('')
    }
  }

  const campo =
    'w-full rounded-xl border border-borda bg-white px-3 py-2 text-sm outline-none focus:border-ceu-medio focus:ring-4 focus:ring-ceu'
  return (
    <form
      className="mt-3 space-y-2 rounded-2xl border border-borda bg-fundo/60 p-3"
      onSubmit={(e) => {
        e.preventDefault()
        void registrar()
      }}
    >
      <p className="text-sm font-semibold">Registrar lance</p>
      <div className="grid grid-cols-[1fr_5rem] gap-2">
        <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoEvento)} aria-label="Tipo de lance" className={campo}>
          {TIPOS_EVENTO.map((t) => (
            <option key={t} value={t}>
              {EVENTO[t].simbolo} {EVENTO[t].rotulo}
            </option>
          ))}
        </select>
        <input
          value={minuto}
          onChange={(e) => setMinuto(e.target.value)}
          inputMode="numeric"
          placeholder="Min."
          aria-label="Minuto"
          className={campo}
        />
      </div>
      <select value={jogadorId} onChange={(e) => setJogadorId(e.target.value)} aria-label="Jogador" className={campo}>
        <option value="">Jogador…</option>
        {[
          { equipe: partida.mandante.nome, elenco: elencoMandante.data?.items ?? [] },
          { equipe: partida.visitante.nome, elenco: elencoVisitante.data?.items ?? [] },
        ].map(({ equipe, elenco }) => (
          <optgroup key={equipe} label={equipe}>
            {elenco.map((j) => (
              <option key={j.id} value={j.id}>
                {j.numero_camisa ? `${j.numero_camisa} · ` : ''}
                {j.nome}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {erro && <p className="text-xs font-medium text-rosa-forte">{erro}</p>}
      <button
        type="submit"
        disabled={ocupado}
        className="inline-flex items-center gap-1.5 rounded-full bg-tinta px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-tinta/85 disabled:opacity-60"
      >
        <Icone nome="mais" /> Registrar
      </button>
    </form>
  )
}
