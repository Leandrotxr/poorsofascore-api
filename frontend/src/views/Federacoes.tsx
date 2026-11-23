import { api } from '../api'
import { ABRANGENCIA, formatarCnpj, FUNCAO, nomeTomDe, plural } from '../estilo'
import type { Arbitro, Campeonato, Equipe, Federacao } from '../types'
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

export function FederacoesView({
  federacoes,
  equipesDe,
  arbitrosDe,
  onAbrir,
}: {
  federacoes: Federacao[]
  equipesDe: Map<number, Equipe[]>
  arbitrosDe: Map<number, Arbitro[]>
  onAbrir: (id: number) => void
}) {
  if (federacoes.length === 0) {
    return (
      <Vazio icone="globo" titulo="Nenhuma federação cadastrada">
        Use o botão <strong>Nova federação</strong>: FIFA, UEFA, CBF…
      </Vazio>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {federacoes.map((f, i) => {
        const abr = ABRANGENCIA[f.abrangencia]
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onAbrir(f.id)}
            style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            className="group animate-rise rounded-3xl border border-borda bg-white p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 focus-visible:ring-2 focus-visible:ring-ceu-medio focus-visible:outline-none"
          >
            <div className="flex items-start gap-4">
              <Avatar nome={f.nome} seed={f.id} texto={f.sigla} tamanho="lg" quadrado className="text-base!" />
              <div className="min-w-0 flex-1">
                <h3 className="text-lg leading-snug font-bold">{f.nome}</h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Icone nome="pin" className="size-3.5" />
                    {f.sede}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icone nome="calendario" className="size-3.5" />
                    {f.fundacao}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Etiqueta tom={abr.tom}>{abr.rotulo}</Etiqueta>
              <span className="rounded-full bg-fundo px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {plural(equipesDe.get(f.id)?.length ?? 0, 'equipe', 'equipes')}
              </span>
              <span className="rounded-full bg-fundo px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {plural(arbitrosDe.get(f.id)?.length ?? 0, 'árbitro', 'árbitros')}
              </span>
              <span className="ml-auto text-xs font-semibold text-slate-500 opacity-0 transition group-hover:opacity-100">
                Gerenciar →
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export function FederacaoDrawer({
  federacao,
  equipes,
  arbitros,
  equipesLivres,
  arbitrosLivres,
  campeonatos,
  executar,
  ocupado,
  onFechar,
}: {
  federacao: Federacao
  equipes: Equipe[]
  arbitros: Arbitro[]
  equipesLivres: Equipe[]
  arbitrosLivres: Arbitro[]
  campeonatos: Campeonato[]
  executar: Executar
  ocupado: boolean
  onFechar: () => void
}) {
  const abr = ABRANGENCIA[federacao.abrangencia]
  return (
    <Gaveta
      tom={nomeTomDe(federacao.id)}
      icone={
        <Avatar
          nome={federacao.nome}
          seed={federacao.id}
          texto={federacao.sigla}
          tamanho="lg"
          quadrado
          className="bg-white/70! text-base!"
        />
      }
      titulo={federacao.nome}
      subtitulo={`${federacao.sede} · fundada em ${federacao.fundacao}`}
      onFechar={onFechar}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-fundo px-3 py-2.5">
          <Rotulo>Abrangência</Rotulo>
          <div className="mt-1">
            <Etiqueta tom={abr.tom}>{abr.rotulo}</Etiqueta>
          </div>
        </div>
        <div className="rounded-2xl bg-fundo px-3 py-2.5">
          <Rotulo>CNPJ</Rotulo>
          <p className="mt-0.5 font-mono text-xs text-slate-600">
            {federacao.cnpj ? formatarCnpj(federacao.cnpj) : <span className="font-sans text-slate-400">Não possui</span>}
          </p>
        </div>
      </div>

      <SecaoGaveta titulo="Campeonatos organizados" extra={plural(campeonatos.length, 'campeonato', 'campeonatos')}>
        {campeonatos.length === 0 ? (
          <VazioPequeno>Nenhum campeonato. Crie um na aba Campeonatos.</VazioPequeno>
        ) : (
          <ul className="mt-2 space-y-1">
            {campeonatos.map((c) => (
              <Linha key={c.id}>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-menta text-menta-forte">
                  <Icone nome="trofeu" className="size-4" />
                </span>
                <span className="flex-1 truncate font-medium">{c.nome}</span>
                <span className="text-sm text-slate-500">{c.temporada}</span>
              </Linha>
            ))}
          </ul>
        )}
      </SecaoGaveta>

      <SecaoGaveta titulo="Equipes filiadas" extra={plural(equipes.length, 'equipe', 'equipes')}>
        {equipes.length === 0 ? (
          <VazioPequeno>Nenhuma equipe filiada</VazioPequeno>
        ) : (
          <ul className="mt-2 space-y-1">
            {equipes.map((e) => (
              <Linha
                key={e.id}
                acao={
                  <BotaoRemover
                    rotulo={`Desfiliar ${e.nome}`}
                    ocupado={ocupado}
                    onClick={() =>
                      void executar(() => api.desfiliarEquipe(federacao.id, e.id), `${e.nome} foi desfiliada`)
                    }
                  />
                }
              >
                <Avatar nome={e.nome} seed={e.id} tamanho="sm" quadrado />
                <span className="flex-1 truncate font-medium">{e.nome}</span>
                <span className="text-sm text-slate-500">{e.sede}</span>
              </Linha>
            ))}
          </ul>
        )}
        <Adicionar
          rotulo="Filiar equipe"
          candidatos={equipesLivres}
          vazio="Todas as equipes já são filiadas a alguma federação."
          ocupado={ocupado}
          item={(e) => (
            <>
              <Avatar nome={e.nome} seed={e.id} tamanho="sm" quadrado />
              <span className="font-medium">{e.nome}</span>
              <span className="text-xs text-slate-400">{e.sede}</span>
            </>
          )}
          onEscolher={(e) =>
            executar(() => api.filiarEquipe(federacao.id, e.id), `${e.nome} filiada à ${federacao.sigla}`)
          }
        />
      </SecaoGaveta>

      <SecaoGaveta titulo="Árbitros" extra={plural(arbitros.length, 'árbitro', 'árbitros')}>
        {arbitros.length === 0 ? (
          <VazioPequeno>Nenhum árbitro vinculado</VazioPequeno>
        ) : (
          <ul className="mt-2 space-y-1">
            {arbitros.map((a) => (
              <Linha
                key={a.id}
                acao={
                  <BotaoRemover
                    rotulo={`Desvincular ${a.nome}`}
                    ocupado={ocupado}
                    onClick={() =>
                      void executar(() => api.desvincularArbitro(federacao.id, a.id), `${a.nome} foi desvinculado`)
                    }
                  />
                }
              >
                <Avatar nome={a.nome} seed={a.id + 1} tamanho="sm" />
                <span className="flex-1 truncate font-medium">{a.nome}</span>
                <Etiqueta tom={FUNCAO[a.funcao].tom}>{FUNCAO[a.funcao].rotulo}</Etiqueta>
              </Linha>
            ))}
          </ul>
        )}
        <Adicionar
          rotulo="Vincular árbitro"
          candidatos={arbitrosLivres}
          vazio="Nenhum árbitro sem federação. Cadastre um pelo botão Novo árbitro, na aba Árbitros."
          ocupado={ocupado}
          item={(a) => (
            <>
              <Avatar nome={a.nome} seed={a.id + 1} tamanho="sm" />
              <span className="font-medium">{a.nome}</span>
              <Etiqueta tom={FUNCAO[a.funcao].tom}>{FUNCAO[a.funcao].rotulo}</Etiqueta>
            </>
          )}
          onEscolher={(a) =>
            executar(() => api.vincularArbitro(federacao.id, a.id), `${a.nome} vinculado à ${federacao.sigla}`)
          }
        />
      </SecaoGaveta>
    </Gaveta>
  )
}
