import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api, consultas } from '../api'
import { ABRANGENCIA, formatarCnpj } from '../estilo'
import { useIdRota, useNavegarNaAba } from '../hooks'
import { ABRANGENCIAS, type Abrangencia, type Federacao } from '../types'
import { digitos, LIMITES, mascaraCnpj, validarCnpj } from '../validacao'
import { Campo, Formulario, GavetaFormulario, Selecao, Texto } from './campos'
import { exigir, exigirFaixa, opcoesDe, useEnvio, type Erros } from './regras'

/** Rota /federacoes/novo e /federacoes/:id/editar */
export function FormFederacao() {
  const id = useIdRota()
  const editando = !Number.isNaN(id)
  const { data, error } = useQuery({ ...consultas.federacao(id), enabled: editando })
  const navegar = useNavegarNaAba()
  const fechar = () => navegar(editando ? String(id) : '')

  return (
    <GavetaFormulario entidade="federacoes" editando={editando} carregado={!!data} erro={error} onFechar={fechar}>
      <Campos inicial={data} onCancelar={fechar} />
    </GavetaFormulario>
  )
}

function Campos({ inicial, onCancelar }: { inicial?: Federacao; onCancelar: () => void }) {
  const [f, setF] = useState({
    nome: inicial?.nome ?? '',
    sigla: inicial?.sigla ?? '',
    abrangencia: (inicial?.abrangencia ?? 'NACIONAL') as Abrangencia,
    fundacao: inicial ? String(inicial.fundacao) : '',
    sede: inicial?.sede ?? '',
    cnpj: inicial?.cnpj ? formatarCnpj(inicial.cnpj) : '',
  })
  const mudar = (campo: keyof typeof f) => (valor: string) => setF({ ...f, [campo]: valor })
  const { enviando, erros, erroGeral, enviar } = useEnvio()

  const submeter = () =>
    enviar(
      () => {
        const e: Erros = {}
        exigir(f.nome, 'nome', e)
        exigir(f.sede, 'sede', e)
        if (!/^[A-Za-z0-9]{2,20}$/.test(f.sigla)) e.sigla = 'De 2 a 20 letras ou números, sem espaços'
        exigirFaixa(f.fundacao, 'fundacao', LIMITES.fundacao, e)
        if (!inicial && f.cnpj && !validarCnpj(f.cnpj)) e.cnpj = 'CNPJ inválido'
        return e
      },
      async () => {
        const dados = {
          nome: f.nome.trim(),
          sigla: f.sigla,
          abrangencia: f.abrangencia,
          fundacao: Number(f.fundacao),
          sede: f.sede.trim(),
        }
        if (inicial) {
          const salva = await api.federacoes.editar(inicial.id, dados)
          return { id: salva.id, mensagem: { tipo: 'ok', texto: `Federação ${salva.sigla} atualizada` } }
        }
        const nova = await api.federacoes.criar({ ...dados, cnpj: f.cnpj ? digitos(f.cnpj) : null })
        return { id: nova.id, mensagem: { tipo: 'ok', texto: `Federação ${nova.sigla} cadastrada` } }
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
        <Texto
          autoFocus
          valor={f.nome}
          onChange={mudar('nome')}
          erro={erros.nome}
          placeholder="Confederação Brasileira de Futebol"
        />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Sigla" obrigatorio erro={erros.sigla}>
          <Texto valor={f.sigla} onChange={(v) => mudar('sigla')(v.toUpperCase())} erro={erros.sigla} placeholder="CBF" />
        </Campo>
        <Campo rotulo="Abrangência" obrigatorio erro={erros.abrangencia}>
          <Selecao valor={f.abrangencia} onChange={mudar('abrangencia')} opcoes={opcoesDe(ABRANGENCIAS, ABRANGENCIA)} />
        </Campo>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Fundação" obrigatorio erro={erros.fundacao}>
          <Texto
            valor={f.fundacao}
            onChange={mudar('fundacao')}
            erro={erros.fundacao}
            inputMode="numeric"
            placeholder="1914"
          />
        </Campo>
        <Campo rotulo="Sede" obrigatorio erro={erros.sede}>
          <Texto valor={f.sede} onChange={mudar('sede')} erro={erros.sede} placeholder="Rio de Janeiro" />
        </Campo>
      </div>
      <Campo
        rotulo="CNPJ"
        erro={erros.cnpj}
        dica={inicial ? 'O CNPJ não pode ser alterado' : 'Opcional: só entidades brasileiras têm CNPJ'}
      >
        <Texto
          valor={f.cnpj}
          onChange={(v) => mudar('cnpj')(mascaraCnpj(v))}
          erro={erros.cnpj}
          inputMode="numeric"
          placeholder={inicial ? 'Não possui' : '00.000.000/0000-00'}
          disabled={!!inicial}
        />
      </Campo>
    </Formulario>
  )
}
