import { useState } from 'react'
import { FUNCAO, nomeTomDe } from '../estilo'
import { FUNCOES, type Arbitro, type FuncaoArbitro } from '../types'
import { Avatar, Etiqueta, Icone, Vazio } from '../ui'

export function ArbitrosView({ arbitros }: { arbitros: Arbitro[] }) {
  const [funcao, setFuncao] = useState<FuncaoArbitro | 'TODAS'>('TODAS')

  if (arbitros.length === 0) {
    return (
      <Vazio icone="cartao" titulo="Nenhum árbitro cadastrado">
        Use o botão <strong>Novo árbitro</strong>. Dá para escolher a federação já no cadastro.
      </Vazio>
    )
  }

  const filtrados = funcao === 'TODAS' ? arbitros : arbitros.filter((a) => a.funcao === funcao)
  const chip = 'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition'
  const inativo = 'border border-borda bg-white text-slate-600 hover:bg-fundo'

  return (
    <div className="space-y-5">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <button
          type="button"
          onClick={() => setFuncao('TODAS')}
          className={`${chip} ${funcao === 'TODAS' ? 'border border-tinta bg-tinta text-white' : inativo}`}
        >
          Todas · {arbitros.length}
        </button>
        {FUNCOES.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFuncao(f)}
            className={`${chip} ${funcao === f ? 'border border-tinta bg-tinta text-white' : inativo}`}
          >
            {FUNCAO[f].rotulo} · {arbitros.filter((a) => a.funcao === f).length}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtrados.map((a, i) => (
          <article
            key={a.id}
            style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            className="animate-rise rounded-3xl border border-borda bg-white p-5"
          >
            <div className="flex items-center gap-4">
              <Avatar nome={a.nome} seed={a.id + 1} tamanho="lg" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-bold">{a.nome}</h3>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                  <Icone nome="bandeira" className="size-3.5" />
                  {a.nacionalidade} · {a.idade} anos
                </p>
              </div>
              <Etiqueta tom={FUNCAO[a.funcao].tom}>{FUNCAO[a.funcao].rotulo}</Etiqueta>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              {a.federacao ? (
                <span title={a.federacao.nome}>
                  <Etiqueta tom={nomeTomDe(a.federacao.id)}>
                    <Icone nome="globo" className="mr-1.5 size-3.5" />
                    {a.federacao.sigla}
                  </Etiqueta>
                </span>
              ) : (
                <span className="rounded-full border border-borda px-3 py-0.5 text-xs font-medium text-slate-400">
                  Sem federação
                </span>
              )}
              <span className="shrink-0 font-mono text-xs text-slate-400">{a.cpf}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
