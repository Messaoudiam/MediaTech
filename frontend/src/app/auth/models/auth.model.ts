export interface User {
  id?: string;
  email: string;
  nom?: string;
  prenom?: string;
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
  nom?: string;
  prenom?: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
  access_token?: string;
  refresh_token?: string;
  message?: string;
}
