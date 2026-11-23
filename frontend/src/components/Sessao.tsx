import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { api, entrar, mensagemDe, sessao } from '../api'
import { SessaoContexto, useAviso, useSessao } from '../hooks'
import { useDialogo } from './dialogo'
import { Icone } from './Icone'

/** Mantém o usuário logado (a partir do token guardado) e oferece entrar/sair ao resto do app. */
export function SessaoProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const avisar = useAviso()
  const token = useSyncExternalStore(sessao.assinar, sessao.token)
  const [loginAberto, setLoginAberto] = useState(false)
  const { data: usuario } = useQuery({
    queryKey: ['auth', 'eu', token],
    queryFn: api.eu,
    enabled: !!token,
    staleTime: 5 * 60_000,
  })

  const sair = useCallback(() => {
    sessao.definir(null)
    qc.removeQueries({ queryKey: ['auth'] })
    avisar({ tipo: 'ok', texto: 'Você saiu. O painel está em modo leitura.' })
  }, [qc, avisar])

  const valor = useMemo(
    () => ({
      usuario: token ? (usuario ?? null) : null,
      podeEditar: !!token && !!usuario,
      abrirLogin: () => setLoginAberto(true),
      sair,
    }),
    [token, usuario, sair],
  )

  return (
    <SessaoContexto.Provider value={valor}>
      {children}
      {loginAberto && <DialogoLogin onFechar={() => setLoginAberto(false)} />}
    </SessaoContexto.Provider>
  )
}

/** Botão do cabeçalho: "Entrar" ou o nome do usuário com "Sair". */
export function BotaoSessao() {
  const { usuario, abrirLogin, sair } = useSessao()
  const [trocandoSenha, setTrocandoSenha] = useState(false)
  const classe =
    'inline-flex items-center gap-2 rounded-full border border-borda bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-fundo'

  if (!usuario) {
    return (
      <button type="button" onClick={abrirLogin} className={classe}>
        <Icone nome="cadeado" className="size-4" />
        Entrar
      </button>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-right text-xs leading-tight sm:block">
        <span className="block font-semibold text-tinta">{usuario.nome}</span>
        <span className="text-slate-400">{usuario.papel === 'ADMIN' ? 'Administrador' : 'Editor'}</span>
      </span>
      {usuario.papel === 'ADMIN' && (
        <Link to="/usuarios" className={classe} title="Gerenciar usuários">
          <Icone nome="pessoas" className="size-4" />
          <span className="hidden md:inline">Usuários</span>
        </Link>
      )}
      <button type="button" onClick={() => setTrocandoSenha(true)} className={classe} title="Trocar minha senha">
        <Icone nome="cadeado" className="size-4" />
        <span className="hidden md:inline">Senha</span>
      </button>
      <button type="button" onClick={sair} className={classe} title={`Sair (${usuario.email})`}>
        <Icone nome="sair" className="size-4" />
        <span className="hidden sm:inline">Sair</span>
      </button>
      {trocandoSenha && <DialogoSenha onFechar={() => setTrocandoSenha(false)} />}
    </div>
  )
}

function DialogoSenha({ onFechar }: { onFechar: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useDialogo(ref, onFechar)
  const avisar = useAviso()
  const [f, setF] = useState({ atual: '', nova: '', repetida: '' })
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!f.atual) return setErro('Informe a senha atual')
    if (f.nova.length < 8) return setErro('A nova senha precisa de pelo menos 8 caracteres')
    if (f.nova !== f.repetida) return setErro('As senhas novas não conferem')
    setEnviando(true)
    setErro(null)
    try {
      await api.trocarMinhaSenha({ senha_atual: f.atual, nova_senha: f.nova })
      avisar({ tipo: 'ok', texto: 'Senha alterada' })
      onFechar()
    } catch (err) {
      setErro(mensagemDe(err))
    } finally {
      setEnviando(false)
    }
  }

  const campo =
    'mt-1.5 w-full rounded-xl border border-borda bg-white px-3 py-2.5 text-sm outline-none transition focus:border-ceu-medio focus:ring-4 focus:ring-ceu'
  const entrada = (chave: keyof typeof f, rotulo: string, autoComplete: string, autoFocus = false) => (
    <label className="block text-sm font-semibold">
      {rotulo}
      <input
        autoFocus={autoFocus}
        type="password"
        autoComplete={autoComplete}
        value={f[chave]}
        onChange={(e) => setF({ ...f, [chave]: e.target.value })}
        className={campo}
      />
    </label>
  )

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-tinta/40" onClick={onFechar} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="senha-titulo"
        className="relative w-full max-w-sm animate-rise rounded-3xl bg-white p-6 shadow-2xl"
      >
        <h2 id="senha-titulo" className="text-lg font-bold">
          Trocar minha senha
        </h2>
        <form onSubmit={enviar} noValidate className="mt-5 space-y-3">
          {entrada('atual', 'Senha atual', 'current-password', true)}
          {entrada('nova', 'Nova senha', 'new-password')}
          {entrada('repetida', 'Repita a nova senha', 'new-password')}
          {erro && (
            <p role="alert" className="rounded-xl bg-rosa px-3 py-2 text-sm text-rosa-forte">
              {erro}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-full border border-borda px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-fundo"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-full bg-tinta px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-tinta/85 disabled:opacity-60"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DialogoLogin({ onFechar }: { onFechar: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useDialogo(ref, onFechar)
  const qc = useQueryClient()
  const avisar = useAviso()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !senha) return setErro('Informe e-mail e senha')
    setEnviando(true)
    setErro(null)
    try {
      const { access_token } = await entrar(email.trim(), senha)
      sessao.definir(access_token)
      const usuario = await qc.fetchQuery({ queryKey: ['auth', 'eu', access_token], queryFn: api.eu })
      avisar({ tipo: 'ok', texto: `Olá, ${usuario.nome}! Agora você pode editar.` })
      onFechar()
    } catch (err) {
      setErro(mensagemDe(err))
    } finally {
      setEnviando(false)
    }
  }

  const campo =
    'mt-1.5 w-full rounded-xl border border-borda bg-white px-3 py-2.5 text-sm outline-none transition focus:border-ceu-medio focus:ring-4 focus:ring-ceu'
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-tinta/40" onClick={onFechar} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-titulo"
        className="relative w-full max-w-sm animate-rise rounded-3xl bg-white p-6 shadow-2xl"
      >
        <span className="grid size-11 place-items-center rounded-2xl bg-menta text-menta-forte">
          <Icone nome="cadeado" className="size-5" />
        </span>
        <h2 id="login-titulo" className="mt-4 text-lg font-bold">
          Entrar para editar
        </h2>
        <p className="mt-1 text-sm text-slate-500">Sem login, o painel funciona só para leitura.</p>
        <form onSubmit={enviar} noValidate className="mt-5 space-y-3">
          <label className="block text-sm font-semibold">
            E-mail
            <input
              autoFocus
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={campo}
            />
          </label>
          <label className="block text-sm font-semibold">
            Senha
            <input
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={campo}
            />
          </label>
          {erro && (
            <p role="alert" className="rounded-xl bg-rosa px-3 py-2 text-sm text-rosa-forte">
              {erro}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-full border border-borda px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-fundo"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="inline-flex items-center gap-2 rounded-full bg-tinta px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-tinta/85 disabled:opacity-60"
            >
              {enviando && <Icone nome="atualizar" className="size-4 animate-spin" />}
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
