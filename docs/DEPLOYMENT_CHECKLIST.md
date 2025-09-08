# 🔍 MediaTech - Checklist de Déploiement Production

## 📋 Pré-déploiement

### Infrastructure
- [ ] **VPS accessible** : SSH vers 51.75.250.125 fonctionnel
- [ ] **Docker installé** : `docker --version` et `docker compose version`
- [ ] **nginx configuré** : Service actif sur ports 80/443
- [ ] **SSL certificats** : Let's Encrypt valide pour my-library.cloud
- [ ] **Monitoring actif** : Prometheus (9090) et Grafana (3000) opérationnels
- [ ] **Espace disque** : Minimum 2GB libres (`df -h`)
- [ ] **RAM disponible** : Minimum 4GB libres (`free -h`)

### Code et Configuration
- [ ] **Repository à jour** : Dernière version du code sur le serveur
- [ ] **Images Docker** : Construites et poussées sur DockerHub
  ```bash
  docker images | grep codingmessaoud/mediatech
  ```
- [ ] **Fichier .env.production** : Copié et configuré depuis le template
- [ ] **Variables sensibles** : Tous les `CHANGE_ME` remplacés par des vraies valeurs
- [ ] **Configuration nginx** : Fichiers `mediatech.conf` et `proxy_params` en place
- [ ] **Scripts exécutables** : `chmod +x scripts/deploy-mediatech.sh`

### Validation des secrets
- [ ] **DB_PASSWORD** : Mot de passe sécurisé (>12 caractères, complexe)
- [ ] **JWT_SECRET** : 64 caractères générés par `openssl rand -hex 32`
- [ ] **SESSION_SECRET** : 64 caractères générés par `openssl rand -hex 32`
- [ ] **SUPABASE_KEY** : Clé Supabase valide et testée
- [ ] **RESEND_API_KEY** : Clé Resend valide et testée

## 🚀 Déploiement

### Étape 1 : Test de configuration
```bash
# Test en mode dry-run
./scripts/deploy-mediatech.sh --dry-run
```
- [ ] **Validation environnement** : Aucune erreur critique
- [ ] **Images Docker** : Accessibles sur DockerHub
- [ ] **Configuration nginx** : Syntaxe valide
- [ ] **Répertoires** : Créés avec bonnes permissions

### Étape 2 : Déploiement réel
```bash
# Déploiement standard avec backup
./scripts/deploy-mediatech.sh
```
- [ ] **Backup base de données** : Créé et vérifié
- [ ] **Images téléchargées** : Pull réussi sans erreur
- [ ] **Services démarrés** : Tous les conteneurs en état "Up"
- [ ] **Migrations appliquées** : Prisma migrate deploy réussi
- [ ] **Health checks** : Tous les services sains

### Étape 3 : Vérification des services
```bash
# Statut des conteneurs
docker compose -f docker-compose.production.yml ps
```
- [ ] **mediatech-backend-prod** : Up et healthy
- [ ] **mediatech-frontend-prod** : Up et healthy  
- [ ] **mediatech-db-prod** : Up et healthy
- [ ] **mediatech-backup-prod** : Up (si profil backup activé)

## ✅ Post-déploiement

### Tests de fonctionnement
- [ ] **Page d'accueil** : https://my-library.cloud accessible
- [ ] **API Health** : https://my-library.cloud/api/health retourne 200
- [ ] **SSL fonctionnel** : Certificat valide et sécurisé (A+ sur SSL Labs)
- [ ] **Redirection HTTP** : http://my-library.cloud redirige vers HTTPS

### Tests applicatifs
- [ ] **Authentification** : Connexion/inscription fonctionne
- [ ] **Navigation** : Toutes les pages principales accessibles
- [ ] **API endpoints** : 
  ```bash
  curl -f https://my-library.cloud/api/health
  curl -f https://my-library.cloud/api/resources
  ```
- [ ] **Upload fichiers** : Test d'upload d'image/document
- [ ] **Base de données** : Données persistées correctement

### Performance et monitoring
- [ ] **Temps de réponse** : Page d'accueil < 2 secondes
- [ ] **API response** : Endpoints < 500ms
- [ ] **Métriques Prometheus** : https://my-library.cloud:9090 (accès local)
- [ ] **Logs accessibles** :
  ```bash
  docker compose -f docker-compose.production.yml logs --tail 50
  ```

### Sécurité
- [ ] **Headers sécurité** : HSTS, CSP, X-Frame-Options présents
- [ ] **Rate limiting** : Test de limitation API fonctionnel
- [ ] **CORS** : Seulement my-library.cloud autorisé
- [ ] **Fichiers sensibles** : `.env` non accessible publiquement

## 🔧 Validation technique

### Base de données
- [ ] **Connexion** : 
  ```bash
  docker compose -f docker-compose.production.yml exec db pg_isready -U postgres
  ```
- [ ] **Schema à jour** :
  ```bash
  docker compose -f docker-compose.production.yml exec backend npx prisma migrate status
  ```
- [ ] **Backup planifié** : Service backup configuré et fonctionnel

### nginx
- [ ] **Configuration valide** : `sudo nginx -t`
- [ ] **Rechargement nginx** : `sudo systemctl reload nginx`
- [ ] **Logs nginx** : Pas d'erreurs dans `/var/log/nginx/mediatech_error.log`
- [ ] **Cache fonctionnel** : Headers cache présents sur assets statiques

### Monitoring intégré
- [ ] **Réseau monitoring** : Conteneurs connectés au réseau monitoring existant
- [ ] **Métriques exposées** : Backend expose `/metrics` pour Prometheus
- [ ] **PostgreSQL exporter** : Métriques DB disponibles
- [ ] **Grafana dashboards** : Peuvent accéder aux nouvelles métriques

## 📊 Tests de charge

### Tests de base (optionnels)
- [ ] **Charge modérée** :
  ```bash
  # Si ab (Apache Bench) disponible
  ab -n 100 -c 10 https://my-library.cloud/
  ```
- [ ] **Stress test API** :
  ```bash
  # Test endpoint critique
  ab -n 50 -c 5 https://my-library.cloud/api/resources
  ```

## 🚨 Tests de récupération

### Simulation de panne
- [ ] **Arrêt backend** :
  ```bash
  docker compose -f docker-compose.production.yml stop backend
  # Attendre 30s puis redémarrer
  docker compose -f docker-compose.production.yml start backend
  ```
- [ ] **Santé après redémarrage** : Services retournent à l'état sain
- [ ] **Persistence données** : Données toujours présentes après redémarrage

## 📝 Documentation finale

### Logs et rapports
- [ ] **Log déploiement** : Présent dans `/opt/mediatech/logs/deploy_*.log`
- [ ] **Rapport JSON** : Généré dans `/opt/mediatech/logs/deployment_report_*.json`
- [ ] **Métriques système** : CPU, RAM, disque dans les limites acceptables

### Communication équipe
- [ ] **Status déploiement** : Équipe informée du succès
- [ ] **Accès application** : URLs partagées avec les utilisateurs
- [ ] **Procédures urgence** : Commandes de rollback documentées

## ⚠️ Vérifications critiques

### Sécurité finale
- [ ] **Secrets non exposés** : Vérifier qu'aucun secret n'est visible dans les logs
- [ ] **Ports fermés** : Seuls 80, 443 ouverts publiquement
- [ ] **Utilisateurs containers** : Aucun conteneur ne s'exécute en root
- [ ] **Permissions fichiers** : `.env.production` en mode 600

### Backup et récupération
- [ ] **Backup automatique** : Premier backup créé avec succès
- [ ] **Test restoration** : Procédure de restauration documentée
- [ ] **Retention policy** : Nettoyage automatique des anciens backups configuré

## 🎯 Checklist de validation finale

### Critères de réussite obligatoires
- ✅ **Application accessible** : https://my-library.cloud fonctionne
- ✅ **API opérationnelle** : Endpoints critiques répondent
- ✅ **SSL sécurisé** : Certificat valide et configuration A+
- ✅ **Base de données** : Connexion et persistence OK
- ✅ **Monitoring** : Métriques collectées par Prometheus
- ✅ **Backup** : Système de sauvegarde opérationnel

### Critères de performance
- ✅ **Temps de réponse** : < 2s pour l'interface, < 500ms pour l'API
- ✅ **Ressources** : CPU < 70%, RAM < 80%
- ✅ **Disponibilité** : Services répondent aux health checks

### Critères de sécurité
- ✅ **Headers sécurité** : Configuration complète
- ✅ **Rate limiting** : Protection contre les abus
- ✅ **Isolation** : Services isolés et non-root

---

## 📞 En cas de problème

### Contacts urgence
- **Logs détaillés** : `docker compose -f docker-compose.production.yml logs -f`
- **Rollback rapide** : Le script gère le rollback automatique
- **Support infrastructure** : Vérifier nginx et certificats SSL

### Commandes de diagnostic
```bash
# Status complet
docker compose -f docker-compose.production.yml ps -a

# Santé des services
curl -f https://my-library.cloud/health

# Métriques système  
docker stats --no-stream

# Espace disque
df -h
```

**✅ Déploiement validé et prêt pour la production !**