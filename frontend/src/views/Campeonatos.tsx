import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { api, consultas, mensagemDe } from '../api'
import { Adicionar } from '../components/Busca'
import {
  AcoesGaveta,
  BotaoRemover,
  Gaveta,
  GavetaEstado,
  IconeGaveta,
  Linha,
  LinkEntidade,
  SecaoGaveta,
  VazioPequeno,
} from '../components/Gaveta'
import { Icone } from '../components/Icone'
import { CardLink, Grade, ListaPaginada } from '../components/Lista'
import { LinhaPartida } from '../components/Partida'
import { Avatar, CampoBusca, Etiqueta, Rotulo } from '../components/ui'
import { FORMATO, formatarPeriodo, nomeTomDe, plural } from '../estilo'
import { useAcao, useFiltrosUrl, useIdRota, useNavegarNaAba, useSessao } from '../hooks'

export function CampeonatosLista() {
  const f = useFiltrosUrl()
  const q = f.ler('q')
  const temporada = Number(f.ler('temporada')) || undefined
  const consulta = useQuery(consultas.campeonatos({ nome: q || undefined, temporada, skip: f.skip, limit: f.limit }))

  return (
    <ListaPaginada
      consulta={consulta}
      filtrando={!!q || !!temporada}
      rotulo={['campeonato', 'campeonatos']}
      vazio={{
        icone: 'trofeu',
        titulo: 'Nenhum campeonato cadastrado',
        texto: 'Use o botão Novo campeonato. Todo campeonato precisa de uma federação organizadora.',
      }}
      filtros={
        <div className="flex flex-col gap-3 sm:flex-row">
          <CampoBusca valor={q} onBuscar={(v) => f.mudar('q', v)} placeholder="Buscar campeonato…" />
          <label className="sm:w-44">
            <span className="sr-only">Temporada</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Temporada"
              value={f.ler('temporada')}
              onChange={(e) => f.mudar('temporada', e.target.value)}
              className="w-full rounded-2xl border border-borda bg-white px-4 py-3 text-sm outline-none focus:border-ceu-medio focus:ring-4 focus:ring-ceu"
            />
          </label>
        </div>
      }
    >
      {(campeonatos) => (
        <Grade>
          {campeonatos.map((c, i) => {
            const periodo = formatarPeriodo(c.data_inicio, c.data_fim)
            return (
              <CardLink key={c.id} id={c.id} indice={i}>
                <div className="flex items-start gap-4">
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-menta text-menta-forte">
                    <Icone nome="trofeu" className="size-7" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg leading-snug font-bold">{c.nome}</h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                      <span className="font-semibold text-tinta">{c.temporada}</span>
                      {periodo && (
                        <span className="inline-flex items-center gap-1">
                          <Icone nome="calendario" className="size-3.5" />
                          {periodo}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span title={c.federacao.nome}>
                    <Etiqueta tom={nomeTomDe(c.federacao.id)}>{c.federacao.sigla}</Etiqueta>
                  </span>
                  <Etiqueta tom={FORMATO[c.formato].tom}>{FORMATO[c.formato].rotulo}</Etiqueta>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  {c.equipes.length === 0 ? (
                    <span className="text-sm text-slate-400">Nenhuma equipe inscrita</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {c.equipes.slice(0, 5).map((e) => (
                          <Avatar key={e.id} nome={e.nome} seed={e.id} tamanho="sm" className="ring-2 ring-white" />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-slate-600">
                        {plural(c.equipes.length, 'equipe', 'equipes')}
                      </span>
                    </div>
                  )}
                  <span className="text-xs font-semibold text-slate-500 opacity-0 transition group-hover:opacity-100">
                    Gerenciar →
                  </span>
                </div>
              </CardLink>
            )
          })}
        </Grade>
      )}
    </ListaPaginada>
  )
}

export function CampeonatoPainel() {
  const id = useIdRota()
  const navegar = useNavegarNaAba()
  const fechar = () => navegar()
  const { data: campeonato, error } = useQuery(consultas.campeonato(id))
  const { executar, ocupado } = useAcao()

  if (!campeonato) return <GavetaEstado tom="menta" erro={error ? mensagemDe(error) : undefined} onFechar={fechar} />

  const inscritas = new Set(campeonato.equipes.map((e) => e.id))
  const periodo = formatarPeriodo(campeonato.data_inicio, campeonato.data_fim)
  const nome = `${campeonato.nome} ${campeonato.temporada}`

  return (
    <Gaveta
      tom="menta"
      larga
      icone={
        <IconeGaveta>
          <Icone nome="trofeu" className="size-7" />
        </IconeGaveta>
      }
      titulo={campeonato.nome}
      subtitulo={`Temporada ${campeonato.temporada}${periodo ? ` · ${periodo}` : ''}`}
      onFechar={fechar}
      acoes={
        <AcoesGaveta
          tom="menta"
          rotulo={`o campeonato ${nome}`}
          consequencia="As inscrições são removidas; as equipes continuam cadastradas."
          excluir={() => api.campeonatos.remover(campeonato.id)}
          aoExcluir={fechar}
        />
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-fundo px-3 py-2.5">
          <Rotulo>Organização</Rotulo>
          <p className="mt-0.5 truncate text-sm font-semibold" title={campeonato.federacao.nome}>
            <LinkEntidade para={`/federacoes/${campeonato.federacao.id}`}>{campeonato.federacao.sigla}</LinkEntidade>
          </p>
        </div>
        <div className="rounded-2xl bg-fundo px-3 py-2.5">
          <Rotulo>Formato</Rotulo>
          <div className="mt-1">
            <Etiqueta tom={FORMATO[campeonato.formato].tom}>{FORMATO[campeonato.formato].rotulo}</Etiqueta>
          </div>
        </div>
      </div>

      <Classificacao campeonatoId={campeonato.id} />
      <Artilharia campeonatoId={campeonato.id} />
      <PartidasDoCampeonato campeonatoId={campeonato.id} />

      <SecaoGaveta titulo="Equipes participantes" extra={plural(campeonato.equipes.length, 'equipe', 'equipes')}>
        {campeonato.equipes.length === 0 ? (
          <VazioPequeno>Nenhuma equipe inscrita</VazioPequeno>
        ) : (
          <ul className="mt-2 space-y-1">
            {campeonato.equipes.map((e) => (
              <Linha
                key={e.id}
                acao={
                  <BotaoRemover
                    rotulo={`Remover ${e.nome} do campeonato`}
                    ocupado={ocupado}
                    onClick={() =>
                      void executar(() => api.campeonatos.removerInscricao(campeonato.id, e.id), `${e.nome} saiu do ${nome}`)
                    }
                  />
                }
              >
                <Avatar nome={e.nome} seed={e.id} tamanho="sm" quadrado />
                <LinkEntidade para={`/equipes/${e.id}`}>{e.nome}</LinkEntidade>
              </Linha>
            ))}
          </ul>
        )}
        <Adicionar
          rotulo="Inscrever equipe"
          chave="equipes"
          buscar={(nome, limit) => api.equipes.listar({ nome, limit }).then((p) => p.items)}
          desabilitar={(e) => inscritas.has(e.id)}
          vazio="Nenhuma equipe cadastrada. Crie uma na aba Equipes."
          ocupado={ocupado}
          item={(e) => (
            <>
              <Avatar nome={e.nome} seed={e.id} tamanho="sm" quadrado />
              <span className="font-medium">{e.nome}</span>
              {e.federacao && <span className="text-xs text-slate-400">{e.federacao.sigla}</span>}
            </>
          )}
          onEscolher={(e) => executar(() => api.campeonatos.inscrever(campeonato.id, e.id), `${e.nome} inscrita no ${nome}`)}
        />
      </SecaoGaveta>
    </Gaveta>
  )
}

function Classificacao({ campeonatoId }: { campeonatoId: number }) {
  const { data: tabela, error } = useQuery(consultas.classificacao(campeonatoId))
  const colunas = [
    ['P', 'Pontos'],
    ['J', 'Jogos'],
    ['V', 'Vitórias'],
    ['E', 'Empates'],
    ['D', 'Derrotas'],
    ['SG', 'Saldo de gols'],
    ['%', 'Aproveitamento'],
  ] as const

  return (
    <SecaoGaveta titulo="Classificação" extra="só partidas encerradas">
      {error ? (
        <VazioPequeno>Não foi possível carregar: {mensagemDe(error)}</VazioPequeno>
      ) : !tabela ? (
        <div className="mt-2 h-32 animate-pulse rounded-2xl bg-borda/60" />
      ) : tabela.length === 0 ? (
        <VazioPequeno>Inscreva equipes para montar a tabela.</VazioPequeno>
      ) : (
        <div className="mt-2 overflow-x-auto rounded-2xl border border-borda">
          <table className="w-full text-sm">
            <thead className="bg-fundo/60 text-[11px] tracking-wider text-slate-400 uppercase">
              <tr>
                <th className="px-3 py-2 text-left font-semibold" colSpan={2}>
                  Equipe
                </th>
                {colunas.map(([sigla, nome]) => (
                  <th key={sigla} className="px-2 py-2 text-right font-semibold">
                    <abbr title={nome} className="no-underline">
                      {sigla}
                    </abbr>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-borda">
              {tabela.map((t) => (
                <tr key={t.equipe.id}>
                  <td className="w-8 py-2 pl-3 font-mono text-xs text-slate-400">{t.posicao}</td>
                  <td className="max-w-40 truncate py-2 pr-2 font-semibold">
                    <Link to={`/equipes/${t.equipe.id}`} className="hover:underline">
                      {t.equipe.nome}
                    </Link>
                  </td>
                  <td className="px-2 py-2 text-right font-extrabold">{t.pontos}</td>
                  {[t.jogos, t.vitorias, t.empates, t.derrotas].map((n, i) => (
                    <td key={i} className="px-2 py-2 text-right text-slate-600 tabular-nums">
                      {n}
                    </td>
                  ))}
                  <td className="px-2 py-2 text-right text-slate-600 tabular-nums">
                    {t.saldo > 0 ? `+${t.saldo}` : t.saldo}
                  </td>
                  <td className="px-2 py-2 pr-3 text-right text-slate-400 tabular-nums">{Math.round(t.aproveitamento)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SecaoGaveta>
  )
}

function Artilharia({ campeonatoId }: { campeonatoId: number }) {
  const { data } = useQuery(consultas.artilheiros(campeonatoId))
  if (!data) return null
  return (
    <SecaoGaveta titulo="Artilharia">
      {data.length === 0 ? (
        <VazioPequeno>Nenhum gol marcado ainda.</VazioPequeno>
      ) : (
        <ol className="mt-2 space-y-1">
          {data.slice(0, 5).map((a, i) => (
            <Linha key={`${a.jogador.id}-${a.equipe.id}`}>
              <span className="w-5 font-mono text-xs text-slate-400">{i + 1}</span>
              <Avatar nome={a.jogador.nome} seed={a.jogador.id} tamanho="sm" />
              <div className="min-w-0 flex-1">
                <LinkEntidade para={`/jogadores/${a.jogador.id}`}>{a.jogador.nome}</LinkEntidade>
                <p className="text-xs text-slate-500">{a.equipe.nome}</p>
              </div>
              <span className="text-lg font-extrabold">{a.gols}</span>
              <span className="text-xs text-slate-400">{a.gols === 1 ? 'gol' : 'gols'}</span>
            </Linha>
          ))}
        </ol>
      )}
    </SecaoGaveta>
  )
}

function PartidasDoCampeonato({ campeonatoId }: { campeonatoId: number }) {
  const { data } = useQuery(consultas.partidas({ campeonato_id: campeonatoId, limit: 10 }))
  const total = data?.total ?? 0
  const { podeEditar } = useSessao()
  return (
    <SecaoGaveta titulo="Partidas" extra={plural(total, 'partida', 'partidas')}>
      {data && data.items.length === 0 && <VazioPequeno>Nenhuma partida agendada.</VazioPequeno>}
      <div className="mt-2 space-y-2">
        {data?.items.map((p) => (
          <LinhaPartida key={p.id} partida={p} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {podeEditar && (
        <Link
          to={`/partidas/novo?campeonato_id=${campeonatoId}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3.5 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-tinta hover:bg-fundo hover:text-tinta"
        >
          <Icone nome="mais" /> Nova partida
        </Link>
        )}
        {total > 10 && (
          <Link
            to={`/partidas?campeonato_id=${campeonatoId}`}
            className="inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-semibold text-slate-500 hover:text-tinta"
          >
            Ver todas →
          </Link>
        )}
      </div>
    </SecaoGaveta>
  )
}
