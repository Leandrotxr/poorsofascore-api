import { tomDe } from '../estilo'
import type { Tecnico } from '../types'
import { Avatar, Icone, Vazio } from '../ui'

export function TecnicosView({ tecnicos }: { tecnicos: Tecnico[] }) {
  if (tecnicos.length === 0) {
    return (
      <Vazio icone="prancheta" titulo="Nenhum técnico cadastrado">
        Use o botão <strong>Novo técnico</strong>. Dá para escolher a equipe já no cadastro.
      </Vazio>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {tecnicos.map((t, i) => {
        const tomEquipe = t.equipe ? tomDe(t.equipe.id) : null
        return (
          <article
            key={t.id}
            style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            className="animate-rise rounded-3xl border border-borda bg-white p-5"
          >
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
          </article>
        )
      })}
    </div>
  )
}
