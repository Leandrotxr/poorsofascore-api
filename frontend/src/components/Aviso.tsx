import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AvisoContexto, type Mensagem } from '../hooks'
import { Icone } from './Icone'

/** Guarda o aviso atual e o mostra no rodapé. Qualquer componente avisa com useAviso(). */
export function AvisoProvider({ children }: { children: ReactNode }) {
  const [mensagem, setMensagem] = useState<Mensagem | null>(null)
  const fechar = useCallback(() => setMensagem(null), [])

  return (
    <AvisoContexto.Provider value={setMensagem}>
      {children}
      {mensagem && <Aviso mensagem={mensagem} onFechar={fechar} />}
    </AvisoContexto.Provider>
  )
}

function Aviso({ mensagem, onFechar }: { mensagem: Mensagem; onFechar: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onFechar, mensagem.tipo === 'erro' ? 6000 : 3500)
    return () => window.clearTimeout(t)
  }, [mensagem, onFechar])

  const erro = mensagem.tipo === 'erro'
  return (
    <div
      role={erro ? 'alert' : 'status'}
      className={`fixed bottom-5 left-1/2 z-[80] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-rise items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg shadow-black/10 ${
        erro ? 'bg-rosa text-rosa-forte' : 'bg-menta text-menta-forte'
      }`}
    >
      <Icone nome={erro ? 'alerta' : 'check'} className="size-5 shrink-0" />
      <span className="flex-1">{mensagem.texto}</span>
      <button type="button" onClick={onFechar} aria-label="Fechar aviso" className="opacity-70 hover:opacity-100">
        <Icone nome="fechar" className="size-4" />
      </button>
    </div>
  )
}
