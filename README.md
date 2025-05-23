# 📚 MediaTech - Système de Gestion de Médiathèque

[![CI/CD Pipeline](https://github.com/Messaoudiam/mon-projet-fullstack/actions/workflows/main.yml/badge.svg)](https://github.com/Messaoudiam/mon-projet-fullstack/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Angular Version](https://img.shields.io/badge/angular-19.x-red)](https://angular.io/)
[![NestJS Version](https://img.shields.io/badge/nestjs-10.x-ea2845)](https://nestjs.com/)

> **Application fullstack moderne** pour la gestion d'une médiathèque avec système d'emprunts, avis utilisateurs et interface d'administration complète.

## 🎯 **Aperçu du Projet**

MediaTech est une solution complète de gestion de médiathèque développée avec les technologies les plus récentes. Elle permet aux utilisateurs de consulter, emprunter et évaluer des ressources (livres, DVD, jeux, magazines) tout en offrant aux administrateurs des outils de gestion avancés.

### 🌟 **Fonctionnalités Principales**

- 🔐 **Authentification sécurisée** avec JWT et refresh tokens
- 📖 **Catalogue multi-ressources** (livres, DVD, jeux vidéo, magazines)
- 📋 **Système d'emprunts** avec gestion des échéances
- ⭐ **Système d'avis et notes** pour chaque ressource
- ❤️ **Liste de favoris** personnalisée
- 👨‍💼 **Interface d'administration** complète
- 📱 **Design responsive** et moderne
- 🔍 **Recherche avancée** avec filtres
- 📧 **Système de contact** intégré

## 🚀 **Technologies Utilisées**

### **Frontend**

- **Angular 19** - Framework moderne avec Standalone Components
- **Angular Material** - Design system cohérent et accessible
- **RxJS** - Programmation réactive
- **TypeScript** - Typage statique pour plus de robustesse

### **Backend**

- **NestJS** - Framework Node.js scalable et modulaire
- **Prisma ORM** - ORM moderne avec type-safety
- **PostgreSQL** - Base de données relationnelle performante
- **JWT** - Authentification stateless sécurisée
- **Swagger** - Documentation API automatique

### **DevOps & Outils**

- **Docker & Docker Compose** - Containerisation complète
- **GitHub Actions** - CI/CD automatisé
- **ESLint & Prettier** - Qualité et formatage du code
- **Jest & Jasmine** - Tests unitaires et d'intégration

## 📋 **Prérequis**

- **Node.js** ≥ 18.0.0
- **Docker** & **Docker Compose**
- **Git**

## ⚡ **Installation Rapide**

### **Option 1: Avec Docker (Recommandé)**

```bash
# Cloner le repository
git clone git@github.com:Messaoudiam/the-centenary-library.git (SSH)
ou
git clone https://github.com/Messaoudiam/mon-projet-fullstack.git (HTTPS)
cd mon-projet-fullstack

# Configurer les variables d'environnement
cp backend/env.example backend/.env.development
cp backend/env.example backend/.env.production

# Démarrer tous les services
npm run docker:up

# Appliquer les migrations de base de données
npm run prisma:migrate
```

**🎉 L'application est maintenant accessible :**

- **Frontend** : http://localhost:4001
- **API Backend** : http://localhost:4000
- **Documentation API** : http://localhost:4000/api/docs
- **Base de données** : localhost:4002

### **Option 2: Installation Locale**

```bash
# Backend
cd backend
npm install
npm run prisma:generate
npm run start:dev

# Frontend (nouveau terminal)
cd frontend
npm install
npm start
```

## 🧪 **Tests**

![Tests Status](https://img.shields.io/badge/Backend-✅%20100%25%20PASSED-brightgreen)
![Tests Status](https://img.shields.io/badge/Frontend-✅%2020%2F20%20PASSED-brightgreen)

```bash
# Tests backend
cd backend
npm test                # Tests unitaires
npm run test:cov       # Avec couverture
npm run test:e2e       # Tests end-to-end

# Tests frontend
cd frontend
npm test               # Tests unitaires
npm run test:ci        # CI mode (headless)
```

## 📊 **Couverture de Tests**

- **Backend** : 85%+ de couverture - AuthService, CRUD, API
- **Frontend** : 27%+ de couverture - Composants, Services, Routing
- **Tests E2E** : Health checks, API intégration
- **Total** : 20+ tests unitaires, 100% succès

> 📋 **[Voir la documentation complète des tests](./TESTING.md)** - Détails par fonctionnalité, patterns utilisés, et stratégie de test

## 🏗️ **Architecture**

```
📦 mon-projet-fullstack/
├── 🎨 frontend/           # Application Angular
│   ├── src/app/
│   │   ├── auth/         # Module d'authentification
│   │   ├── core/         # Services globaux & guards
│   │   ├── shared/       # Composants réutilisables
│   │   ├── features/     # Modules métier
│   │   └── pages/        # Pages principales
├── ⚙️ backend/            # API NestJS
│   ├── src/
│   │   ├── auth/         # Authentification JWT
│   │   ├── users/        # Gestion utilisateurs
│   │   ├── resources/    # Catalogue de ressources
│   │   ├── borrowings/   # Système d'emprunts
│   │   └── reviews/      # Système d'avis
├── 🐳 .docker/           # Configuration Docker
├── 🔄 .github/workflows/ # CI/CD GitHub Actions
└── 📚 docs/              # Documentation
```

## 🔒 **Sécurité**

- ✅ **Authentification JWT** avec refresh tokens
- ✅ **Validation stricte** des entrées (class-validator)
- ✅ **Protection CORS** configurée
- ✅ **Rate limiting** anti-spam
- ✅ **Helmet** pour la sécurité des headers
- ✅ **Hachage bcrypt** des mots de passe
- ✅ **Variables d'environnement** sécurisées

## 📈 **Performance**

- ⚡ **Lazy loading** des modules Angular
- ⚡ **Optimisation des requêtes** avec Prisma
- ⚡ **Compression gzip** activée
- ⚡ **Cache HTTP** configuré
- ⚡ **Bundle optimization** Webpack

## 🚀 **Déploiement**

### **Production avec Docker**

```bash
# Build des images de production
docker-compose -f docker-compose.prod.yml build

# Déploiement
docker-compose -f docker-compose.prod.yml up -d
```

### **Variables d'Environnement**

Consultez `backend/env.example` pour la configuration complète.

## 📖 **Documentation**

- 📋 [**Architecture détaillée**](./ARCHITECTURE.md)
- 🔧 [**Guide de développement**](./docs/DEVELOPMENT.md)
- 🚀 [**Guide de déploiement**](./docs/DEPLOYMENT.md)
- 📚 [**Documentation API**](http://localhost:3000/api/docs) (Swagger)

## 🤝 **Contribution**

Les contributions sont les bienvenues ! Consultez notre [guide de contribution](./CONTRIBUTING.md).

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📝 **Roadmap**

- [ ] 🔍 **Recherche elasticsearch** pour de meilleures performances
- [ ] 📧 **Notifications email** automatiques
- [ ] 📱 **Application mobile** React Native
- [ ] 🌐 **Internationalisation** (i18n)
- [ ] 📊 **Dashboard analytics** avancé
- [ ] 🔄 **API GraphQL** en complément REST

## 📄 **Licence**

Ce projet est sous licence [MIT](./LICENSE).

## 👨‍💻 **Auteur**

**Messaoud Iam**

- 📧 Email: [codingmessaoud@gmail.com](mailto:codingmessaoud@gmail.com)
- 💼 LinkedIn: [Votre LinkedIn](https://linkedin.com/in/votre-profil)
- 🐙 GitHub: [@Messaoudiam](https://github.com/Messaoudiam)

---

⭐ **N'hésitez pas à donner une étoile si ce projet vous plaît !**
