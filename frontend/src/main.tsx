import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { ApiError } from './api'
import { AvisoProvider } from './components/Aviso'
import { SessaoProvider } from './components/Sessao'
import './index.css'
import { router } from './rotas'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // dados valem 30 s; depois de alterar algo, invalidamos na hora (useAcao)
      // Erros 4xx (ex.: 404) não melhoram tentando de novo; falha de rede/5xx tenta mais uma vez.
      retry: (tentativas, erro) => !(erro instanceof ApiError && erro.status >= 400 && erro.status < 500) && tentativas < 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AvisoProvider>
        <SessaoProvider>
          <RouterProvider router={router} />
        </SessaoProvider>
      </AvisoProvider>
    </QueryClientProvider>
  </StrictMode>,
)
