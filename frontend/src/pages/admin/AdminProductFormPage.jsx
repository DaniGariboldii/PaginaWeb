import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { productsService, categoriesService, brandsService } from '../../services/products.service';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { PageSpinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { ProductImageManager } from '../../components/admin/ProductImageManager';

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Precio inválido'),
  discountPrice: z.coerce.number().positive().optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
  stock: z.coerce.number().int().min(0),
  categoryId: z.string().min(1, 'Seleccioná una categoría'),
  brandId: z.string().optional(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});

const inputClass =
  'w-full border border-ink-200 rounded-xl px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition';

// Field fuera del render para no remontar inputs en cada render
const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-ink-700 mb-1.5">{label}</label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1.5">{error.message}</p>}
  </div>
);

export const AdminProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [serverError, setServerError] = useState('');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { active: true, featured: false, stock: 0 },
  });

  useEffect(() => {
    Promise.all([categoriesService.list(), brandsService.list()])
      .then(([catRes, brandRes]) => {
        setCategories(catRes.data.data?.categories || []);
        setBrands(brandRes.data.data?.brands || []);
      });

    if (isEditing) {
      productsService.getById(id)
        .then((res) => {
          const p = res.data.data?.product;
          reset({
            name: p.name,
            description: p.description || '',
            price: Number(p.price),
            discountPrice: p.discountPrice ? Number(p.discountPrice) : '',
            stock: p.stock,
            categoryId: p.category?.id || '',
            brandId: p.brand?.id || '',
            featured: p.featured,
            active: p.active,
          });
          setProductImages(p.images || []);
        })
        .catch(() => setServerError('No se pudo cargar el producto'))
        .finally(() => setInitialLoading(false));
    }
  }, [id, isEditing, reset]);

  const onSubmit = async (data) => {
    setServerError('');
    const payload = { ...data };
    if (!payload.brandId) delete payload.brandId;
    if (!payload.discountPrice) delete payload.discountPrice;

    try {
      if (isEditing) {
        await productsService.update(id, payload);
        navigate('/admin/productos');
      } else {
        const { data: created } = await productsService.create(payload);
        navigate(`/admin/productos/${created.data.product.id}/editar`);
      }
    } catch (err) {
      setServerError(err.response?.data?.message || 'Error al guardar');
    }
  };

  if (initialLoading) return <PageSpinner />;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-ink-900 mb-6">
        {isEditing ? 'Editar producto' : 'Nuevo producto'}
      </h1>

      {serverError && <div className="mb-4"><ErrorMessage message={serverError} /></div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-white border border-ink-200 rounded-2xl p-6">
        <Field label="Nombre *" error={errors.name}>
          <input {...register('name')} className={inputClass} />
        </Field>

        <Field label="Descripción" error={errors.description}>
          <textarea {...register('description')} rows={4} className={inputClass} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Precio *" error={errors.price}>
            <input {...register('price')} type="number" step="0.01" className={inputClass} />
          </Field>
          <Field label="Precio con descuento" error={errors.discountPrice}>
            <input {...register('discountPrice')} type="number" step="0.01" className={inputClass} />
          </Field>
        </div>

        <Field label="Stock *" error={errors.stock}>
          <input {...register('stock')} type="number" className={inputClass} />
        </Field>

        <Field label="Categoría *" error={errors.categoryId}>
          <select {...register('categoryId')} className={inputClass}>
            <option value="">Seleccionar...</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>

        <Field label="Marca" error={errors.brandId}>
          <select {...register('brandId')} className={inputClass}>
            <option value="">Sin marca</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" {...register('featured')} className="rounded" />
            Producto destacado
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" {...register('active')} className="rounded" />
            Activo
          </label>
        </div>

        {/* Imágenes — solo en edición (requiere producto creado) */}
        {isEditing ? (
          <div className="border-t border-ink-100 pt-5">
            <ProductImageManager productId={id} images={productImages} onChange={setProductImages} />
          </div>
        ) : (
          <p className="text-xs text-ink-400 border-t border-ink-100 pt-5">
            Podrás cargar imágenes después de crear el producto.
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear producto'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/productos')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
};
