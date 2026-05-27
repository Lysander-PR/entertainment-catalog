# 🎬 Entertainment Catalog API

A complete RESTful API for managing an entertainment catalog (movies, books, albums, and songs) built with NestJS, designed to serve information to multimedia content presentation applications.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Endpoints](#-api-endpoints)
- [Documentation](#-documentation)
- [Docker](#-docker)
- [Available Scripts](#-available-scripts)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Main Functionalities

- **Complete CRUD**: Create, Read, Update, and Delete operations for all entertainment types
- **File Management**: Upload and management of cover images using Supabase Storage
- **Cache System**: Redis implementation to optimize frequent queries
- **Pagination**: Configurable pagination system in all listing endpoints
- **Robust Validation**: Multi-layer data validation with `class-validator` and `zod`
- **Interactive Documentation**: API automatically documented with Swagger/OpenAPI
- **Seed Data**: Endpoint to populate the database with sample data
- **HTTP Logging**: Custom middleware for logging all HTTP requests

### Advanced Technical Features

- **Input Sanitization**: Custom `@CleanInput()` decorator to clean and normalize input data
- **Error Handling**: Global filters for database, validation, and storage errors
- **Serialization**: Precise control of exposed data using `class-transformer`
- **Interceptors**: Global cache interceptor for automatic optimization
- **Custom Pipes**: File validation with type and size restrictions
- **TypeORM Relations**: Optimized entity relationships with eager/lazy loading

## 🛠 Tech Stack

### DevOps

- **Containerization**: Docker and Docker Compose
- **Package Manager**: [pnpm](https://pnpm.io/)

## 🏗 Architecture

The project follows a modular architecture based on Clean Architecture:

```
src/
├── albums/           # Albums module
├── books/            # Books module
├── movies/           # Movies module
├── songs/            # Songs module
├── genres/           # Genres module
├── files/            # File management module
├── common/           # Shared utilities
│   ├── decorators/   # Custom decorators
│   ├── filters/      # Exception filters
│   ├── helpers/      # Helper functions
│   ├── interceptors/ # Interceptors
│   ├── middleware/   # HTTP middleware
│   └── pipes/        # Validation pipes
├── config/           # Application configuration
└── seed/             # Initialization data
```

Each module follows the pattern:

```
module/
├── dto/              # Data Transfer Objects
├── entities/         # TypeORM entities
├── types/            # Types, interfaces, and constants
├── module.controller.ts
├── module.service.ts
└── module.module.ts
```

## 📋 Prerequisites

- Docker and Docker Compose (optional but recommended)
- Supabase account (for file storage)

## 🚀 Installation

### Option 1: Local Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/entertaiments-catalog.git
cd entertaiments-catalog
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Configure environment variables** (see [Configuration](#-configuration) section)

4. **Start services with Docker Compose**

```bash
docker-compose up -d
```

5. **Start the application**

```bash
pnpm run start:dev
```

### Option 2: With Docker Compose (Production)

```bash
# Using the production compose
docker-compose -f docker-compose.prod.yaml up -d
```

## ⚙ Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Application
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password_seguro
DB_NAME=entertainments_db

# Supabase Storage
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu_supabase_anon_key
SUPABASE_BUCKET=entertainments-covers

# Redis Cache
REDIS_URL=redis://localhost:6379
```

### Supabase Configuration

1. Create a project in [Supabase](https://supabase.com)
2. Create a bucket named `entertainments-covers` (or your preferred name)
3. Configure public access policies for reading
4. Copy the URL and anonymous API Key

## 💻 Usage

### Start the Development Server

```bash
pnpm run start:dev
```

The application will be available at `http://localhost:3000`

### Populate the Database

To load sample data:

```bash
curl -X POST http://localhost:3000/api/seed
```

### Access the Documentation

Swagger UI: `http://localhost:3000/api`

## 📡 API Endpoints

All endpoints are prefixed with `/api`

### Pagination Parameters

For listing endpoints:

```
GET /api/movies?limit=10&offset=0
```

- `limit`: Number of results (default: 10)
- `offset`: Number of results to skip (default: 0)

### Example Request with Cover

```bash
curl -X POST http://localhost:3000/api/movies \
  -F "title=Dune" \
  -F "director=Denis Villeneuve" \
  -F "writer=Jon Spaihts" \
  -F "studio=Warner Bros" \
  -F "protagonist=Timothee Chalamet" \
  -F "releaseDate=2021-10-22" \
  -F "cover=@/path/to/image.jpg"
```

## 📚 Documentation

### Swagger UI

The interactive API documentation is available at:

```
http://localhost:3000/api
```

Here you can:

- View all available endpoints
- Test requests directly from the browser
- View request/response schemas
- Download the OpenAPI specification

## 🐳 Docker

### Multi-Stage Dockerfile

The project uses an optimized Dockerfile with multi-stage builds:

1. **dev-deps**: Installs development dependencies
2. **builder**: Compiles the TypeScript project
3. **prod-deps**: Installs only production dependencies
4. **prod**: Optimized final image (~200MB)

### Docker Compose for Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Included services:

- PostgreSQL (port 5432)
- Redis (port 6379)

### Docker Compose for Production

```bash
docker-compose -f docker-compose.prod.yaml up -d
```

Included services:

- App (port configured in .env)
- Redis (port 6379)

> **Note**: In production, PostgreSQL is expected to be on an external service (RDS, etc.)

### Build Docker Image

```bash
# Build image
docker build -t entertaiments-api:latest .

# Build with specific tag
docker build -t entertaiments-api:1.0.0 .

# Publish to Docker Hub
docker tag entertaiments-api:1.0.0 yourusername/entertaiments:1.0.0
docker push yourusername/entertaiments:1.0.0
```

## 🎯 Available Scripts

### Code Quality

```bash
# Run linter
pnpm run lint

# Format code
pnpm run format
```

### Testing

```bash
# Run unit tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:cov

# Run E2E tests
pnpm run test:e2e
```

## 🧪 Testing

The project includes configuration for:

- **Jest**: Testing framework
- **Unit tests**: For services and controllers
- **E2E tests**: For complete application flows

### Run Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm run test:e2e

# Coverage
pnpm run test:cov
```

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🌟 Future Features

- [ ] JWT authentication and authorization
- [ ] Rate limiting
