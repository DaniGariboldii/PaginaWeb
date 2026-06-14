import { z } from 'zod';

const productBase = z.object({
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

// El precio de oferta nunca puede ser mayor o igual al precio regular.
const discountLessThanPrice = {
  message: 'El precio de oferta debe ser menor al precio regular',
  path: ['discountPrice'],
};

export const createProductSchema = productBase.refine(
  (d) => d.discountPrice == null || d.discountPrice < d.price,
  discountLessThanPrice
);

// En updates parciales solo podemos comparar si llegan ambos campos; el caso en que
// llega uno solo se valida en el servicio contra el valor ya guardado.
export const updateProductSchema = productBase.partial().refine(
  (d) => d.discountPrice == null || d.price == null || d.discountPrice < d.price,
  discountLessThanPrice
);

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
  onSale: z.enum(['true', 'false']).optional(),
  sort: z.enum(['relevance', 'price_asc', 'price_desc', 'newest', 'name_asc']).default('relevance'),
});
