/**
 * @file auth.routes.js
 * @description Rutas de autenticación: login, registro, recuperación y
 * cambio de contraseña.
 * @module routes/auth
 */

const { Router } = require("express");
const {
  login,
  register,
  recover,
  cambiarPassword,
} = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth");

const router = Router();

/** Inicia sesión y devuelve el usuario y un JWT. */
router.post("/login", login);

/** Registra un nuevo paciente (el rol nunca se acepta del cliente). */
router.post("/register", register);

/** Restablece la contraseña enviando una temporal al correo de la cuenta. */
router.post("/recover", recover);

/** Cambia la contraseña del usuario autenticado (requiere token). */
router.post("/cambiar-password", requireAuth, cambiarPassword);

module.exports = router;
