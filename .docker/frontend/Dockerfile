# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Production stage
FROM nginx:alpine

# Copier la configuration nginx
# Le fichier doit être dans le répertoire de build (frontend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers de build dans le dossier de nginx
COPY --from=builder /usr/src/app/dist/frontend /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]