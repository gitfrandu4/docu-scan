import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    base: '/docu-scan/', // Asegúrate de que coincida con la ruta de tu servidor
    chunkSizeWarningLimit: 2000, // handle warning on vendor.js bundle size
  },
  server: {
    host: true, // Esto permite que el servidor sea accesible en la red local
    port: 3000, // (Opcional) Cambia el puerto si lo deseas
  },
  base: "/docu-scan/",
});
