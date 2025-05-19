import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { ReviewService } from '../../../core/services/review.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../auth/services/auth.service';
import {
  Review,
  CreateReviewDto,
  UpdateReviewDto,
} from '../../../core/models/review.model';
import { catchError, finalize, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-book-reviews',
  templateUrl: './book-reviews.component.html',
  styleUrls: ['./book-reviews.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSliderModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
})
export class BookReviewsComponent implements OnInit {
  @Input() resourceId!: string;
  @Input() resourceTitle!: string;

  reviews: Review[] = [];
  userReview: Review | null = null;
  isAuthenticated = false;
  loading = true;
  submitting = false;
  reviewForm: FormGroup;
  editMode = false;

  constructor(
    private reviewService: ReviewService,
    private authService: AuthService,
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.reviewForm = this.fb.group({
      content: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(1000),
        ],
      ],
      rating: [null, [Validators.min(1), Validators.max(5)]],
    });
  }

  ngOnInit(): void {
    this.authService.isAuthenticated().subscribe((isAuth) => {
      this.isAuthenticated = isAuth;
      this.loadReviews();
    });
  }

  loadReviews(): void {
    this.loading = true;

    // Récupérer les avis pour cette ressource
    this.reviewService
      .getReviewsByResource(this.resourceId)
      .pipe(
        switchMap((reviews) => {
          this.reviews = reviews;

          // Si l'utilisateur est authentifié, récupérer son avis
          if (this.isAuthenticated) {
            return this.reviewService
              .getUserReviewForResource(this.resourceId)
              .pipe(catchError(() => of(null)));
          }
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((userReview) => {
        if (userReview) {
          this.userReview = userReview;
          this.initEditForm();
        }
      });
  }

  private initEditForm(): void {
    if (this.userReview) {
      this.reviewForm.patchValue({
        content: this.userReview.content,
        rating: this.userReview.rating,
      });
    }
  }

  onSubmit(): void {
    if (this.reviewForm.invalid) {
      return;
    }

    this.submitting = true;
    const formData = this.reviewForm.value;

    if (this.userReview) {
      // Mettre à jour l'avis existant
      const updateDto: UpdateReviewDto = {
        content: formData.content,
        rating: formData.rating,
      };

      this.reviewService
        .updateReview(this.resourceId, updateDto)
        .pipe(
          finalize(() => {
            this.submitting = false;
            this.editMode = false;
          })
        )
        .subscribe({
          next: (updatedReview) => {
            this.userReview = updatedReview;
            this.notificationService.success('Votre avis a été mis à jour');
            this.loadReviews();
          },
          error: (error) => {
            this.notificationService.error(
              'Erreur lors de la mise à jour de votre avis'
            );
          },
        });
    } else {
      // Créer un nouvel avis
      const createDto: CreateReviewDto = {
        resourceId: this.resourceId,
        content: formData.content,
        rating: formData.rating,
      };

      this.reviewService
        .createReview(createDto)
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe({
          next: (newReview) => {
            this.userReview = newReview;
            this.notificationService.success('Votre avis a été publié');
            this.reviewForm.reset();
            this.loadReviews();
          },
          error: (error) => {
            this.notificationService.error(
              'Erreur lors de la publication de votre avis'
            );
          },
        });
    }
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.initEditForm();
    }
  }

  deleteReview(): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre avis ?')) {
      return;
    }

    this.submitting = true;
    this.reviewService
      .deleteReview(this.resourceId)
      .pipe(
        finalize(() => {
          this.submitting = false;
        })
      )
      .subscribe({
        next: () => {
          this.userReview = null;
          this.notificationService.info('Votre avis a été supprimé');
          this.reviewForm.reset();
          this.loadReviews();
        },
        error: (error) => {
          this.notificationService.error(
            'Erreur lors de la suppression de votre avis'
          );
        },
      });
  }

  // Fonctions utilitaires pour les étoiles
  getStarArray(rating: number | undefined): number[] {
    return rating ? Array(rating).fill(0) : [];
  }

  getEmptyStarArray(rating: number | undefined): number[] {
    return rating ? Array(5 - rating).fill(0) : Array(5).fill(0);
  }
}
