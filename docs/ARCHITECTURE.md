# 🏗️ Architecture du Projet

## Vue d'ensemble

Ce projet est une application fullstack moderne construite avec une architecture en microservices découplée :

- **Frontend** : Angular 19 avec Material Design
- **Backend** : NestJS avec architecture modulaire
- **Base de données** : PostgreSQL avec Prisma ORM
- **Authentification** : JWT avec refresh tokens
- **Stockage** : Supabase pour les fichiers
- **Containerisation** : Docker & Docker Compose
- **CI/CD** : GitHub Actions

## 📁 Structure du Projet

```
mon-projet-fullstack/
├── frontend/                 # Application Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/        # Module d'authentification
│   │   │   ├── core/        # Services et guards globaux
│   │   │   ├── shared/      # Composants partagés
│   │   │   ├── features/    # Modules métier
│   │   │   └── pages/       # Pages principales
│   │   ├── assets/          # Ressources statiques
│   │   └── environments/    # Configuration par environnement
├── backend/                  # API NestJS
│   ├── src/
│   │   ├── auth/            # Module d'authentification
│   │   ├── users/           # Gestion des utilisateurs
│   │   ├── resources/       # Gestion des ressources
│   │   ├── borrowings/      # Système d'emprunts
│   │   ├── reviews/         # Système d'avis
│   │   ├── common/          # Services partagés
│   │   ├── config/          # Configuration
│   │   └── prisma/          # Service Prisma
│   ├── prisma/              # Schéma et migrations
│   └── test/                # Tests e2e
├── .docker/                 # Configuration Docker
├── .github/workflows/       # CI/CD GitHub Actions
└── docs/                    # Documentation
```

## 🔧 Architecture Backend (NestJS)

### Modules Principaux

1. **AuthModule** - Authentification JWT
2. **UsersModule** - Gestion des utilisateurs
3. **ResourcesModule** - Gestion des livres/DVD/jeux
4. **BorrowingsModule** - Système d'emprunts
5. **ReviewsModule** - Système d'avis
6. **HealthModule** - Monitoring de l'application

### Patterns Utilisés

- **Dependency Injection** : Injection de dépendances NestJS
- **Repository Pattern** : Avec Prisma ORM
- **DTO Pattern** : Validation des données avec class-validator
- **Guard Pattern** : Protection des routes
- **Interceptor Pattern** : Transformation des réponses
- **Decorator Pattern** : Métadonnées et validation

### Sécurité

- **Helmet** : Protection contre les vulnérabilités communes
- **CORS** : Configuration stricte
- **Rate Limiting** : Protection contre le spam
- **JWT** : Tokens d'accès et de rafraîchissement
- **Bcrypt** : Hachage des mots de passe
- **Validation** : Validation stricte des entrées

## 🎨 Architecture Frontend (Angular)

### Structure Modulaire

- **Core Module** : Services singleton et guards
- **Shared Module** : Composants réutilisables
- **Feature Modules** : Modules métier avec lazy loading
- **Auth Module** : Authentification et autorisation

### State Management

- **Services** : Gestion d'état simple avec RxJS
- **BehaviorSubject** : État réactif
- **Observables** : Communication asynchrone

### UI/UX

- **Angular Material** : Design system cohérent
- **Responsive Design** : Mobile-first
- **Accessibility** : Standards WCAG
- **Progressive Web App** : Fonctionnalités PWA

## 🗄️ Base de Données

### Modèle de Données

```prisma
User {
  id                       String     @id @default(uuid())
  email                    String     @unique
  password                 String
  role                     UserRole   @default(USER)
  lastLogin                DateTime?
  failedAttempts           Int        @default(0)
  isLocked                 Boolean    @default(false)
  isEmailVerified          Boolean    @default(false)
  emailVerificationToken   String?
  emailVerificationExpires DateTime?
  activeBorrowingsCount    Int        @default(0)

  createdAt                DateTime   @default(now())
  updatedAt                DateTime   @updatedAt

  sessions    Session[]
  borrowings  Borrowing[]
  favorites   Favorite[]
  contactRequests ContactRequest[]
  reviews     Review[]
}

Review {
  id         String   @id @default(uuid())
  userId     String
  resourceId String
  content    String
  rating     Int?     
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  resource   Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  
  @@unique([userId, resourceId])
  @@map("reviews")
  @@index([userId])
  @@index([resourceId])
}

Borrowing {
  id         String        @id @default(uuid())
  userId     String
  copyId     String
  borrowedAt DateTime      @default(now())
  dueDate    DateTime
  returnedAt DateTime?
  status     BorrowingStatus @default(ACTIVE)

  user       User          @relation(fields: [userId], references: [id])
  copy       Copy          @relation(fields: [copyId], references: [id])

  @@index([userId])
  @@index([copyId])
  @@index([status])
}
}
```

### Optimisations

- **Index** : Sur les champs fréquemment recherchés
- **Relations** : Optimisées pour les requêtes
- **Contraintes** : Intégrité référentielle
- **Migrations** : Versioning de la base

## 🔄 Flux de Données

### Authentification

1. **Login** : Email/Password → JWT tokens
2. **Authorization** : Bearer token dans headers
3. **Refresh** : Renouvellement automatique des tokens
4. **Logout** : Invalidation des tokens

### CRUD Operations

1. **Frontend** : Formulaire → Service → HTTP Client
2. **Backend** : Controller → Service → Repository → Database
3. **Response** : Database → DTO → HTTP Response → Frontend

## 🚀 Déploiement

### Environnements

- **Development** : Docker Compose local
- **Staging** : Container registry + orchestration
- **Production** : Cloud deployment avec monitoring

### CI/CD Pipeline

1. **Tests** : Unit + Integration + E2E
2. **Build** : Docker images
3. **Security** : Vulnerability scanning
4. **Deploy** : Automated deployment
5. **Monitor** : Health checks et logs

## 📊 Monitoring

### Métriques

- **Health Endpoint** : `/api/health`
- **Performance** : Temps de réponse
- **Errors** : Logs structurés
- **Usage** : Métriques métier

### Logging

- **Structured Logs** : Format JSON
- **Log Levels** : Error, Warn, Info, Debug
- **Correlation IDs** : Traçabilité des requêtes

## 🔒 Sécurité

### Authentification & Autorisation

- **JWT** : Stateless authentication
- **RBAC** : Role-based access control
- **Guards** : Protection des routes
- **Rate Limiting** : Protection DDoS

### Validation & Sanitization

- **Input Validation** : DTO avec class-validator
- **Output Sanitization** : Transformation des données
- **SQL Injection** : Protection via Prisma ORM
- **XSS Protection** : Helmet middleware

## 🧪 Tests

### Stratégie de Tests

- **Unit Tests** : Services et composants isolés
- **Integration Tests** : Modules complets
- **E2E Tests** : Parcours utilisateur
- **Coverage** : Minimum 80%

### Outils

- **Jest** : Framework de tests
- **Supertest** : Tests API
- **Karma/Jasmine** : Tests Angular
- **Cypress** : Tests E2E (à implémenter)

## 📈 Performance

### Optimisations Backend

- **Database Indexing** : Requêtes optimisées
- **Compression** : Gzip middleware
- **Connection Pooling** : Prisma connection pool

### Optimisations Frontend

- **Lazy Loading** : Modules chargés à la demande
- **OnPush Strategy** : Détection de changements optimisée
- **Tree Shaking** : Élimination du code mort
- **Bundle Optimization** : Webpack optimizations
