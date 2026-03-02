# LudoCloud

Applicazione **SPA + backend API + PostgreSQL** per la gestione di una ludoteca, progettata per l'esame di Applicazioni Web/Mobile/Cloud.

## Stack
- Frontend: Angular 20 + Angular Material + PWA
- Backend: NestJS + Prisma ORM + JWT + RBAC
- DBMS: PostgreSQL
- Cloud-native: Docker + Kubernetes (k3d)
- DevOps: GitHub Actions CI + deploy locale scriptato
- Frontend web: SPA Angular (`apps/frontend`)
- Backend API: NestJS REST (`apps/backend`)
- Database: PostgreSQL con Prisma ORM (`apps/backend/prisma`)
- Deploy cloud-native / locale: Docker Compose e Kubernetes (k3d)
- Documentazione e script di avvio/deploy: `README.md`, `scripts/`, `infra/`

Scopo del progetto (demo esame):
- autenticazione JWT con ruoli (`ADMIN`, `STAFF`, `MEMBER`)
- gestione giochi, tavoli, membri e prenotazioni
- deploy ripetibile con seed dati demo
- health check per verifica operativita dell'applicazione

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

test:
- `npm run smoke:test`

## Parte cloud
La traccia accetta deploy su cloud provider oppure in locale. Questo progetto supporta:
- `Docker Compose`
- `Kubernetes su k3d`
- `Kubernetes su cluster remoto (es. Akamai LKE)`

### Opzione A : Docker Compose
Avvio completo (DB + backend + frontend):
- `docker compose -f infra/docker/docker-compose.yml up -d`

Endpoint:
- Frontend: `http://localhost`
- Backend health: `http://localhost:3000/api/v1/health/ready`

Cosa dimostra in ottica cloud:
- containerizzazione dei servizi
- networking tra container
- configurazione via variabili d'ambiente
- inizializzazione automatica backend con migrazioni + seed (`docker-compose.yml`)

### Opzione B: Kubernetes con k3d
Deploy completo:
- `npm run deploy:local`

### Opzione C: Deploy su cluster remoto (es. Akamai LKE)
Portale:
- Akamai Cloud Manager: `https://cloud.linode.com`

Prerequisiti:
- `kubectl` configurato verso il cluster target (`KUBECONFIG` o context attivo)
- immagini backend/frontend gia` pushate su registry raggiungibile dal cluster

Ingress (una tantum, se non presente nel cluster):
- `kubectl apply -f infra/k8s/traefik.yaml`
- attesa IP pubblico: `kubectl -n traefik get svc traefik -w`

Comando:
- `bash scripts/deploy-akamai.sh --context <ctx> --backend-image <registry>/ludocloud-backend:<tag> --frontend-image <registry>/ludocloud-frontend:<tag>`

Endpoint:
- recupero IP pubblico: `kubectl -n traefik get svc traefik`
- https://www.akamai.com/it
- Frontend: `http://<EXTERNAL-IP>/`
- API health: `http://<EXTERNAL-IP>/api/v1/health/ready`

Cosa dimostra in ottica cloud:
- orchestrazione con Kubernetes
- manifest separati per namespace, config, secret, backend, frontend, DB
- job di migrazione/seed (`infra/k8s/migrate-job.yaml`)
- readiness/liveness checks e rollout controllato
- HPA e ingress (`infra/k8s/hpa.yaml`, `infra/k8s/ingress.yaml`)

### Componenti cloud
- Configurazione applicativa: `infra/k8s/configmap.yaml`
- Secret applicativi: `infra/k8s/secret.yaml`
- Persistenza DB (PostgreSQL): `infra/k8s/postgres.yaml`
- Deploy backend/frontend: `infra/k8s/backend.yaml`, `infra/k8s/frontend.yaml`
- Automazione deploy locale: `scripts/deploy-local.sh`
- Smoke test post-deploy: `scripts/smoke-test.ps1`

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
