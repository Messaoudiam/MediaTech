import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ContactTicket {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
  isResolved?: boolean; // Propriété calculée côté frontend
  userId?: string;
  status: string; // PENDING, IN_PROGRESS, RESOLVED, CLOSED
  user?: {
    id: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ContactTicketService {
  private apiUrl = `${environment.apiUrl}/contact/requests`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les tickets de contact
   */
  getAllTickets(): Observable<ContactTicket[]> {
    return this.http.get<ContactTicket[]>(this.apiUrl);
  }

  /**
   * Récupère un ticket par son ID
   */
  getTicketById(id: string): Observable<ContactTicket> {
    return this.http.get<ContactTicket>(`${this.apiUrl}/${id}`);
  }

  /**
   * Marque un ticket comme résolu
   */
  markAsResolved(id: string): Observable<ContactTicket> {
    return this.http.patch<ContactTicket>(`${this.apiUrl}/${id}/resolve`, {});
  }

  /**
   * Répondre à un ticket
   */
  replyToTicket(id: string, response: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/reply`, { response });
  }
}
