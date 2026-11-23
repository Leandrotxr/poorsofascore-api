import { api } from '../api'
import { formatarCnpj, nomeTomDe, plural } from '../estilo'
import { POSICOES, type Campeonato, type Equipe, type Jogador, type Tecnico } from '../types'
import {
  Adicionar,
  Avatar,
  BotaoRemover,
  DistribuicaoPosicoes,
  Etiqueta,
  Gaveta,
  Icone,
  Linha,
  PosBadge,
  Rotulo,
  SecaoGaveta,
  Vazio,
  VazioPequeno,
} from '../ui'

/** Executa uma ação na API, recarrega os dados e mostra o aviso de sucesso ou erro. */
export type Executar = (acao: () => Promise<unknown>, sucesso: string) => Promise<void>

export function EquipesView({
  equipes,
  elenco,
  tecnicoDe,
  onAbrir,
}: {
  equipes: Equipe[]
  elenco: Map<number, Jogador[]>
  tecnicoDe: Map<number, Tecnico>
  onAbrir: (id: number) => void
}) {
  if (equipes.length === 0) {
    return (
      <Vazio icone="escudo" titulo="Nenhuma equipe cadastrada">
        Use o botão <strong>Nova equipe</strong> para cadastrar a primeira.
      </Vazio>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {equipes.map((e, i) => {
        const jogadores = elenco.get(e.id) ?? []
        const tecnico = tecnicoDe.get(e.id)
        return (
          <button
            key={e.id}
            type="button"
            onClick={() => onAbrir(e.id)}
            style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            className="group animate-rise rounded-3xl border border-borda bg-white p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 focus-visible:ring-2 focus-visible:ring-ceu-medio focus-visible:outline-none"
          >
            <div className="flex items-center gap-4">
              <Avatar nome={e.nome} seed={e.id} tamanho="lg" quadrado />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-bold">{e.nome}</h3>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Icone nome="pin" className="size-3.5" />
                    {e.sede}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icone nome="calendario" className="size-3.5" />
                    {e.fundacao}
                  </span>
                </p>
              </div>
              {e.federacao && (
                <span title={e.federacao.nome}>
                  <Etiqueta tom={nomeTomDe(e.federacao.id)}>{e.federacao.sigla}</Etiqueta>
                </span>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-fundo px-3 py-2.5">
                <Rotulo>Técnico</Rotulo>
                <p className="mt-0.5 truncate text-sm font-semibold">
                  {tecnico ? tecnico.nome : <span className="font-normal text-slate-400">Sem técnico</span>}
                </p>
              </div>
              <div className="rounded-2xl bg-fundo px-3 py-2.5">
                <Rotulo>Elenco</Rotulo>
                <p className="mt-0.5 text-sm font-semibold">{plural(jogadores.length, 'jogador', 'jogadores')}</p>
              </div>
            </div>

            <DistribuicaoPosicoes jogadores={jogadores} className="mt-4" />

            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400">{formatarCnpj(e.cnpj)}</span>
              <span className="font-semibold text-slate-500 opacity-0 transition group-hover:opacity-100">
                Gerenciar →
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export function EquipeDrawer({
  equipe,
  jogadores,
  tecnico,
  agentesLivres,
  tecnicosLivres,
  campeonatos,
  executar,
  ocupado,
  onFechar,
}: {
  equipe: Equipe
  jogadores: Jogador[]
  tecnico: Tecnico | undefined
  agentesLivres: Jogador[]
  tecnicosLivres: Tecnico[]
  campeonatos: Campeonato[]
  executar: Executar
  ocupado: boolean
  onFechar: () => void
}) {
  return (
    <Gaveta
      tom={nomeTomDe(equipe.id)}
      icone={<Avatar nome={equipe.nome} seed={equipe.id} tamanho="lg" quadrado className="bg-white/70!" />}
      titulo={equipe.nome}
      subtitulo={`${equipe.sede} · fundado em ${equipe.fundacao}`}
      onFechar={onFechar}
    >
      <SecaoGaveta titulo="Federação">
        {equipe.federacao ? (
          <div className="mt-2 flex items-center gap-3 rounded-2xl bg-fundo p-3">
            <Avatar nome={equipe.federacao.nome} seed={equipe.federacao.id} texto={equipe.federacao.sigla} quadrado />
            <p className="font-semibold">{equipe.federacao.nome}</p>
          </div>
        ) : (
          <VazioPequeno>Não filiada. Filie pela aba Federações.</VazioPequeno>
        )}
      </SecaoGaveta>

      <SecaoGaveta titulo="Técnico">
        {tecnico ? (
          <ul className="mt-2">
            <Linha
              acao={
                <BotaoRemover
                  rotulo={`Remover ${tecnico.nome} do comando`}
                  ocupado={ocupado}
                  onClick={() => void executar(() => api.removerTecnico(equipe.id), `${tecnico.nome} deixou o comando`)}
                />
              }
            >
              <Avatar nome={tecnico.nome} seed={tecnico.id + 3} />
              <div className="flex-1">
                <p className="font-semibold">{tecnico.nome}</p>
                <p className="text-sm text-slate-500">
                  {tecnico.idade} anos · {tecnico.nacionalidade}
                </p>
              </div>
            </Linha>
          </ul>
        ) : (
          <VazioPequeno>Nenhum técnico definido</VazioPequeno>
        )}
        <Adicionar
          rotulo={tecnico ? 'Trocar técnico' : 'Definir técnico'}
          candidatos={tecnicosLivres}
          vazio="Nenhum técnico sem equipe. Cadastre um pelo botão Novo técnico, na aba Técnicos."
          ocupado={ocupado}
          item={(t) => (
            <>
              <Avatar nome={t.nome} seed={t.id + 3} tamanho="sm" />
              <span className="font-medium">{t.nome}</span>
              <span className="text-xs text-slate-400">{t.idade} anos</span>
            </>
          )}
          onEscolher={(t) => executar(() => api.definirTecnico(equipe.id, t.id), `${t.nome} agora comanda ${equipe.nome}`)}
        />
      </SecaoGaveta>

      <SecaoGaveta titulo="Elenco" extra={plural(jogadores.length, 'jogador', 'jogadores')}>
        <DistribuicaoPosicoes jogadores={jogadores} className="mt-2" />
        {jogadores.length === 0 ? (
          <VazioPequeno>Nenhum jogador contratado</VazioPequeno>
        ) : (
          <div className="mt-4 space-y-4">
            {POSICOES.map((p) => {
              const daPosicao = jogadores.filter((j) => j.posicao === p)
              if (daPosicao.length === 0) return null
              return (
                <div key={p}>
                  <PosBadge posicao={p} />
                  <ul className="mt-2 space-y-1">
                    {daPosicao.map((j) => (
                      <Linha
                        key={j.id}
                        acao={
                          <BotaoRemover
                            rotulo={`Dispensar ${j.nome}`}
                            ocupado={ocupado}
                            onClick={() =>
                              void executar(() => api.dispensarJogador(equipe.id, j.id), `${j.nome} foi dispensado`)
                            }
                          />
                        }
                      >
                        <Avatar nome={j.nome} seed={j.id} tamanho="sm" />
                        <span className="flex-1 truncate font-medium">{j.nome}</span>
                        <span className="text-sm text-slate-500">{j.idade} anos</span>
                      </Linha>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
        <Adicionar
          rotulo="Contratar jogador"
          candidatos={agentesLivres}
          vazio="Nenhum agente livre. Dispense um jogador de outra equipe ou cadastre um na aba Jogadores."
          ocupado={ocupado}
          item={(j) => (
            <>
              <Avatar nome={j.nome} seed={j.id} tamanho="sm" />
              <span className="font-medium">{j.nome}</span>
              <PosBadge posicao={j.posicao} />
            </>
          )}
          onEscolher={(j) => executar(() => api.contratarJogador(equipe.id, j.id), `${j.nome} contratado`)}
        />
      </SecaoGaveta>

      <SecaoGaveta titulo="Campeonatos" extra={plural(campeonatos.length, 'campeonato', 'campeonatos')}>
        {campeonatos.length === 0 ? (
          <VazioPequeno>Não disputa nenhum campeonato. Inscreva pela aba Campeonatos.</VazioPequeno>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {campeonatos.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full bg-menta px-3 py-1 text-sm font-semibold text-menta-forte">
                <Icone nome="trofeu" className="size-3.5" />
                {c.nome} {c.temporada}
              </span>
            ))}
          </div>
        )}
      </SecaoGaveta>

      <SecaoGaveta titulo="CNPJ">
        <p className="mt-1 font-mono text-sm text-slate-600">{formatarCnpj(equipe.cnpj)}</p>
      </SecaoGaveta>
    </Gaveta>
  )
}
