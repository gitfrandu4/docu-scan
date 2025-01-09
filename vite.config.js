import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    base: '/docu-scan/', // Asegúrate de que coincida con la ruta de tu servidor
    chunkSizeWarningLimit: 4000, // handle warning on vendor.js bundle size
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('@tensorflow/tfjs')) {
            // Split TensorFlow.js into core and backend chunks
            if (id.includes('backend')) {
              return 'tensorflow-backend'
            }
            return 'tensorflow-core'
          }
          if (id.includes('react')) {
            return 'vendor-react'
          }
          if (id.includes('@mui') || id.includes('@emotion')) {
            return 'vendor-mui'
          }
          // Add opencv.js to vendor chunks when imported
          if (id.includes('opencv')) {
            return 'vendor-opencv'
          }
        }
      }
    }
  },
  server: {
    host: true, // Esto permite que el servidor sea accesible en la red local
    port: 3000 // (Opcional) Cambia el puerto si lo deseas
  },
  base: '/docu-scan/'
})
