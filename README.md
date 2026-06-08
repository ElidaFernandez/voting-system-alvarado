# voting-system-alvarado

Backend (NestJS + TypeORM + PostgreSQL) del sistema de votación del **Colegio Secundario "Dr. Roberto I. López Alvarado"** de Goya, Corrientes.

## Stack

- NestJS 11 / TypeScript
- TypeORM + PostgreSQL
- JWT + bcrypt para login del admin
- pdfkit para el acta de elección

## Estructura

- `src/students/` — alumnos habilitados a votar
- `src/votes/` — emisión de votos, resultados, acta PDF
- `src/election/` — abrir/cerrar y reiniciar la elección
- `src/users/` + `src/auth/` — usuario admin y JWT
- `scripts/seed-students.ts` — carga inicial de alumnos desde planillas `.xls/.xlsx`
- `seeds/` — drop de planillas a procesar (`.xls/.xlsx`)
- `src/assets/logo-alvarado.png` — logo que aparece en el acta PDF

## Listas participantes

- Lista N°2 — Presidente: Gonzalez, Nahuel
- Lista N°10 — Presidente: Martinez, Guadalupe

## Variables de entorno

Ver `.env.example`. Las más importantes:

- `DATABASE_URL` — connection string de Postgres
- `JWT_SECRET` — secreto del JWT
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — admin que se crea/actualiza al arrancar (por defecto: `palavecino` / `Alvarado2026!`)
- `FRONTEND_URL` — URL del frontend para CORS

## Correr en local

```bash
npm install
cp .env.example .env  # editar DATABASE_URL local
npm run start:dev
```

## Cargar alumnos desde los Excel

```bash
# 1) Dejar las planillas .xls/.xlsx en ./seeds (ya vienen los 16 archivos del Alvarado)
# 2) Apuntar DATABASE_URL al Postgres deseado (Render o local)
DATABASE_URL=postgres://... npm run seed:students
```

El script es **idempotente**: si un alumno con el mismo DNI ya existe, le actualiza nombre y curso pero no modifica `enabled`.

Salida esperada con las planillas que ya vienen en `seeds/`: **496 alumnos únicos**.

## Deploy en Render

1. Crear una **PostgreSQL** nueva en Render (free tier alcanza para esta escala).
2. Crear un **Web Service** apuntando al repo del backend con:
   - Build command: `npm install && npm run build`
   - Start command: `npm run start:prod`
   - Env vars: las de `.env.example` (con el `DATABASE_URL` que da Render, y un `JWT_SECRET` aleatorio).
3. Después del primer deploy, correr el seed apuntando al `DATABASE_URL` externo desde tu máquina:
   ```bash
   DATABASE_URL=<external_url_de_render> npm run seed:students
   ```
   (El admin se crea solo al primer arranque vía `UsersService.ensureDefaultAdmin`.)

## Endpoints clave

- `POST /votes` — emitir voto
- `GET /votes/results` — resultados (admin)
- `GET /votes/stats` — estadísticas (admin)
- `GET /votes/acta` — PDF del acta de elección (admin)
- `POST /auth/login` — login del admin
- `GET /election` / `POST /election/open` / `POST /election/close` / `POST /election/reset`
