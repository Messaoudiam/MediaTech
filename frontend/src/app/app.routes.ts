// angular
import { Routes } from '@angular/router';

// components
import { LoginComponent } from './auth/components/login/login.component';
import { RegisterComponent } from './auth/components/register/register.component';
import { HomeComponent } from './home/home.component';
import { AdminDashboardComponent } from './admin/admin-dashboard.component';
import { LandingComponent } from './landing/landing.component';
import { BookDetailComponent } from './books/book-detail/book-detail.component';
import { SearchComponent } from './books/search/search.component';
import { BookFormComponent } from './admin/book-form/book-form.component';
import { ResourceFormComponent } from './admin/resource-form/resource-form.component';
import { BookListComponent as AdminBookListComponent } from './admin/book-list/book-list.component';
import { BookEditComponent } from './admin/book-edit/book-edit.component';
import { BookListComponent } from './books/book-list/book-list.component';
import { AdminBorrowingsComponent } from './admin/components/borrowing-management/admin-borrowings.component';
import { ProfileComponent } from './features/profile/profile.component';
import { FavoritesComponent } from './features/favorites/favorites.component';

// guards
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { path: 'landing', component: LandingComponent },
  { path: 'books/all', component: BookListComponent },
  { path: 'books/:id', component: BookDetailComponent },
  { path: 'dvds/:id', component: BookDetailComponent },
  { path: 'games/:id', component: BookDetailComponent },
  { path: 'magazines/:id', component: BookDetailComponent },
  { path: 'resources/:id', component: BookDetailComponent },
  { path: 'search', component: SearchComponent },
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
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
    component: ProfileComponent,
    canActivate: [AuthGuard],
    data: { requiredRole: 'USER' },
  },
  {
    path: 'favorites',
    component: FavoritesComponent,
    canActivate: [AuthGuard],
    data: { requiredRole: 'USER' },
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard],
    data: { requiredRole: 'USER' },
  },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    data: { requiredRole: 'ADMIN' },
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'add-book', component: ResourceFormComponent },
      { path: 'add-resource', component: ResourceFormComponent },
      { path: 'books', component: AdminBookListComponent },
      { path: 'edit-book/:id', component: BookEditComponent },
      { path: 'dashboard', redirectTo: '', pathMatch: 'full' },
      { path: 'borrowings', component: AdminBorrowingsComponent },
    ],
  },
  { path: '**', redirectTo: '/landing' },
];
