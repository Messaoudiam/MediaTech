import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/api/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('app');
          expect(res.body).toHaveProperty('system');
          expect(res.body).toHaveProperty('memory');
          expect(res.body).toHaveProperty('database');
        });
    });
  });

  describe('Authentication Flow', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('refresh_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('email', testUser.email);
        });
    });

    it('should login with valid credentials', async () => {
      // First register the user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser);

      // Then login
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send(testUser)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('refresh_token');
          expect(res.body).toHaveProperty('user');
        });
    });

    it('should reject login with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('Protected Routes', () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and login to get auth token
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'protected@example.com',
          password: 'password123',
        });

      authToken = response.body.access_token;
    });

    it('should access protected route with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should reject access without token', () => {
      return request(app.getHttpServer()).get('/api/users/profile').expect(401);
    });

    it('should reject access with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
