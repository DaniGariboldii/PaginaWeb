import nodemailer from 'nodemailer';
import { env } from './env.js';

let transporterPromise = null;

const isSmtpConfigured = () => Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);

/**
 * Devuelve un transporter de Nodemailer (cacheado).
 * - Con SMTP configurado: usa esas credenciales.
 * - Sin SMTP (desarrollo): crea una cuenta de prueba en Ethereal y loguea
 *   la URL de previsualización del email enviado.
 */
const getTransporter = async () => {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (isSmtpConfigured()) {
      return nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.port === 465,
        auth: { user: env.smtp.user, pass: env.smtp.pass },
      });
    }
    // Desarrollo: cuenta de prueba Ethereal (no envía emails reales)
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  })();

  return transporterPromise;
};

/**
 * Envía un email. Nunca lanza al caller crítico: ante error, loguea y sigue,
 * para no filtrar si un email existe ni romper el flujo.
 */
export const sendMail = async ({ to, subject, html, text }) => {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({ from: env.smtp.from, to, subject, html, text });

    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log(`[MAIL] Vista previa (Ethereal): ${preview}`);
    else console.log(`[MAIL] Email enviado a ${to} (${subject})`);

    return { sent: true, preview };
  } catch (err) {
    console.error('[MAIL] Error al enviar email:', err.message);
    return { sent: false };
  }
};
