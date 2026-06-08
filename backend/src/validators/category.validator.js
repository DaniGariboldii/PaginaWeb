import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  active: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createBrandSchema = z.object({
  name: z.string().min(2).max(100),
  active: z.boolean().default(true),
});

export const updateBrandSchema = createBrandSchema.partial();
