# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Argumento de build para a URL da API (Obrigatório para o Next.js no build)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Etapa 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

# Copie apenas o necessário para rodar (Next.js standalone mode é ideal, mas aqui usaremos o padrão)
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
