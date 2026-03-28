import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/npi-proxy': {
        target: 'https://npiregistry.cms.hhs.gov',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/npi-proxy/, ''),
      },
    },
  },
})
