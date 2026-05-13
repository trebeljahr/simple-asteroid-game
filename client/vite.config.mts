import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const apiPort = process.env.API_PORT || "9777";
const apiTarget = `http://127.0.0.1:${apiPort}`;

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "assets/null-vector-thumbnail.svg",
        "assets/null-vector-thumbnail.png",
        "assets/background.jpg",
        "assets/asteroid1.svg",
        "assets/asteroid1.png",
        "assets/asteroid2.svg",
        "assets/asteroid2.png",
        "assets/asteroid3.svg",
        "assets/asteroid3.png",
        "assets/heart.svg",
        "assets/heart.png",
        "assets/bullets.svg",
        "assets/bullets.png",
        "assets/favicon.png",
      ],
      manifest: {
        name: "Asteroids",
        short_name: "Asteroids",
        description:
          "A fast arcade asteroid-shooter with singleplayer race courses and multiplayer battles.",
        start_url: "/",
        display: "fullscreen",
        orientation: "landscape",
        background_color: "#010611",
        theme_color: "#060f1f",
        icons: [
          {
            src: "/assets/null-vector-thumbnail.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
          {
            src: "/assets/null-vector-thumbnail.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/assets/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/assets/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        // Don't precache the large background image; lazy-load via runtime caching.
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        globIgnores: ["**/background*.jpg"],
        navigateFallback: "/index.html",
        // Never serve a cached HTML for API or websocket routes.
        navigateFallbackDenylist: [/^\/trpc/, /^\/socket\.io/],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "asteroids-images",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
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
