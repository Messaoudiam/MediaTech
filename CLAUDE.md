# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MediaTech is a fullstack library management system built with Angular 19 (frontend) and NestJS (backend), using PostgreSQL with Prisma ORM. The project uses Docker for development and deployment.

## Common Commands

### Docker Development (Recommended)
- `npm run docker:up` - Start all services (frontend, backend, database)
- `npm run docker:down` - Stop all services
- `npm run docker:build` - Build Docker images
- `npm run docker:logs` - View logs
- `npm run docker:clean` - Clean volumes and containers
- `npm run prisma:migrate` - Apply database migrations after Docker start

### Backend (NestJS)
- `cd backend && npm run start:dev` - Start in development mode with watch
- `cd backend && npm run build` - Build for production
- `cd backend && npm run lint` - Run ESLint with auto-fix
- `cd backend && npm run format` - Format code with Prettier
- `cd backend && npm test` - Run unit tests
- `cd backend && npm run test:e2e` - Run end-to-end tests
- `cd backend && npm run test:cov` - Run tests with coverage
- `cd backend && npm run prisma:generate` - Generate Prisma client

### Frontend (Angular)
- `cd frontend && npm start` - Start development server
- `cd frontend && npm run build` - Build for development
- `cd frontend && npm run build:prod` - Build for production
- `cd frontend && npm test` - Run unit tests
- `cd frontend && npm run test:ci` - Run tests in CI mode (headless)

### Cross-project Commands
- `npm run test:ci` - Run all tests (backend and frontend)
- `npm run audit:fix` - Fix npm audit issues in both projects

## Project Architecture

### Backend Structure (src/)
- `auth/` - JWT authentication, guards, decorators
- `users/` - User management and profiles
- `resources/` - Library catalog (books, DVDs, games, magazines)
- `borrowings/` - Borrowing system and management
- `reviews/` - User reviews and ratings system
- `contacts/` - Contact form handling
- `prisma/` - Database schema and migrations

### Frontend Structure (src/app/)
- `auth/` - Authentication module and guards
- `core/` - Global services, guards, interceptors
- `shared/` - Reusable components and utilities
- `features/` - Feature modules (resources, borrowings, reviews)
- `pages/` - Main page components

### Database Schema
The project uses PostgreSQL with Prisma ORM. Key entities:
- **User** - Authentication and user profiles with role-based access
- **Resource** - Multi-type catalog (BOOK, DVD, GAME, MAGAZINE, AUDIOBOOK, COMIC)
- **Copy** - Physical copies of resources available for borrowing
- **Borrowing** - Loan tracking with due dates and status
- **Review** - User reviews and ratings for resources
- **Favorite** - User favorite resources
- **Session** - JWT session management

## Development Guidelines

### Technology Stack
- **Frontend**: Angular 19, Angular Material, TypeScript, RxJS
- **Backend**: NestJS, Prisma ORM, PostgreSQL, JWT authentication
- **DevOps**: Docker, Docker Compose, GitHub Actions

### Key Features
- JWT authentication with refresh tokens
- Role-based access control (USER/ADMIN)
- Multi-resource catalog management
- Borrowing system with due date tracking
- User reviews and ratings
- Responsive design with Angular Material
- Full Docker containerization

### Port Configuration
- Frontend: http://localhost:4001
- Backend API: http://localhost:4000
- Swagger Documentation: http://localhost:4000/api/docs
- PostgreSQL: localhost:4002

### Environment Setup
Backend environment files are located in `backend/.env.development` and `backend/.env.production`. Copy from `backend/env.example` for initial setup.

## Testing Strategy

### Backend Testing
- Unit tests with Jest (85%+ coverage target)
- E2E tests for API endpoints
- Authentication and authorization testing
- Database integration testing

### Frontend Testing
- Unit tests with Jasmine/Karma
- Component testing with Angular Testing Utilities
- Service and routing tests
- Use `npm run test:ci` for headless testing

## Development Workflow

1. Start with `npm run docker:up` for full environment
2. Apply database migrations with `npm run prisma:migrate`
3. Access services at the configured ports
4. Run tests before committing changes
5. Use linting and formatting tools in both projects

## Additional Notes

- The project includes comprehensive Swagger API documentation
- Authentication uses JWT with refresh token strategy
- Database migrations are handled through Prisma
- The frontend uses Angular Material for UI components
- Docker configuration supports both development and production environments