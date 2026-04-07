FROM node:22-bookworm-slim AS deps
WORKDIR /app

COPY server/package*.json server/
COPY shared/package*.json shared/
COPY package*.json ./

RUN npm ci --workspace @simple-asteroid-game/server

FROM deps AS build
WORKDIR /app

COPY shared ./shared
COPY server ./server
COPY package*.json ./

RUN npm run build:server
RUN npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=9777

COPY --from=build /app/server/package*.json ./server/
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/shared/package*.json ./shared/
COPY --from=build /app/package*.json ./

USER node

EXPOSE 9777

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || '9777') + '/health').then(r => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1))"

CMD ["node", "server/dist/server.js"]
