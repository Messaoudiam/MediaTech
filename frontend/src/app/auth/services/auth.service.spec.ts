import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { of } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    role: 'user',
  };

  const mockLoginResponse = {
    user: mockUser,
    access_token: 'mock_access_token',
    refresh_token: 'mock_refresh_token',
    message: 'Connexion réussie',
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: Router, useValue: spy }],
    });

    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Créer le service APRÈS avoir configuré httpMock
    service = TestBed.inject(AuthService);

    // Mock console pour éviter les logs de test
    spyOn(console, 'log').and.stub();
    spyOn(console, 'error').and.stub();

    // Gérer la requête automatique de checkAuthStatus qui se déclenche dans le constructeur
    const checkAuthReq = httpMock.match(
      `${environment.apiUrl}/auth/check-auth`
    );
    if (checkAuthReq.length > 0) {
      checkAuthReq[0].flush(null, { status: 401, statusText: 'Unauthorized' });
    }

    // Mock localStorage
    let store: { [key: string]: string } = {};
    spyOn(localStorage, 'getItem').and.callFake(
      (key: string) => store[key] || null
    );
    spyOn(localStorage, 'setItem').and.callFake(
      (key: string, value: string) => (store[key] = value)
    );
    spyOn(localStorage, 'removeItem').and.callFake(
      (key: string) => delete store[key]
    );
    spyOn(localStorage, 'clear').and.callFake(() => (store = {}));
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login user successfully', (done) => {
      const loginData = { email: 'test@example.com', password: 'password' };

      service.login(loginData).subscribe((response) => {
        expect(response.user.email).toBe(loginData.email);
        expect(response.access_token).toBeDefined();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginData);
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockLoginResponse);
    });

    it('should handle login error', (done) => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      const errorResponse = {
        status: 401,
        error: { message: 'Email ou mot de passe incorrect' },
      };

      service.login(loginData).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
          expect(error.error.message).toBe('Email ou mot de passe incorrect');
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(errorResponse.error, {
        status: 401,
        statusText: 'Unauthorized',
      });
    });
  });

  describe('register', () => {
    it('should register user successfully', (done) => {
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      service.register(registerData).subscribe((response) => {
        expect(response.user.email).toBe(registerData.email);
        expect(response.access_token).toBeDefined();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerData);
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockLoginResponse);
    });
  });

  describe('logout', () => {
    it('should logout user and navigate to landing', (done) => {
      service.logout().subscribe(() => {
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/landing']);
        expect(service.currentUser).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush({});
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', (done) => {
      service.isAuthenticated().subscribe((result) => {
        expect(result).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/check-auth`);
      req.flush({ user: mockUser });
    });

    it('should return false when user is not authenticated', (done) => {
      service.isAuthenticated().subscribe((result) => {
        expect(result).toBe(false);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/check-auth`);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('currentUser getter', () => {
    it('should return current user', () => {
      // Simuler un utilisateur connecté
      service['currentUserSubject'].next(mockUser);

      expect(service.currentUser).toEqual(mockUser);
    });

    it('should return null when no user', () => {
      service['currentUserSubject'].next(null);

      expect(service.currentUser).toBeNull();
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile', (done) => {
      service.getUserProfile().subscribe((user) => {
        expect(user).toEqual(mockUser);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/profile`);
      req.flush(mockUser);
    });

    it('should fallback to check-auth endpoint on 404', (done) => {
      service.getUserProfile().subscribe((user) => {
        expect(user).toEqual(mockUser);
        done();
      });

      const profileReq = httpMock.expectOne(
        `${environment.apiUrl}/auth/profile`
      );
      profileReq.flush(null, { status: 404, statusText: 'Not Found' });

      const checkAuthReq = httpMock.expectOne(
        `${environment.apiUrl}/auth/check-auth`
      );
      checkAuthReq.flush({ user: mockUser });
    });
  });
});
