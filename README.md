# Full Stack Project

A modern full-stack web application built with Angular 19 (frontend) and NestJS (backend).

## 📋 Project Overview

This project is a comprehensive full-stack solution that demonstrates modern web development practices.
It's designed to showcase technical skills and best practices.

## 🚀 Technology Stack

### Frontend

- Angular 19
- Angular Material UI
- RxJS
- TypeScript

### Backend

- NestJS framework
- Prisma ORM
- PostgreSQL database
- JWT authentication
- Swagger API documentation

### DevOps

- Docker & Docker Compose for containerization
- GitHub Actions for CI/CD

## ✨ Features

- Modern and responsive UI with Angular Material
- RESTful API with NestJS
- Database integration with PostgreSQL and Prisma
- Authentication and authorization
- Containerized development and production environments

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- Git

### Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/mon-projet-fullstack.git
   cd mon-projet-fullstack
   ```

2. **Development Setup**

   For local development without Docker:

   **Backend:**

   ```bash
   cd backend
   npm install
   npm run prisma:generate
   npm run start:dev
   ```

   **Frontend:**

   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Using Docker (Recommended)**

   ```bash
   # Build and start all services
   docker-compose up -d

   # View logs
   docker-compose logs -f

   # Stop all services
   docker-compose down
   ```

   This will start:

   - Frontend: http://localhost:4001
   - Backend API: http://localhost:4000
   - PostgreSQL Database: localhost:4002

## 📚 API Documentation

Once the backend is running, access the Swagger documentation at:

```
http://localhost:4000/api
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
# Run all tests
npm test

# Run with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 📁 Project Structure

```
mon-projet-fullstack/
├── frontend/            # Angular application
│   ├── src/             # Source code
│   ├── dist/            # Compiled output
│   └── package.json     # Dependencies
├── backend/             # NestJS API server
│   ├── src/             # Source code
│   ├── prisma/          # Database schema and migrations
│   └── package.json     # Dependencies
├── .docker/             # Docker configuration
└── docker-compose.yml   # Docker Compose configuration
```

## 🔒 Environment Variables

This project uses environment variables for configuration. Create the following files:

- `backend/.env.development`
- `backend/.env.production`

Example configuration:

```
# Database
DATABASE_URL="postgresql://postgres:password@db:5432/myapp"

# Authentication
JWT_SECRET="your-jwt-secret"
JWT_EXPIRATION="1d"

# API
PORT=3000
```

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the [MIT License](LICENSE).

## 📧 Contact

[![Email](https://img.shields.io/badge/-Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:codingmessaoud@gmail.com)
