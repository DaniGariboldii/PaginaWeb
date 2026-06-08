import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';

export const getAddresses = (userId) =>
  prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

export const getAddressById = async (userId, id) => {
  const address = await prisma.address.findUnique({ where: { id } });
  if (!address || address.userId !== userId) throw new AppError('Dirección no encontrada', 404);
  return address;
};

export const createAddress = async (userId, data) => {
  // Si es la primera dirección o se marca como predeterminada, ajustar el resto
  const count = await prisma.address.count({ where: { userId } });
  const isDefault = data.isDefault || count === 0;

  return prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return tx.address.create({ data: { ...data, isDefault, userId } });
  });
};

export const updateAddress = async (userId, id, data) => {
  await getAddressById(userId, id); // valida pertenencia

  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return tx.address.update({ where: { id }, data });
  });
};

export const deleteAddress = async (userId, id) => {
  const address = await getAddressById(userId, id);

  // No permitir borrar si tiene pedidos asociados (integridad del historial)
  const orderCount = await prisma.order.count({ where: { addressId: id } });
  if (orderCount > 0) {
    throw new AppError('No se puede eliminar: la dirección tiene pedidos asociados', 409);
  }

  await prisma.address.delete({ where: { id } });

  // Si era la predeterminada, promover otra
  if (address.isDefault) {
    const next = await prisma.address.findFirst({ where: { userId } });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }

  return { deleted: true };
};
