import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { PAID_STATUSES } from './dashboard.service.js';

export const getUsers = async ({ page, limit, search }) => {
  const where = {
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };
  const skip = (page - 1) * limit;

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        role: true, active: true, createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
  ]);

  return { users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

/**
 * Activa/desactiva un usuario (baja lógica).
 * Reglas: no permite cambiar el estado de un ADMIN ni el propio.
 */
export const setUserStatus = async (adminId, userId, active) => {
  if (adminId === userId) throw new AppError('No podés cambiar tu propio estado', 400);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('Usuario no encontrado', 404);
  if (user.role === 'ADMIN') throw new AppError('No se puede modificar a un administrador', 403);

  return prisma.user.update({
    where: { id: userId },
    data: { active },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, active: true },
  });
};

/** Detalle de un usuario con su resumen de compras (para admin) */
export const getUserDetail = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      role: true, active: true, createdAt: true,
    },
  });
  if (!user) throw new AppError('Usuario no encontrado', 404);

  const spentAgg = await prisma.order.aggregate({
    _sum: { total: true },
    _count: { _all: true },
    where: { userId, status: { in: PAID_STATUSES } },
  });

  return {
    ...user,
    totalSpent: Number(spentAgg._sum.total ?? 0),
    paidOrders: spentAgg._count._all,
  };
};
