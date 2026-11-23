import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api, consultas } from '../api'
import { SelecaoRemota } from '../components/Busca'
import { formatarCnpj } from '../estilo'
import { useIdRota, useNavegarNaAba } from '../hooks'
import type { Equipe, Federacao } from '../types'
import { digitos, LIMITES, mascaraCnpj, validarCnpj } from '../validacao'
import { Campo, Formulario, GavetaFormulario, Texto } from './campos'
import { buscarFederacoes, exigir, exigirFaixa, rotuloFederacao, useEnvio, vincularDepois, type Erros } from './regras'

/** Rota /equipes/novo e /equipes/:id/editar */
export function FormEquipe() {
  const id = useIdRota()
  const editando = !Number.isNaN(id)
  const { data, error } = useQuery({ ...consultas.equipe(id), enabled: editando })
  const navegar = useNavegarNaAba()
  const fechar = () => navegar(editando ? String(id) : '')

  return (
    <GavetaFormulario entidade="equipes" editando={editando} carregado={!!data} erro={error} onFechar={fechar}>
      <Campos inicial={data} onCancelar={fechar} />
    </GavetaFormulario>
  )
}

function Campos({ inicial, onCancelar }: { inicial?: Equipe; onCancelar: () => void }) {
  const [f, setF] = useState({
    nome: inicial?.nome ?? '',
    cnpj: inicial ? formatarCnpj(inicial.cnpj) : '',
    fundacao: inicial ? String(inicial.fundacao) : '',
    sede: inicial?.sede ?? '',
  })
  const [federacao, setFederacao] = useState<Federacao | null>(null)
  const mudar = (campo: keyof typeof f) => (valor: string) => setF({ ...f, [campo]: valor })
  const { enviando, erros, erroGeral, enviar } = useEnvio()

  const submeter = () =>
    enviar(
      () => {
        const e: Erros = {}
        exigir(f.nome, 'nome', e)
        exigir(f.sede, 'sede', e)
        exigirFaixa(f.fundacao, 'fundacao', LIMITES.fundacao, e)
        if (!inicial && !validarCnpj(f.cnpj)) e.cnpj = f.cnpj ? 'CNPJ inválido' : 'Campo obrigatório'
        return e
      },
      async () => {
        const dados = { nome: f.nome.trim(), fundacao: Number(f.fundacao), sede: f.sede.trim() }
        if (inicial) {
          const salva = await api.equipes.editar(inicial.id, dados)
          return { id: salva.id, mensagem: { tipo: 'ok', texto: `${salva.nome} atualizada` } }
        }
        const nova = await api.equipes.criar({ ...dados, cnpj: digitos(f.cnpj) })
        const fed = federacao
        const mensagem = await vincularDepois(
          nova.nome,
          fed ? () => api.federacoes.filiarEquipe(fed.id, nova.id) : null,
          `filiado(a) à ${fed?.sigla}`,
        )
        return { id: nova.id, mensagem }
      },
    )

  return (
    <Formulario
      onSubmit={submeter}
      onCancelar={onCancelar}
      enviando={enviando}
      erroGeral={erroGeral}
      editando={!!inicial}
    >
      <Campo rotulo="Nome" obrigatorio erro={erros.nome}>
        <Texto autoFocus valor={f.nome} onChange={mudar('nome')} erro={erros.nome} placeholder="Flamengo" />
      </Campo>
      <Campo rotulo="CNPJ" obrigatorio erro={erros.cnpj} dica={inicial ? 'O CNPJ não pode ser alterado' : undefined}>
        <Texto
          valor={f.cnpj}
          onChange={(v) => mudar('cnpj')(mascaraCnpj(v))}
          erro={erros.cnpj}
          inputMode="numeric"
          placeholder="00.000.000/0000-00"
          disabled={!!inicial}
        />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Fundação" obrigatorio erro={erros.fundacao}>
          <Texto
            valor={f.fundacao}
            onChange={mudar('fundacao')}
            erro={erros.fundacao}
            inputMode="numeric"
            placeholder="1895"
          />
        </Campo>
        <Campo rotulo="Sede" obrigatorio erro={erros.sede}>
          <Texto valor={f.sede} onChange={mudar('sede')} erro={erros.sede} placeholder="Rio de Janeiro" />
        </Campo>
      </div>
      {!inicial && (
        <div>
          <span className="text-sm font-semibold">Federação</span>
          <SelecaoRemota
            chave="form-federacoes"
            valor={federacao}
            onChange={setFederacao}
            nenhum="Nenhuma por enquanto"
            vazio="Nenhuma federação cadastrada"
            rotuloDe={rotuloFederacao}
            buscar={buscarFederacoes}
            item={(x) => <span className="font-medium">{rotuloFederacao(x)}</span>}
          />
          <span className="mt-1 block text-xs text-slate-400">Opcional: a equipe já sai filiada</span>
        </div>
      )}
    </Formulario>
  )
}
