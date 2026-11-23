import { queryOptions, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../api'
import { SelecaoRemota } from '../components/Busca'
import { FUNCAO, POS } from '../estilo'
import { useIdRota, useNavegarNaAba } from '../hooks'
import { FUNCOES, POSICOES, type FuncaoArbitro, type Posicao } from '../types'
import { digitos, LIMITES, mascaraCpf, validarCpf } from '../validacao'
import { Campo, Formulario, GavetaFormulario, Selecao, Texto } from './campos'
import {
  buscarEquipes,
  buscarFederacoes,
  exigir,
  exigirFaixa,
  opcoesDe,
  rotuloFederacao,
  useEnvio,
  vincularDepois,
  type Erros,
  type Resultado,
} from './regras'

// Jogador, técnico e árbitro herdam de PessoaFisica na API: o formulário é o mesmo,
// muda a faixa de idade, o campo extra (posição/função) e o vínculo opcional no cadastro.

type Tipo = 'jogador' | 'tecnico' | 'arbitro'

const PESSOA = {
  jogador: { recurso: 'jogadores', idade: LIMITES.idadeJogador, vinculo: 'Equipe', nenhum: 'Agente livre' },
  tecnico: { recurso: 'tecnicos', idade: LIMITES.idadeTecnico, vinculo: 'Equipe', nenhum: 'Sem equipe por enquanto' },
  arbitro: {
    recurso: 'arbitros',
    idade: LIMITES.idadeArbitro,
    vinculo: 'Federação',
    nenhum: 'Sem federação por enquanto',
  },
} as const

/** O que o formulário precisa saber de uma pessoa já cadastrada (edição). */
interface PessoaInicial {
  id: number
  nome: string
  cpf: string // já vem mascarado da API
  idade: number
  nacionalidade: string
  posicao?: Posicao
  funcao?: FuncaoArbitro
}

/** Mesma chave de consultas.jogador(id) etc.: reaproveita o cache do painel. */
const consultaDe = (tipo: Tipo, id: number) => {
  const recurso = PESSOA[tipo].recurso
  return queryOptions<PessoaInicial>({ queryKey: [recurso, id], queryFn: () => api[recurso].obter(id) })
}

function FormPessoa({ tipo }: { tipo: Tipo }) {
  const id = useIdRota()
  const editando = !Number.isNaN(id)
  const { data, error } = useQuery({ ...consultaDe(tipo, id), enabled: editando })
  const navegar = useNavegarNaAba()
  const fechar = () => navegar(editando ? String(id) : '')

  return (
    <GavetaFormulario
      entidade={PESSOA[tipo].recurso}
      editando={editando}
      carregado={!!data}
      erro={error}
      onFechar={fechar}
    >
      <Campos tipo={tipo} inicial={data} onCancelar={fechar} />
    </GavetaFormulario>
  )
}

export const FormJogador = () => <FormPessoa tipo="jogador" />
export const FormTecnico = () => <FormPessoa tipo="tecnico" />
export const FormArbitro = () => <FormPessoa tipo="arbitro" />

interface Vinculo {
  id: number
  nome: string
  sigla?: string
}

const rotuloVinculo = (x: Vinculo) => (x.sigla ? rotuloFederacao({ sigla: x.sigla, nome: x.nome }) : x.nome)

function Campos({ tipo, inicial, onCancelar }: { tipo: Tipo; inicial?: PessoaInicial; onCancelar: () => void }) {
  const cfg = PESSOA[tipo]
  const [f, setF] = useState({
    nome: inicial?.nome ?? '',
    cpf: inicial?.cpf ?? '',
    idade: inicial ? String(inicial.idade) : '',
    nacionalidade: inicial?.nacionalidade ?? '',
    posicao: inicial?.posicao ?? ('MEIA' as Posicao),
    funcao: inicial?.funcao ?? ('CENTRAL' as FuncaoArbitro),
  })
  const [vinculo, setVinculo] = useState<Vinculo | null>(null)
  const mudar = (campo: keyof typeof f) => (valor: string) => setF({ ...f, [campo]: valor })
  const { enviando, erros, erroGeral, enviar } = useEnvio()

  const validar = () => {
    const e: Erros = {}
    exigir(f.nome, 'nome', e)
    exigir(f.nacionalidade, 'nacionalidade', e)
    exigirFaixa(f.idade, 'idade', cfg.idade, e)
    if (!inicial && !validarCpf(f.cpf)) e.cpf = f.cpf ? 'CPF inválido' : 'Campo obrigatório'
    return e
  }

  async function salvar(): Promise<Resultado> {
    const base = { nome: f.nome.trim(), idade: Number(f.idade), nacionalidade: f.nacionalidade.trim() }
    const ok = (id: number, nome: string) => ({ id, mensagem: { tipo: 'ok' as const, texto: `${nome} atualizado(a)` } })

    if (inicial) {
      if (tipo === 'jogador') return api.jogadores.editar(inicial.id, { ...base, posicao: f.posicao }).then((p) => ok(p.id, p.nome))
      if (tipo === 'tecnico') return api.tecnicos.editar(inicial.id, base).then((p) => ok(p.id, p.nome))
      return api.arbitros.editar(inicial.id, { ...base, funcao: f.funcao }).then((p) => ok(p.id, p.nome))
    }

    const novo = { ...base, cpf: digitos(f.cpf) }
    const alvo = vinculo
    if (tipo === 'jogador') {
      const j = await api.jogadores.criar({ ...novo, posicao: f.posicao })
      const m = await vincularDepois(j.nome, alvo && (() => api.equipes.contratar(alvo.id, j.id)), `contratado(a) pelo ${alvo?.nome}`)
      return { id: j.id, mensagem: m }
    }
    if (tipo === 'tecnico') {
      const t = await api.tecnicos.criar(novo)
      const m = await vincularDepois(t.nome, alvo && (() => api.equipes.definirTecnico(alvo.id, t.id)), `agora comanda o ${alvo?.nome}`)
      return { id: t.id, mensagem: m }
    }
    const a = await api.arbitros.criar({ ...novo, funcao: f.funcao })
    const m = await vincularDepois(a.nome, alvo && (() => api.federacoes.vincularArbitro(alvo.id, a.id)), `vinculado(a) à ${alvo?.sigla}`)
    return { id: a.id, mensagem: m }
  }

  return (
    <Formulario
      onSubmit={() => enviar(validar, salvar)}
      onCancelar={onCancelar}
      enviando={enviando}
      erroGeral={erroGeral}
      editando={!!inicial}
    >
      <Campo rotulo="Nome" obrigatorio erro={erros.nome}>
        <Texto autoFocus valor={f.nome} onChange={mudar('nome')} erro={erros.nome} />
      </Campo>
      <Campo
        rotulo="CPF"
        obrigatorio
        erro={erros.cpf}
        dica={
          inicial ? 'O CPF não pode ser alterado' : 'Fica guardado completo, mas a API só exibe os 2 últimos dígitos'
        }
      >
        <Texto
          valor={f.cpf}
          onChange={(v) => mudar('cpf')(mascaraCpf(v))}
          erro={erros.cpf}
          inputMode="numeric"
          placeholder="000.000.000-00"
          disabled={!!inicial}
        />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Idade" obrigatorio erro={erros.idade} dica={`Entre ${cfg.idade.min} e ${cfg.idade.max}`}>
          <Texto valor={f.idade} onChange={mudar('idade')} erro={erros.idade} inputMode="numeric" />
        </Campo>
        <Campo rotulo="Nacionalidade" obrigatorio erro={erros.nacionalidade}>
          <Texto
            valor={f.nacionalidade}
            onChange={mudar('nacionalidade')}
            erro={erros.nacionalidade}
            placeholder="Brasileiro"
          />
        </Campo>
      </div>
      {tipo === 'jogador' && (
        <Campo rotulo="Posição" obrigatorio erro={erros.posicao}>
          <Selecao valor={f.posicao} onChange={mudar('posicao')} opcoes={opcoesDe(POSICOES, POS)} />
        </Campo>
      )}
      {tipo === 'arbitro' && (
        <Campo rotulo="Função" obrigatorio erro={erros.funcao}>
          <Selecao valor={f.funcao} onChange={mudar('funcao')} opcoes={opcoesDe(FUNCOES, FUNCAO)} />
        </Campo>
      )}
      {!inicial && (
        <div>
          <span className="text-sm font-semibold">{cfg.vinculo}</span>
          {tipo === 'arbitro' ? (
            <SelecaoRemota
              chave="form-federacoes"
              valor={vinculo}
              onChange={setVinculo}
              nenhum={cfg.nenhum}
              vazio="Nenhuma federação cadastrada"
              rotuloDe={rotuloVinculo}
              buscar={buscarFederacoes}
              item={(x) => <span className="font-medium">{rotuloVinculo(x)}</span>}
            />
          ) : (
            <SelecaoRemota
              chave={tipo === 'tecnico' ? 'form-equipes-sem-tecnico' : 'form-equipes'}
              valor={vinculo}
              onChange={setVinculo}
              nenhum={cfg.nenhum}
              vazio={tipo === 'tecnico' ? 'Todas as equipes já têm técnico' : 'Nenhuma equipe cadastrada'}
              // Técnico só vai para equipe sem técnico (a API trocaria o atual, o que surpreenderia aqui).
              buscar={
                tipo === 'tecnico'
                  ? (nome, limit) => api.equipes.listar({ nome, limit, sem_tecnico: true }).then((p) => p.items)
                  : buscarEquipes
              }
              item={(x) => <span className="font-medium">{x.nome}</span>}
            />
          )}
          <span className="mt-1 block text-xs text-slate-400">
            {tipo === 'tecnico' ? 'Opcional. Só aparecem equipes sem técnico' : 'Opcional: já sai vinculado'}
          </span>
        </div>
      )}
    </Formulario>
  )
}
