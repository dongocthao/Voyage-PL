# Database workflow

This project uses SQL-first migrations for the Voyage P&L schema.

## Local development

The current local development URL is:

```text
postgresql://postgres@localhost:55432/voyage_pnl_dev?schema=public
```

The local PostgreSQL data directory is `infra/.postgres-dev/data`, which is
ignored by git.

Start the local PostgreSQL instance:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "D:\Project\VoyageP&L\infra\.postgres-dev\data" -l "D:\Project\VoyageP&L\infra\.postgres-dev\postgres.log" -o "-p 55432" start
```

Stop it:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "D:\Project\VoyageP&L\infra\.postgres-dev\data" stop
```

1. Point `DATABASE_URL` to a clean local PostgreSQL database.
2. Apply migrations:

   ```powershell
   pnpm --filter @voyage-pnl/api prisma:deploy
   ```

3. Seed baseline master data:

   ```powershell
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" "postgresql://postgres@localhost:55432/voyage_pnl_dev?sslmode=disable" -f apps/api/prisma/seed.sql
   ```

4. Regenerate Prisma Client after schema changes:

   ```powershell
   pnpm --filter @voyage-pnl/api exec prisma generate
   ```

## Updating the schema

- Change database structure by adding a new migration under `prisma/migrations`.
- Apply the migration to a clean local database first.
- Run `prisma db pull` against that verified database to refresh `schema.prisma`.
- Do not edit Supabase directly without also committing the matching migration.

## Supabase notes

The initial migration enables RLS for the business tables and grants full CRUD to
the `authenticated` role as a development baseline. Replace those policies with
module/role-specific rules before production data goes live.
