FROM node:20-slim AS base
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json ./
COPY apps/api/package.json ./apps/api/package.json
RUN npm install --workspaces

FROM deps AS build
COPY . .
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/.env.example ./apps/api/.env.example
COPY --from=build /app/apps/api/jest.config.ts ./apps/api/jest.config.ts
COPY --from=build /app/apps/api/jest.e2e.config.ts ./apps/api/jest.e2e.config.ts
COPY --from=build /app/apps/api/tsconfig.spec.json ./apps/api/tsconfig.spec.json
COPY --from=build /app/apps/api/tsconfig.json ./apps/api/tsconfig.json
COPY --from=build /app/apps/api/test ./apps/api/test
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/main.js"]
