import { z } from 'zod';
import { AR_PROVINCES } from '../utils/provinces.js';

export const quoteSchema = z.object({
  province: z.string().min(1, 'Provincia requerida'),
  subtotal: z.coerce.number().min(0).default(0),
});

export const createZoneSchema = z.object({
  name: z.string().min(2, 'Nombre requerido').max(100),
  provinces: z.array(z.enum(AR_PROVINCES)).default([]),
  cost: z.coerce.number().min(0),
  freeThreshold: z.coerce.number().min(0).optional().nullable(),
  isDefault: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const updateZoneSchema = createZoneSchema.partial();
