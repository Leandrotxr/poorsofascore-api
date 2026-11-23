import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { api, consultas, mensagemDe } from '../api'
import { Adicionar } from '../components/Busca'
import {
  AcoesGaveta,
  BotaoRemover,
  Gaveta,
  GavetaEstado,
  Linha,
  LinkEntidade,
  SecaoGaveta,
  VazioPequeno,
} from '../components/Gaveta'
import { Icone } from '../components/Icone'
import { CardLink, Grade, ListaPaginada } from '../components/Lista'
import { Avatar, CampoBusca, DistribuicaoPosicoes, Etiqueta, PosBadge, Rotulo } from '../components/ui'
import { formatarCnpj, nomeTomDe, plural } from '../estilo'
import { useAcao, useFiltrosUrl, useIdRota, useNavegarNaAba } from '../hooks'
import { POSICOES } from '../types'

export function EquipesLista() {
  const f = useFiltrosUrl()
  const q = f.ler('q')
  const consulta = useQuery(consultas.equipes({ nome: q || undefined, skip: f.skip, limit: f.limit }))

  return (
    <ListaPaginada
      consulta={consulta}
      filtrando={!!q}
      rotulo={['equipe', 'equipes']}
      vazio={{ icone: 'escudo', titulo: 'Nenhuma equipe cadastrada', texto: 'Use o botão Nova equipe para cadastrar a primeira.' }}
      filtros={<CampoBusca valor={q} onBuscar={(v) => f.mudar('q', v)} placeholder="Buscar equipe…" />}
    >
      {(equipes) => (
        <Grade>
          {equipes.map((e, i) => (
            <CardLink key={e.id} id={e.id} indice={i}>
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
                    {e.tecnico ? e.tecnico.nome : <span className="font-normal text-slate-400">Sem técnico</span>}
                  </p>
                </div>
                <div className="rounded-2xl bg-fundo px-3 py-2.5">
                  <Rotulo>Elenco</Rotulo>
                  <p className="mt-0.5 text-sm font-semibold">{plural(e.jogadores.length, 'jogador', 'jogadores')}</p>
                </div>
              </div>

              <DistribuicaoPosicoes jogadores={e.jogadores} className="mt-4" />

              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="font-mono text-slate-400">{formatarCnpj(e.cnpj)}</span>
                <span className="font-semibold text-slate-500 opacity-0 transition group-hover:opacity-100">
                  Gerenciar →
                </span>
              </div>
            </CardLink>
          ))}
        </Grade>
      )}
    </ListaPaginada>
  )
}

export function EquipePainel() {
  const id = useIdRota()
  const navegar = useNavegarNaAba()
  const fechar = () => navegar()
  const { data: equipe, error } = useQuery(consultas.equipe(id))
  const { executar, ocupado } = useAcao()

  if (!equipe) return <GavetaEstado tom="pessego" erro={error ? mensagemDe(error) : undefined} onFechar={fechar} />

  const { tecnico, jogadores, campeonatos } = equipe
  return (
    <Gaveta
      tom={nomeTomDe(equipe.id)}
      icone={<Avatar nome={equipe.nome} seed={equipe.id} tamanho="lg" quadrado className="bg-white/70!" />}
      titulo={equipe.nome}
      subtitulo={`${equipe.sede} · fundado em ${equipe.fundacao}`}
      onFechar={fechar}
      acoes={
        <AcoesGaveta
          tom={nomeTomDe(equipe.id)}
          rotulo={`a equipe ${equipe.nome}`}
          consequencia="Os jogadores e o técnico ficam sem equipe, e as inscrições em campeonatos são removidas."
          excluir={() => api.equipes.remover(equipe.id)}
          aoExcluir={fechar}
        />
      }
    >
      <SecaoGaveta titulo="Federação">
        {equipe.federacao ? (
          <div className="mt-2 flex items-center gap-3 rounded-2xl bg-fundo p-3">
            <Avatar nome={equipe.federacao.nome} seed={equipe.federacao.id} texto={equipe.federacao.sigla} quadrado />
            <LinkEntidade para={`/federacoes/${equipe.federacao.id}`}>{equipe.federacao.nome}</LinkEntidade>
          </div>
        ) : (
          <VazioPequeno>Não filiada. Filie pelo painel de uma federação.</VazioPequeno>
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
                  onClick={() => void executar(() => api.equipes.removerTecnico(equipe.id), `${tecnico.nome} deixou o comando`)}
                />
              }
            >
              <Avatar nome={tecnico.nome} seed={tecnico.id + 3} />
              <div className="min-w-0 flex-1">
                <LinkEntidade para={`/tecnicos/${tecnico.id}`}>{tecnico.nome}</LinkEntidade>
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
          chave="tecnicos-livres"
          buscar={(nome, limit) => api.tecnicos.listar({ nome, limit, sem_equipe: true }).then((p) => p.items)}
          vazio="Nenhum técnico sem equipe. Cadastre um na aba Técnicos."
          ocupado={ocupado}
          item={(t) => (
            <>
              <Avatar nome={t.nome} seed={t.id + 3} tamanho="sm" />
              <span className="font-medium">{t.nome}</span>
              <span className="text-xs text-slate-400">{t.idade} anos</span>
            </>
          )}
          onEscolher={(t) => executar(() => api.equipes.definirTecnico(equipe.id, t.id), `${t.nome} agora comanda ${equipe.nome}`)}
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
                            onClick={() => void executar(() => api.equipes.dispensar(equipe.id, j.id), `${j.nome} foi dispensado`)}
                          />
                        }
                      >
                        <Avatar nome={j.nome} seed={j.id} tamanho="sm" />
                        <LinkEntidade para={`/jogadores/${j.id}`}>{j.nome}</LinkEntidade>
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
          chave="agentes-livres"
          buscar={(nome, limit) => api.jogadores.listar({ nome, limit, sem_equipe: true }).then((p) => p.items)}
          vazio="Nenhum agente livre. Dispense um jogador de outra equipe ou cadastre um na aba Jogadores."
          ocupado={ocupado}
          item={(j) => (
            <>
              <Avatar nome={j.nome} seed={j.id} tamanho="sm" />
              <span className="font-medium">{j.nome}</span>
              <PosBadge posicao={j.posicao} />
            </>
          )}
          onEscolher={(j) => executar(() => api.equipes.contratar(equipe.id, j.id), `${j.nome} contratado`)}
        />
      </SecaoGaveta>

      <SecaoGaveta titulo="Campeonatos" extra={plural(campeonatos.length, 'campeonato', 'campeonatos')}>
        {campeonatos.length === 0 ? (
          <VazioPequeno>Não disputa nenhum campeonato. Inscreva pelo painel de um campeonato.</VazioPequeno>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {campeonatos.map((c) => (
              <Link
                key={c.id}
                to={`/campeonatos/${c.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-menta px-3 py-1 text-sm font-semibold text-menta-forte hover:bg-menta-medio"
              >
                <Icone nome="trofeu" className="size-3.5" />
                {c.nome} {c.temporada}
              </Link>
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
