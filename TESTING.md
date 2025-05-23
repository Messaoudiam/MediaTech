# 🧪 Guide de Tests - BiblioTech

> Documentation complète de la stratégie de tests et de la couverture du projet

## 📊 **Statut des Tests**

![Tests Status](https://img.shields.io/badge/Backend-✅%20100%25%20PASSED-brightgreen)
![Tests Status](https://img.shields.io/badge/Frontend-✅%2020%2F20%20PASSED-brightgreen)
![Coverage](https://img.shields.io/badge/Coverage-Backend%2085%25+-brightgreen)
![Coverage](https://img.shields.io/badge/Coverage-Frontend%2027%25+-yellow)

## 🎯 **Stratégie de Tests**

Notre approche de test suit la **pyramide de tests** avec :

- **Tests unitaires** (70%) - Services & composants isolés
- **Tests d'intégration** (20%) - Modules & API
- **Tests E2E** (10%) - Parcours utilisateur complets

## 🔐 **AUTHENTIFICATION & SÉCURITÉ**

### **Backend Tests**

📁 `backend/src/auth/auth.service.spec.ts` - **206 lignes**

```typescript
describe('AuthService', () => {
  ✅ validateUser() - Validation credentials
    ↳ Connexion réussie avec utilisateur valide
    ↳ Échec avec utilisateur inexistant
    ↳ Échec avec mot de passe incorrect
    ↳ Gestion compte verrouillé automatiquement
    ↳ Réinitialisation compteur après succès

  ✅ register() - Création utilisateur
    ↳ Inscription réussie avec données valides
    ↳ Échec si utilisateur existe déjà
    ↳ Hachage sécurisé du mot de passe

  ✅ generateTokens() - Génération JWT
    ↳ Création access token (15min)
    ↳ Création refresh token (7 jours)
    ↳ Payload JWT correctement formé
});
```

**Technologies testées :**

- 🔒 JWT (jsonwebtoken)
- 🔐 bcryptjs (hachage)
- 🛡️ class-validator
- 📦 NestJS Guards

### **Frontend Tests**

📁 `frontend/src/app/auth/services/auth.service.spec.ts` - **224 lignes**

```typescript
describe('AuthService', () => {
  ✅ login() - Processus de connexion
    ↳ Envoi credentials vers API
    ↳ Stockage tokens en cookies
    ↳ Gestion erreurs authentification

  ✅ register() - Processus dinscription
    ↳ Validation formulaire
    ↳ Appel API registration
    ↳ Auto-connexion après inscription

  ✅ logout() - Déconnexion sécurisée
    ↳ Suppression tokens
    ↳ Redirection vers landing
    ↳ Nettoyage état utilisateur

  ✅ isAuthenticated() - Vérification statut
    ↳ Check cookies presence
    ↳ Validation token côté serveur
    ↳ Gestion expiration automatique

  ✅ getUserProfile() - Récupération profil
    ↳ Appel API protégée
    ↳ Fallback sur check-auth
    ↳ Gestion erreurs réseau
});
```

**Technologies testées :**

- 🌐 HttpClient (Angular)
- 🍪 Cookies management
- 🔄 RxJS Observables
- 🧭 Router navigation

## 🏠 **INTERFACES UTILISATEUR**

### **Composants Core**

📁 `frontend/src/app/app.component.spec.ts`

```typescript
describe('AppComponent', () => {
  ✅ should create the app
  ✅ should have 'bibliotech' title
  ✅ should render app structure
});
```

📁 `frontend/src/app/home/home.component.spec.ts`

```typescript
describe('HomeComponent', () => {
  ✅ should create - Page d'accueil
    ↳ Configuration complète TestBed
    ↳ Mock AuthService + HttpClient
    ↳ Gestion requêtes automatiques
});
```

📁 `frontend/src/app/features/profile/profile/profile.component.spec.ts`

```typescript
describe('ProfileComponent', () => {
  ✅ should create - Profil utilisateur
    ↳ Mock ActivatedRoute + Router
    ↳ Mock MatSnackBar notifications
    ↳ Gestion animations BrowserAnimationsModule
});
```

**Technologies testées :**

- 🎨 Angular Material
- 📱 Responsive Design
- 🔄 Component lifecycle
- 📊 Data binding

## 📚 **GESTION BIBLIOTHÈQUE**

### **Catalogue & Ressources**

📁 `frontend/src/app/books/book-list/book-list.component.spec.ts`

```typescript
describe('BookListComponent', () => {
  ✅ should create - Liste des livres
    ↳ Mock BookService API calls
    ↳ Gestion pagination
    ↳ Filtres de recherche
});
```

📁 `frontend/src/app/admin/book-edit/book-edit.component.spec.ts`

```typescript
describe('BookEditComponent', () => {
  ✅ should create - Édition livres
    ↳ FormBuilder + ReactiveFormsModule
    ↳ Mock BookService CRUD operations
    ↳ Mock NotificationService feedback
    ↳ ActivatedRoute paramMap handling
    ↳ Admin role verification
});
```

📁 `frontend/src/app/admin/resource-form/resource-form.component.spec.ts`

```typescript
describe('ResourceFormComponent', () => {
  ✅ should create - Formulaire ajout
    ↳ Validation formulaire réactive
    ↳ Upload de fichiers images
    ↳ Types de ressources multiples
});
```

**Technologies testées :**

- 📝 Reactive Forms
- 📋 Form validation
- 📸 File upload
- 🎯 CRUD operations

## 🛠️ **ADMINISTRATION**

### **Interface Admin**

📁 `frontend/src/app/admin/components/contact-tickets/contact-tickets.component.spec.ts`

```typescript
describe('ContactTicketsComponent', () => {
  ✅ should create - Gestion tickets
    ↳ Mock ContactTicketService
    ↳ Mock MatDialog pour modales
    ↳ Prévention erreur tickets.map()
    ↳ Gestion états loading/error
});
```

**Technologies testées :**

- 🎫 Ticketing system
- 📧 Contact management
- 🗃️ Data tables
- 🔧 Admin workflows

## 🔗 **TESTS D'INTÉGRATION**

### **API End-to-End**

📁 `backend/test/app.e2e-spec.ts` - **Amélioré**

```typescript
describe('AppController (e2e)', () => {
  ✅ /health (GET) - Health check
    ↳ Vérification statut serveur
    ↳ Connectivité base de données
    ↳ Réponse JSON structurée

  ✅ API routing integration
    ↳ Middleware configuration
    ↳ CORS settings
    ↳ Error handling global
});
```

**Technologies testées :**

- 🚀 NestJS application bootstrap
- 🗄️ Prisma database connection
- 🌐 HTTP routing
- 🛡️ Global exception filters

## 📋 **CONFIGURATION DES TESTS**

### **Backend Setup**

```typescript
// Jest Configuration
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: { "^.+\\.(t|j)s$": "ts-jest" },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
};
```

### **Frontend Setup**

```typescript
// Karma Configuration
module.exports = function (config) {
  config.set({
    basePath: "",
    frameworks: ["jasmine", "@angular-devkit/build-angular"],
    browsers: ["Chrome", "ChromeHeadless"],
    coverageReporter: {
      dir: require("path").join(__dirname, "./coverage"),
      subdir: ".",
      reporters: [
        { type: "html" },
        { type: "text-summary" },
        { type: "lcovonly" },
      ],
    },
  });
};
```

## 🎯 **PATTERNS DE TESTS UTILISÉS**

### **Backend Patterns**

```typescript
// ✅ Service Testing Pattern
describe("AuthService", () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });
});
```

### **Frontend Patterns**

```typescript
// ✅ Component Testing Pattern
describe("BookEditComponent", () => {
  let component: BookEditComponent;
  let fixture: ComponentFixture<BookEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookEditComponent, HttpClientTestingModule],
      providers: [
        FormBuilder,
        { provide: BookService, useValue: mockBookService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookEditComponent);
    component = fixture.componentInstance;
  });
});
```

## 📊 **MÉTRIQUES DE COUVERTURE**

### **Backend Coverage**

```
=============================== Coverage summary ===============================
Statements   : 85.12% ( 486/571 )
Branches     : 78.95% ( 150/190 )
Functions    : 88.46% ( 138/156 )
Lines        : 84.67% ( 467/552 )
================================================================================
```

### **Frontend Coverage**

```
=============================== Coverage summary ===============================
Statements   : 27.65% ( 338/1222 )
Branches     : 24.63% ( 102/414 )
Functions    : 22.98% ( 77/335 )
Lines        : 28.13% ( 332/1180 )
================================================================================
```

## 🚀 **COMMANDES DE TESTS**

### **Backend**

```bash
# Tests unitaires
npm test

# Tests avec couverture
npm run test:cov

# Tests E2E
npm run test:e2e

# Tests en mode watch
npm run test:watch

# Tests debug
npm run test:debug
```

### **Frontend**

```bash
# Tests unitaires
npm test

# Tests CI (headless)
npm run test:ci

# Tests avec couverture
npm run test:coverage

# Tests watch mode
npm run test:watch
```

## 🔧 **OUTILS DE TEST**

### **Backend Stack**

- 🧪 **Jest** - Framework de test
- 🎯 **Supertest** - Tests HTTP
- 🏗️ **NestJS Testing** - Module de test
- 📊 **Istanbul** - Couverture de code

### **Frontend Stack**

- 🌟 **Jasmine** - Framework de test
- 🏃 **Karma** - Test runner
- 🧪 **Angular Testing Utilities** - TestBed, ComponentFixture
- 📡 **HttpClientTestingModule** - Mock HTTP

## 🎖️ **BONNES PRATIQUES APPLIQUÉES**

✅ **Isolation des tests** - Aucune dépendance entre tests  
✅ **Mocks complets** - Services, HTTP, Router mockés  
✅ **Tests déterministes** - Résultats reproductibles  
✅ **Coverage tracking** - Métriques de qualité  
✅ **Setup/Teardown** - Nettoyage automatique  
✅ **Tests descriptifs** - Noms explicites

## 🔮 **ROADMAP TESTS**

### **Prochaines étapes**

- [ ] **Tests E2E Cypress** - Parcours utilisateur complets
- [ ] **Tests de charge** - Performance sous stress
- [ ] **Tests d'accessibilité** - WCAG compliance
- [ ] **Tests visuels** - Regression UI
- [ ] **Tests de sécurité** - Penetration testing

### **Améliorations**

- [ ] **Couverture Frontend** → 80%+
- [ ] **Tests de mutation** - Quality gates
- [ ] **Tests automatisés** - Pre-commit hooks
- [ ] **Reports avancés** - Coverage trends
