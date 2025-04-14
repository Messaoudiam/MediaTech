# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

# Installer toutes les dépendances, y compris celles de développement
RUN npm ci

COPY . .

RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/prisma ./prisma

# Installer explicitement les dépendances qui posent problème
RUN npm install --production=false @nestjs/swagger cookie-parser passport-local

EXPOSE 3000

# Utiliser le chemin complet vers main.js
CMD ["node", "dist/src/main.js"]