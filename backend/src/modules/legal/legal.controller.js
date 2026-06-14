import crypto from 'node:crypto';
import { z } from 'zod';
import { sendSuccess } from '../../utils/response.js';
import { sendMail } from '../../config/mailer.js';
import { env } from '../../config/env.js';

const retractionSchema = z.object({
  name: z.string().min(2, 'Ingresá tu nombre'),
  email: z.string().email('Email inválido'),
  orderNumber: z.string().min(1, 'Ingresá el número de pedido'),
  reason: z.string().max(1000).optional(),
});

const contactSchema = z.object({
  name: z.string().min(2, 'Ingresá tu nombre'),
  email: z.string().email('Email inválido'),
  message: z.string().min(10, 'Contanos un poco más'),
});

/**
 * Solicitud de arrepentimiento (Resolución 424/2020, derecho de retracto 10 días).
 * Registra la solicitud, notifica a la tienda y devuelve un comprobante al cliente.
 */
export const retraction = async (req, res, next) => {
  try {
    const data = retractionSchema.parse(req.body);
    const code = `ARR-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const fecha = new Date().toLocaleString('es-AR');

    // Notificar a la tienda (best-effort; no bloquea la respuesta al cliente)
    sendMail({
      to: env.storeEmail,
      subject: `Solicitud de arrepentimiento ${code} — Pedido ${data.orderNumber}`,
      text: `Comprobante: ${code}\nFecha: ${fecha}\nCliente: ${data.name} (${data.email})\nPedido: ${data.orderNumber}\nMotivo: ${data.reason || '-'}`,
    }).catch(() => {});

    // Confirmación al cliente
    sendMail({
      to: data.email,
      subject: `Recibimos tu solicitud de arrepentimiento (${code})`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#4f46e5">Solicitud de arrepentimiento recibida</h2>
          <p>Hola ${data.name}, registramos tu solicitud para el pedido <strong>${data.orderNumber}</strong>.</p>
          <p><strong>Comprobante:</strong> ${code}<br/><strong>Fecha:</strong> ${fecha}</p>
          <p style="color:#64748b;font-size:14px">Te contactaremos para coordinar la devolución y el reintegro según la normativa vigente (derecho de retracto, 10 días corridos).</p>
        </div>`,
    }).catch(() => {});

    sendSuccess(res, { code, date: fecha }, 'Solicitud registrada', 201);
  } catch (err) { next(err); }
};

/** Mensaje de contacto: notifica a la tienda. */
export const contact = async (req, res, next) => {
  try {
    const data = contactSchema.parse(req.body);
    sendMail({
      to: env.storeEmail,
      subject: `Consulta de ${data.name} — MiTienda`,
      text: `De: ${data.name} (${data.email})\n\n${data.message}`,
    }).catch(() => {});
    sendSuccess(res, null, 'Mensaje enviado');
  } catch (err) { next(err); }
};
