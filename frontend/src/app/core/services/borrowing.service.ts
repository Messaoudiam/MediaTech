import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export enum BorrowingStatus {
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE',
}

export interface Borrowing {
  id: string;
  userId: string;
  copyId: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string;
  status: BorrowingStatus;
  copy?: {
    id: string;
    resourceId: string;
    available: boolean;
    resource?: any;
  };
  user?: {
    id: string;
    email: string;
  };
}

export interface BorrowingResponse {
  items: Borrowing[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class BorrowingService {
  private apiUrl = `${environment.apiUrl}/borrowings`;

  constructor(private http: HttpClient) {}

  /**
   * Créer un nouvel emprunt
   */
  createBorrowing(copyId: string): Observable<Borrowing> {
    console.log("Service - Création d'un emprunt avec l'ID:", copyId);
    console.log('Service - URL API:', this.apiUrl);

    // S'assurer que l'ID est bien une chaîne de caractères
    const cleanCopyId = String(copyId).trim();
    console.log('Service - ID nettoyé:', cleanCopyId);

    // Créer un objet conforme au DTO attendu par le backend
    const payload = { copyId: cleanCopyId };
    console.log('Service - Payload envoyé:', payload);

    return this.http.post<Borrowing>(this.apiUrl, payload, {
      withCredentials: true,
    });
  }

  /**
   * Créer un emprunt pour un utilisateur par un administrateur
   */
  createBorrowingByAdmin(data: {
    userId: string;
    copyId: string;
    dueDate?: string;
    comments?: string;
  }): Observable<Borrowing> {
    const url = `${this.apiUrl}/admin/create`;
    return this.http.post<Borrowing>(url, data, {
      withCredentials: true,
    });
  }

  /**
   * Récupérer tous les emprunts (admin seulement)
   */
  getAllBorrowings(
    status?: BorrowingStatus,
    search?: string,
    page = 1,
    pageSize = 10
  ): Observable<BorrowingResponse> {
    let params = new HttpParams()
      .set('skip', ((page - 1) * pageSize).toString())
      .set('take', pageSize.toString())
      .set('includeResource', 'true')
      .set('includeUser', 'true');

    if (status) {
      params = params.set('status', status);
    }

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<BorrowingResponse>(this.apiUrl, {
      params,
      withCredentials: true,
    });
  }

  /**
   * Récupérer les emprunts de l'utilisateur connecté
   */
  getUserBorrowings(status?: BorrowingStatus): Observable<Borrowing[]> {
    let params = new HttpParams();

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<Borrowing[]>(`${this.apiUrl}/my`, {
      params,
      withCredentials: true,
    });
  }

  /**
   * Récupérer un emprunt par son ID
   */
  getBorrowingById(id: string): Observable<Borrowing> {
    return this.http.get<Borrowing>(`${this.apiUrl}/${id}`, {
      withCredentials: true,
    });
  }

  /**
   * Mettre à jour un emprunt (renouvellement, commentaires, etc.)
   */
  updateBorrowing(id: string, data: any): Observable<Borrowing> {
    return this.http.patch<Borrowing>(`${this.apiUrl}/${id}`, data, {
      withCredentials: true,
    });
  }

  /**
   * Retourner un emprunt
   */
  returnBorrowing(id: string): Observable<Borrowing> {
    return this.http.post<Borrowing>(
      `${this.apiUrl}/${id}/return`,
      {},
      {
        withCredentials: true,
      }
    );
  }

  /**
   * Renouveler un emprunt
   */
  renewBorrowing(id: string): Observable<Borrowing> {
    return this.http.patch<Borrowing>(
      `${this.apiUrl}/${id}`,
      { renew: true },
      {
        withCredentials: true,
      }
    );
  }

  /**
   * Vérifier les emprunts en retard (admin seulement)
   */
  checkOverdueBorrowings(): Observable<{ updated: number }> {
    return this.http.post<{ updated: number }>(
      `${this.apiUrl}/check-overdue`,
      {},
      {
        withCredentials: true,
      }
    );
  }

  /**
   * Formater une date d'échéance pour l'affichage
   */
  formatDueDate(date: string): { text: string; isOverdue: boolean } {
    const dueDate = new Date(date);
    const today = new Date();
    const isOverdue = dueDate < today;

    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    };

    return {
      text: dueDate.toLocaleDateString('fr-FR', options),
      isOverdue,
    };
  }

  /**
   * Calculer le nombre de jours restants avant l'échéance
   */
  getDaysRemaining(date: string): number {
    const dueDate = new Date(date);
    const today = new Date();

    // Réinitialiser les heures pour comparer uniquement les dates
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }
}
