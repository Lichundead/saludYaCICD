/**
 * @file swagger.js
 * @description Configuración de la documentación OpenAPI 3.0 de la API de SaludYa.
 * Usa `swagger-jsdoc` para generar la especificación a partir de las anotaciones
 * `@openapi` escritas en los archivos de rutas.
 * @module swagger
 */

const path = require("node:path");
const swaggerJSDoc = require("swagger-jsdoc");

/**
 * Opciones de configuración para swagger-jsdoc.
 * @type {object}
 */
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de SaludYa",
      version: "1.0.0",
      description:
        "API REST para la gestión y agendamiento de citas médicas del proyecto SaludYa. " +
        "Permite el registro e inicio de sesión de usuarios, la consulta de perfiles y la " +
        "creación y consulta de citas médicas.",
      contact: {
        name: "Equipo SaludYa",
        url: "https://github.com/Lichundead/saludYaCICD",
      },
      license: { name: "MIT" },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Servidor local de desarrollo",
      },
      {
        url: "https://saludyacicd-54ta.onrender.com",
        description: "Servidor de producción (Render)",
      },
    ],
    tags: [
      {
        name: "Autenticación",
        description: "Inicio de sesión y registro de usuarios",
      },
      {
        name: "Usuarios",
        description: "Consulta y actualización de usuarios y médicos",
      },
      {
        name: "Citas",
        description: "Creación, consulta y gestión de citas médicas",
      },
      { name: "Salud", description: "Estado de la API" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Token devuelto por POST /login. Enviar como `Authorization: Bearer <token>`.",
        },
      },
      schemas: {
        /** Esquema de un usuario (la API nunca expone el campo `password`). */
        Usuario: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            nombre: { type: "string", example: "Paciente Demo" },
            email: {
              type: "string",
              format: "email",
              example: "demo@saludya.com",
            },
            telefono: { type: "string", example: "3000000000" },
            tipo_id: { type: "string", example: "CC" },
            numero_id: { type: "string", example: "12345678" },
            rh: { type: "string", example: "O+" },
            rol: {
              type: "string",
              enum: ["paciente", "medico", "admin"],
              example: "paciente",
            },
          },
        },
        /**
         * Esquema de una cita médica. Las lecturas incluyen los datos del
         * paciente y el nombre del médico resueltos por JOIN.
         */
        Cita: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            paciente_id: { type: "integer", example: 1 },
            medico_id: { type: "integer", example: 3 },
            paciente_email: {
              type: "string",
              format: "email",
              example: "demo@saludya.com",
            },
            paciente_nombre: { type: "string", example: "Paciente Demo" },
            medico: { type: "string", example: "Medico Demo" },
            especialidad: { type: "string", example: "Medicina general" },
            fecha: { type: "string", format: "date", example: "2026-06-15" },
            hora: { type: "string", example: "09:30" },
            estado: {
              type: "string",
              enum: ["pendiente", "confirmada", "rechazada", "atendida"],
              example: "pendiente",
            },
          },
        },
      },
    },
  },
  // Archivos donde swagger-jsdoc buscará las anotaciones @openapi.
  apis: [path.join(__dirname, "routes", "*.js")],
};

/**
 * Especificación OpenAPI generada a partir de las anotaciones.
 * @type {object}
 */
const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
