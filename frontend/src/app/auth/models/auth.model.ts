export interface User {
  id?: string;
  email: string;
  nom: string;
  prenom: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword?: string;
  nom: string;
  prenom: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}
