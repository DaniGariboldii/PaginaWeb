import { z } from 'zod';

export const addItemSchema = z.object({
  productId: z.string().uuid('productId inválido'),
  quantity: z.number().int().positive('La cantidad debe ser al menos 1').default(1),
});

export const updateItemSchema = z.object({
  quantity: z.number().int().positive('La cantidad debe ser al menos 1'),
});
