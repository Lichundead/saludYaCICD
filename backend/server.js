/**
 * @file server.js
 * @description Shim de compatibilidad: los despliegues existentes (Render)
 * ejecutan `node server.js` desde la raíz del backend. El código real vive en `src/`.
 */

require("./src/server");
