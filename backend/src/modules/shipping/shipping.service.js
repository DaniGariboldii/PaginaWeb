import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';

/**
 * Cotiza el envío para una provincia y un subtotal.
 * - Busca la zona que cubre la provincia; si no hay, usa la zona por defecto.
 * - Si el subtotal supera el umbral de envío gratis de la zona, el costo es 0.
 * - Si no hay ninguna zona configurada, el envío es gratis (no bloquea la compra).
 */
export const quoteShipping = async (province, subtotal = 0) => {
  let zone = null;
  if (province) {
    zone = await prisma.shippingZone.findFirst({
      where: { active: true, provinces: { has: province } },
    });
  }
  if (!zone) {
    zone = await prisma.shippingZone.findFirst({ where: { active: true, isDefault: true } });
  }

  if (!zone) {
    return { cost: 0, free: true, zoneName: 'Envío gratis', configured: false };
  }

  const free = zone.freeThreshold != null && subtotal >= Number(zone.freeThreshold);
  return {
    cost: free ? 0 : Number(zone.cost),
    free,
    zoneName: zone.name,
    freeThreshold: zone.freeThreshold != null ? Number(zone.freeThreshold) : null,
    configured: true,
  };
};

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

export const listZones = () => prisma.shippingZone.findMany({ orderBy: { createdAt: 'asc' } });

export const createZone = async (data) => {
  if (data.isDefault) {
    await prisma.shippingZone.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
  }
  return prisma.shippingZone.create({ data });
};

export const updateZone = async (id, data) => {
  const zone = await prisma.shippingZone.findUnique({ where: { id } });
  if (!zone) throw new AppError('Zona no encontrada', 404);
  if (data.isDefault) {
    await prisma.shippingZone.updateMany({ where: { isDefault: true, id: { not: id } }, data: { isDefault: false } });
  }
  return prisma.shippingZone.update({ where: { id }, data });
};

export const deleteZone = async (id) => {
  const zone = await prisma.shippingZone.findUnique({ where: { id } });
  if (!zone) throw new AppError('Zona no encontrada', 404);
  await prisma.shippingZone.delete({ where: { id } });
};
