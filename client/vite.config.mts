import { defineConfig } from "vite";

const apiPort = process.env.API_PORT || "9777";
const apiTarget = `http://127.0.0.1:${apiPort}`;

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/socket.io": { target: apiTarget, ws: true },
      "/trpc": apiTarget,
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
});
