import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:3000',
      '/products': 'http://localhost:3000',
      '/users': 'http://localhost:3000',
      '/admin': 'http://localhost:3000',
      '/api': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      '/test-register': 'http://localhost:3000'
    }
  }
})
