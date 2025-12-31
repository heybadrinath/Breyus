FROM node:20-bookworm AS build

WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY backend/package*.json ./
RUN npm ci

COPY backend/. .
RUN npm run build

FROM node:20-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

CMD ["node", "dist/main"]
