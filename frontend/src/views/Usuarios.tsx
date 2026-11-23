import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Outlet, useNavigate, useParams } from 'react-router'
import { api, ApiError, consultas, mensagemDe } from '../api'
import { Confirmar, Gaveta, GavetaEstado, IconeGaveta } from '../components/Gaveta'
import { Icone } from '../components/Icone'
import { Avatar, ErroCarregar, Etiqueta, Vazio } from '../components/ui'
import { Campo, Formulario, Selecao, Texto } from '../forms/campos'
import { useAviso, useSessao } from '../hooks'
import { PAPEIS, type PapelUsuario, type Usuario } from '../types'

const PAPEL: Record<PapelUsuario, { rotulo: string; descricao: string }> = {
  EDITOR: { rotulo: 'Editor', descricao: 'Cadastra, edita e exclui dados' },
  ADMIN: { rotulo: 'Administrador', descricao: 'Tudo do editor + gerencia usuários' },
}

/** Rota /usuarios: só ADMIN. As filhas (novo, :id) abrem a gaveta do formulário por cima. */
export function UsuariosPagina() {
  const { usuario: eu, abrirLogin } = useSessao()
  const ehAdmin = eu?.papel === 'ADMIN'
  const { data: usuarios, error, isPending } = useQuery({ ...consultas.usuarios(), enabled: ehAdmin })

  if (!eu) {
    return (
      <Vazio icone="cadeado" titulo="Área restrita">
        <button type="button" onClick={abrirLogin} className="font-semibold text-tinta underline">
          Entre como administrador
        </button>{' '}
        para gerenciar usuários.
      </Vazio>
    )
  }
  if (!ehAdmin) {
    return <Vazio icone="cadeado" titulo="Apenas administradores gerenciam usuários" />
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to="/" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-tinta">
            <Icone nome="esquerda" /> Voltar ao painel
          </Link>
          <h2 className="text-xl font-extrabold">Usuários</h2>
          <p className="text-sm text-slate-500">Quem pode alterar os dados do painel. A leitura é pública.</p>
        </div>
        <Link
          to="novo"
          className="inline-flex items-center gap-2 rounded-full bg-tinta px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-tinta/85"
        >
          <Icone nome="mais" /> Novo usuário
        </Link>
      </div>

      {error ? (
        <ErroCarregar mensagem={mensagemDe(error)} />
      ) : isPending ? (
        <div className="h-48 animate-pulse rounded-3xl bg-borda/60" />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-borda bg-white">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-fundo/60">
              <tr className="text-left text-[11px] tracking-wider text-slate-400 uppercase">
                <th className="px-5 py-3.5 font-semibold">Usuário</th>
                <th className="px-5 py-3.5 font-semibold">Papel</th>
                <th className="px-5 py-3.5 font-semibold">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borda">
              {usuarios.map((u) => (
                <tr key={u.id} className="transition hover:bg-fundo/50">
                  <td className="px-5 py-3">
                    <Link to={String(u.id)} className="flex items-center gap-3 hover:underline">
                      <Avatar nome={u.nome} seed={u.id} tamanho="sm" />
                      <div>
                        <p className="font-semibold">
                          {u.nome} {u.id === eu.id && <span className="font-normal text-slate-400">(você)</span>}
                        </p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <Etiqueta tom={u.papel === 'ADMIN' ? 'lavanda' : 'ceu'}>{PAPEL[u.papel].rotulo}</Etiqueta>
                  </td>
                  <td className="px-5 py-3">
                    {u.ativo ? (
                      <Etiqueta tom="menta">Ativo</Etiqueta>
                    ) : (
                      <span className="rounded-full border border-borda px-2.5 py-0.5 text-xs font-medium text-slate-400">
                        Desativado
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Outlet />
    </div>
  )
}

/** Rotas /usuarios/novo e /usuarios/:id (editar). */
export function FormUsuario() {
  const { id } = useParams()
  const editando = id !== undefined
  const navigate = useNavigate()
  const fechar = () => navigate('/usuarios')
  const { data: usuarios, error } = useQuery(consultas.usuarios())
  const alvo = editando ? usuarios?.find((u) => u.id === Number(id)) : undefined

  if (editando && !alvo) {
    const erro = error ? mensagemDe(error) : usuarios ? `Usuário ${id} não encontrado` : undefined
    return <GavetaEstado tom="lavanda" erro={erro} onFechar={fechar} />
  }
  return (
    <Gaveta
      tom="lavanda"
      icone={
        alvo ? (
          <Avatar nome={alvo.nome} seed={alvo.id} tamanho="lg" className="bg-white/70!" />
        ) : (
          <IconeGaveta>
            <Icone nome="cadeado" className="size-7" />
          </IconeGaveta>
        )
      }
      titulo={alvo ? alvo.nome : 'Novo usuário'}
      subtitulo={alvo ? alvo.email : 'Campos com * são obrigatórios'}
      onFechar={fechar}
    >
      <Campos inicial={alvo} onConcluir={fechar} />
    </Gaveta>
  )
}

function Campos({ inicial, onConcluir }: { inicial?: Usuario; onConcluir: () => void }) {
  const qc = useQueryClient()
  const avisar = useAviso()
  const { usuario: eu } = useSessao()
  const ehVoce = inicial?.id === eu?.id
  const [f, setF] = useState({
    email: inicial?.email ?? '',
    nome: inicial?.nome ?? '',
    papel: (inicial?.papel ?? 'EDITOR') as PapelUsuario,
    senha: '',
    ativo: inicial?.ativo ?? true,
  })
  const [erros, setErros] = useState<Record<string, string>>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const mudar = (campo: 'email' | 'nome' | 'papel' | 'senha') => (valor: string) => setF({ ...f, [campo]: valor })

  async function salvar() {
    const e: Record<string, string> = {}
    if (!inicial && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'E-mail inválido'
    if (f.nome.trim().length < 2) e.nome = 'Mínimo de 2 caracteres'
    if ((!inicial || f.senha) && f.senha.length < 8) e.senha = 'Mínimo de 8 caracteres'
    setErros(e)
    setErroGeral(null)
    if (Object.keys(e).length) return

    setEnviando(true)
    try {
      if (inicial) {
        await api.usuarios.editar(inicial.id, {
          nome: f.nome.trim(),
          papel: f.papel,
          ativo: f.ativo,
          ...(f.senha ? { senha: f.senha } : {}),
        })
      } else {
        await api.usuarios.criar({ email: f.email.trim(), nome: f.nome.trim(), senha: f.senha, papel: f.papel })
      }
      await qc.invalidateQueries({ queryKey: ['usuarios'] })
      await qc.invalidateQueries({ queryKey: ['auth'] }) // se mudou o próprio nome/papel
      avisar({ tipo: 'ok', texto: inicial ? `${f.nome} atualizado(a)` : `${f.nome} cadastrado(a)` })
      onConcluir()
    } catch (err) {
      if (err instanceof ApiError) setErros(err.campos)
      setErroGeral(mensagemDe(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <Formulario
        onSubmit={() => void salvar()}
        onCancelar={onConcluir}
        enviando={enviando}
        erroGeral={erroGeral}
        editando={!!inicial}
      >
        <Campo rotulo="E-mail" obrigatorio erro={erros.email} dica={inicial ? 'O e-mail não pode ser alterado' : 'Usado para entrar'}>
          <Texto autoFocus={!inicial} type="email" valor={f.email} onChange={mudar('email')} erro={erros.email} disabled={!!inicial} />
        </Campo>
        <Campo rotulo="Nome" obrigatorio erro={erros.nome}>
          <Texto autoFocus={!!inicial} valor={f.nome} onChange={mudar('nome')} erro={erros.nome} />
        </Campo>
        <Campo rotulo="Papel" obrigatorio erro={erros.papel} dica={PAPEL[f.papel].descricao}>
          <Selecao
            valor={f.papel}
            onChange={(v) => setF({ ...f, papel: v })}
            opcoes={PAPEIS.map((p) => ({ valor: p, rotulo: PAPEL[p].rotulo }))}
          />
        </Campo>
        <Campo
          rotulo={inicial ? 'Nova senha' : 'Senha'}
          obrigatorio={!inicial}
          erro={erros.senha}
          dica={inicial ? 'Deixe vazio para manter a senha atual' : 'Mínimo de 8 caracteres'}
        >
          <Texto type="password" valor={f.senha} onChange={mudar('senha')} erro={erros.senha} />
        </Campo>
        {inicial && (
          <label className="flex items-start gap-3 rounded-2xl bg-fundo p-3 text-sm">
            <input
              type="checkbox"
              checked={f.ativo}
              disabled={ehVoce}
              onChange={(e) => setF({ ...f, ativo: e.target.checked })}
              className="mt-0.5 size-4 accent-[#2a2b33]"
            />
            <span>
              <span className="font-semibold">Ativo</span>
              <span className="block text-xs text-slate-500">
                {ehVoce ? 'Você não pode desativar a própria conta.' : 'Desativado, não consegue entrar (o acesso cai na hora).'}
              </span>
            </span>
          </label>
        )}
      </Formulario>

      {inicial && !ehVoce && (
        <div className="border-t border-borda pt-5">
          <button
            type="button"
            onClick={() => setExcluindo(true)}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-rosa-forte transition hover:bg-rosa"
          >
            <Icone nome="lixeira" /> Excluir usuário
          </button>
        </div>
      )}
      {excluindo && inicial && (
        <Confirmar
          titulo={`Excluir ${inicial.nome}?`}
          descricao="A pessoa perde o acesso. Para só bloquear temporariamente, prefira desativar."
          excluir={() => api.usuarios.remover(inicial.id)}
          sucesso={`${inicial.nome} foi excluído(a)`}
          onFechar={() => setExcluindo(false)}
          aoExcluir={onConcluir}
        />
      )}
    </>
  )
}
