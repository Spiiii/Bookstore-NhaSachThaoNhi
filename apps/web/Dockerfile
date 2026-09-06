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

COPY apps/web apps/web
COPY packages packages

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL="$NEXT_PUBLIC_API_BASE_URL"

RUN pnpm --filter @bookstore/web build
RUN pnpm --filter @bookstore/web deploy --legacy --prod /opt/bookstore/web

FROM node:24.18.0-bookworm-slim AS runtime

ENV NODE_ENV="production"
ENV HOSTNAME="0.0.0.0"
ENV PORT="3000"

WORKDIR /app

COPY --from=build --chown=node:node /opt/bookstore/web ./
COPY --from=build --chown=node:node /workspace/apps/web/.next ./.next
COPY --from=build --chown=node:node /workspace/apps/web/public ./public

USER node

EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]
