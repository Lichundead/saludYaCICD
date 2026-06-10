# SaludYa

Sistema de gestión y agendamiento de citas médicas con tres roles: paciente, médico y administrador.

## Arquitectura

Monorepo gestionado con **pnpm workspaces**:

```
saludYaCICD/
├── backend/              # API REST (Express 5 + SQLite vía node:sqlite)
│   ├── src/
│   │   ├── app.js        # Aplicación Express (middleware, rutas, errores)
│   │   ├── server.js     # Punto de entrada (levanta el servidor)
│   │   ├── config.js     # Configuración por variables de entorno
│   │   ├── db.js         # Conexión SQLite, esquema y datos de demostración
│   │   ├── passwords.js  # Hash de contraseñas (scrypt)
│   │   ├── swagger.js    # Especificación OpenAPI
│   │   ├── routes/       # Definición de endpoints + documentación
│   │   └── controllers/  # Lógica de cada endpoint
│   └── test/             # Pruebas de integración (node:test)
└── frontend/             # SPA React 19 + Vite
    └── src/
        ├── pages/        # Vistas (login, dashboards, citas, etc.)
        └── services/     # Cliente HTTP centralizado de la API
```

## Tecnologías

- **Frontend**: React 19, React Router 6, Vite, Vitest + Testing Library, ESLint 9
- **Backend**: Node.js 22+, Express 5, SQLite (`node:sqlite`, sin dependencias nativas), autenticación JWT con roles, Swagger UI, Helmet y rate limiting
- **CI/CD**: GitHub Actions (lint, pruebas y build en cada push/PR a `main`)

## Requisitos

- Node.js 22 o superior (usa el módulo nativo `node:sqlite`)
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
| `DB_PATH`      | backend  | Ruta del archivo SQLite (`:memory:` para pruebas) | `./saludya.db`          |
| `CORS_ORIGINS` | backend  | Orígenes permitidos, separados por coma           | localhost + despliegues |
| `AUTH_RATE_LIMIT` | backend | Peticiones a `/login` y `/register` por IP cada 15 min | `20`              |
| `JWT_SECRET`   | backend  | Secreto para firmar los tokens de sesión          | aleatorio por arranque  |
| `JWT_EXPIRES_IN` | backend | Tiempo de vida de los tokens                      | `8h`                    |

## Despliegue

- **Frontend**: Vercel (build con Vite, salida en `dist/`). Configurar `VITE_API_URL` en las variables de entorno del proyecto.
- **Backend**: Render (`node server.js` o `npm start`). Definir `JWT_SECRET` para que las sesiones sobrevivan a los reinicios del servicio.

## Autenticación

`POST /login` devuelve un JWT con el rol del usuario (`paciente`, `medico` o `admin`).
Las rutas de usuarios y citas requieren la cabecera `Authorization: Bearer <token>`:
un paciente solo accede a sus propios datos, mientras que `admin` y `medico` pueden
consultar los de cualquier paciente. El registro público siempre crea pacientes.

## Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

## Licencia

MIT
