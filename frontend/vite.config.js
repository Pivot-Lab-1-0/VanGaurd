import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Ensures Leaflet's internal requires resolve correctly
      'leaflet': 'leaflet',
    },
  },
  optimizeDeps: {
    // Force Vite to pre-bundle Leaflet so its assets are handled right
    include: ['leaflet', 'react-leaflet'],
  },
  server: {
    port: 5173,
    open: true,
  },
})
