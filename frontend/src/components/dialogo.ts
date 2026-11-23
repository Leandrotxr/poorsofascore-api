import { useEffect, useRef, type RefObject } from 'react'

/** Diálogos abertos (o último é o de cima e é o único que reage ao teclado). */
const pilha: ((ev: KeyboardEvent) => void)[] = []

const FOCAVEIS ='a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Comportamento de diálogo acessível: foca o primeiro elemento ao abrir, mantém o Tab dentro dele,
 * fecha com Esc e devolve o foco para onde estava ao fechar.
 */
export function useDialogo(ref: RefObject<HTMLElement | null>, onFechar: () => void) {
  // Guardado em ref: o efeito roda só ao abrir/fechar, mesmo que o pai recrie a função a cada render.
  const fechar = useRef(onFechar)
  useEffect(() => {
    fechar.current = onFechar
  })

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null
    const el = ref.current
    const primeiro = el?.querySelector<HTMLElement>('[autofocus]') ?? el?.querySelector<HTMLElement>(FOCAVEIS)
    ;(primeiro ?? el)?.focus()

    const aoTeclar = (ev: KeyboardEvent) => {
      if (!el) return
      if (ev.key === 'Escape') {
        fechar.current()
      } else if (ev.key === 'Tab') {
        const itens = [...el.querySelectorAll<HTMLElement>(FOCAVEIS)]
        if (itens.length === 0) return
        const [ini, fim] = [itens[0], itens[itens.length - 1]]
        if (ev.shiftKey && document.activeElement === ini) {
          ev.preventDefault()
          fim.focus()
        } else if (!ev.shiftKey && document.activeElement === fim) {
          ev.preventDefault()
          ini.focus()
        }
      }
    }
    // Com uma gaveta e um "Confirmar" abertos, só o de cima reage ao teclado (Esc não fecha os dois).
    pilha.push(aoTeclar)
    const despachar = (ev: KeyboardEvent) => pilha[pilha.length - 1] === aoTeclar && aoTeclar(ev)
    window.addEventListener('keydown', despachar)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', despachar)
      pilha.splice(pilha.indexOf(aoTeclar), 1)
      document.body.style.overflow = overflow
      anterior?.focus?.()
    }
  }, [ref])
}
