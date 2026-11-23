import { useQuery } from '@tanstack/react-query'
import { consultas } from '../api'
import { Icone } from '../components/Icone'
import { CardLink, Grade, ListaPaginada } from '../components/Lista'
import { Avatar, CampoBusca, Chip } from '../components/ui'
import { tomDe } from '../estilo'
import { useFiltrosUrl } from '../hooks'

export function TecnicosLista() {
  const f = useFiltrosUrl()
  const q = f.ler('q')
  const livres = f.ler('livres') === '1'
  const consulta = useQuery(consultas.tecnicos({ nome: q || undefined, sem_equipe: livres, skip: f.skip, limit: f.limit }))

  return (
    <ListaPaginada
      consulta={consulta}
      filtrando={!!q || livres}
      rotulo={['técnico', 'técnicos']}
      vazio={{
        icone: 'prancheta',
        titulo: 'Nenhum técnico cadastrado',
        texto: 'Use o botão Novo técnico. Dá para escolher a equipe já no cadastro.',
      }}
      filtros={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <CampoBusca valor={q} onBuscar={(v) => f.mudar('q', v)} placeholder="Buscar técnico…" />
          <Chip ativo={livres} onClick={() => f.mudar('livres', livres ? '' : '1')}>
            Só sem equipe
          </Chip>
        </div>
      }
    >
      {(tecnicos) => (
        <Grade>
          {tecnicos.map((t, i) => {
            const tomEquipe = t.equipe ? tomDe(t.equipe.id) : null
            return (
              <CardLink key={t.id} id={t.id} indice={i}>
                <div className="flex items-center gap-4">
                  <Avatar nome={t.nome} seed={t.id + 3} tamanho="lg" />
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold">{t.nome}</h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                      <Icone nome="bandeira" className="size-3.5" />
                      {t.nacionalidade} · {t.idade} anos
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  {t.equipe && tomEquipe ? (
                    <span
                      className={`inline-flex min-w-0 items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${tomEquipe.fundo} ${tomEquipe.texto}`}
                    >
                      <Icone nome="escudo" className="size-3.5 shrink-0" />
                      <span className="truncate">{t.equipe.nome}</span>
                    </span>
                  ) : (
                    <span className="rounded-full border border-borda px-3 py-1 text-sm font-medium text-slate-400">
                      Sem equipe
                    </span>
                  )}
                  <span className="shrink-0 font-mono text-xs text-slate-400">{t.cpf}</span>
                </div>
              </CardLink>
            )
          })}
        </Grade>
      )}
    </ListaPaginada>
  )
}
