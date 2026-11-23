import { useQuery } from '@tanstack/react-query'
import { consultas } from '../api'
import { Icone } from '../components/Icone'
import { CardLink, Grade, ListaPaginada } from '../components/Lista'
import { Avatar, CampoBusca, Chip, Etiqueta, LinhaChips } from '../components/ui'
import { FUNCAO, nomeTomDe } from '../estilo'
import { useFiltrosUrl } from '../hooks'
import { FUNCOES, type FuncaoArbitro } from '../types'

export function ArbitrosLista() {
  const f = useFiltrosUrl()
  const q = f.ler('q')
  const funcao = (f.ler('funcao') || undefined) as FuncaoArbitro | undefined
  const consulta = useQuery(consultas.arbitros({ nome: q || undefined, funcao, skip: f.skip, limit: f.limit }))

  return (
    <ListaPaginada
      consulta={consulta}
      filtrando={!!q || !!funcao}
      rotulo={['árbitro', 'árbitros']}
      vazio={{
        icone: 'cartao',
        titulo: 'Nenhum árbitro cadastrado',
        texto: 'Use o botão Novo árbitro. Dá para escolher a federação já no cadastro.',
      }}
      filtros={
        <>
          <CampoBusca valor={q} onBuscar={(v) => f.mudar('q', v)} placeholder="Buscar árbitro…" />
          <LinhaChips>
            <Chip ativo={!funcao} onClick={() => f.mudar('funcao', '')}>
              Todas as funções
            </Chip>
            {FUNCOES.map((fn) => (
              <Chip key={fn} ativo={funcao === fn} onClick={() => f.mudar('funcao', fn)}>
                {FUNCAO[fn].rotulo}
              </Chip>
            ))}
          </LinhaChips>
        </>
      }
    >
      {(arbitros) => (
        <Grade>
          {arbitros.map((a, i) => (
            <CardLink key={a.id} id={a.id} indice={i}>
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
            </CardLink>
          ))}
        </Grade>
      )}
    </ListaPaginada>
  )
}
