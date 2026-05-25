FROM node:22.16.0-slim AS dev-deps
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm i --frozen-lockfile --ignore-scripts

FROM node:22.16.0-slim AS builder
WORKDIR /app
COPY --from=dev-deps /app/node_modules ./node_modules
RUN npm install -g pnpm
COPY . .
RUN pnpm build

FROM node:22.16.0-slim AS prod-deps
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm i --prod --frozen-lockfile --ignore-scripts

FROM node:22.16.0-slim AS prod
ENV NODE_ENV=prod
EXPOSE 3000
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

CMD [ "node", "dist/main.js" ]