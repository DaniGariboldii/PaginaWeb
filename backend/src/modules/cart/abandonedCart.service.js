import prisma from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { sendMail } from '../../config/mailer.js';

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(n));

/**
 * Recordatorio de carrito abandonado.
 * Busca carritos con productos cuya última actualización supera `hours` horas y
 * envía un email al cliente. Para no spamear, solo se envía si nunca se mandó un
 * recordatorio o si el carrito cambió después del último envío
 * (reminderSentAt < updatedAt = "abandono nuevo").
 *
 * Cuando el checkout completa la compra, el carrito se vacía, así que un carrito
 * con ítems es un abandono genuino.
 */
export const sendAbandonedCartReminders = async (hours = 4) => {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  const candidates = await prisma.cart.findMany({
    where: {
      updatedAt: { lt: cutoff },
      items: { some: {} },
      user: { emailVerified: true }, // no escribimos a cuentas sin verificar
    },
    include: {
      user: { select: { firstName: true, email: true } },
      items: {
        include: { product: { select: { name: true, price: true, discountPrice: true } } },
      },
    },
  });

  let sent = 0;
  for (const cart of candidates) {
    // Saltar si ya avisamos y el carrito no cambió desde entonces
    if (cart.reminderSentAt && cart.reminderSentAt >= cart.updatedAt) continue;
    if (!cart.user?.email) continue;

    const ok = await sendReminderEmail(cart);
    if (ok) {
      await prisma.cart.update({ where: { id: cart.id }, data: { reminderSentAt: new Date() } });
      sent += 1;
    }
  }

  if (sent > 0) console.log(`[CART] Recordatorios de carrito abandonado enviados: ${sent}`);
  return { sent, candidates: candidates.length };
};

const sendReminderEmail = async (cart) => {
  const rows = cart.items
    .map((i) => {
      const unit = i.product?.discountPrice ?? i.product?.price ?? i.unitPrice;
      return `<tr><td style="padding:6px 0">${i.product?.name ?? 'Producto'} × ${i.quantity}</td><td style="text-align:right">${fmt(Number(unit) * i.quantity)}</td></tr>`;
    })
    .join('');

  const cartUrl = `${env.frontendUrl}/carrito`;

  const { sent } = await sendMail({
    to: cart.user.email,
    subject: '¿Te quedó algo en el carrito? 🛒 — MiTienda',
    text: `Hola ${cart.user.firstName}, todavía tenés productos esperándote en tu carrito. Completá tu compra en ${cartUrl}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#4f46e5">Te guardamos tu carrito, ${cart.user.firstName} 🛒</h2>
        <p>Vimos que dejaste algunos productos sin comprar. ¡Todavía estás a tiempo!</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
          ${rows}
        </table>
        <p style="text-align:center;margin:24px 0">
          <a href="${cartUrl}" style="background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;display:inline-block">
            Completar mi compra
          </a>
        </p>
        <p style="color:#64748b;font-size:13px">Si ya lo compraste, ignorá este mensaje. ¡Gracias por elegirnos!</p>
      </div>`,
  });

  return sent;
};
