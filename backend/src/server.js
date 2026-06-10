/**
 * @file server.js
 * @description Punto de entrada de la API REST de SaludYa.
 * Levanta el servidor HTTP en el puerto configurado.
 * @module server
 */

const app = require("./app");
const config = require("./config");

app.listen(config.port, () => {
  console.log(`Servidor corriendo en puerto ${config.port}`);
  console.log(`Documentación Swagger disponible en /api-docs`);
});
