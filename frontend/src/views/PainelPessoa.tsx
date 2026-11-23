import { useQuery } from '@tanstack/react-query'
import { api, consultas, mensagemDe } from '../api'
import { Adicionar } from '../components/Busca'
import { AcoesGaveta, BotaoRemover, Gaveta, GavetaEstado, Linha, LinkEntidade, SecaoGaveta, VazioPequeno } from '../components/Gaveta'
import { Avatar, Etiqueta, PosBadge, Rotulo } from '../components/ui'
import { formatarDataCurta, FUNCAO, nomeTomDe, plural, VISUAL } from '../estilo'
import { useAcao, useIdRota, useNavegarNaAba } from '../hooks'
import type { Arbitro, ContratoJogador, ContratoTecnico, Jogador, Tecnico } from '../types'

// Jogador, técnico e árbitro têm o mesmo painel: dados pessoais + o vínculo (equipe ou federação).

export function JogadorPainel() {
  const id = useIdRota()
  const consulta = useQuery(consultas.jogador(id))
  return <PainelPessoa tipo="jogador" pessoa={consulta.data} erro={consulta.error} />
}

export function TecnicoPainel() {
  const id = useIdRota()
  const consulta = useQuery(consultas.tecnico(id))
  return <PainelPessoa tipo="tecnico" pessoa={consulta.data} erro={consulta.error} />
}

export function ArbitroPainel() {
  const id = useIdRota()
  const consulta = useQuery(consultas.arbitro(id))
  return <PainelPessoa tipo="arbitro" pessoa={consulta.data} erro={consulta.error} />
}

type Props =
  | { tipo: 'jogador'; pessoa: Jogador | undefined; erro: unknown }
  | { tipo: 'tecnico'; pessoa: Tecnico | undefined; erro: unknown }
  | { tipo: 'arbitro'; pessoa: Arbitro | undefined; erro: unknown }

const CONFIG = {
  jogador: { recurso: 'jogadores', seed: 0, artigo: 'o jogador', consequencia: 'Ele sai do elenco da equipe.' },
  tecnico: { recurso: 'tecnicos', seed: 3, artigo: 'o técnico', consequencia: 'A equipe que ele comanda fica sem técnico.' },
  arbitro: { recurso: 'arbitros', seed: 1, artigo: 'o árbitro', consequencia: 'Ele sai do quadro da federação.' },
} as const

function PainelPessoa(props: Props) {
  const navegar = useNavegarNaAba()
  const fechar = () => navegar()
  const { executar, ocupado } = useAcao()
  const cfg = CONFIG[props.tipo]
  const tom = VISUAL[cfg.recurso].tom

  if (!props.pessoa) return <GavetaEstado tom={tom} erro={props.erro ? mensagemDe(props.erro) : undefined} onFechar={fechar} />
  const p = props.pessoa

  return (
    <Gaveta
      tom={tom}
      icone={<Avatar nome={p.nome} seed={p.id + cfg.seed} tamanho="lg" className="bg-white/70!" />}
      titulo={p.nome}
      subtitulo={`${p.nacionalidade} · ${p.idade} anos`}
      onFechar={fechar}
      acoes={
        <AcoesGaveta
          tom={tom}
          rotulo={`${cfg.artigo} ${p.nome}`}
          consequencia={cfg.consequencia}
          excluir={() => api[cfg.recurso].remover(p.id)}
          aoExcluir={fechar}
        />
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-fundo px-3 py-2.5">
          <Rotulo>Nascimento</Rotulo>
          <p className="mt-0.5 text-sm font-semibold">{formatarDataCurta(p.data_nascimento)}</p>
        </div>
        <div className="rounded-2xl bg-fundo px-3 py-2.5">
          <Rotulo>CPF</Rotulo>
          <p className="mt-0.5 font-mono text-xs text-slate-600">{p.cpf}</p>
        </div>
        {props.tipo === 'jogador' && props.pessoa && (
          <>
            <div className="rounded-2xl bg-fundo px-3 py-2.5">
              <Rotulo>Posição</Rotulo>
              <div className="mt-1">
                <PosBadge posicao={props.pessoa.posicao} />
              </div>
            </div>
            <div className="rounded-2xl bg-fundo px-3 py-2.5">
              <Rotulo>Camisa</Rotulo>
              <p className="mt-0.5 text-sm font-semibold">
                {props.pessoa.numero_camisa ?? <span className="font-normal text-slate-400">–</span>}
              </p>
            </div>
          </>
        )}
        {props.tipo === 'arbitro' && props.pessoa && (
          <div className="rounded-2xl bg-fundo px-3 py-2.5">
            <Rotulo>Função</Rotulo>
            <div className="mt-1">
              <Etiqueta tom={FUNCAO[props.pessoa.funcao].tom}>{FUNCAO[props.pessoa.funcao].rotulo}</Etiqueta>
            </div>
          </div>
        )}
      </div>

      {props.tipo === 'arbitro' && props.pessoa ? (
        <VinculoFederacao arbitro={props.pessoa} executar={executar} ocupado={ocupado} />
      ) : (
        <VinculoEquipe pessoa={p as Jogador | Tecnico} tecnico={props.tipo === 'tecnico'} executar={executar} ocupado={ocupado} />
      )}
      {props.tipo === 'jogador' && <HistoricoJogador id={p.id} />}
      {props.tipo === 'tecnico' && <HistoricoTecnico id={p.id} />}
    </Gaveta>
  )
}

type Acao = ReturnType<typeof useAcao>

function VinculoEquipe({
  pessoa,
  tecnico,
  executar,
  ocupado,
}: { pessoa: Jogador | Tecnico; tecnico: boolean } & Acao) {
  const { equipe } = pessoa
  return (
    <SecaoGaveta titulo={tecnico ? 'Comanda' : 'Equipe'}>
      {equipe ? (
        <ul className="mt-2">
          <Linha
            acao={
              <BotaoRemover
                rotulo={tecnico ? `Tirar ${pessoa.nome} do comando` : `Dispensar ${pessoa.nome}`}
                ocupado={ocupado}
                onClick={() =>
                  void executar(
                    () => (tecnico ? api.equipes.removerTecnico(equipe.id) : api.equipes.dispensar(equipe.id, pessoa.id)),
                    tecnico ? `${pessoa.nome} deixou o comando` : `${pessoa.nome} foi dispensado`,
                  )
                }
              />
            }
          >
            <Avatar nome={equipe.nome} seed={equipe.id} tamanho="sm" quadrado />
            <LinkEntidade para={`/equipes/${equipe.id}`}>{equipe.nome}</LinkEntidade>
          </Linha>
        </ul>
      ) : (
        <>
          <VazioPequeno>{tecnico ? 'Sem equipe no momento' : 'Agente livre'}</VazioPequeno>
          <Adicionar
            rotulo={tecnico ? 'Assumir uma equipe' : 'Contratar por uma equipe'}
            chave={tecnico ? 'equipes-sem-tecnico' : 'equipes'}
            buscar={(nome, limit) => api.equipes.listar({ nome, limit, sem_tecnico: tecnico }).then((p) => p.items)}
            vazio={tecnico ? 'Todas as equipes já têm técnico.' : 'Nenhuma equipe cadastrada.'}
            ocupado={ocupado}
            item={(e) => (
              <>
                <Avatar nome={e.nome} seed={e.id} tamanho="sm" quadrado />
                <span className="font-medium">{e.nome}</span>
              </>
            )}
            onEscolher={(e) =>
              executar(
                () => (tecnico ? api.equipes.definirTecnico(e.id, pessoa.id) : api.equipes.contratar(e.id, pessoa.id)),
                tecnico ? `${pessoa.nome} agora comanda ${e.nome}` : `${pessoa.nome} contratado pelo ${e.nome}`,
              )
            }
          />
        </>
      )}
    </SecaoGaveta>
  )
}

function VinculoFederacao({ arbitro, executar, ocupado }: { arbitro: Arbitro } & Acao) {
  const { federacao } = arbitro
  return (
    <SecaoGaveta titulo="Federação">
      {federacao ? (
        <ul className="mt-2">
          <Linha
            acao={
              <BotaoRemover
                rotulo={`Desvincular ${arbitro.nome}`}
                ocupado={ocupado}
                onClick={() =>
                  void executar(
                    () => api.federacoes.desvincularArbitro(federacao.id, arbitro.id),
                    `${arbitro.nome} foi desvinculado`,
                  )
                }
              />
            }
          >
            <Avatar nome={federacao.nome} seed={federacao.id} texto={federacao.sigla} tamanho="sm" quadrado />
            <LinkEntidade para={`/federacoes/${federacao.id}`}>{federacao.nome}</LinkEntidade>
            <Etiqueta tom={nomeTomDe(federacao.id)}>{federacao.sigla}</Etiqueta>
          </Linha>
        </ul>
      ) : (
        <>
          <VazioPequeno>Sem federação no momento</VazioPequeno>
          <Adicionar
            rotulo="Vincular a uma federação"
            chave="federacoes"
            buscar={(nome, limit) => api.federacoes.listar({ nome, limit }).then((p) => p.items)}
            vazio="Nenhuma federação cadastrada."
            ocupado={ocupado}
            item={(f) => (
              <>
                <Avatar nome={f.nome} seed={f.id} texto={f.sigla} tamanho="sm" quadrado />
                <span className="font-medium">{f.nome}</span>
              </>
            )}
            onEscolher={(f) =>
              executar(() => api.federacoes.vincularArbitro(f.id, arbitro.id), `${arbitro.nome} vinculado à ${f.sigla}`)
            }
          />
        </>
      )}
    </SecaoGaveta>
  )
}

// ---------- Histórico de contratos ----------

function HistoricoJogador({ id }: { id: number }) {
  const { data } = useQuery(consultas.contratosJogador(id))
  return <Historico contratos={data} />
}

function HistoricoTecnico({ id }: { id: number }) {
  const { data } = useQuery(consultas.contratosTecnico(id))
  return <Historico contratos={data} />
}

function Historico({ contratos }: { contratos: (ContratoJogador | ContratoTecnico)[] | undefined }) {
  if (!contratos) return null
  return (
    <SecaoGaveta titulo="Histórico" extra={plural(contratos.length, 'passagem', 'passagens')}>
      {contratos.length === 0 ? (
        <VazioPequeno>Nenhum contrato registrado.</VazioPequeno>
      ) : (
        <ol className="relative mt-3 space-y-3 border-l-2 border-borda pl-5">
          {contratos.map((c) => (
            <li key={c.id} className="relative">
              <span
                className={`absolute top-1.5 -left-[27px] size-3 rounded-full ring-4 ring-white ${c.fim ? 'bg-slate-300' : 'bg-menta-forte'}`}
                aria-hidden="true"
              />
              <LinkEntidade para={`/equipes/${c.equipe.id}`}>{c.equipe.nome}</LinkEntidade>
              <p className="text-xs text-slate-500">
                {formatarDataCurta(c.inicio)} – {c.fim ? formatarDataCurta(c.fim) : 'atual'}
                {'numero_camisa' in c && c.numero_camisa ? ` · camisa ${c.numero_camisa}` : ''}
              </p>
            </li>
          ))}
        </ol>
      )}
    </SecaoGaveta>
  )
}
