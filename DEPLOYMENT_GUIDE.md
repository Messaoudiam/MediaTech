# Guide de Déploiement - my-library.cloud

## 📋 Prérequis

- VPS avec Ubuntu/Debian
- Docker et Docker Compose installés
- Nginx installé
- Certificat SSL configuré pour `my-library.cloud` et `www.my-library.cloud`
- Images Docker Hub disponibles : `codingmessaoud/backend:latest` et `codingmessaoud/frontend:latest`

## 🚀 Étapes de Déploiement

### 1. Connexion au VPS et préparation

```bash
# Connexion SSH à votre VPS
ssh root@your-vps-ip

# Aller dans le dossier de l'application
cd /opt/my-library-app
```

### 2. Cloner ou télécharger les fichiers de configuration

```bash
# Si vous avez un repository Git
git clone https://github.com/votre-username/mon-projet-fullstack.git .

# OU créer les fichiers manuellement (voir section suivante)
```

### 3. Créer les fichiers de configuration nécessaires

#### Fichier `.env` (racine du projet)

```bash
cat > .env << 'EOF'
# Variables d'environnement pour Docker Compose Production

# Database
DB_PASSWORD=your-secure-database-password-change-this

# JWT Configuration
JWT_SECRET=your-very-secure-secret-key-change-this-in-production-2024

# Supabase
SUPABASE_URL=https://zcexuqkzavrsdclondls.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZXh1cWt6YXZyc2RjbG9uZGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0OTY4MDcsImV4cCI6MjA2MTA3MjgwN30.2GunGZmnFT9KK6aewGGsfJnBv68vRHSn3rgYt0v5OKk

# Resend
RESEND_API_KEY=re_votre_cle_api_resend
FROM_EMAIL=noreply@my-library.cloud

# Session
SESSION_SECRET=another-very-secure-session-secret-change-this-2024
EOF
```

#### Structure des dossiers

```bash
# Créer la structure nécessaire
mkdir -p nginx
mkdir -p backups
mkdir -p logs

# Rendre les scripts exécutables
chmod +x deploy.sh
chmod +x update.sh
```

### 4. Configuration Nginx

Votre fichier `nginx/nginx.conf` est déjà configuré. Assurez-vous que :

- Les certificats SSL sont présents dans `/etc/letsencrypt/live/my-library.cloud/`
- Le dossier `/var/www/certbot` existe pour le renouvellement des certificats

### 5. Premier déploiement

```bash
# Lancer le déploiement
./deploy.sh
```

### 6. Vérification du déploiement

```bash
# Vérifier l'état des services
docker compose -f docker-compose.prod.yml ps

# Vérifier les logs
docker compose -f docker-compose.prod.yml logs -f

# Tester l'accès
curl -I https://my-library.cloud
```

## 🔄 Mise à jour de l'application

Pour mettre à jour l'application avec de nouvelles images Docker Hub :

```bash
./update.sh
```

## 🛠️ Commandes utiles

### Gestion des services

```bash
# Voir l'état des services
docker compose -f docker-compose.prod.yml ps

# Voir les logs d'un service spécifique
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f db

# Redémarrer un service
docker compose -f docker-compose.prod.yml restart backend

# Arrêter tous les services
docker compose -f docker-compose.prod.yml down

# Démarrer tous les services
docker compose -f docker-compose.prod.yml up -d
```

### Gestion de la base de données

```bash
# Sauvegarde de la base de données
docker compose -f docker-compose.prod.yml exec db pg_dump -U postgres myapp > backup.sql

# Restaurer une sauvegarde
docker compose -f docker-compose.prod.yml exec -T db psql -U postgres myapp < backup.sql

# Accéder à la console PostgreSQL
docker compose -f docker-compose.prod.yml exec db psql -U postgres myapp
```

### Monitoring et debugging

```bash
# Voir l'utilisation des ressources
docker stats

# Inspecter un conteneur
docker compose -f docker-compose.prod.yml exec backend sh

# Nettoyer les images non utilisées
docker system prune -f
```

## 🔒 Sécurité

### Variables d'environnement sensibles

Assurez-vous de modifier ces valeurs dans le fichier `.env` :

- `DB_PASSWORD` : Mot de passe fort pour PostgreSQL
- `JWT_SECRET` : Clé secrète pour JWT (minimum 32 caractères)
- `SESSION_SECRET` : Clé secrète pour les sessions
- `RESEND_API_KEY` : Votre vraie clé API Resend

### Permissions des fichiers

```bash
# Sécuriser le fichier .env
chmod 600 .env

# Sécuriser les scripts
chmod 755 deploy.sh update.sh
```

## 🚨 Dépannage

### Problèmes courants

1. **Services qui ne démarrent pas**

   ```bash
   docker compose -f docker-compose.prod.yml logs
   ```

2. **Problème de certificat SSL**

   ```bash
   # Vérifier les certificats
   ls -la /etc/letsencrypt/live/my-library.cloud/

   # Renouveler si nécessaire
   certbot renew
   ```

3. **Base de données inaccessible**

   ```bash
   # Vérifier l'état de PostgreSQL
   docker compose -f docker-compose.prod.yml exec db pg_isready -U postgres
   ```

4. **Images Docker Hub non accessibles**
   ```bash
   # Tester la connectivité
   docker pull codingmessaoud/backend:latest
   docker pull codingmessaoud/frontend:latest
   ```

### Rollback en cas de problème

```bash
# Arrêter les services
docker compose -f docker-compose.prod.yml down

# Utiliser une image précédente (si disponible)
docker tag codingmessaoud/backend:previous codingmessaoud/backend:latest

# Redémarrer
docker compose -f docker-compose.prod.yml up -d
```

## 📊 Monitoring

### Logs centralisés

```bash
# Suivre tous les logs en temps réel
docker compose -f docker-compose.prod.yml logs -f

# Logs avec timestamps
docker compose -f docker-compose.prod.yml logs -f -t
```

### Métriques système

```bash
# Utilisation des ressources par conteneur
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
```

## 🔄 Automatisation

### Cron pour les sauvegardes automatiques

```bash
# Ajouter au crontab
crontab -e

# Sauvegarde quotidienne à 2h du matin
0 2 * * * cd /opt/my-library-app && docker compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres myapp > backups/daily_backup_$(date +\%Y\%m\%d).sql
```

### Surveillance automatique

```bash
# Script de vérification de santé (à ajouter au cron)
#!/bin/bash
if ! curl -f -s https://my-library.cloud > /dev/null; then
    echo "Site down!" | mail -s "my-library.cloud Alert" admin@example.com
fi
```
