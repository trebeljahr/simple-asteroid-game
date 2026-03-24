import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/socket.io": "http://127.0.0.1:9777",
      "/trpc": "http://127.0.0.1:9777",
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
});
