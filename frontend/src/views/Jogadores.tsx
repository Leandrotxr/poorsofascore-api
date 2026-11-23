import { useQuery } from '@tanstack/react-query'
import { Link, useLocation } from 'react-router'
import { consultas } from '../api'
import { Icone } from '../components/Icone'
import { ListaPaginada } from '../components/Lista'
import { Avatar, CampoBusca, Chip, LinhaChips, PosBadge } from '../components/ui'
import { POS, TONS, tomDe } from '../estilo'
import { useFiltrosUrl } from '../hooks'
import { POSICOES, type Posicao } from '../types'

export function JogadoresLista() {
  const f = useFiltrosUrl()
  const { search } = useLocation()
  const q = f.ler('q')
  const posicao = (f.ler('posicao') || undefined) as Posicao | undefined
  const livres = f.ler('livres') === '1'
  const consulta = useQuery(
    consultas.jogadores({ nome: q || undefined, posicao, sem_equipe: livres, skip: f.skip, limit: f.limit }),
  )

  return (
    <ListaPaginada
      consulta={consulta}
      filtrando={!!q || !!posicao || livres}
      rotulo={['jogador', 'jogadores']}
      vazio={{
        icone: 'pessoas',
        titulo: 'Nenhum jogador cadastrado',
        texto: 'Use o botão Novo jogador. Dá para escolher a equipe já no cadastro.',
      }}
      filtros={
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <CampoBusca valor={q} onBuscar={(v) => f.mudar('q', v)} placeholder="Buscar jogador…" />
            <Chip
              ativo={livres}
              onClick={() => f.mudar('livres', livres ? '' : '1')}
              classeAtivo="border border-transparent bg-menta text-menta-forte"
            >
              Só agentes livres
            </Chip>
          </div>
          <LinhaChips>
            <Chip ativo={!posicao} onClick={() => f.mudar('posicao', '')}>
              Todas as posições
            </Chip>
            {POSICOES.map((p) => {
              const tom = TONS[POS[p].tom]
              return (
                <Chip
                  key={p}
                  ativo={posicao === p}
                  onClick={() => f.mudar('posicao', p)}
                  classeAtivo={`border border-transparent ${tom.medio} ${tom.texto}`}
                >
                  {POS[p].rotulo}
                </Chip>
              )
            })}
          </LinhaChips>
        </>
      }
      carregando={<div className="h-96 animate-pulse rounded-3xl bg-borda/60" />}
    >
      {(jogadores) => (
        <div className="overflow-x-auto rounded-3xl border border-borda bg-white">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-fundo/60">
              <tr className="text-left text-[11px] tracking-wider text-slate-400 uppercase">
                <th className="px-5 py-3.5 font-semibold">Jogador</th>
                <th className="px-5 py-3.5 font-semibold">Posição</th>
                <th className="px-5 py-3.5 font-semibold">Idade</th>
                <th className="px-5 py-3.5 font-semibold">Equipe</th>
                <th className="px-5 py-3.5 font-semibold">CPF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borda">
              {jogadores.map((j) => (
                <tr key={j.id} className="transition hover:bg-fundo/50">
                  <td className="px-5 py-3">
                    <Link to={{ pathname: String(j.id), search }} className="flex items-center gap-3 hover:underline">
                      <Avatar nome={j.nome} seed={j.id} tamanho="sm" />
                      <div>
                        <p className="font-semibold">{j.nome}</p>
                        <p className="text-xs text-slate-400">{j.nacionalidade}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <PosBadge posicao={j.posicao} />
                  </td>
                  <td className="px-5 py-3 text-slate-600">{j.idade}</td>
                  <td className="px-5 py-3">
                    {j.equipe ? (
                      <Link to={`/equipes/${j.equipe.id}`} className="inline-flex items-center gap-2 font-medium hover:underline">
                        <span className={`size-2.5 rounded-full ${tomDe(j.equipe.id).medio}`} />
                        {j.equipe.nome}
                        {j.numero_camisa && <span className="font-mono text-xs text-slate-400">#{j.numero_camisa}</span>}
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-menta px-2.5 py-0.5 text-xs font-semibold text-menta-forte">
                        <Icone nome="livre" className="size-3" /> Agente livre
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-400">{j.cpf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ListaPaginada>
  )
}
