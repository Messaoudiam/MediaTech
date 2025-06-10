// angular
import { Routes } from '@angular/router';

// components - Keep only essential/shared components
import { HomeComponent } from './home/home.component';
import { LandingComponent } from './landing/landing.component';
import { ContactComponent } from './pages/contact/contact.component';

// guards
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { path: 'landing', component: LandingComponent },
  {
    path: 'contact',
    component: ContactComponent,
    title: 'Contact - Médiathèque',
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard],
    data: { requiredRole: 'USER' },
  },
  // Lazy loaded routes with standalone components (Modern Angular approach)
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then((r) => r.AUTH_ROUTES),
  },
  {
    path: 'books',
    loadChildren: () =>
      import('./books/books.routes').then((r) => r.BOOKS_ROUTES),
  },
  {
    path: 'dvds',
    loadChildren: () =>
      import('./books/books.routes').then((r) => r.BOOKS_ROUTES),
  },
  {
    path: 'games',
    loadChildren: () =>
      import('./books/books.routes').then((r) => r.BOOKS_ROUTES),
  },
  {
    path: 'magazines',
    loadChildren: () =>
      import('./books/books.routes').then((r) => r.BOOKS_ROUTES),
  },
  {
    path: 'resources',
    loadChildren: () =>
      import('./books/books.routes').then((r) => r.BOOKS_ROUTES),
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./books/search/search.component').then((c) => c.SearchComponent),
  },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    data: { requiredRole: 'ADMIN' },
    loadChildren: () =>
      import('./admin/admin.routes').then((r) => r.ADMIN_ROUTES),
  },
  {
    path: 'features',
    loadChildren: () =>
      import('./features/features.routes').then((r) => r.FEATURES_ROUTES),
  },
  // Direct lazy loading for specific components (backwards compatibility)
  {
    path: 'borrowings',
    canActivate: [AuthGuard],
    data: { requiredRole: 'USER' },
    loadChildren: () =>
      import('./features/borrowing/borrowing.module').then(
        (m) => m.BorrowingModule
      ),
  },
  {
    path: 'profile',
    canActivate: [AuthGuard],
    data: { requiredRole: 'USER' },
    loadComponent: () =>
      import('./features/profile/profile.component').then(
        (c) => c.ProfileComponent
      ),
  },
  {
    path: 'favorites',
    canActivate: [AuthGuard],
    data: { requiredRole: 'USER' },
    loadComponent: () =>
      import('./features/favorites/favorites.component').then(
        (c) => c.FavoritesComponent
      ),
  },
  // Specific route for verify-email (standalone component)
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./auth/components/verify-email/verify-email.component').then(
        (c) => c.VerifyEmailComponent
      ),
  },
  { path: '**', redirectTo: '/landing' },
];
