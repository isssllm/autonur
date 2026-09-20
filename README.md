# Autonur

Production-ready driving lesson website for Astana, Kokshetau and Karaganda.

## Stack

Next.js 15 + React 19 + TypeScript + Tailwind CSS + PostgreSQL + Prisma 6.

## Local run

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` and a random `SESSION_SECRET` (32+ characters).
3. Install dependencies:

```bash
npm install
```

4. Create/update the database:

```bash
npm run prisma:migrate
npm run prisma:seed
```

5. Start:

```bash
npm run dev
```

## Production / Vercel

The repository contains `prisma/migrations`, and `vercel.json` runs:

```text
prisma migrate deploy -> prisma seed -> prisma generate -> next build
```

The seed is safe to repeat: it does not delete existing production data. The base seed runs only when the database is empty; the developer account is checked on every seed.

### Required Vercel environment variables

```text
DATABASE_URL=<hosted PostgreSQL connection string>
SESSION_SECRET=<long random secret, 32+ characters>
DEVELOPER_PHONE=<your phone number>
DEVELOPER_PASSWORD=<your own password, 8+ characters>
DEVELOPER_FIRST_NAME=Ислам
DEVELOPER_LAST_NAME=Developer
```

On the first production seed, `DEVELOPER_PHONE` is created as `ADMIN`, or an existing user with that phone is promoted to `ADMIN`. The application treats `ADMIN` as the full administrator/developer role.

Do not commit `.env`, production database URLs, or `SESSION_SECRET` to Git.

## Demo staff

The seed creates manager and instructor sample accounts for the three cities so the staff interfaces can be tested. Change their passwords before using the site with real staff.
