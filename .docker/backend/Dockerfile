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

# Définir les arguments pour Supabase et Resend
ARG SUPABASE_URL
ARG SUPABASE_KEY
ARG RESEND_API_KEY
ARG FROM_EMAIL

# Définir les variables d'environnement pour Supabase et Resend
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_KEY=$SUPABASE_KEY
ENV RESEND_API_KEY=$RESEND_API_KEY
ENV FROM_EMAIL=$FROM_EMAIL

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/prisma ./prisma

# Installer explicitement les dépendances qui posent problème
RUN npm install --production=false @nestjs/swagger cookie-parser passport-local @supabase/supabase-js resend

EXPOSE 3000

# Utiliser le chemin complet vers main.js
CMD ["node", "dist/src/main.js"]