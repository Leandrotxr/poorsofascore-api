// Guarda o token de acesso. Fica no localStorage para a sessão sobreviver ao F5.
// (Trade-off conhecido: um script injetado na página conseguiria ler o token. A defesa é não ter XSS:
// o React escapa todo texto por padrão e o app não usa dangerouslySetInnerHTML.)

const CHAVE = 'poorsofascore.token'
const ouvintes = new Set<() => void>()

function ler(): string | null {
  try {
    return localStorage.getItem(CHAVE)
  } catch {
    return null // modo privado / storage bloqueado: a sessão vale só enquanto a aba estiver aberta
  }
}

let token: string | null = ler()

export const sessao = {
  token: () => token,

  definir(novo: string | null) {
    token = novo
    try {
      if (novo) localStorage.setItem(CHAVE, novo)
      else localStorage.removeItem(CHAVE)
    } catch {
      // ignora: o token continua em memória
    }
    ouvintes.forEach((f) => f())
  },

  /** Para o React (useSyncExternalStore) re-renderizar quando o login muda. */
  assinar(f: () => void) {
    ouvintes.add(f)
    return () => ouvintes.delete(f)
  },
}
