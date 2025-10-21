// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: true, type: "module" },
      manifest: {
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  server: {
    host: true,        // 네트워크 접근 허용(동일 LAN 테스트용)
    port: 5173,        // 원하면 바꿔도 됨
    proxy: {
      "/api": {
        target: "http://localhost:8080", // 백엔드
        changeOrigin: true,
        secure: false,
        ws: true,       // 웹소켓 사용 시
        // rewrite 불필요: /api 그대로 유지해서 /api -> http://localhost:8080/api
      },
    },
  },
});
