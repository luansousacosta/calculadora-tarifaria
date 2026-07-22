import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serve o site em https://<usuario>.github.io/calculadora-tarifaria/
// então o base precisa ser o nome do repositório.
export default defineConfig({
  base: '/calculadora-tarifaria/',
  plugins: [react()],
})
