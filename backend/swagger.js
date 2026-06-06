/**
 * @file swagger.js
 * @description Configuración de la documentación OpenAPI 3.0 de la API de SaludYa.
 * Usa `swagger-jsdoc` para generar la especificación a partir de las anotaciones
 * `@openapi` escritas en los comentarios de `server.js`.
 * @module swagger
 */

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
        url: "https://saludyacicd.onrender.com",
        description: "Servidor de producción (Render)",
      },
    ],
    components: {
      schemas: {
        /** Esquema de un usuario almacenado en la tabla `usuarios`. */
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
            password: { type: "string", example: "123456" },
            telefono: { type: "string", example: "3000000000" },
            tipo_id: { type: "string", example: "CC" },
            numero_id: { type: "string", example: "12345678" },
            rh: { type: "string", example: "O+" },
          },
        },
        /** Esquema de una cita médica almacenada en la tabla `citas`. */
        Cita: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            paciente_email: {
              type: "string",
              format: "email",
              example: "demo@saludya.com",
            },
            especialidad: { type: "string", example: "Medicina general" },
            medico: { type: "string", example: "Paula García" },
            fecha: { type: "string", format: "date", example: "2026-06-15" },
            hora: { type: "string", example: "09:30" },
          },
        },
      },
    },
  },
  // Archivos donde swagger-jsdoc buscará las anotaciones @openapi.
  apis: ["./server.js"],
};

/**
 * Especificación OpenAPI generada a partir de las anotaciones.
 * @type {object}
 */
const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
