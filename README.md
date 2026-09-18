# To Be Take

A modern, production-ready full-stack enterprise monorepo workspace designed for high scalability, type-safety, and modular architecture across Web, Mobile, and API services.

---

## 🏗️ Architecture & Technology Stack

The project is architected as an integrated Turborepo monorepo powered by `pnpm` workspaces:

- **Backend API (`apps/api`)**: [NestJS](https://nestjs.com/) (TypeScript, Modular Architecture, ConfigModule, Health endpoint, Jest).
- **Web Application (`apps/web`)**: [Next.js](https://nextjs.org/) 14+ (TypeScript, React 18, App Router, SSR/SSG).
- **Mobile Application (`apps/mobile`)**: [React Native](https://reactnative.dev/) with [Expo SDK](https://expo.dev/) (TypeScript, Cross-platform iOS/Android/Web).
- **Database Layer (`packages/database`)**: [PostgreSQL](https://www.postgresql.org/) & [Prisma ORM](https://www.prisma.io/) (client generation, migration workflows, injectable NestJS `PrismaService`).
- **Shared Types (`packages/shared-types`)**: Universal TypeScript contracts, DTOs, and API responses shared across API, Web, and Mobile.
- **Shared Tooling (`packages/eslint-config`, `packages/tsconfig`)**: Centralized ESLint and TypeScript configs enforcing consistent coding standards across all workspaces.
- **Monorepo Orchestration**: [Turborepo](https://turbo.build/repo) + [pnpm](https://pnpm.io/) workspaces.
- **Infrastructure**: [Docker Compose](https://docs.docker.com/compose/) for containerized PostgreSQL.

---

## 📁 Monorepo Folder Structure

```
To-Be-Take/
├── apps/
│   ├── api/                    # NestJS Backend API
│   │   ├── src/
│   │   │   ├── config/         # ConfigModule & Environment variables loader
│   │   │   ├── database/       # Global database module integrating PrismaService
│   │   │   ├── health/         # /api/health controller & service
│   │   │   ├── app.module.ts   # Root NestJS module
│   │   │   └── main.ts         # Application entry point & global middlewares
│   │   └── test/               # E2E test suites
│   ├── web/                    # Next.js Web Application (App Router)
│   │   └── src/app/            # App Router pages & layout
│   └── mobile/                 # React Native Mobile Application (Expo)
│       └── App.tsx             # Starter mobile screen
│
├── packages/
│   ├── database/               # Prisma schema, migrations, & NestJS PrismaService
│   │   ├── prisma/             # schema.prisma & migrations
│   │   └── src/                # Prisma client exports & PrismaService
│   ├── shared-types/           # Shared TypeScript interfaces & DTOs
│   ├── eslint-config/          # Shared ESLint configurations (base, nest, next, react-native)
│   └── tsconfig/               # Shared TypeScript configurations (base, node, nextjs, react-native)
│
├── docker-compose.yml          # PostgreSQL container definition
├── pnpm-workspace.yaml         # pnpm workspace definition
├── turbo.json                  # Turborepo task pipeline configuration
├── .env.example                # Root environment variables template
├── .gitignore                  # Git ignore rules for monorepo
├── .prettierrc                 # Code style and formatting rules
└── README.md                   # Project documentation
```

---

## 📋 Prerequisites

Before running the project, make sure you have the following installed:

- **Node.js**: `v20.0.0` or later (LTS recommended)
- **pnpm**: `v9.0.0` or later (`npm install -g pnpm`)
- **Docker & Docker Compose**: For running the local PostgreSQL database

---

## 🚀 Getting Started

### 1. Installation

Clone the repository and install all dependencies:

```bash
pnpm install
```

### 2. Environment Setup

Copy the template environment file to `.env`:

```bash
# Windows PowerShell
cp .env.example .env

# macOS / Linux
cp .env.example .env
```

Review and adjust variables in `.env` if needed:

- `DATABASE_URL`: PostgreSQL connection string (defaults to `postgresql://postgres:postgres@localhost:5432/to_be_take_dev?schema=public`)
- `API_PORT`: Port for the NestJS API (defaults to `4000`)
- `PORT`: Port for Next.js Web (defaults to `3000`)

### 3. Start PostgreSQL Database

Launch the PostgreSQL container using Docker Compose:

```bash
docker compose up -d
```

To verify the container is running healthy:

```bash
docker compose ps
```

### 4. Generate Prisma Client

Generate the Prisma client for `@tobetake/database`:

```bash
pnpm db:generate
```

To sync the schema with the PostgreSQL database:

```bash
pnpm --filter @tobetake/database db:push
# OR for migrations:
pnpm db:migrate
```

---

## 💻 Running Development Servers

### Run All Applications Simultaneously (Turborepo)

To start the API, Web, and Mobile applications concurrently:

```bash
pnpm dev
```

### Run Individual Applications

- **Start Backend API only**:

  ```bash
  pnpm --filter @tobetake/api dev
  ```

  API endpoint: `http://localhost:4000/api`
  Health check: `http://localhost:4000/api/health`

- **Start Web Application only**:

  ```bash
  pnpm --filter @tobetake/web dev
  ```

  Web frontend: `http://localhost:3000`

- **Start Mobile Application only (Expo)**:
  ```bash
  pnpm --filter @tobetake/mobile start
  ```
  Press `w` in terminal for web preview, or scan QR code with Expo Go app.

---

## 🧪 Testing & Verification Commands

| Command             | Description                                         |
| :------------------ | :-------------------------------------------------- |
| `pnpm build`        | Builds all packages and applications for production |
| `pnpm test`         | Runs unit and E2E tests across all workspaces       |
| `pnpm typecheck`    | Validates TypeScript types across all projects      |
| `pnpm lint`         | Runs ESLint on all apps and packages                |
| `pnpm format`       | Formats all files using Prettier                    |
| `pnpm format:check` | Checks code formatting against Prettier rules       |
| `pnpm db:studio`    | Opens Prisma Studio GUI in browser to inspect data  |
| `pnpm clean`        | Cleans build artifacts and dist folders             |

---

## 🩺 API Health Endpoint

The API provides a health check at `GET /api/health` returning:

```json
{
  "status": "ok",
  "timestamp": "2026-09-14T11:30:00.000Z",
  "uptime": 42,
  "environment": "development",
  "version": "0.1.0",
  "services": {
    "database": "connected"
  }
}
```

---

## ⚡ Exact Command to Start the Entire Project

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file
cp .env.example .env

# 3. Start PostgreSQL container
docker compose up -d

# 4. Generate database client
pnpm db:generate

# 5. Start all apps in development mode
pnpm dev
```
