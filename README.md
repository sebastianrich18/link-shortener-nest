# Link Shortener

A URL shortening API built with NestJS, Prisma, and PostgreSQL.

## Prerequisites

- Node.js
- Docker (for PostgreSQL)

## Setup

```bash
# install dependencies (also generates Prisma client via postinstall)
npm install

# start the database
docker compose up -d

# run migrations
npx prisma migrate dev
```

Create a `.env` file in the project root:

```
DATABASE_URL=postgresql://admin:admin@localhost:5432/linkshortener
JWT_SECRET=your-secret-here
```

## Running

```bash
# development (watch mode)
npm run start:dev

# production
npm run build
npm run start:prod
```

## Testing

```bash
# unit tests
npm test

# e2e tests
npm run test:e2e
```

Both commands include coverage reports. Unit test coverage outputs to `coverage/`, e2e to `coverage/e2e/`.

## URLs

| URL | Description |
|-----|-------------|
| `http://localhost:3000/admin` | AdminJS dashboard |
| `http://localhost:3000/api` | Swagger UI |
| `http://localhost:3000/api-json` | OpenAPI spec (JSON) |

## API

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/health` | No | Health check |
| POST | `/register` | No | Register a new user |
| POST | `/login` | No | Login and receive a JWT |
| POST | `/link` | Yes | Create a shortened link |
| GET | `/link/:slug` | Yes | Get link details (owner only) |
| PUT | `/link/:slug` | Yes | Update a link (owner only) |
| GET | `/:slug` | No | Redirect to target URL |
