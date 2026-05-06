# Use a imagem base do Node.js
FROM node:20-alpine

# Instale dependências necessárias para o Prisma e Node-canvas (se houver)
RUN apk add --no-cache openssl

# Crie o diretório de trabalho
WORKDIR /app

# Copie apenas os arquivos de manifesto primeiro para aproveitar o cache de camadas
COPY package*.json ./
COPY prisma ./prisma/

# Instale as dependências
RUN npm install

# Gere o cliente do Prisma
RUN npx prisma generate

# Copie o restante do código
COPY . .

# Expõe a porta (Easypanel irá mapear isso)
EXPOSE 3001

# Comando para iniciar o servidor
CMD ["npm", "start"]
