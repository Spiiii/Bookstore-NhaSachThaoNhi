FROM node:24.18.0-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@10.34.5 --activate

WORKDIR /workspace

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN pnpm install --frozen-lockfile

FROM dependencies AS build

COPY apps/api apps/api
COPY packages packages

RUN pnpm --filter @bookstore/api exec prisma generate
RUN pnpm --filter @bookstore/api build
# Prisma CLI is a development dependency whose Studio package declares optional
# React peers. They are irrelevant to the API runtime, so keep strict peer checks
# for normal installs while allowing the production-only deploy projection.
RUN pnpm --config.strict-peer-dependencies=false --filter @bookstore/api deploy --legacy --prod /opt/bookstore/api

FROM node:24.18.0-bookworm-slim AS runtime

ENV NODE_ENV="production"

WORKDIR /app

COPY --from=build --chown=node:node /opt/bookstore/api ./
COPY --from=build --chown=node:node /workspace/apps/api/dist ./dist

RUN mkdir -p /var/lib/bookstore/uploads && chown node:node /var/lib/bookstore/uploads

USER node

EXPOSE 3001
VOLUME ["/var/lib/bookstore/uploads"]

CMD ["node", "dist/main.js"]
