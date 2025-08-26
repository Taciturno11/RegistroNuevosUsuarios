import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

// Obtener la URL del backend desde .env
const backendURL = "http://10.182.18.70:3001";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5174,
    host: true,
    proxy: {
      "/api": {
        target: `${backendURL}`, // usa la variable de entorno
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
