import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // A API só aceita chamadas desta origem (CORS_ORIGINS no .env da API),
  // então a porta é fixa: se a 5173 estiver ocupada, o Vite avisa em vez de trocar.
  server: { port: 5173, strictPort: true },
})
