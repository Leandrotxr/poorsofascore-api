import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { api, consultas } from '../api'
import { SelecaoRemota } from '../components/Busca'
import { paraDataHoraLocal } from '../estilo'
import { useIdRota, useNavegarNaAba } from '../hooks'
import type { ArbitroResumo, CampeonatoResumo, PartidaDetalhe } from '../types'
import { Campo, Formulario, GavetaFormulario, Selecao, Texto } from './campos'
import { exigirFaixa, useEnvio, type Erros, type Resultado } from './regras'

/** Rota /partidas/novo (aceita ?campeonato_id=) e /partidas/:id/editar */
export function FormPartida() {
  const id = useIdRota()
  const editando = !Number.isNaN(id)
  const { data, error } = useQuery({ ...consultas.partida(id), enabled: editando })
  const navegar = useNavegarNaAba()
  const fechar = () => navegar(editando ? String(id) : '')

  return (
    <GavetaFormulario entidade="partidas" editando={editando} carregado={!!data} erro={error} onFechar={fechar}>
      <Campos inicial={data} onCancelar={fechar} />
    </GavetaFormulario>
  )
}

const buscarCampeonatos = (nome: string, limit: number) =>
  api.campeonatos.listar({ nome, limit }).then((p) => p.items)
const buscarArbitros = (nome: string, limit: number) => api.arbitros.listar({ nome, limit }).then((p) => p.items)
const rotuloCampeonato = (c: { nome: string; temporada: number }) => `${c.nome} ${c.temporada}`

function Campos({ inicial, onCancelar }: { inicial?: PartidaDetalhe; onCancelar: () => void }) {
  const [params] = useSearchParams()
  const idDaUrl = Number(params.get('campeonato_id')) || 0
  // Vindo do painel do campeonato (/partidas/novo?campeonato_id=3), ele já vem escolhido.
  const daUrl = useQuery({ ...consultas.campeonato(idDaUrl), enabled: !inicial && idDaUrl > 0 })

  const [escolhido, setCampeonato] = useState<CampeonatoResumo | null>(inicial?.campeonato ?? null)
  const campeonato = escolhido ?? (daUrl.data ? { id: daUrl.data.id, nome: daUrl.data.nome, temporada: daUrl.data.temporada } : null)
  const detalhe = useQuery({ ...consultas.campeonato(campeonato?.id ?? 0), enabled: !!campeonato })
  const inscritas = detalhe.data?.equipes ?? []

  const [f, setF] = useState({
    rodada: String(inicial?.rodada ?? 1),
    mandante: inicial ? String(inicial.mandante.id) : '',
    visitante: inicial ? String(inicial.visitante.id) : '',
    data_hora: paraDataHoraLocal(inicial?.data_hora ?? null),
    local: inicial?.local ?? '',
  })
  const [arbitro, setArbitro] = useState<ArbitroResumo | null>(inicial?.arbitro ?? null)
  const mudar = (campo: keyof typeof f) => (valor: string) => setF({ ...f, [campo]: valor })
  const { enviando, erros, erroGeral, enviar } = useEnvio()

  const validar = () => {
    const e: Erros = {}
    if (!campeonato) e.campeonato_id = 'Escolha o campeonato'
    exigirFaixa(f.rodada, 'rodada', { min: 1, max: 999 }, e)
    if (!f.mandante) e.mandante_id = 'Escolha o mandante'
    if (!f.visitante) e.visitante_id = 'Escolha o visitante'
    if (f.mandante && f.mandante === f.visitante) e.visitante_id = 'Precisa ser diferente do mandante'
    return e
  }

  async function salvar(): Promise<Resultado> {
    const dados = {
      rodada: Number(f.rodada),
      mandante_id: Number(f.mandante),
      visitante_id: Number(f.visitante),
      // O input é no horário local; a API guarda com fuso (toISOString converte para UTC).
      data_hora: f.data_hora ? new Date(f.data_hora).toISOString() : null,
      local: f.local.trim() || null,
      arbitro_id: arbitro?.id ?? null,
    }
    const p = inicial
      ? await api.partidas.editar(inicial.id, dados)
      : await api.partidas.criar({ ...dados, campeonato_id: campeonato!.id })
    const texto = `${p.mandante.nome} × ${p.visitante.nome} ${inicial ? 'atualizada' : 'agendada'}`
    return { id: p.id, mensagem: { tipo: 'ok', texto } }
  }

  const opcoesEquipe = [
    { valor: '', rotulo: inscritas.length ? 'Escolha…' : 'Nenhuma equipe inscrita' },
    ...inscritas.map((e) => ({ valor: String(e.id), rotulo: e.nome })),
  ]

  return (
    <Formulario
      onSubmit={() => enviar(validar, salvar)}
      onCancelar={onCancelar}
      enviando={enviando}
      erroGeral={erroGeral}
      editando={!!inicial}
    >
      <div>
        <span className="text-sm font-semibold">
          Campeonato <span className="text-rosa-forte">*</span>
        </span>
        {inicial ? (
          <p className="mt-1.5 rounded-xl border border-borda bg-fundo px-3 py-2.5 text-sm text-slate-500">
            {rotuloCampeonato(inicial.campeonato)} (não pode ser alterado)
          </p>
        ) : (
          <SelecaoRemota
            chave="form-campeonatos"
            valor={campeonato}
            onChange={(c) => {
              setCampeonato(c)
              setF({ ...f, mandante: '', visitante: '' }) // as equipes dependem do campeonato
            }}
            nenhum="Escolha o campeonato"
            vazio="Nenhum campeonato cadastrado"
            rotuloDe={rotuloCampeonato}
            buscar={buscarCampeonatos}
            item={(c) => <span className="font-medium">{rotuloCampeonato(c)}</span>}
          />
        )}
        {erros.campeonato_id && <span className="mt-1 block text-xs font-medium text-rosa-forte">{erros.campeonato_id}</span>}
      </div>

      {campeonato && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Mandante" obrigatorio erro={erros.mandante_id}>
              <Selecao valor={f.mandante} onChange={mudar('mandante')} opcoes={opcoesEquipe} erro={erros.mandante_id} />
            </Campo>
            <Campo rotulo="Visitante" obrigatorio erro={erros.visitante_id}>
              <Selecao valor={f.visitante} onChange={mudar('visitante')} opcoes={opcoesEquipe} erro={erros.visitante_id} />
            </Campo>
          </div>
          {inicial && inicial.eventos.length > 0 && (
            <p className="text-xs text-slate-400">Esta partida já tem lances: as equipes não podem mais ser trocadas.</p>
          )}
        </>
      )}

      <div className="grid grid-cols-[6rem_1fr] gap-3">
        <Campo rotulo="Rodada" obrigatorio erro={erros.rodada}>
          <Texto valor={f.rodada} onChange={mudar('rodada')} erro={erros.rodada} inputMode="numeric" />
        </Campo>
        <Campo rotulo="Data e hora" erro={erros.data_hora}>
          <Texto type="datetime-local" valor={f.data_hora} onChange={mudar('data_hora')} erro={erros.data_hora} />
        </Campo>
      </div>
      <Campo rotulo="Local" erro={erros.local}>
        <Texto valor={f.local} onChange={mudar('local')} erro={erros.local} placeholder="Maracanã" />
      </Campo>
      <div>
        <span className="text-sm font-semibold">Árbitro</span>
        <SelecaoRemota
          chave="form-arbitros"
          valor={arbitro}
          onChange={setArbitro}
          nenhum="A definir"
          vazio="Nenhum árbitro cadastrado"
          buscar={buscarArbitros}
          item={(a) => <span className="font-medium">{a.nome}</span>}
        />
      </div>
    </Formulario>
  )
}
