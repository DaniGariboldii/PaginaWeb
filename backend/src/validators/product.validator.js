import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  price: z.number().positive('El precio debe ser positivo'),
  discountPrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  categoryId: z.string().uuid('categoryId inválido'),
  brandId: z.string().uuid('brandId inválido').optional().nullable(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  featured: z.enum(['true', 'false']).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.enum(['true', 'false']).optional(),
  sort: z.enum(['relevance', 'price_asc', 'price_desc', 'newest', 'name_asc']).default('relevance'),
});
