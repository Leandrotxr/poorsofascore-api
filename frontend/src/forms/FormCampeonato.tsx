import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api, consultas } from '../api'
import { BuscaRemota, SelecaoRemota } from '../components/Busca'
import { Icone } from '../components/Icone'
import { FORMATO } from '../estilo'
import { useIdRota, useNavegarNaAba } from '../hooks'
import { FORMATOS, type Campeonato, type EquipeResumo, type FederacaoResumo, type FormatoCampeonato } from '../types'
import { LIMITES } from '../validacao'
import { Campo, Formulario, GavetaFormulario, Selecao, Texto } from './campos'
import {
  buscarEquipes,
  buscarFederacoes,
  exigir,
  exigirFaixa,
  opcoesDe,
  rotuloFederacao,
  useEnvio,
  type Erros,
  type Resultado,
} from './regras'

const ANO_ATUAL = new Date().getFullYear()

/** Rota /campeonatos/novo e /campeonatos/:id/editar */
export function FormCampeonato() {
  const id = useIdRota()
  const editando = !Number.isNaN(id)
  const { data, error } = useQuery({ ...consultas.campeonato(id), enabled: editando })
  const navegar = useNavegarNaAba()
  const fechar = () => navegar(editando ? String(id) : '')

  return (
    <GavetaFormulario entidade="campeonatos" editando={editando} carregado={!!data} erro={error} onFechar={fechar}>
      <Campos inicial={data} onCancelar={fechar} />
    </GavetaFormulario>
  )
}

function Campos({ inicial, onCancelar }: { inicial?: Campeonato; onCancelar: () => void }) {
  const [f, setF] = useState({
    nome: inicial?.nome ?? '',
    temporada: String(inicial?.temporada ?? ANO_ATUAL),
    formato: (inicial?.formato ?? 'PONTOS_CORRIDOS') as FormatoCampeonato,
    data_inicio: inicial?.data_inicio ?? '',
    data_fim: inicial?.data_fim ?? '',
  })
  const [federacao, setFederacao] = useState<FederacaoResumo | null>(inicial?.federacao ?? null)
  const [equipes, setEquipes] = useState<EquipeResumo[]>([])
  const mudar = (campo: keyof typeof f) => (valor: string) => setF({ ...f, [campo]: valor })
  const { enviando, erros, erroGeral, enviar } = useEnvio()

  const validar = () => {
    const e: Erros = {}
    exigir(f.nome, 'nome', e)
    exigirFaixa(f.temporada, 'temporada', LIMITES.temporada, e)
    if (f.data_inicio && f.data_fim && f.data_fim < f.data_inicio) e.data_fim = 'Não pode ser antes do início'
    if (!federacao) e.federacao_id = 'Campo obrigatório'
    return e
  }

  async function salvar(): Promise<Resultado> {
    const dados = {
      nome: f.nome.trim(),
      temporada: Number(f.temporada),
      formato: f.formato,
      data_inicio: f.data_inicio || null,
      data_fim: f.data_fim || null,
      federacao_id: federacao!.id,
    }
    if (inicial) {
      const c = await api.campeonatos.editar(inicial.id, dados)
      return { id: c.id, mensagem: { tipo: 'ok', texto: `${c.nome} ${c.temporada} atualizado` } }
    }

    const c = await api.campeonatos.criar(dados)
    const nome = `${c.nome} ${c.temporada}`
    if (equipes.length === 0) return { id: c.id, mensagem: { tipo: 'ok', texto: `${nome} cadastrado` } }

    // Inscreve uma por uma; se alguma falhar, as outras continuam e o aviso conta quantas entraram.
    const resultados = await Promise.allSettled(equipes.map((e) => api.campeonatos.inscrever(c.id, e.id)))
    const falhas = resultados.filter((r) => r.status === 'rejected').length
    return {
      id: c.id,
      mensagem:
        falhas === 0
          ? { tipo: 'ok', texto: `${nome} cadastrado com ${equipes.length} equipe(s)` }
          : { tipo: 'erro', texto: `${nome} foi cadastrado, mas ${falhas} de ${equipes.length} inscrições falharam` },
    }
  }

  const selecionadas = new Set(equipes.map((e) => e.id))

  return (
    <Formulario
      onSubmit={() => enviar(validar, salvar)}
      onCancelar={onCancelar}
      enviando={enviando}
      erroGeral={erroGeral}
      editando={!!inicial}
    >
      <Campo rotulo="Nome" obrigatorio erro={erros.nome}>
        <Texto autoFocus valor={f.nome} onChange={mudar('nome')} erro={erros.nome} placeholder="Brasileirão Série A" />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Temporada" obrigatorio erro={erros.temporada}>
          <Texto valor={f.temporada} onChange={mudar('temporada')} erro={erros.temporada} inputMode="numeric" />
        </Campo>
        <Campo rotulo="Formato" obrigatorio erro={erros.formato}>
          <Selecao valor={f.formato} onChange={mudar('formato')} opcoes={opcoesDe(FORMATOS, FORMATO)} />
        </Campo>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Início" erro={erros.data_inicio}>
          <Texto type="date" valor={f.data_inicio} onChange={mudar('data_inicio')} erro={erros.data_inicio} />
        </Campo>
        <Campo rotulo="Fim" erro={erros.data_fim}>
          <Texto type="date" valor={f.data_fim} onChange={mudar('data_fim')} erro={erros.data_fim} />
        </Campo>
      </div>

      <div>
        <span className="text-sm font-semibold">
          Federação organizadora <span className="text-rosa-forte">*</span>
        </span>
        <SelecaoRemota
          chave="form-federacoes"
          valor={federacao}
          onChange={setFederacao}
          nenhum="Escolha a organizadora"
          vazio="Nenhuma federação cadastrada. Cadastre uma na aba Federações."
          rotuloDe={rotuloFederacao}
          buscar={buscarFederacoes}
          item={(x) => <span className="font-medium">{rotuloFederacao(x)}</span>}
        />
        {erros.federacao_id && (
          <span className="mt-1 block text-xs font-medium text-rosa-forte">{erros.federacao_id}</span>
        )}
      </div>

      {!inicial && (
        <fieldset>
          <legend className="text-sm font-semibold">
            Equipes participantes <span className="font-normal text-slate-400">· {equipes.length} selecionada(s)</span>
          </legend>
          {equipes.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {equipes.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => setEquipes(equipes.filter((x) => x.id !== e.id))}
                    className="inline-flex items-center gap-1.5 rounded-full bg-menta px-3 py-1 text-sm font-semibold text-menta-forte hover:bg-menta-medio"
                    aria-label={`Tirar ${e.nome}`}
                  >
                    {e.nome}
                    <Icone nome="fechar" className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 rounded-xl border border-borda p-2">
            <BuscaRemota
              chave="form-equipes"
              autoFocus={false}
              buscar={buscarEquipes}
              vazio="Nenhuma equipe cadastrada ainda. Dá para inscrever depois."
              desabilitar={(e) => selecionadas.has(e.id)}
              onEscolher={(e) => setEquipes([...equipes, { id: e.id, nome: e.nome }])}
              item={(e) => (
                <>
                  <span className="font-medium">{e.nome}</span>
                  {e.federacao && <span className="text-xs text-slate-400">{e.federacao.sigla}</span>}
                </>
              )}
            />
          </div>
        </fieldset>
      )}
    </Formulario>
  )
}
