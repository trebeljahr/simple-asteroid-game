FROM node:24-bookworm-slim AS deps
WORKDIR /app

RUN npm install -g pnpm@10.33.2

COPY server/package.json server/
COPY shared/package.json shared/
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile --filter @simple-asteroid-game/server...

FROM deps AS build
WORKDIR /app

COPY shared ./shared
COPY server ./server

RUN pnpm run build:server
RUN pnpm install --prod --frozen-lockfile --ignore-scripts --filter @simple-asteroid-game/server...

FROM node:24-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=9777

COPY --from=build /app/server/package*.json ./server/
COPY --from=build /app/server/dist ./server/dist
# Migrations are copied into dist by the build script, but keep the
# src copy around as a belt-and-suspenders fallback used by
# resolveMigrationsFolder when dist lookup fails.
COPY --from=build /app/server/src/db/migrations ./server/src/db/migrations
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/shared/package*.json ./shared/
COPY --from=build /app/package*.json ./

USER node

EXPOSE 9777

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || '9777') + '/health').then(r => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1))"

CMD ["node", "server/dist/server/src/server.js"]
