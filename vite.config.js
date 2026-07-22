import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Domínio próprio (calculadora.sousacosta.com.br) serve na raiz.
// base './' gera caminhos relativos — funciona tanto no domínio próprio
// quanto no subcaminho github.io/calculadora-tarifaria/ durante a propagação.
export default defineConfig({
  base: './',
  plugins: [react()],
})
