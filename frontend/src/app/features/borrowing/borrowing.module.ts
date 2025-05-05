import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';

// Components
import { UserBorrowingsComponent } from './user-borrowings/user-borrowings.component';
import { BorrowingDetailComponent } from './borrowing-detail/borrowing-detail.component';
import { BorrowingListComponent } from './borrowing-list/borrowing-list.component';
import { BorrowDialogComponent } from './borrow-dialog/borrow-dialog.component';
import { AdminBorrowingsComponent } from '../../admin/components/borrowing-management/admin-borrowings.component';

const routes: Routes = [
  { path: '', component: UserBorrowingsComponent },
  { path: 'admin', component: AdminBorrowingsComponent },
  { path: ':id', component: BorrowingDetailComponent },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDividerModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatBadgeModule,
    // Importer les composants standalone
    UserBorrowingsComponent,
    BorrowingDetailComponent,
    BorrowingListComponent,
    BorrowDialogComponent,
    AdminBorrowingsComponent,
  ],
  exports: [],
})
export class BorrowingModule {}
