# LudoCloud

Applicazione **SPA + backend API + PostgreSQL** per la gestione di una ludoteca, progettata per l'esame di Applicazioni Web/Mobile/Cloud.

## Stack
- Frontend: Angular 20 + Angular Material + PWA
- Backend: NestJS + Prisma ORM + JWT + RBAC
- DBMS: PostgreSQL
- Cloud-native: Docker + Kubernetes (k3d)
- DevOps: GitHub Actions CI + deploy locale scriptato

## Struttura repository
- `apps/frontend`: SPA Angular responsive/mobile-first
- `apps/backend`: API REST NestJS + Prisma
- `infra/docker`: Dockerfile e config runtime
- `infra/k8s`: manifest Kubernetes
- `scripts`: automazione deploy e smoke test

## Avvio locale (sviluppo)
1. Installazione dipendenze:
   - `npm run install:all`
2. Avvio backend:
   - `npm run dev:backend`
3. Avvio frontend:
   - `npm run dev:frontend`
4. URL app:
   - `http://localhost:4200`

## Setup DB backend
1. Configura `apps/backend/.env` (gia incluso un template con valori locali).
2. Esegui migrazione + seed:
   - `npm --prefix apps/backend run prisma:migrate:dev`
   - `npm --prefix apps/backend run prisma:seed:dev`

Utenti demo seed:
- `admin@ludocloud.local`
- `staff@ludocloud.local`
- `member@ludocloud.local`
- Password comune: `Password123!`

## Build e test
- Build completa: `npm run build`
- Lint backend: `npm run lint:backend`
- Test backend unit: `npm run test:backend`

## Deploy cloud-native locale (k3d)
Prerequisiti:
- Docker
- kubectl
- k3d

Comando unico:
- `npm run deploy:local`

Endpoint dopo deploy:
- Frontend: `http://localhost:8080/`
- API health: `http://localhost:8080/api/v1/health/ready`

Smoke test:
- `npm run smoke:test`

## API principali
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET/POST/PATCH /api/v1/games`
- `GET/POST/PATCH /api/v1/tables`
- `GET/POST /api/v1/members`
- `PATCH /api/v1/members/:id/status`
- `GET/POST /api/v1/bookings`
- `PATCH /api/v1/bookings/:id/cancel`
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`

## CI
Workflow: `.github/workflows/ci.yml`
- lint + unit test backend
- integrazione backend con PostgreSQL service
- build frontend
- build immagini Docker
