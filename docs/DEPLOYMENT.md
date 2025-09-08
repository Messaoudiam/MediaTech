# 🚀 MediaTech - Guide de Déploiement Production

## Vue d'ensemble

Ce guide détaille le déploiement de l'application MediaTech sur le VPS Ubuntu 24.04 (my-library.cloud). L'infrastructure utilise Docker, nginx comme reverse proxy, et un monitoring Prometheus/Grafana.

## 📋 Prérequis

### Infrastructure VPS
- **Serveur** : Ubuntu 24.04 LTS
- **IP** : 51.75.250.125
- **Domaine** : my-library.cloud
- **Ressources** : 4 vCPU, 8GB RAM, 75GB stockage
- **SSL** : Let's Encrypt configuré

### Services préinstallés
- Docker & Docker Compose
- nginx (ports 80/443)
- Prometheus (port 9090)
- Grafana (port 3000)
- Let's Encrypt SSL

### Images Docker
Les images sont disponibles sur DockerHub :
- `codingmessaoud/mediatech-backend:latest`
- `codingmessaoud/mediatech-frontend:latest`

## 🛠️ Configuration Initiale

### 1. Préparation de l'environnement

```bash
# Cloner le projet sur le VPS
git clone https://github.com/your-username/mediatech.git /opt/mediatech-app
cd /opt/mediatech-app

# Copier le template d'environnement
cp .env.production.template .env.production

# Éditer les variables d'environnement
nano .env.production
```

### 2. Variables d'environnement critiques

**⚠️ Variables à configurer obligatoirement :**

```bash
# Database
DB_PASSWORD=votre_mot_de_passe_securise_ici

# JWT & Sessions (générer avec: openssl rand -hex 32)
JWT_SECRET=votre_secret_jwt_64_caracteres_ici
SESSION_SECRET=votre_secret_session_64_caracteres_ici

# Services externes
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_KEY=votre_cle_supabase_anon
RESEND_API_KEY=re_votre_cle_resend_api
```

### 3. Configuration des répertoires

```bash
# Exécuter le setup initial
chmod +x scripts/deploy-mediatech.sh
./scripts/deploy-mediatech.sh --setup-only
```

## 🚀 Déploiement

### 1. Déploiement standard

```bash
# Déploiement complet avec backup
./scripts/deploy-mediatech.sh

# Déploiement sans backup
./scripts/deploy-mediatech.sh --no-backup

# Test de déploiement (dry-run)
./scripts/deploy-mediatech.sh --dry-run
```

### 2. Déploiement zero-downtime

```bash
# Pour les mises à jour sans interruption
./scripts/deploy-mediatech.sh --zero-downtime
```

### 3. Options avancées

```bash
# Forcer le déploiement même avec des erreurs
./scripts/deploy-mediatech.sh --force

# Déploiement sans pull d'images
./scripts/deploy-mediatech.sh --no-pull

# Aide complète
./scripts/deploy-mediatech.sh --help
```

## 🏗️ Architecture de déploiement

### Services déployés

| Service | Container | Port interne | Accès externe |
|---------|-----------|--------------|---------------|
| Frontend | mediatech-frontend-prod | 80 | https://my-library.cloud |
| Backend | mediatech-backend-prod | 3000 | https://my-library.cloud/api |
| Database | mediatech-db-prod | 5432 | Interne uniquement |
| Backup | mediatech-backup-prod | - | Cron automatique |
| Redis | mediatech-redis-prod | 6379 | Interne uniquement |

### Réseaux Docker

- **app-network** : Communication entre services
- **monitoring** : Intégration Prometheus/Grafana

### Volumes persistants

```
/opt/mediatech/
├── data/
│   ├── postgres/     # Base de données
│   └── uploads/      # Fichiers uploadés
├── backups/          # Sauvegardes automatiques
└── logs/             # Logs de déploiement
```

## 🔧 Configuration nginx

Le fichier `nginx/mediatech.conf` configure :
- **Reverse proxy** vers les conteneurs
- **SSL/TLS** avec sécurité renforcée
- **Rate limiting** par endpoint
- **Compression** gzip
- **Cache** pour les assets statiques
- **Headers de sécurité**

### Points d'accès

- **Application** : https://my-library.cloud
- **API** : https://my-library.cloud/api
- **Health checks** : https://my-library.cloud/health
- **Uploads** : https://my-library.cloud/uploads/

## 📊 Monitoring & Logging

### Intégration Prometheus

Les métriques sont exposées automatiquement :
- **Backend** : `:3000/metrics`
- **PostgreSQL** : via postgres-exporter
- **nginx** : via stub_status

### Logs

```bash
# Logs temps réel
docker compose -f docker-compose.production.yml logs -f

# Logs par service
docker compose -f docker-compose.production.yml logs -f backend
docker compose -f docker-compose.production.yml logs -f frontend
docker compose -f docker-compose.production.yml logs -f db

# Logs nginx
sudo tail -f /var/log/nginx/mediatech_access.log
sudo tail -f /var/log/nginx/mediatech_error.log
```

## 🗄️ Gestion de la base de données

### Migrations

```bash
# Migrations automatiques (incluses dans le déploiement)
docker compose -f docker-compose.production.yml exec backend npx prisma migrate deploy

# Génération du client Prisma
docker compose -f docker-compose.production.yml exec backend npx prisma generate

# Accès direct à la base
docker compose -f docker-compose.production.yml exec db psql -U postgres mediatech_prod
```

### Sauvegardes

Les sauvegardes sont automatiques :
- **Fréquence** : Quotidienne
- **Rétention** : 7 jours, 4 semaines, 6 mois
- **Localisation** : `/opt/mediatech/backups/`

```bash
# Backup manuel
docker compose -f docker-compose.production.yml exec db pg_dump -U postgres mediatech_prod > backup_$(date +%Y%m%d).sql

# Restauration
cat backup_file.sql | docker compose -f docker-compose.production.yml exec -T db psql -U postgres mediatech_prod
```

## 🔐 Sécurité

### Mesures implémentées

- **Conteneurs non-root** avec utilisateurs dédiés
- **Secrets Docker** pour les données sensibles
- **Rate limiting** sur les endpoints critiques
- **Headers de sécurité** complets
- **SSL/TLS** avec configuration moderne
- **Isolation réseau** des services
- **Read-only containers** où possible

### Certificats SSL

```bash
# Renouvellement automatique Let's Encrypt
sudo certbot renew --dry-run

# Vérification de l'expiration
openssl x509 -enddate -noout -in /etc/letsencrypt/live/my-library.cloud/fullchain.pem
```

## 🚨 Dépannage

### Vérifications de base

```bash
# État des services
docker compose -f docker-compose.production.yml ps

# Health checks
curl -f https://my-library.cloud/health
curl -f https://my-library.cloud/api/health

# Ressources système
docker stats
df -h
free -h
```

### Problèmes fréquents

#### 1. Services qui ne démarrent pas
```bash
# Vérifier les logs
docker compose -f docker-compose.production.yml logs backend

# Vérifier l'environnement
docker compose -f docker-compose.production.yml exec backend env | grep DATABASE_URL
```

#### 2. Erreurs de base de données
```bash
# Vérifier la connexion
docker compose -f docker-compose.production.yml exec db pg_isready -U postgres

# Vérifier les migrations
docker compose -f docker-compose.production.yml exec backend npx prisma migrate status
```

#### 3. Erreurs nginx
```bash
# Tester la configuration
sudo nginx -t

# Recharger nginx
sudo systemctl reload nginx

# Logs détaillés
sudo tail -f /var/log/nginx/error.log
```

### Rollback d'urgence

```bash
# Le script gère le rollback automatique en cas d'échec
# Pour un rollback manuel :

# 1. Arrêter les services actuels
docker compose -f docker-compose.production.yml down

# 2. Restaurer la dernière sauvegarde
gunzip < /opt/mediatech/backups/pre_deploy_backup_latest.sql.gz | \
  docker compose -f docker-compose.production.yml exec -T db psql -U postgres mediatech_prod

# 3. Redémarrer les services précédents
docker images # Identifier les versions précédentes
```

## 📈 Optimisations de performance

### Base de données PostgreSQL
- **Connexions max** : 200
- **Shared buffers** : 512MB
- **Effective cache size** : 1.5GB
- **Work memory** : 8MB

### nginx
- **Gzip compression** activée
- **Cache** pour assets statiques (1 an)
- **Keep-alive** avec upstream
- **Rate limiting** intelligent

### Docker
- **Ressources limitées** par service
- **Health checks** optimisés
- **Logs rotatifs** automatiques

## 🔄 Mises à jour

### Processus standard

1. **Build des nouvelles images** (CI/CD GitHub Actions)
2. **Push vers DockerHub** avec tag
3. **Déploiement sur le serveur** :
   ```bash
   # Mise à jour avec la dernière version
   ./scripts/deploy-mediatech.sh --zero-downtime
   ```

### Mises à jour de sécurité

```bash
# Système
sudo apt update && sudo apt upgrade -y

# Docker images
docker compose -f docker-compose.production.yml pull
./scripts/deploy-mediatech.sh
```

## 📊 Métriques et alertes

### Métriques surveillées
- **Temps de réponse** API
- **Utilisation CPU/RAM** des conteneurs  
- **Connexions base de données**
- **Espace disque**
- **Certificats SSL** (expiration)

### Dashboards Grafana
- **Application Overview** : Métriques générales
- **Database Performance** : PostgreSQL
- **nginx Metrics** : Trafic et erreurs
- **System Resources** : Serveur

## ✅ Checklist de déploiement

### Avant déploiement
- [ ] Variables d'environnement configurées
- [ ] Certificats SSL valides
- [ ] Espace disque suffisant (>2GB)
- [ ] Services de base fonctionnels
- [ ] Backup de l'état actuel

### Après déploiement
- [ ] Services démarrés et sains
- [ ] Migrations appliquées
- [ ] Health checks OK
- [ ] HTTPS fonctionnel
- [ ] Monitoring actif
- [ ] Logs accessibles

### Tests post-déploiement
- [ ] Authentification utilisateur
- [ ] CRUD ressources (livres, etc.)
- [ ] Upload de fichiers
- [ ] API endpoints critiques
- [ ] Performance acceptable

## 📞 Support

### Logs de déploiement
- **Localisation** : `/opt/mediatech/logs/deploy_*.log`
- **Rapports JSON** : `/opt/mediatech/logs/deployment_report_*.json`

### Commandes utiles

```bash
# Status complet
docker compose -f docker-compose.production.yml ps -a

# Restart d'un service
docker compose -f docker-compose.production.yml restart backend

# Accès shell au container
docker compose -f docker-compose.production.yml exec backend sh

# Nettoyage Docker
docker system prune -f

# Monitoring en temps réel
watch 'docker stats --no-stream'
```

---

## 🎯 Résumé des livrables

Cette configuration de production fournit :

### ✅ **Configuration complète**
- `docker-compose.production.yml` - Orchestration des services
- `nginx/mediatech.conf` - Reverse proxy optimisé
- `.env.production.template` - Variables d'environnement
- `scripts/deploy-mediatech.sh` - Script de déploiement

### ✅ **Fonctionnalités avancées**
- Déploiement zero-downtime
- Sauvegardes automatiques avec rétention
- Monitoring Prometheus/Grafana intégré
- Sécurité renforcée (SSL, rate limiting, headers)
- Health checks et rollback automatique

### ✅ **Optimisations**
- Configuration PostgreSQL optimisée pour 8GB RAM
- nginx avec cache et compression
- Conteneurs avec limites de ressources
- Logs rotatifs et structurés

### ✅ **Facilité d'usage**
- Script de déploiement avec options avancées
- Documentation complète avec troubleshooting
- Commandes prêtes à l'emploi
- Checklist de validation

**🚀 L'application MediaTech est maintenant prête pour un déploiement production robuste et sécurisé !**