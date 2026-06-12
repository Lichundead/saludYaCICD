/**
 * @file auth.controller.js
 * @description Controladores de autenticación: inicio de sesión y registro.
 * @module controllers/auth
 */

const usuariosRepo = require("../repositories/usuarios.repo");
const {
  hashPassword,
  verifyPassword,
  isHashed,
  generarPasswordTemporal,
} = require("../passwords");
const {
  EMAIL_REGEX,
  normalizarEmail,
  sinPassword,
  esViolacionUnicidad,
} = require("../utils");
const { firmarToken } = require("../middleware/auth");
const { enviarCorreo, correoHabilitado } = require("../mailer");
const logger = require("../logger");

/**
 * Autentica a un usuario validando su correo y contraseña.
 * Si el registro aún guarda la contraseña en texto plano (datos antiguos),
 * se re-hashea automáticamente tras un login exitoso.
 *
 * @param {express.Request} req - `req.body` debe contener `email` y `password`.
 * @param {express.Response} res - Respuesta JSON.
 * @param {express.NextFunction} next - Pasa errores al middleware de errores.
 */
async function login(req, res, next) {
  try {
    const { password } = req.body;
    const email = normalizarEmail(req.body.email);

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Correo y contraseña son requeridos" });
    }

    const user = await usuariosRepo.buscarPorEmail(email);

    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ success: false });
    }

    if (!isHashed(user.password)) {
      await usuariosRepo.actualizarPassword(user.id, hashPassword(password));
    }

    res.json({ success: true, user: sinPassword(user), token: firmarToken(user) });
  } catch (error) {
    next(error);
  }
}

/**
 * Registra un nuevo usuario (paciente). La contraseña se almacena hasheada
 * con scrypt y el rol nunca se acepta del cliente.
 *
 * @param {express.Request} req - `req.body` contiene los datos del usuario.
 * @param {express.Response} res - Respuesta JSON.
 * @param {express.NextFunction} next - Pasa errores al middleware de errores.
 */
async function register(req, res, next) {
  try {
    const { nombre, password, telefono, tipo_id, numero_id, rh } = req.body;
    const email = normalizarEmail(req.body.email);

    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Nombre, correo y contraseña son requeridos",
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "El correo no tiene un formato válido" });
    }

    const usuario = await usuariosRepo.crear({
      nombre,
      email,
      password: hashPassword(password),
      telefono: telefono ?? null,
      tipo_id: tipo_id ?? null,
      numero_id: numero_id ?? null,
      rh: rh ?? null,
      // El rol siempre es "paciente": nunca se acepta del cliente para evitar
      // que un registro público se autoasigne privilegios.
      rol: "paciente",
    });

    res.status(201).json({ success: true, id: usuario.id });
  } catch (error) {
    if (esViolacionUnicidad(error)) {
      return res
        .status(409)
        .json({ success: false, message: "El correo ya está registrado" });
    }
    next(error);
  }
}

/**
 * Restablecimiento de contraseña por correo. Solo requiere el correo: si
 * corresponde a una cuenta, se genera una contraseña temporal, se guarda
 * (marcada para cambio obligatorio) y se envía por correo. La respuesta es
 * genérica para no revelar qué correos están registrados.
 *
 * @param {express.Request} req - `req.body` con { email }.
 * @param {express.Response} res - Respuesta JSON.
 * @param {express.NextFunction} next - Pasa errores al middleware de errores.
 */
async function recover(req, res, next) {
  try {
    const email = normalizarEmail(req.body.email);

    if (!email || !EMAIL_REGEX.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Ingresa un correo válido" });
    }

    if (!correoHabilitado) {
      return res.status(503).json({
        success: false,
        message: "El servicio de correo no está disponible en este momento",
      });
    }

    const user = await usuariosRepo.buscarPorEmail(email);

    // Mensaje genérico común: no revela si la cuenta existe (anti enumeración).
    const respuestaGenerica = {
      success: true,
      message:
        "Si existe una cuenta con ese correo, te enviamos una contraseña temporal.",
    };

    if (!user) {
      return res.json(respuestaGenerica);
    }

    const temporal = generarPasswordTemporal();

    // Se envía el correo ANTES de cambiar la contraseña: si el envío falla,
    // no se modifica nada y el usuario no queda bloqueado con una temporal
    // que nunca recibió.
    const enviado = await enviarCorreo({
      to: email,
      subject: "Restablecimiento de contraseña · SaludYa",
      text:
        `Hola ${user.nombre || ""},\n\n` +
        `Solicitaste restablecer tu contraseña en SaludYa.\n` +
        `Tu contraseña temporal es: ${temporal}\n\n` +
        `Inicia sesión con ella; el sistema te pedirá definir una nueva ` +
        `contraseña en tu primer ingreso.`,
    });

    if (!enviado) {
      logger.error({ email }, "No se pudo enviar el correo de restablecimiento");
      return res.status(502).json({
        success: false,
        message: "No se pudo enviar el correo. Intenta de nuevo más tarde.",
      });
    }

    await usuariosRepo.actualizarPorId(user.id, {
      password: hashPassword(temporal),
      debe_cambiar_password: true,
    });

    res.json(respuestaGenerica);
  } catch (error) {
    next(error);
  }
}

/**
 * Cambia la contraseña del usuario autenticado validando la actual.
 * Usado también para reemplazar la contraseña temporal del primer ingreso
 * (limpia la marca `debe_cambiar_password`).
 *
 * @param {express.Request} req - `req.body` con { password_actual, password_nueva }.
 * @param {express.Response} res - Respuesta JSON.
 * @param {express.NextFunction} next - Pasa errores al middleware de errores.
 */
async function cambiarPassword(req, res, next) {
  try {
    const { password_actual, password_nueva } = req.body;

    if (!password_actual || !password_nueva) {
      return res.status(400).json({
        success: false,
        message: "La contraseña actual y la nueva son requeridas",
      });
    }

    if (password_nueva.length < 6) {
      return res.status(400).json({
        success: false,
        message: "La nueva contraseña debe tener al menos 6 caracteres",
      });
    }

    const user = await usuariosRepo.buscarPorId(req.user.sub);

    if (!user || !verifyPassword(password_actual, user.password)) {
      return res
        .status(401)
        .json({ success: false, message: "La contraseña actual es incorrecta" });
    }

    await usuariosRepo.actualizarPassword(user.id, hashPassword(password_nueva));

    res.json({ success: true, message: "Contraseña actualizada" });
  } catch (error) {
    next(error);
  }
}

module.exports = { login, register, recover, cambiarPassword };
