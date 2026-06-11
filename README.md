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
│   │   ├── routes/       # Definición de endpoints + documentación
│   │   ├── middleware/   # Autenticación JWT y autorización por rol
│   │   ├── passwords.js  # Hash de contraseñas (scrypt)
│   │   └── swagger.js    # Especificación OpenAPI
│   └── test/             # Pruebas de integración (node:test + PGlite en memoria)
└── frontend/             # SPA React 19 + Vite
    └── src/
        ├── pages/        # Vistas (login, dashboards, citas, etc.)
        └── services/     # Cliente HTTP centralizado de la API
```

## Tecnologías

- **Frontend**: React 19, React Router 6, Vite 8, Vitest 4 + Testing Library, ESLint 9
- **Backend**: Node.js 24+, Express 5, PostgreSQL con Drizzle ORM (Neon en producción, PGlite embebido en desarrollo y pruebas), migraciones versionadas, autenticación JWT con roles, Swagger UI, Helmet y rate limiting
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
# Backend en http://localhost:3001 (Swagger en /api-docs)
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

| Variable       | Dónde    | Descripción                                       | Por defecto             |
| -------------- | -------- | ------------------------------------------------- | ----------------------- |
| `VITE_API_URL` | frontend | URL base de la API                                | `http://localhost:3001` |
| `PORT`         | backend  | Puerto del servidor                               | `3001`                  |
| `DATABASE_URL` | backend  | URL de PostgreSQL (Neon en producción); si falta, se usa PGlite local | _(vacío)_ |
| `DATABASE_SSL` | backend  | `false` para conectar a un Postgres local sin TLS | `true`                  |
| `PGLITE_DIR`   | backend  | Directorio de datos de PGlite (`memory://` en pruebas) | `./pgdata`        |
| `CORS_ORIGINS` | backend  | Orígenes permitidos, separados por coma           | localhost + despliegues |
| `AUTH_RATE_LIMIT` | backend | Peticiones a `/login` y `/register` por IP cada 15 min | `20`              |
| `JWT_SECRET`   | backend  | Secreto para firmar los tokens de sesión          | aleatorio por arranque  |
| `JWT_EXPIRES_IN` | backend | Tiempo de vida de los tokens                      | `8h`                    |

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

## Despliegue

- **Frontend**: Vercel (build con Vite, salida en `dist/`). Configurar `VITE_API_URL` en las variables de entorno del proyecto.
- **Backend**: Render (`node server.js` o `npm start`). Definir `DATABASE_URL` (PostgreSQL de Neon) para que los datos sobrevivan a los deploys, y `JWT_SECRET` para que las sesiones sobrevivan a los reinicios.

## Autenticación

`POST /login` devuelve un JWT con el rol del usuario (`paciente`, `medico` o `admin`).
Las rutas de usuarios y citas requieren la cabecera `Authorization: Bearer <token>`:
un paciente solo accede a sus propios datos, mientras que `admin` y `medico` pueden
consultar los de cualquier paciente. El registro público siempre crea pacientes.

## Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

## Licencia

MIT
