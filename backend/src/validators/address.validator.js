import { z } from 'zod';

export const createAddressSchema = z.object({
  province: z.string().min(2, 'Provincia requerida').max(100),
  city: z.string().min(2, 'Ciudad requerida').max(100),
  postalCode: z.string().min(3, 'Código postal requerido').max(20),
  street: z.string().min(2, 'Calle requerida').max(200),
  number: z.string().min(1, 'Número requerido').max(20),
  floor: z.string().max(20).optional(),
  apartment: z.string().max(20).optional(),
  reference: z.string().max(300).optional(),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();
