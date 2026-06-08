import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';

/** Precio efectivo de un producto (con descuento si corresponde) */
const effectivePrice = (product) =>
  product.discountPrice && Number(product.discountPrice) < Number(product.price)
    ? Number(product.discountPrice)
    : Number(product.price);

/** Asegura que el usuario tenga un carrito (lo crea si no existe) */
const ensureCart = async (userId) => {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) cart = await prisma.cart.create({ data: { userId } });
  return cart;
};

/**
 * Devuelve el carrito del usuario con los ítems, precios actuales y totales.
 * Los totales SIEMPRE se calculan en el backend a partir del precio actual.
 */
export const getCart = async (userId) => {
  const cart = await ensureCart(userId);

  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    orderBy: { createdAt: 'asc' },
    include: {
      product: {
        select: {
          id: true, name: true, slug: true, price: true, discountPrice: true,
          stock: true, active: true,
          images: { select: { url: true, isPrimary: true }, orderBy: { isPrimary: 'desc' }, take: 1 },
        },
      },
    },
  });

  const mappedItems = items.map((item) => {
    const unitPrice = effectivePrice(item.product);
    const subtotal = unitPrice * item.quantity;
    return {
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      slug: item.product.slug,
      image: item.product.images[0]?.url ?? null,
      unitPrice,
      quantity: item.quantity,
      subtotal,
      stock: item.product.stock,
      available: item.product.active && item.product.stock >= item.quantity,
    };
  });

  const total = mappedItems.reduce((acc, i) => acc + (i.available ? i.subtotal : 0), 0);
  const itemCount = mappedItems.reduce((acc, i) => acc + i.quantity, 0);

  return { cartId: cart.id, items: mappedItems, total, itemCount };
};

/** Agrega un producto al carrito (o suma cantidad) validando stock */
export const addItem = async (userId, { productId, quantity }) => {
  const cart = await ensureCart(userId);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.active) throw new AppError('Producto no disponible', 404);

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  const newQuantity = (existing?.quantity ?? 0) + quantity;
  if (newQuantity > product.stock) {
    throw new AppError(`Stock insuficiente. Disponible: ${product.stock}`, 409);
  }

  const unitPrice = effectivePrice(product);

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQuantity, unitPrice },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity, unitPrice },
    });
  }

  return getCart(userId);
};

/** Actualiza la cantidad de un ítem validando stock y pertenencia */
export const updateItem = async (userId, itemId, quantity) => {
  const cart = await ensureCart(userId);

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { product: true },
  });

  if (!item || item.cartId !== cart.id) throw new AppError('Ítem no encontrado', 404);
  if (quantity > item.product.stock) {
    throw new AppError(`Stock insuficiente. Disponible: ${item.product.stock}`, 409);
  }

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity, unitPrice: effectivePrice(item.product) },
  });

  return getCart(userId);
};

/** Elimina un ítem del carrito */
export const removeItem = async (userId, itemId) => {
  const cart = await ensureCart(userId);

  const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!item || item.cartId !== cart.id) throw new AppError('Ítem no encontrado', 404);

  await prisma.cartItem.delete({ where: { id: itemId } });
  return getCart(userId);
};

/** Vacía el carrito */
export const clearCart = async (userId) => {
  const cart = await ensureCart(userId);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return getCart(userId);
};
