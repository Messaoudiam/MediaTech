import { Routes } from '@angular/router';
import { AuthGuard } from '../core/guards/auth.guard';

export const FEATURES_ROUTES: Routes = [
  {
    path: 'profile',
    loadComponent: () =>
      import('./profile/profile.component').then((c) => c.ProfileComponent),
    canActivate: [AuthGuard],
    data: { requiredRole: 'USER' },
  },
  {
    path: 'favorites',
    loadComponent: () =>
      import('./favorites/favorites.component').then(
        (c) => c.FavoritesComponent
      ),
    canActivate: [AuthGuard],
    data: { requiredRole: 'USER' },
  },
  {
    path: 'borrowings',
    canActivate: [AuthGuard],
    data: { requiredRole: 'USER' },
    loadChildren: () =>
      import('./borrowing/borrowing.module').then((m) => m.BorrowingModule),
  },
];
