import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private apiUrl = `${environment.apiUrl}/contact`;

  constructor(private http: HttpClient) {}

  /**
   * Envoie une demande de contact
   * @param contactData Les données du formulaire de contact
   */
  submitContactRequest(contactData: ContactRequest): Observable<any> {
    return this.http.post(this.apiUrl, contactData);
  }
}
