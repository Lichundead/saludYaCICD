/**
 * @file usuarios.controller.js
 * @description Controladores de consulta y actualización de usuarios,
 * y de gestión de cuentas de médicos.
 * @module controllers/usuarios
 */

const usuariosRepo = require("../repositories/usuarios.repo");
const disponibilidadRepo = require("../repositories/disponibilidad.repo");
const { hashPassword } = require("../passwords");
const {
  EMAIL_REGEX,
  normalizarEmail,
  sinPassword,
  esViolacionUnicidad,
} = require("../utils");

/**
 * Obtiene los datos de un usuario a partir de su correo electrónico.
 *
 * @param {express.Request} req - `req.params.email` es el correo a buscar.
 * @param {express.Response} res - Respuesta JSON.
 * @param {express.NextFunction} next - Pasa errores al middleware de errores.
 */
async function getPorEmail(req, res, next) {
  try {
    const user = await usuariosRepo.buscarPorEmail(
      normalizarEmail(req.params.email)
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }

    res.json({ success: true, user: sinPassword(user) });
  } catch (error) {
    next(error);
  }
}

/**
 * Actualiza los datos de perfil de un usuario (nombre, teléfono, tipo y
 * número de identificación, RH). El correo, el rol y la contraseña no se
 * modifican por esta vía: el correo identifica la cuenta en el token.
 *
 * @param {express.Request} req - `req.params.email` identifica al usuario;
 *   `req.body` trae los campos a actualizar.
 * @param {express.Response} res - Respuesta JSON con el usuario actualizado.
 * @param {express.NextFunction} next - Pasa errores al middleware de errores.
 */
async function actualizar(req, res, next) {
  try {
    const email = normalizarEmail(req.params.email);
    const { nombre, telefono, tipo_id, numero_id, rh } = req.body;

    if (nombre !== undefined && !nombre) {
      return res
        .status(400)
        .json({ success: false, message: "El nombre no puede estar vacío" });
    }

    // Solo se actualizan los campos presentes en el cuerpo.
    const cambios = {};
    if (nombre !== undefined) cambios.nombre = nombre;
    if (telefono !== undefined) cambios.telefono = telefono;
    if (tipo_id !== undefined) cambios.tipo_id = tipo_id;
    if (numero_id !== undefined) cambios.numero_id = numero_id;
    if (rh !== undefined) cambios.rh = rh;

    if (Object.keys(cambios).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No hay campos para actualizar" });
    }

    const user = await usuariosRepo.actualizarPerfil(email, cambios);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }

    res.json({ success: true, user: sinPassword(user) });
  } catch (error) {
    next(error);
  }
}

/**
 * Lista las cuentas con rol `medico`. Cualquier usuario autenticado puede
 * consultarla (los pacientes la necesitan para agendar), pero solo el admin
 * recibe los datos completos; el resto ve id, nombre y especialidad.
 *
 * @param {express.Request} req
 * @param {express.Response} res - Respuesta JSON `{ success, medicos }`.
 * @param {express.NextFunction} next - Pasa errores al middleware de errores.
 */
async function listarMedicos(req, res, next) {
  try {
    const filas = await usuariosRepo.listarMedicos();

    const medicos =
      req.user.rol === "admin"
        ? filas.map(sinPassword)
        : filas.map(({ id, nombre, especialidad }) => ({ id, nombre, especialidad }));

    res.json({ success: true, medicos });
  } catch (error) {
    next(error);
  }
}

/**
 * Crea una cuenta de médico. Solo accesible para administradores
 * (la ruta aplica `requireRole("admin")`).
 *
 * @param {express.Request} req - `req.body` con los datos del médico.
 * @param {express.Response} res - Respuesta JSON `{ success, id }`.
 * @param {express.NextFunction} next - Pasa errores al middleware de errores.
 */
async function crearMedico(req, res, next) {
  try {
    const { nombre, password, telefono, tipo_id, numero_id, especialidad, licencia } =
      req.body;
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

    const medico = await usuariosRepo.crear({
      nombre,
      email,
      password: hashPassword(password),
      telefono: telefono ?? null,
      tipo_id: tipo_id ?? null,
      numero_id: numero_id ?? null,
      especialidad: especialidad ?? null,
      licencia: licencia ?? null,
      rol: "medico",
      // La contraseña asignada por el admin es temporal: el médico debe
      // definir la suya en su primer ingreso.
      debe_cambiar_password: true,
    });

    res.status(201).json({ success: true, id: medico.id });
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
 * Actualiza los datos de una cuenta de médico (solo admin).
 * El correo, la contraseña y el rol no se modifican por esta vía.
 *
 * @param {express.Request} req - `req.params.id` y campos en `req.body`.
 * @param {express.Response} res - Respuesta JSON con el médico actualizado.
 * @param {express.NextFunction} next - Pasa errores al middleware de errores.
 */
async function actualizarMedico(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existente = await usuariosRepo.buscarPorId(id);

    if (!existente || existente.rol !== "medico") {
      return res
        .status(404)
        .json({ success: false, message: "Médico no encontrado" });
    }

    const { nombre, telefono, tipo_id, numero_id, especialidad, licencia } =
      req.body;

    const cambios = {};
    if (nombre !== undefined) cambios.nombre = nombre;
    if (telefono !== undefined) cambios.telefono = telefono;
    if (tipo_id !== undefined) cambios.tipo_id = tipo_id;
    if (numero_id !== undefined) cambios.numero_id = numero_id;
    if (especialidad !== undefined) cambios.especialidad = especialidad;
    if (licencia !== undefined) cambios.licencia = licencia;

    if (cambios.nombre !== undefined && !cambios.nombre) {
      return res
        .status(400)
        .json({ success: false, message: "El nombre no puede estar vacío" });
    }

    if (Object.keys(cambios).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No hay campos para actualizar" });
    }

    const medico = await usuariosRepo.actualizarPorId(id, cambios);

    res.json({ success: true, medico: sinPassword(medico) });
  } catch (error) {
    next(error);
  }
}

/**
 * Elimina una cuenta de médico (solo admin). Borra primero su
 * disponibilidad; si tiene citas asociadas, la clave foránea lo impide
 * y se responde 409.
 *
 * @param {express.Request} req - `req.params.id`.
 * @param {express.Response} res - Respuesta JSON.
 * @param {express.NextFunction} next - Pasa errores al middleware de errores.
 */
async function eliminarMedico(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existente = await usuariosRepo.buscarPorId(id);

    if (!existente || existente.rol !== "medico") {
      return res
        .status(404)
        .json({ success: false, message: "Médico no encontrado" });
    }

    await disponibilidadRepo.eliminarPorMedico(id);
    await usuariosRepo.eliminarPorId(id);

    res.json({ success: true });
  } catch (error) {
    // Violación de FK: el médico tiene citas registradas.
    for (let e = error; e; e = e.cause) {
      if (e.code === "23503" || /foreign key|llave foránea/i.test(e.message ?? "")) {
        return res.status(409).json({
          success: false,
          message: "No se puede eliminar: el médico tiene citas registradas",
        });
      }
    }
    next(error);
  }
}

module.exports = {
  getPorEmail,
  actualizar,
  listarMedicos,
  crearMedico,
  actualizarMedico,
  eliminarMedico,
};
