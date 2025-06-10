import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-dashboard.component').then(
        (c) => c.AdminDashboardComponent
      ),
  },
  {
    path: 'add-book',
    loadComponent: () =>
      import('./resource-form/resource-form.component').then(
        (c) => c.ResourceFormComponent
      ),
  },
  {
    path: 'add-resource',
    loadComponent: () =>
      import('./resource-form/resource-form.component').then(
        (c) => c.ResourceFormComponent
      ),
  },
  {
    path: 'books',
    loadComponent: () =>
      import('./book-list/book-list.component').then(
        (c) => c.BookListComponent
      ),
  },
  {
    path: 'edit-book/:id',
    loadComponent: () =>
      import('./book-edit/book-edit.component').then(
        (c) => c.BookEditComponent
      ),
  },
  {
    path: 'borrowings',
    loadComponent: () =>
      import(
        './components/borrowing-management/admin-borrowings.component'
      ).then((c) => c.AdminBorrowingsComponent),
  },
  {
    path: 'contact-tickets',
    loadComponent: () =>
      import('./components/contact-tickets/contact-tickets.component').then(
        (c) => c.ContactTicketsComponent
      ),
  },
  { path: 'dashboard', redirectTo: '', pathMatch: 'full' },
];
