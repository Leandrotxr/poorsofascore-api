import { api } from '../api'
import { FORMATO, formatarPeriodo, nomeTomDe, plural } from '../estilo'
import type { Campeonato, Equipe } from '../types'
import {
  Adicionar,
  Avatar,
  BotaoRemover,
  Etiqueta,
  Gaveta,
  Icone,
  Linha,
  Rotulo,
  SecaoGaveta,
  Vazio,
  VazioPequeno,
} from '../ui'
import type { Executar } from './Equipes'

export function CampeonatosView({
  campeonatos,
  onAbrir,
}: {
  campeonatos: Campeonato[]
  onAbrir: (id: number) => void
}) {
  if (campeonatos.length === 0) {
    return (
      <Vazio icone="trofeu" titulo="Nenhum campeonato cadastrado">
        Use o botão <strong>Novo campeonato</strong>. Todo campeonato precisa de uma federação organizadora.
      </Vazio>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {campeonatos.map((c, i) => {
        const periodo = formatarPeriodo(c.data_inicio, c.data_fim)
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onAbrir(c.id)}
            style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            className="group animate-rise rounded-3xl border border-borda bg-white p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 focus-visible:ring-2 focus-visible:ring-ceu-medio focus-visible:outline-none"
          >
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
          </button>
        )
      })}
    </div>
  )
}

export function CampeonatoDrawer({
  campeonato,
  equipes,
  executar,
  ocupado,
  onFechar,
}: {
  campeonato: Campeonato
  equipes: Equipe[]
  executar: Executar
  ocupado: boolean
  onFechar: () => void
}) {
  const inscritas = new Set(campeonato.equipes.map((e) => e.id))
  const candidatas = equipes.filter((e) => !inscritas.has(e.id))
  const periodo = formatarPeriodo(campeonato.data_inicio, campeonato.data_fim)
  const nome = `${campeonato.nome} ${campeonato.temporada}`

  return (
    <Gaveta
      tom="menta"
      icone={
        <span className="grid size-14 place-items-center rounded-2xl bg-white/70">
          <Icone nome="trofeu" className="size-7" />
        </span>
      }
      titulo={campeonato.nome}
      subtitulo={`Temporada ${campeonato.temporada}${periodo ? ` · ${periodo}` : ''}`}
      onFechar={onFechar}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-fundo px-3 py-2.5">
          <Rotulo>Organização</Rotulo>
          <p className="mt-0.5 truncate text-sm font-semibold" title={campeonato.federacao.nome}>
            {campeonato.federacao.sigla}
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
                      void executar(() => api.removerInscricao(campeonato.id, e.id), `${e.nome} saiu do ${nome}`)
                    }
                  />
                }
              >
                <Avatar nome={e.nome} seed={e.id} tamanho="sm" quadrado />
                <span className="flex-1 truncate font-medium">{e.nome}</span>
              </Linha>
            ))}
          </ul>
        )}
        <Adicionar
          rotulo="Inscrever equipe"
          candidatos={candidatas}
          vazio={equipes.length === 0 ? 'Nenhuma equipe cadastrada. Crie uma na aba Equipes.' : 'Todas as equipes já estão inscritas.'}
          ocupado={ocupado}
          item={(e) => (
            <>
              <Avatar nome={e.nome} seed={e.id} tamanho="sm" quadrado />
              <span className="font-medium">{e.nome}</span>
              {e.federacao && <span className="text-xs text-slate-400">{e.federacao.sigla}</span>}
            </>
          )}
          onEscolher={(e) => executar(() => api.inscreverEquipe(campeonato.id, e.id), `${e.nome} inscrita no ${nome}`)}
        />
      </SecaoGaveta>
    </Gaveta>
  )
}
