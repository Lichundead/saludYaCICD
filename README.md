# SaludYa

Sistema de gestión y agendamiento de citas médicas con tres roles: paciente, médico y administrador.

## Arquitectura

Monorepo gestionado con **pnpm workspaces**:

```
saludYaCICD/
├── backend/              # API REST (Express 5 + PostgreSQL vía Drizzle ORM)
│   ├── drizzle/          # Migraciones SQL versionadas (generadas con drizzle-kit)
│   ├── src/
│   │   ├── app.js        # Aplicación Express (middleware, rutas, errores)
│   │   ├── server.js     # Punto de entrada (migra, siembra y levanta el servidor)
│   │   ├── config.js     # Configuración por variables de entorno
│   │   ├── db/           # Esquema Drizzle, conexión (Postgres/PGlite) y seed
│   │   ├── repositories/ # Único lugar con consultas a la base de datos
│   │   ├── controllers/  # Lógica de cada endpoint
│   │   ├── routes/       # Definición de endpoints
│   │   ├── middleware/   # Autenticación JWT y autorización por rol
│   │   ├── passwords.js  # Hash de contraseñas (scrypt)
│   │   └── logger.js     # Logger estructurado (pino)
│   └── test/             # Pruebas de integración (node:test + PGlite en memoria)
└── frontend/             # SPA React 19 + Vite
    └── src/
        ├── pages/        # Vistas (login, dashboards, citas, etc.)
        └── services/     # Cliente HTTP centralizado de la API
```

## Tecnologías

- **Frontend**: React 19 (rutas con carga diferida), React Router 6, Vite 8, Vitest 4 + Testing Library, ESLint 9
- **Backend**: Node.js 24+, Express 5, PostgreSQL con Drizzle ORM (Neon en producción, PGlite embebido en desarrollo y pruebas), migraciones versionadas, autenticación JWT con roles, Helmet, compresión gzip, rate limiting, logging estructurado (pino) y apagado ordenado
- **CI/CD**: GitHub Actions (lint, pruebas y build en cada push/PR a `main`)

## Requisitos

- Node.js 24 (LTS) o superior
- pnpm 10 (`corepack enable`)

## Instalación

```bash
pnpm install
```

## Uso

```bash
# Backend en http://localhost:3001
pnpm dev:backend

# Frontend en http://localhost:3000
pnpm dev:frontend
```

Usuarios de demostración (contraseña `123456`):

| Rol           | Correo              |
| ------------- | ------------------- |
| Paciente      | demo@saludya.com    |
| Administrador | admin@saludya.com   |
| Médico        | medico@saludya.com  |

## Pruebas y calidad

```bash
pnpm test    # Pruebas de backend (node:test) y frontend (Vitest)
pnpm lint    # ESLint del frontend
pnpm build   # Build de producción del frontend (frontend/dist)
```

## Configuración

Plantilla completa en [`backend/.env.example`](backend/.env.example).

| Variable       | Dónde    | Descripción                                       | Por defecto             |
| -------------- | -------- | ------------------------------------------------- | ----------------------- |
| `VITE_API_URL` | frontend | URL base de la API                                | `http://localhost:3001` |
| `NODE_ENV`     | backend  | `development` \| `test` \| `production`           | `development`           |
| `PORT`         | backend  | Puerto del servidor                               | `3001`                  |
| `LOG_LEVEL`    | backend  | Nivel de pino (`info`, `debug`, `silent`…)        | `info`                  |
| `DATABASE_URL` | backend  | URL de PostgreSQL (**obligatoria en producción**); si falta, se usa PGlite local | _(vacío)_ |
| `DATABASE_SSL` | backend  | `false` para conectar a un Postgres local sin TLS | `true`                  |
| `DB_POOL_MAX`  | backend  | Máximo de conexiones del pool de Postgres         | `10`                    |
| `PGLITE_DIR`   | backend  | Directorio de datos de PGlite (`memory://` en pruebas) | `./pgdata`        |
| `JWT_SECRET`   | backend  | Secreto para firmar los tokens (**obligatorio en producción**) | aleatorio por arranque |
| `JWT_EXPIRES_IN` | backend | Tiempo de vida de los tokens                      | `8h`                    |
| `CORS_ORIGINS` | backend  | Orígenes permitidos, separados por coma           | localhost + despliegues |
| `AUTH_RATE_LIMIT` | backend | Peticiones a `/login`, `/register` y `/recover` por IP / 15 min | `20`        |
| `GLOBAL_RATE_LIMIT` | backend | Tope global de peticiones por IP / 15 min      | `300`                   |
| `BODY_LIMIT`   | backend  | Tamaño máximo del cuerpo JSON                      | `10kb`                  |

## Base de datos

El esquema vive en `backend/src/db/schema.js` (Drizzle ORM) con integridad real:
claves foráneas paciente/médico en `citas`, `CHECK` sobre roles y estados, y un
índice único `(medico, fecha, hora)` que impide el doble agendamiento incluso
ante peticiones concurrentes.

- **Producción**: define `DATABASE_URL` con un PostgreSQL gestionado (p. ej. [Neon](https://neon.tech), gratuito).
- **Desarrollo local**: sin configuración — PGlite (Postgres embebido) persiste en `backend/pgdata/`.
- **Pruebas**: PGlite en memoria, mismo dialecto que producción.

Las migraciones de `backend/drizzle/` se aplican automáticamente al arrancar.
Tras cambiar el esquema, regenera las migraciones y haz commit del resultado:

```bash
pnpm --filter saludya-backend db:generate   # genera la migración SQL
pnpm --filter saludya-backend db:seed       # inserta los usuarios demo (idempotente)
```

## Despliegue a producción

**Frontend (Vercel)**: framework Vite, salida en `dist/`. Definir `VITE_API_URL` con la URL pública del backend.

**Backend (Render)**: comando de arranque `npm start`. El servidor **no arranca** si faltan los secretos críticos, así que en producción hay que definir:

1. `NODE_ENV=production`
2. `DATABASE_URL` — PostgreSQL gestionado (Neon). Usa la cadena de conexión *pooled* para aprovechar el pool.
3. `JWT_SECRET` — valor largo y aleatorio (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
4. `CORS_ORIGINS` — el dominio del frontend en Vercel.

Recomendado además: configurar el *health check* de Render en `GET /health`, que verifica API + base de datos y responde `503` si la BD no está disponible.

Al arrancar, el backend aplica las migraciones pendientes, siembra los usuarios demo (idempotente) y emite logs estructurados en JSON. Responde a `SIGTERM`/`SIGINT` cerrando el servidor y el pool de conexiones de forma ordenada (apto para los despliegues sin downtime de Render).

## Autenticación

`POST /login` devuelve un JWT con el rol del usuario (`paciente`, `medico` o `admin`).
Las rutas de usuarios y citas requieren la cabecera `Authorization: Bearer <token>`:
un paciente solo accede a sus propios datos, mientras que `admin` y `medico` pueden
consultar los de cualquier paciente. El registro público siempre crea pacientes.

## Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

## Licencia

MIT
