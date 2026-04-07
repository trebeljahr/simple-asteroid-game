FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY client/package*.json client/
COPY shared/package*.json shared/
COPY package*.json ./

RUN npm ci --workspace @simple-asteroid-game/client

COPY shared ./shared
COPY client ./client
COPY package*.json ./

RUN npm run build:client

FROM node:22-bookworm-slim AS runtime
WORKDIR /app

COPY --from=build /app/client/dist ./dist
COPY --from=build /app/client/server.mjs ./server.mjs
COPY --from=build /app/client/package*.json ./

ENV NODE_ENV=production
ENV PORT=80

USER node

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || '80') + '/healthz').then(r => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1))"

CMD ["node", "server.mjs"]
