import { useQuery } from '@tanstack/react-query'
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
import { Avatar, CampoBusca, Chip, Etiqueta, LinhaChips, Rotulo } from '../components/ui'
import { ABRANGENCIA, formatarCnpj, FUNCAO, nomeTomDe, plural } from '../estilo'
import { useAcao, useFiltrosUrl, useIdRota, useNavegarNaAba } from '../hooks'
import { ABRANGENCIAS, type Abrangencia } from '../types'

export function FederacoesLista() {
  const f = useFiltrosUrl()
  const q = f.ler('q')
  const abrangencia = (f.ler('abrangencia') || undefined) as Abrangencia | undefined
  const consulta = useQuery(consultas.federacoes({ nome: q || undefined, abrangencia, skip: f.skip, limit: f.limit }))

  return (
    <ListaPaginada
      consulta={consulta}
      filtrando={!!q || !!abrangencia}
      rotulo={['federação', 'federações']}
      vazio={{ icone: 'globo', titulo: 'Nenhuma federação cadastrada', texto: 'Use o botão Nova federação: FIFA, UEFA, CBF…' }}
      filtros={
        <>
          <CampoBusca valor={q} onBuscar={(v) => f.mudar('q', v)} placeholder="Buscar por nome ou sigla…" />
          <LinhaChips>
            <Chip ativo={!abrangencia} onClick={() => f.mudar('abrangencia', '')}>
              Todas
            </Chip>
            {ABRANGENCIAS.map((a) => (
              <Chip key={a} ativo={abrangencia === a} onClick={() => f.mudar('abrangencia', a)}>
                {ABRANGENCIA[a].rotulo}
              </Chip>
            ))}
          </LinhaChips>
        </>
      }
    >
      {(federacoes) => (
        <Grade>
          {federacoes.map((fed, i) => {
            const abr = ABRANGENCIA[fed.abrangencia]
            return (
              <CardLink key={fed.id} id={fed.id} indice={i}>
                <div className="flex items-start gap-4">
                  <Avatar nome={fed.nome} seed={fed.id} texto={fed.sigla} tamanho="lg" quadrado className="text-base!" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg leading-snug font-bold">{fed.nome}</h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Icone nome="pin" className="size-3.5" />
                        {fed.sede}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Icone nome="calendario" className="size-3.5" />
                        {fed.fundacao}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Etiqueta tom={abr.tom}>{abr.rotulo}</Etiqueta>
                  {[
                    plural(fed.equipes.length, 'equipe', 'equipes'),
                    plural(fed.arbitros.length, 'árbitro', 'árbitros'),
                    plural(fed.campeonatos.length, 'campeonato', 'campeonatos'),
                  ].map((t) => (
                    <span key={t} className="rounded-full bg-fundo px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                      {t}
                    </span>
                  ))}
                </div>
              </CardLink>
            )
          })}
        </Grade>
      )}
    </ListaPaginada>
  )
}

export function FederacaoPainel() {
  const id = useIdRota()
  const navegar = useNavegarNaAba()
  const fechar = () => navegar()
  const { data: federacao, error } = useQuery(consultas.federacao(id))
  const { executar, ocupado } = useAcao()

  if (!federacao) return <GavetaEstado tom="agua" erro={error ? mensagemDe(error) : undefined} onFechar={fechar} />

  const { equipes, arbitros, campeonatos } = federacao
  const abr = ABRANGENCIA[federacao.abrangencia]
  const tom = nomeTomDe(federacao.id)
  return (
    <Gaveta
      tom={tom}
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
      onFechar={fechar}
      acoes={
        <AcoesGaveta
          tom={tom}
          rotulo={`a federação ${federacao.sigla}`}
          consequencia={
            campeonatos.length > 0
              ? `Ela organiza ${plural(campeonatos.length, 'campeonato', 'campeonatos')}: a API só deixa excluir depois que eles forem apagados ou passarem para outra organizadora.`
              : 'As equipes e os árbitros vinculados ficam sem federação.'
          }
          excluir={() => api.federacoes.remover(federacao.id)}
          aoExcluir={fechar}
        />
      }
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
                <LinkEntidade para={`/campeonatos/${c.id}`}>{c.nome}</LinkEntidade>
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
                      void executar(() => api.federacoes.desfiliarEquipe(federacao.id, e.id), `${e.nome} foi desfiliada`)
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
          rotulo="Filiar equipe"
          chave="equipes-sem-federacao"
          buscar={(nome, limit) => api.equipes.listar({ nome, limit, sem_federacao: true }).then((p) => p.items)}
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
            executar(() => api.federacoes.filiarEquipe(federacao.id, e.id), `${e.nome} filiada à ${federacao.sigla}`)
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
                      void executar(() => api.federacoes.desvincularArbitro(federacao.id, a.id), `${a.nome} foi desvinculado`)
                    }
                  />
                }
              >
                <Avatar nome={a.nome} seed={a.id + 1} tamanho="sm" />
                <LinkEntidade para={`/arbitros/${a.id}`}>{a.nome}</LinkEntidade>
                <Etiqueta tom={FUNCAO[a.funcao].tom}>{FUNCAO[a.funcao].rotulo}</Etiqueta>
              </Linha>
            ))}
          </ul>
        )}
        <Adicionar
          rotulo="Vincular árbitro"
          chave="arbitros-sem-federacao"
          buscar={(nome, limit) => api.arbitros.listar({ nome, limit, sem_federacao: true }).then((p) => p.items)}
          vazio="Nenhum árbitro sem federação. Cadastre um na aba Árbitros."
          ocupado={ocupado}
          item={(a) => (
            <>
              <Avatar nome={a.nome} seed={a.id + 1} tamanho="sm" />
              <span className="font-medium">{a.nome}</span>
              <Etiqueta tom={FUNCAO[a.funcao].tom}>{FUNCAO[a.funcao].rotulo}</Etiqueta>
            </>
          )}
          onEscolher={(a) =>
            executar(() => api.federacoes.vincularArbitro(federacao.id, a.id), `${a.nome} vinculado à ${federacao.sigla}`)
          }
        />
      </SecaoGaveta>
    </Gaveta>
  )
}
