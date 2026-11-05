FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

RUN npx prisma generate

COPY tsconfig*.json ./
COPY src ./src

RUN npm run build && npm prune --omit=dev

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist

RUN mkdir -p uploads

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
