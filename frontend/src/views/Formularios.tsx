import { useState, type FormEvent, type ReactNode } from 'react'
import { api, ApiError } from '../api'
import { ABRANGENCIA, FORMATO, FUNCAO, normalizar, POS, type Tom } from '../estilo'
import {
  ABRANGENCIAS,
  FORMATOS,
  FUNCOES,
  POSICOES,
  type Abrangencia,
  type Equipe,
  type FormatoCampeonato,
  type FuncaoArbitro,
  type Federacao,
  type Posicao,
} from '../types'
import { Gaveta, Icone, type Mensagem, type NomeIcone } from '../ui'
import { digitos, LIMITES, mascaraCnpj, mascaraCpf, validarCnpj, validarCpf } from '../validacao'

export type Entidade = 'federacoes' | 'campeonatos' | 'equipes' | 'jogadores' | 'tecnicos' | 'arbitros'

/** Rótulo do botão "Novo…" de cada aba. */
export const NOVO: Record<Entidade, string> = {
  federacoes: 'Nova federação',
  campeonatos: 'Novo campeonato',
  equipes: 'Nova equipe',
  jogadores: 'Novo jogador',
  tecnicos: 'Novo técnico',
  arbitros: 'Novo árbitro',
}

const VISUAL: Record<Entidade, { tom: Tom; icone: NomeIcone }> = {
  federacoes: { tom: 'agua', icone: 'globo' },
  campeonatos: { tom: 'menta', icone: 'trofeu' },
  equipes: { tom: 'pessego', icone: 'escudo' },
  jogadores: { tom: 'ceu', icone: 'pessoas' },
  tecnicos: { tom: 'lavanda', icone: 'prancheta' },
  arbitros: { tom: 'manteiga', icone: 'cartao' },
}

interface Contexto {
  federacoes: Federacao[]
  equipes: Equipe[]
  equipesSemTecnico: Equipe[]
}

export function FormularioCriacao({
  entidade,
  contexto,
  onFechar,
  onCriado,
}: {
  entidade: Entidade
  contexto: Contexto
  onFechar: () => void
  onCriado: (m: Mensagem) => void
}) {
  const v = VISUAL[entidade]
  const props = { contexto, onFechar, onCriado }
  return (
    <Gaveta
      tom={v.tom}
      icone={
        <span className="grid size-14 place-items-center rounded-2xl bg-white/70">
          <Icone nome={v.icone} className="size-7" />
        </span>
      }
      titulo={NOVO[entidade]}
      subtitulo="Campos com * são obrigatórios"
      onFechar={onFechar}
    >
      {entidade === 'federacoes' && <FormFederacao {...props} />}
      {entidade === 'campeonatos' && <FormCampeonato {...props} />}
      {entidade === 'equipes' && <FormEquipe {...props} />}
      {entidade === 'jogadores' && <FormPessoa tipo="jogador" {...props} />}
      {entidade === 'tecnicos' && <FormPessoa tipo="tecnico" {...props} />}
      {entidade === 'arbitros' && <FormPessoa tipo="arbitro" {...props} />}
    </Gaveta>
  )
}

interface PropsForm {
  contexto: Contexto
  onFechar: () => void
  onCriado: (m: Mensagem) => void
}

// ---------- Base comum ----------

type Erros = Record<string, string>

/** Cuida do envio: trava o botão, mostra os erros da API por campo e avisa o resultado. */
function useEnvio(onCriado: (m: Mensagem) => void) {
  const [enviando, setEnviando] = useState(false)
  const [erros, setErros] = useState<Erros>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)

  async function enviar(validar: () => Erros, acao: () => Promise<Mensagem>) {
    const locais = validar()
    setErros(locais)
    setErroGeral(null)
    if (Object.keys(locais).length > 0) return

    setEnviando(true)
    try {
      onCriado(await acao())
    } catch (e) {
      if (e instanceof ApiError) {
        setErros(e.campos)
        setErroGeral(e.message)
      } else {
        setErroGeral(String(e))
      }
    } finally {
      setEnviando(false)
    }
  }

  return { enviando, erros, erroGeral, enviar }
}

/**
 * Depois de criar, faz o vínculo opcional (contratar, filiar...). Se só o vínculo falhar,
 * o registro já existe: avisa isso em vez de fingir que nada aconteceu.
 */
async function vincularDepois(criado: string, vinculo: (() => Promise<unknown>) | null, feito: string): Promise<Mensagem> {
  if (!vinculo) return { tipo: 'ok', texto: `${criado} cadastrado(a)` }
  try {
    await vinculo()
    return { tipo: 'ok', texto: `${criado} cadastrado(a) e ${feito}` }
  } catch (e) {
    return { tipo: 'erro', texto: `${criado} foi cadastrado(a), mas não deu para concluir o vínculo: ${(e as Error).message}` }
  }
}

const exigir = (valor: string, campo: string, erros: Erros) => {
  if (!valor.trim()) erros[campo] = 'Campo obrigatório'
}

function exigirFaixa(valor: string, campo: string, faixa: { min: number; max: number }, erros: Erros) {
  if (!valor.trim()) return void (erros[campo] = 'Campo obrigatório')
  const n = Number(valor)
  if (!Number.isInteger(n)) erros[campo] = 'Informe um número inteiro'
  else if (n < faixa.min || n > faixa.max) erros[campo] = `Entre ${faixa.min} e ${faixa.max}`
}

function Campo({
  rotulo,
  erro,
  dica,
  obrigatorio,
  children,
}: {
  rotulo: string
  erro?: string
  dica?: string
  obrigatorio?: boolean
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">
        {rotulo}
        {obrigatorio && <span className="text-rosa-forte"> *</span>}
      </span>
      {children}
      {erro ? (
        <span className="mt-1 block text-xs font-medium text-rosa-forte">{erro}</span>
      ) : (
        dica && <span className="mt-1 block text-xs text-slate-400">{dica}</span>
      )}
    </label>
  )
}

const entrada = (erro?: string) =>
  `mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-4 ${
    erro ? 'border-rosa-medio focus:ring-rosa' : 'border-borda focus:border-ceu-medio focus:ring-ceu'
  }`

function Texto({
  valor,
  onChange,
  erro,
  ...resto
}: {
  valor: string
  onChange: (v: string) => void
  erro?: string
  placeholder?: string
  inputMode?: 'numeric' | 'text'
  type?: string
  autoFocus?: boolean
}) {
  return (
    <input
      {...resto}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={!!erro}
      className={entrada(erro)}
    />
  )
}

function Selecao<T extends string>({
  valor,
  onChange,
  opcoes,
  erro,
}: {
  valor: T
  onChange: (v: T) => void
  opcoes: { valor: T; rotulo: string }[]
  erro?: string
}) {
  return (
    <select value={valor} onChange={(e) => onChange(e.target.value as T)} aria-invalid={!!erro} className={entrada(erro)}>
      {opcoes.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.rotulo}
        </option>
      ))}
    </select>
  )
}

function Rodape({ enviando, erroGeral, onFechar }: { enviando: boolean; erroGeral: string | null; onFechar: () => void }) {
  return (
    <div className="space-y-3 border-t border-borda pt-5">
      {erroGeral && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-rosa px-3 py-2.5 text-sm text-rosa-forte">
          <Icone nome="alerta" className="mt-0.5 size-4 shrink-0" />
          {erroGeral}
        </p>
      )}
      <div className="flex justify-end gap-2">
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
          {enviando ? <Icone nome="atualizar" className="size-4 animate-spin" /> : <Icone nome="check" className="size-4" />}
          Cadastrar
        </button>
      </div>
    </div>
  )
}

function Formulario({ onSubmit, children }: { onSubmit: () => void; children: ReactNode }) {
  return (
    <form
      noValidate
      onSubmit={(e: FormEvent) => {
        e.preventDefault()
        onSubmit()
      }}
      className="space-y-4"
    >
      {children}
    </form>
  )
}

const opcoesDe = <T extends string>(lista: T[], mapa: Record<T, { rotulo: string }>) =>
  lista.map((v) => ({ valor: v, rotulo: mapa[v].rotulo }))

const ANO_ATUAL = new Date().getFullYear()

// ---------- Federação ----------

function FormFederacao({ onFechar, onCriado }: PropsForm) {
  const [f, setF] = useState({ nome: '', sigla: '', abrangencia: 'NACIONAL' as Abrangencia, fundacao: '', sede: '', cnpj: '' })
  const mudar = (campo: keyof typeof f) => (valor: string) => setF({ ...f, [campo]: valor })
  const { enviando, erros, erroGeral, enviar } = useEnvio(onCriado)

  const submeter = () =>
    enviar(
      () => {
        const e: Erros = {}
        exigir(f.nome, 'nome', e)
        exigir(f.sede, 'sede', e)
        if (!/^[A-Za-z0-9]{2,20}$/.test(f.sigla)) e.sigla = 'De 2 a 20 letras ou números, sem espaços'
        exigirFaixa(f.fundacao, 'fundacao', LIMITES.fundacao, e)
        if (f.cnpj && !validarCnpj(f.cnpj)) e.cnpj = 'CNPJ inválido'
        return e
      },
      async () => {
        const nova = await api.criarFederacao({
          nome: f.nome.trim(),
          sigla: f.sigla,
          abrangencia: f.abrangencia,
          fundacao: Number(f.fundacao),
          sede: f.sede.trim(),
          cnpj: f.cnpj ? digitos(f.cnpj) : null,
        })
        return { tipo: 'ok', texto: `Federação ${nova.sigla} cadastrada` }
      },
    )

  return (
    <Formulario onSubmit={submeter}>
      <Campo rotulo="Nome" obrigatorio erro={erros.nome}>
        <Texto autoFocus valor={f.nome} onChange={mudar('nome')} erro={erros.nome} placeholder="Confederação Brasileira de Futebol" />
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
          <Texto valor={f.fundacao} onChange={mudar('fundacao')} erro={erros.fundacao} inputMode="numeric" placeholder="1914" />
        </Campo>
        <Campo rotulo="Sede" obrigatorio erro={erros.sede}>
          <Texto valor={f.sede} onChange={mudar('sede')} erro={erros.sede} placeholder="Rio de Janeiro" />
        </Campo>
      </div>
      <Campo rotulo="CNPJ" erro={erros.cnpj} dica="Opcional: só entidades brasileiras têm CNPJ">
        <Texto valor={f.cnpj} onChange={(v) => mudar('cnpj')(mascaraCnpj(v))} erro={erros.cnpj} inputMode="numeric" placeholder="00.000.000/0000-00" />
      </Campo>
      <Rodape enviando={enviando} erroGeral={erroGeral} onFechar={onFechar} />
    </Formulario>
  )
}

// ---------- Equipe ----------

function FormEquipe({ contexto, onFechar, onCriado }: PropsForm) {
  const [f, setF] = useState({ nome: '', cnpj: '', fundacao: '', sede: '', federacao: '' })
  const mudar = (campo: keyof typeof f) => (valor: string) => setF({ ...f, [campo]: valor })
  const { enviando, erros, erroGeral, enviar } = useEnvio(onCriado)

  const submeter = () =>
    enviar(
      () => {
        const e: Erros = {}
        exigir(f.nome, 'nome', e)
        exigir(f.sede, 'sede', e)
        exigirFaixa(f.fundacao, 'fundacao', LIMITES.fundacao, e)
        if (!validarCnpj(f.cnpj)) e.cnpj = f.cnpj ? 'CNPJ inválido' : 'Campo obrigatório'
        return e
      },
      async () => {
        const nova = await api.criarEquipe({
          nome: f.nome.trim(),
          cnpj: digitos(f.cnpj),
          fundacao: Number(f.fundacao),
          sede: f.sede.trim(),
        })
        const fed = contexto.federacoes.find((x) => x.id === Number(f.federacao))
        return vincularDepois(nova.nome, fed ? () => api.filiarEquipe(fed.id, nova.id) : null, `filiado(a) à ${fed?.sigla}`)
      },
    )

  return (
    <Formulario onSubmit={submeter}>
      <Campo rotulo="Nome" obrigatorio erro={erros.nome}>
        <Texto autoFocus valor={f.nome} onChange={mudar('nome')} erro={erros.nome} placeholder="Flamengo" />
      </Campo>
      <Campo rotulo="CNPJ" obrigatorio erro={erros.cnpj}>
        <Texto valor={f.cnpj} onChange={(v) => mudar('cnpj')(mascaraCnpj(v))} erro={erros.cnpj} inputMode="numeric" placeholder="00.000.000/0000-00" />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Fundação" obrigatorio erro={erros.fundacao}>
          <Texto valor={f.fundacao} onChange={mudar('fundacao')} erro={erros.fundacao} inputMode="numeric" placeholder="1895" />
        </Campo>
        <Campo rotulo="Sede" obrigatorio erro={erros.sede}>
          <Texto valor={f.sede} onChange={mudar('sede')} erro={erros.sede} placeholder="Rio de Janeiro" />
        </Campo>
      </div>
      <Campo rotulo="Federação" dica="Opcional: a equipe já sai filiada">
        <Selecao
          valor={f.federacao}
          onChange={mudar('federacao')}
          opcoes={[{ valor: '', rotulo: 'Nenhuma por enquanto' }, ...contexto.federacoes.map((x) => ({ valor: String(x.id), rotulo: `${x.sigla} · ${x.nome}` }))]}
        />
      </Campo>
      <Rodape enviando={enviando} erroGeral={erroGeral} onFechar={onFechar} />
    </Formulario>
  )
}

// ---------- Jogador, Técnico e Árbitro (mesma base: pessoa física) ----------

const PESSOA = {
  jogador: { rotulo: 'Jogador', idade: LIMITES.idadeJogador, vinculo: 'Equipe', nenhum: 'Agente livre' },
  tecnico: { rotulo: 'Técnico', idade: LIMITES.idadeTecnico, vinculo: 'Equipe', nenhum: 'Sem equipe por enquanto' },
  arbitro: { rotulo: 'Árbitro', idade: LIMITES.idadeArbitro, vinculo: 'Federação', nenhum: 'Sem federação por enquanto' },
}

function FormPessoa({ tipo, contexto, onFechar, onCriado }: PropsForm & { tipo: keyof typeof PESSOA }) {
  const cfg = PESSOA[tipo]
  const [f, setF] = useState({
    nome: '',
    cpf: '',
    idade: '',
    nacionalidade: '',
    posicao: 'MEIA' as Posicao,
    funcao: 'CENTRAL' as FuncaoArbitro,
    vinculo: '',
  })
  const mudar = (campo: keyof typeof f) => (valor: string) => setF({ ...f, [campo]: valor })
  const { enviando, erros, erroGeral, enviar } = useEnvio(onCriado)

  // Técnico só pode ir para equipe sem técnico (a API trocaria o atual, o que surpreenderia aqui).
  const vinculos =
    tipo === 'arbitro'
      ? contexto.federacoes.map((x) => ({ valor: String(x.id), rotulo: `${x.sigla} · ${x.nome}` }))
      : (tipo === 'tecnico' ? contexto.equipesSemTecnico : contexto.equipes).map((x) => ({ valor: String(x.id), rotulo: x.nome }))

  const submeter = () =>
    enviar(
      () => {
        const e: Erros = {}
        exigir(f.nome, 'nome', e)
        exigir(f.nacionalidade, 'nacionalidade', e)
        exigirFaixa(f.idade, 'idade', cfg.idade, e)
        if (!validarCpf(f.cpf)) e.cpf = f.cpf ? 'CPF inválido' : 'Campo obrigatório'
        return e
      },
      async () => {
        const base = { nome: f.nome.trim(), cpf: digitos(f.cpf), idade: Number(f.idade), nacionalidade: f.nacionalidade.trim() }
        const alvo = Number(f.vinculo) || null

        if (tipo === 'jogador') {
          const j = await api.criarJogador({ ...base, posicao: f.posicao })
          const eq = contexto.equipes.find((x) => x.id === alvo)
          return vincularDepois(j.nome, eq ? () => api.contratarJogador(eq.id, j.id) : null, `contratado(a) pelo ${eq?.nome}`)
        }
        if (tipo === 'tecnico') {
          const t = await api.criarTecnico(base)
          const eq = contexto.equipes.find((x) => x.id === alvo)
          return vincularDepois(t.nome, eq ? () => api.definirTecnico(eq.id, t.id) : null, `agora comanda o ${eq?.nome}`)
        }
        const a = await api.criarArbitro({ ...base, funcao: f.funcao })
        const fed = contexto.federacoes.find((x) => x.id === alvo)
        return vincularDepois(a.nome, fed ? () => api.vincularArbitro(fed.id, a.id) : null, `vinculado(a) à ${fed?.sigla}`)
      },
    )

  return (
    <Formulario onSubmit={submeter}>
      <Campo rotulo="Nome" obrigatorio erro={erros.nome}>
        <Texto autoFocus valor={f.nome} onChange={mudar('nome')} erro={erros.nome} />
      </Campo>
      <Campo rotulo="CPF" obrigatorio erro={erros.cpf} dica="Fica guardado completo, mas a API só exibe os 2 últimos dígitos">
        <Texto valor={f.cpf} onChange={(v) => mudar('cpf')(mascaraCpf(v))} erro={erros.cpf} inputMode="numeric" placeholder="000.000.000-00" />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Idade" obrigatorio erro={erros.idade} dica={`Entre ${cfg.idade.min} e ${cfg.idade.max}`}>
          <Texto valor={f.idade} onChange={mudar('idade')} erro={erros.idade} inputMode="numeric" />
        </Campo>
        <Campo rotulo="Nacionalidade" obrigatorio erro={erros.nacionalidade}>
          <Texto valor={f.nacionalidade} onChange={mudar('nacionalidade')} erro={erros.nacionalidade} placeholder="Brasileiro" />
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
      <Campo
        rotulo={cfg.vinculo}
        dica={tipo === 'tecnico' ? 'Opcional. Só aparecem equipes sem técnico' : 'Opcional: já sai vinculado'}
      >
        <Selecao valor={f.vinculo} onChange={mudar('vinculo')} opcoes={[{ valor: '', rotulo: cfg.nenhum }, ...vinculos]} />
      </Campo>
      <Rodape enviando={enviando} erroGeral={erroGeral} onFechar={onFechar} />
    </Formulario>
  )
}

// ---------- Campeonato ----------

function FormCampeonato({ contexto, onFechar, onCriado }: PropsForm) {
  const [f, setF] = useState({
    nome: '',
    temporada: String(ANO_ATUAL),
    formato: 'PONTOS_CORRIDOS' as FormatoCampeonato,
    data_inicio: '',
    data_fim: '',
    federacao: contexto.federacoes[0] ? String(contexto.federacoes[0].id) : '',
  })
  const [equipes, setEquipes] = useState<Set<number>>(new Set())
  const [busca, setBusca] = useState('')
  const mudar = (campo: keyof typeof f) => (valor: string) => setF({ ...f, [campo]: valor })
  const { enviando, erros, erroGeral, enviar } = useEnvio(onCriado)

  if (contexto.federacoes.length === 0) {
    return (
      <p className="rounded-2xl bg-manteiga p-4 text-sm text-manteiga-forte">
        Todo campeonato precisa de uma federação organizadora. Cadastre uma federação primeiro, na aba Federações.
      </p>
    )
  }

  const alternar = (id: number) => {
    const novo = new Set(equipes)
    if (novo.has(id)) novo.delete(id)
    else novo.add(id)
    setEquipes(novo)
  }
  const q = normalizar(busca)
  const visiveis = contexto.equipes.filter((e) => !q || normalizar(e.nome).includes(q))

  const submeter = () =>
    enviar(
      () => {
        const e: Erros = {}
        exigir(f.nome, 'nome', e)
        exigirFaixa(f.temporada, 'temporada', LIMITES.temporada, e)
        if (f.data_inicio && f.data_fim && f.data_fim < f.data_inicio) e.data_fim = 'Não pode ser antes do início'
        if (!f.federacao) e.federacao_id = 'Campo obrigatório'
        return e
      },
      async () => {
        const c = await api.criarCampeonato({
          nome: f.nome.trim(),
          temporada: Number(f.temporada),
          formato: f.formato,
          data_inicio: f.data_inicio || null,
          data_fim: f.data_fim || null,
          federacao_id: Number(f.federacao),
        })
        const nome = `${c.nome} ${c.temporada}`
        if (equipes.size === 0) return { tipo: 'ok', texto: `${nome} cadastrado` }

        // Inscreve uma por uma; se alguma falhar, as outras continuam e o aviso conta quantas entraram.
        const resultados = await Promise.allSettled([...equipes].map((id) => api.inscreverEquipe(c.id, id)))
        const falhas = resultados.filter((r) => r.status === 'rejected').length
        return falhas === 0
          ? { tipo: 'ok', texto: `${nome} cadastrado com ${equipes.size} equipe(s)` }
          : { tipo: 'erro', texto: `${nome} foi cadastrado, mas ${falhas} de ${equipes.size} inscrições falharam` }
      },
    )

  return (
    <Formulario onSubmit={submeter}>
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
      <Campo rotulo="Federação organizadora" obrigatorio erro={erros.federacao_id}>
        <Selecao
          valor={f.federacao}
          onChange={mudar('federacao')}
          erro={erros.federacao_id}
          opcoes={contexto.federacoes.map((x) => ({ valor: String(x.id), rotulo: `${x.sigla} · ${x.nome}` }))}
        />
      </Campo>

      <fieldset>
        <legend className="text-sm font-semibold">
          Equipes participantes <span className="font-normal text-slate-400">· {equipes.size} selecionada(s)</span>
        </legend>
        {contexto.equipes.length === 0 ? (
          <p className="mt-1.5 text-sm text-slate-400">Nenhuma equipe cadastrada ainda. Dá para inscrever depois.</p>
        ) : (
          <div className="mt-1.5 rounded-xl border border-borda">
            {contexto.equipes.length > 6 && (
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar equipe…"
                className="w-full rounded-t-xl border-b border-borda px-3 py-2 text-sm outline-none"
              />
            )}
            <ul className="max-h-52 overflow-y-auto p-1">
              {visiveis.map((e) => (
                <li key={e.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-fundo">
                    <input
                      type="checkbox"
                      checked={equipes.has(e.id)}
                      onChange={() => alternar(e.id)}
                      className="size-4 accent-[#2a2b33]"
                    />
                    <span className="flex-1 font-medium">{e.nome}</span>
                    {e.federacao && <span className="text-xs text-slate-400">{e.federacao.sigla}</span>}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
      </fieldset>

      <Rodape enviando={enviando} erroGeral={erroGeral} onFechar={onFechar} />
    </Formulario>
  )
}
