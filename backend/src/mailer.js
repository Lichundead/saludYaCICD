/**
 * @file mailer.js
 * @description Envío de correos a través de la API de Mailtrap (mailtrap.io).
 * Si no hay token configurado, `enviarCorreo` no hace nada (no-op) y registra
 * un aviso, de modo que el resto de la app funciona sin correo configurado.
 *
 * Variables de entorno:
 *   MAILTRAP_API_TOKEN  Token de la API (obligatorio para enviar).
 *   MAILTRAP_INBOX_ID   Si se define, usa el sandbox de pruebas en vez del envío real.
 *   MAIL_FROM           Remitente "Nombre <correo>".
 *
 * @module mailer
 */

const config = require("./config");
const logger = require("./logger");

const URL_ENVIO = "https://send.api.mailtrap.io/api/send";
const urlSandbox = (inboxId) =>
  `https://sandbox.api.mailtrap.io/api/send/${inboxId}`;

/**
 * Bandeja en memoria usada solo en pruebas: en vez de llamar a la red, los
 * correos se acumulan aquí para que la suite pueda inspeccionarlos.
 * @type {Array<{to: string, subject: string, text?: string, html?: string}>}
 */
const outbox = [];

/** Indica si el envío de correos está disponible (configurado, o modo prueba). */
const correoHabilitado = Boolean(config.mailtrapToken) || config.isTest;

/**
 * Convierte "Nombre <correo>" en `{ name, email }`. Acepta también un correo suelto.
 * @param {string} remitente
 * @returns {{ email: string, name?: string }}
 */
function parsearRemitente(remitente) {
  const match = remitente.match(/^\s*(.*?)\s*<\s*(.+?)\s*>\s*$/);
  if (match) return { name: match[1] || undefined, email: match[2] };
  return { email: remitente.trim() };
}

/**
 * Envía un correo. Best-effort: nunca lanza; devuelve true si se entregó.
 *
 * @param {object} opts
 * @param {string} opts.to - Correo del destinatario.
 * @param {string} opts.subject - Asunto.
 * @param {string} [opts.text] - Cuerpo en texto plano.
 * @param {string} [opts.html] - Cuerpo en HTML (opcional).
 * @returns {Promise<boolean>} true si Mailtrap aceptó el correo.
 */
async function enviarCorreo({ to, subject, text, html }) {
  // En pruebas no se toca la red: el correo se captura en la bandeja en memoria.
  if (config.isTest) {
    outbox.push({ to, subject, text, html });
    return true;
  }

  if (!config.mailtrapToken) {
    logger.warn({ to, subject }, "Correo no enviado: MAILTRAP_API_TOKEN no configurado");
    return false;
  }

  const url = config.mailtrapInboxId
    ? urlSandbox(config.mailtrapInboxId)
    : URL_ENVIO;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.mailtrapToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: parsearRemitente(config.mailFrom),
        to: [{ email: to }],
        subject,
        text,
        ...(html ? { html } : {}),
      }),
    });

    if (!res.ok) {
      const detalle = await res.text().catch(() => "");
      logger.error({ status: res.status, detalle }, "Mailtrap rechazó el correo");
      return false;
    }

    return true;
  } catch (error) {
    logger.error({ err: error }, "Fallo al enviar el correo");
    return false;
  }
}

module.exports = { enviarCorreo, correoHabilitado, outbox };
