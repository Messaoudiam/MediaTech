import { Routes } from '@angular/router';

export const BOOKS_ROUTES: Routes = [
  {
    path: 'all',
    loadComponent: () =>
      import('./book-list/book-list.component').then(
        (c) => c.BookListComponent
      ),
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./search/search.component').then((c) => c.SearchComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./book-detail/book-detail.component').then(
        (c) => c.BookDetailComponent
      ),
  },
];
