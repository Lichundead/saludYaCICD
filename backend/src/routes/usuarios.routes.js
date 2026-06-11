/**
 * @file usuarios.routes.js
 * @description Rutas de consulta y actualización de usuarios, y gestión
 * (CRUD) de cuentas de médicos.
 * @module routes/usuarios
 */

const { Router } = require("express");
const {
  getPorEmail,
  actualizar,
  listarMedicos,
  crearMedico,
  actualizarMedico,
  eliminarMedico,
} = require("../controllers/usuarios.controller");
const {
  requireAuth,
  requireSelfOrStaff,
  requireRole,
} = require("../middleware/auth");

const router = Router();

/** Consulta un usuario por correo (propio, o cualquiera si es personal). */
router.get("/usuario/:email", requireAuth, requireSelfOrStaff, getPorEmail);

/** Actualiza el perfil propio (no cambia correo, rol ni contraseña). */
router.put("/usuario/:email", requireAuth, requireSelfOrStaff, actualizar);

/** Lista médicos: el admin ve todo; el resto, solo id/nombre/especialidad. */
router.get("/medicos", requireAuth, listarMedicos);

/** Crea una cuenta de médico con contraseña temporal (solo admin). */
router.post("/medicos", requireAuth, requireRole("admin"), crearMedico);

/** Actualiza los datos de un médico (solo admin). */
router.put("/medicos/:id", requireAuth, requireRole("admin"), actualizarMedico);

/** Elimina un médico (solo admin; 409 si tiene citas registradas). */
router.delete("/medicos/:id", requireAuth, requireRole("admin"), eliminarMedico);

module.exports = router;
