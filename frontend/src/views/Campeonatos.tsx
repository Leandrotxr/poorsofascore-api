import { useQuery } from '@tanstack/react-query'
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
import { Avatar, CampoBusca, Etiqueta, Rotulo } from '../components/ui'
import { FORMATO, formatarPeriodo, nomeTomDe, plural } from '../estilo'
import { useAcao, useFiltrosUrl, useIdRota, useNavegarNaAba } from '../hooks'

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
