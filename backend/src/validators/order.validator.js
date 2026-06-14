import { z } from 'zod';

export const createOrderSchema = z.object({
  addressId: z.string().uuid('Dirección inválida'),
  couponCode: z.string().optional(),
});

// Dirección de envío para un pedido de invitado (snapshot, no se guarda en una cuenta)
const guestAddressSchema = z.object({
  province: z.string().min(2, 'Provincia requerida'),
  city: z.string().min(2, 'Ciudad requerida'),
  postalCode: z.string().min(3, 'Código postal requerido'),
  street: z.string().min(2, 'Calle requerida'),
  number: z.string().min(1, 'Número requerido'),
  floor: z.string().optional(),
  apartment: z.string().optional(),
  reference: z.string().optional(),
});

export const guestOrderSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nombre requerido').max(120),
  phone: z.string().max(40).optional(),
  couponCode: z.string().optional(),
  address: guestAddressSchema,
  items: z
    .array(
      z.object({
        productId: z.string().uuid('Producto inválido'),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1, 'El carrito está vacío'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING_PAYMENT', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REJECTED']),
  trackingNumber: z.string().max(100).optional(),
  carrier: z.string().max(100).optional(),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING_PAYMENT', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REJECTED']).optional(),
});
