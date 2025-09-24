<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

SMTrack Authentication Service - A NestJS-based microservice for user authentication and management with integrated logging and monitoring capabilities.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Features

- 🔐 **JWT Authentication** - Secure token-based authentication
- 👥 **User Management** - Complete CRUD operations for users
- 🏥 **Hospital & Ward Management** - Multi-tenant hospital and ward system
- 📊 **Structured Logging** - Winston-based JSON logging for Grafana Loki
- 🐰 **Message Queue Integration** - RabbitMQ for inter-service communication
- 🗄️ **Database** - Prisma ORM with PostgreSQL
- 🚀 **Redis Caching** - Performance optimization with Redis
- 🔍 **Health Checks** - Built-in health monitoring
- 🛡️ **Role-Based Access Control** - Granular permission system

## Architecture

This service follows a modular architecture with:

- **Authentication Module**: JWT-based auth with refresh tokens
- **User Module**: User management with role-based permissions
- **Hospital Module**: Hospital management and configuration
- **Ward Module**: Ward management within hospitals
- **Common Module**: Shared utilities, guards, and interceptors

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/smtrack_auth"

# JWT Secrets
JWT_SECRET="your-jwt-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
EXPIRE_TIME="1h"
REFRESH_EXPIRE_TIME="7d"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD="your-redis-password"

# RabbitMQ
RABBITMQ="amqp://localhost:5672"

# Upload Service
UPLOAD_PATH="http://localhost:3001"

# Application
PORT=8080
NODE_ENV="development"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
```

## Database Setup

```bash
# Generate Prisma client
$ npx prisma generate

# Run database migrations
$ npx prisma migrate dev

# Seed database (if seed file exists)
$ npx prisma db seed
```

## Logging

The application uses Winston for structured JSON logging, specifically configured for Grafana Loki integration:

- **Error Level**: Server errors (5xx status codes)
- **Warn Level**: Client errors (4xx status codes) and warnings
- **Format**: JSON with timestamp, service name, and contextual metadata
- **Output**: stdout for container log collection

### Log Structure

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "error",
  "message": "Failed to create user",
  "service": "smtrack-auth-service",
  "error": {
    "message": "Database connection failed",
    "stack": "Error: Database connection failed..."
  },
  "userId": "user-123",
  "action": "create_user"
}
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh JWT token
- `PUT /auth/reset-password/:username` - Reset user password

### Users
- `GET /auth/users` - Get all users (role-based filtering)
- `GET /auth/users/:id` - Get user by ID
- `PUT /auth/users/:id` - Update user
- `DELETE /auth/users/:id` - Delete user

### Hospitals
- `GET /auth/hospitals` - Get hospitals
- `GET /auth/hospitals/:id` - Get hospital by ID
- `POST /auth/hospitals` - Create hospital
- `PUT /auth/hospitals/:id` - Update hospital
- `DELETE /auth/hospitals/:id` - Delete hospital

### Wards
- `GET /auth/wards` - Get wards
- `GET /auth/wards/:id` - Get ward by ID
- `POST /auth/wards` - Create ward
- `PUT /auth/wards/:id` - Update ward
- `DELETE /auth/wards/:id` - Delete ward

### Health Check
- `GET /auth/health` - Application health status

## Role-Based Access Control

The system supports multiple user roles:

- **SUPER**: Full system access
- **SERVICE**: Cross-hospital service access
- **ADMIN**: Hospital administrator access
- **LEGACY_ADMIN**: Legacy system administrator

## Monitoring & Observability

- **Health Checks**: Built-in health endpoint for monitoring
- **Structured Logging**: JSON logs for log aggregation systems
- **Error Tracking**: Comprehensive error logging with context
- **Performance Monitoring**: Request timing and caching metrics

## Development

```bash
# Install dependencies
$ npm install

# Start development server
$ npm run start:dev

# Format code
$ npm run format

# Lint code
$ npm run lint
```

## Production Deployment

```bash
# Build for production
$ npm run build

# Start production server
$ npm run start:prod
```

## Docker Deployment

The service includes a Dockerfile for containerized deployment. Ensure all environment variables are properly configured in your container orchestration platform.

## Contributing

1. Follow the established code style and patterns
2. Add appropriate logging for new features
3. Include error handling with proper HTTP status codes
4. Update documentation for new endpoints or features

## Troubleshooting

### Common Issues

1. **Database Connection**: Verify DATABASE_URL and database availability
2. **Redis Connection**: Check Redis configuration and connectivity
3. **RabbitMQ**: Ensure RabbitMQ is running and accessible
4. **JWT Errors**: Verify JWT secrets are properly configured
