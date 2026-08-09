# Voyage P&L

Web ERP starter for marine voyage profitability calculation.

## Stack

- Frontend: Next.js App Router, React, Ant Design, Tailwind CSS, TanStack Query, Zustand, React Hook Form, Zod, dayjs, next-intl.
- Backend: NestJS, Prisma, PostgreSQL/PostGIS, Redis, BullMQ, Passport/JWT, Swagger, Pino.
- Infrastructure: MinIO-compatible object storage, Docker Compose for local services.

## Local Setup

1. Copy `.env.example` to `.env`.
2. Start services: `pnpm docker:up`.
3. Install dependencies: `pnpm install`.
4. Generate Prisma client: `pnpm --filter @voyage-pnl/api prisma:generate`.
5. Run apps: `pnpm dev`.

Frontend: http://localhost:3000

API: http://localhost:3001/api

Swagger: http://localhost:3001/docs
