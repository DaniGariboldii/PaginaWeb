import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFetch } from '../../hooks/useFetch';
import { categoriesService, brandsService } from '../../services/products.service';
import { PageSpinner } from '../../components/ui/Spinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Badge } from '../../components/ui/Badge';

const catSchema = z.object({ name: z.string().min(2), description: z.string().optional(), active: z.boolean().default(true) });
const brandSchema = z.object({ name: z.string().min(2), active: z.boolean().default(true) });

const MiniForm = ({ title, schema, onSave, loading }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { active: true } });
  const onSubmit = async (data) => { await onSave(data); reset(); };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
      <div className="flex gap-2">
        <input {...register('name')} placeholder={`Nueva ${title.toLowerCase()}...`}
          className="flex-1 border border-ink-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition" />
        <button type="submit" disabled={loading}
          className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition active:scale-[0.98]">
          Agregar
        </button>
      </div>
      {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name.message}</p>}
    </form>
  );
};

const ListCard = ({ children }) => (
  <div className="bg-white border border-ink-200 rounded-2xl overflow-hidden">{children}</div>
);

export const AdminCategoriesPage = () => {
  const [catError, setCatError] = useState('');
  const [brandError, setBrandError] = useState('');

  const { data: catData, loading: catLoading, refetch: refetchCats } = useFetch(() => categoriesService.list(), []);
  const { data: brandData, loading: brandLoading, refetch: refetchBrands } = useFetch(() => brandsService.list(), []);

  const categories = catData?.categories || [];
  const brands = brandData?.brands || [];

  const handleCreateCat = async (data) => {
    try { setCatError(''); await categoriesService.create(data); refetchCats(); }
    catch (err) { setCatError(err.response?.data?.message || 'Error'); }
  };
  const handleToggleCat = async (cat) => {
    try { await categoriesService.update(cat.id, { active: !cat.active }); refetchCats(); }
    catch (err) { setCatError(err.response?.data?.message || 'Error'); }
  };
  const handleDeleteCat = async (id) => {
    if (!window.confirm('¿Eliminar categoría?')) return;
    try { setCatError(''); await categoriesService.remove(id); refetchCats(); }
    catch (err) { setCatError(err.response?.data?.message || 'Error'); }
  };
  const handleCreateBrand = async (data) => {
    try { setBrandError(''); await brandsService.create(data); refetchBrands(); }
    catch (err) { setBrandError(err.response?.data?.message || 'Error'); }
  };
  const handleDeleteBrand = async (id) => {
    if (!window.confirm('¿Eliminar marca?')) return;
    try { setBrandError(''); await brandsService.remove(id); refetchBrands(); }
    catch (err) { setBrandError(err.response?.data?.message || 'Error'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-6">Categorías y marcas</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Categorías */}
        <div>
          <h2 className="font-semibold text-ink-900 mb-3">Categorías</h2>
          {catError && <div className="mb-3"><ErrorMessage message={catError} /></div>}
          {catLoading ? <PageSpinner /> : (
            <ListCard>
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3 border-b border-ink-100 last:border-0 hover:bg-ink-50">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{c.name}</p>
                    <p className="text-xs text-ink-400">{c.slug}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge label={c.active ? 'Activa' : 'Inactiva'} variant={c.active ? 'green' : 'gray'} />
                    <button onClick={() => handleToggleCat(c)} className="text-xs font-medium text-amber-600 hover:underline">
                      {c.active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button onClick={() => handleDeleteCat(c.id)} className="text-xs font-medium text-red-500 hover:underline">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && <p className="text-center text-ink-400 py-8 text-sm">Sin categorías</p>}
            </ListCard>
          )}
          <MiniForm title="Categoría" schema={catSchema} onSave={handleCreateCat} />
        </div>

        {/* Marcas */}
        <div>
          <h2 className="font-semibold text-ink-900 mb-3">Marcas</h2>
          {brandError && <div className="mb-3"><ErrorMessage message={brandError} /></div>}
          {brandLoading ? <PageSpinner /> : (
            <ListCard>
              {brands.map((b) => (
                <div key={b.id} className="flex items-center justify-between px-4 py-3 border-b border-ink-100 last:border-0 hover:bg-ink-50">
                  <p className="text-sm font-medium text-ink-900">{b.name}</p>
                  <div className="flex items-center gap-3">
                    <Badge label={b.active ? 'Activa' : 'Inactiva'} variant={b.active ? 'green' : 'gray'} />
                    <button onClick={() => handleDeleteBrand(b.id)} className="text-xs font-medium text-red-500 hover:underline">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
              {brands.length === 0 && <p className="text-center text-ink-400 py-8 text-sm">Sin marcas</p>}
            </ListCard>
          )}
          <MiniForm title="Marca" schema={brandSchema} onSave={handleCreateBrand} />
        </div>
      </div>
    </div>
  );
};
