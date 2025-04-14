// angular
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../../auth/models/auth.model';

export interface UserRoleUpdate {
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste de tous les utilisateurs
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl, {
      withCredentials: true,
    });
  }

  /**
   * Met à jour le rôle d'un utilisateur
   * @param userId ID de l'utilisateur
   * @param role Nouveau rôle
   */
  updateUserRole(userId: string, role: string): Observable<User> {
    return this.http.put<User>(
      `${this.apiUrl}/${userId}/role`,
      { role },
      {
        withCredentials: true,
      }
    );
  }
}
