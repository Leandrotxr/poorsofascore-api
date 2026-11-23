import { useMemo, useState } from 'react'
import { normalizar, plural, POS, TONS, tomDe } from '../estilo'
import { POSICOES, type Equipe, type Jogador, type Posicao } from '../types'
import { Avatar, Icone, PosBadge, Vazio } from '../ui'

type FiltroEquipe = 'todas' | 'livres' | `${number}`

export function JogadoresView({ jogadores, equipes }: { jogadores: Jogador[]; equipes: Equipe[] }) {
  const [busca, setBusca] = useState('')
  const [posicao, setPosicao] = useState<Posicao | 'TODAS'>('TODAS')
  const [equipe, setEquipe] = useState<FiltroEquipe>('todas')

  const porPosicao = useMemo(() => {
    const m = new Map<Posicao, number>()
    for (const j of jogadores) m.set(j.posicao, (m.get(j.posicao) ?? 0) + 1)
    return m
  }, [jogadores])

  const filtrados = useMemo(() => {
    const q = normalizar(busca)
    return jogadores.filter(
      (j) =>
        (!q || normalizar(j.nome).includes(q)) &&
        (posicao === 'TODAS' || j.posicao === posicao) &&
        (equipe === 'todas' || (equipe === 'livres' ? !j.equipe : j.equipe?.id === Number(equipe))),
    )
  }, [jogadores, busca, posicao, equipe])

  if (jogadores.length === 0) {
    return (
      <Vazio icone="pessoas" titulo="Nenhum jogador cadastrado">
        Use o botão <strong>Novo jogador</strong>. Dá para escolher a equipe já no cadastro.
      </Vazio>
    )
  }

  const chip = 'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition'
  const inativo = 'border border-borda bg-white text-slate-600 hover:bg-fundo'

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Buscar jogador</span>
          <Icone nome="busca" className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome…"
            className="w-full rounded-2xl border border-borda bg-white py-3 pr-4 pl-11 text-sm transition outline-none placeholder:text-slate-400 focus:border-ceu-medio focus:ring-4 focus:ring-ceu"
          />
        </label>
        <select
          value={equipe}
          onChange={(e) => setEquipe(e.target.value as FiltroEquipe)}
          aria-label="Filtrar por equipe"
          className="rounded-2xl border border-borda bg-white px-4 py-3 text-sm outline-none focus:border-ceu-medio focus:ring-4 focus:ring-ceu"
        >
          <option value="todas">Todas as equipes</option>
          <option value="livres">Agentes livres</option>
          {equipes.map((e) => (
            <option key={e.id} value={String(e.id)}>
              {e.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <button
          type="button"
          onClick={() => setPosicao('TODAS')}
          className={`${chip} ${posicao === 'TODAS' ? 'border border-tinta bg-tinta text-white' : inativo}`}
        >
          Todas · {jogadores.length}
        </button>
        {POSICOES.map((p) => {
          const tom = TONS[POS[p].tom]
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPosicao(p)}
              className={`${chip} ${posicao === p ? `border border-transparent ${tom.medio} ${tom.texto}` : inativo}`}
            >
              {POS[p].rotulo} · {porPosicao.get(p) ?? 0}
            </button>
          )
        })}
      </div>

      <p className="text-sm text-slate-500">{plural(filtrados.length, 'jogador encontrado', 'jogadores encontrados')}</p>

      {filtrados.length === 0 ? (
        <Vazio icone="busca" titulo="Nenhum jogador com esses filtros" />
      ) : (
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
              {filtrados.map((j) => (
                <tr key={j.id} className="transition hover:bg-fundo/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar nome={j.nome} seed={j.id} tamanho="sm" />
                      <div>
                        <p className="font-semibold">{j.nome}</p>
                        <p className="text-xs text-slate-400">{j.nacionalidade}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <PosBadge posicao={j.posicao} />
                  </td>
                  <td className="px-5 py-3 text-slate-600">{j.idade}</td>
                  <td className="px-5 py-3">
                    {j.equipe ? (
                      <span className="inline-flex items-center gap-2 font-medium">
                        <span className={`size-2.5 rounded-full ${tomDe(j.equipe.id).medio}`} />
                        {j.equipe.nome}
                      </span>
                    ) : (
                      <span className="rounded-full bg-menta px-2.5 py-0.5 text-xs font-semibold text-menta-forte">
                        Agente livre
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
    </div>
  )
}
