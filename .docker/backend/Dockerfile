# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

# Installer toutes les dépendances, y compris celles de développement
# Utiliser --no-fund et --no-deprecation pour réduire les messages d'avertissement
RUN npm ci --no-fund --no-deprecation

COPY . .

RUN npm run build

# Production stage
FROM node:20-alpine

# Définir les arguments de build pour les variables d'environnement
ARG NODE_ENV=production
ARG PORT=3000
ARG JWT_SECRET
ARG JWT_ACCESS_EXPIRATION=1h
ARG FRONTEND_URL
ARG API_URL
ARG DATABASE_URL

# Créer un fichier .env à partir des arguments
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}
ENV JWT_SECRET=${JWT_SECRET}
ENV JWT_ACCESS_EXPIRATION=${JWT_ACCESS_EXPIRATION}
ENV FRONTEND_URL=${FRONTEND_URL}
ENV API_URL=${API_URL}
ENV DATABASE_URL=${DATABASE_URL}

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/prisma ./prisma

# Installer explicitement les dépendances qui posent problème en ignorant les avertissements
RUN npm install --production=false --no-fund --no-deprecation @nestjs/swagger cookie-parser passport-local

EXPOSE 3000

# Utiliser le chemin complet vers main.js
CMD ["node", "dist/src/main.js"]