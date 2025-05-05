import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmButtonText: string;
  cancelButtonText: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>
        {{ data.title }}
      </h2>
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions>
        <button mat-stroked-button (click)="dialogRef.close(false)">
          {{ data.cancelButtonText }}
        </button>
        <button mat-raised-button color="primary" [mat-dialog-close]="true">
          {{ data.confirmButtonText }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .dialog-container {
        padding: 0 24px;
      }

      h2 {
        margin: 16px 0;
        color: #3f51b5;
        font-weight: 500;
      }

      mat-dialog-content {
        min-width: 300px;
        color: rgba(0, 0, 0, 0.7);
        margin-bottom: 24px;
      }

      mat-dialog-actions {
        padding: 16px 0 24px;
        display: flex;
        justify-content: flex-end;
        gap: 16px;
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
