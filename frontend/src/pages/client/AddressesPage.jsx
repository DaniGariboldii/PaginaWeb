import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFetch } from '../../hooks/useFetch';
import { addressesService } from '../../services/orders.service';
import { PageSpinner } from '../../components/ui/Spinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { AR_PROVINCES } from '../../utils/provinces';

const schema = z.object({
  province: z.string().min(2, 'Requerido'),
  city: z.string().min(2, 'Requerido'),
  postalCode: z.string().min(3, 'Requerido'),
  street: z.string().min(2, 'Requerido'),
  number: z.string().min(1, 'Requerido'),
  floor: z.string().optional(),
  apartment: z.string().optional(),
  reference: z.string().optional(),
  isDefault: z.boolean().default(false),
});

const inputClass =
  'w-full border border-ink-200 rounded-xl px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition';

export const AddressFormFields = ({ register, errors }) => (
  <>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-1.5">Provincia</label>
        <select {...register('province')} className={inputClass}>
          <option value="">Seleccionar...</option>
          {AR_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-1.5">Ciudad</label>
        <input {...register('city')} className={inputClass} />
        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
      </div>
    </div>
    <div className="grid grid-cols-3 gap-3">
      <div className="col-span-2">
        <label className="block text-sm font-medium text-ink-700 mb-1.5">Calle</label>
        <input {...register('street')} className={inputClass} />
        {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-1.5">Número</label>
        <input {...register('number')} className={inputClass} />
        {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number.message}</p>}
      </div>
    </div>
    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-1.5">Piso</label>
        <input {...register('floor')} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-1.5">Depto</label>
        <input {...register('apartment')} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-1.5">C. Postal</label>
        <input {...register('postalCode')} className={inputClass} />
        {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode.message}</p>}
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-ink-700 mb-1.5">Referencia (opcional)</label>
      <input {...register('reference')} placeholder="Ej: timbre azul, casa con rejas" className={inputClass} />
    </div>
    <label className="flex items-center gap-2 text-sm text-ink-700">
      <input type="checkbox" {...register('isDefault')} className="rounded" />
      Usar como dirección predeterminada
    </label>
  </>
);

export const AddressesPage = () => {
  const { data, loading, refetch } = useFetch(() => addressesService.list(), []);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const addresses = data?.addresses || [];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { isDefault: false },
  });

  const openCreate = () => {
    setEditing(null);
    reset({ province: '', city: '', postalCode: '', street: '', number: '', floor: '', apartment: '', reference: '', isDefault: false });
    setShowForm(true);
  };

  const openEdit = (addr) => {
    setEditing(addr.id);
    reset({ ...addr, floor: addr.floor || '', apartment: addr.apartment || '', reference: addr.reference || '' });
    setShowForm(true);
  };

  const onSubmit = async (values) => {
    setError('');
    try {
      if (editing) await addressesService.update(editing, values);
      else await addressesService.create(values);
      setShowForm(false);
      refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la dirección');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta dirección?')) return;
    setError('');
    try {
      await addressesService.remove(id);
      refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo eliminar');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Mis direcciones</h1>
          <p className="text-ink-500 mt-1">Gestioná tus domicilios de entrega</p>
        </div>
        {!showForm && <Button onClick={openCreate}>+ Nueva dirección</Button>}
      </div>

      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-ink-200 rounded-2xl p-6 space-y-4 mb-8">
          <h2 className="font-semibold text-ink-900">{editing ? 'Editar dirección' : 'Nueva dirección'}</h2>
          <AddressFormFields register={register} errors={errors} />
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar'}</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </form>
      )}

      {loading ? <PageSpinner /> : addresses.length === 0 && !showForm ? (
        <div className="text-center py-16 bg-white border border-ink-200 rounded-2xl">
          <p className="text-ink-500">Todavía no tenés direcciones cargadas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((a) => (
            <div key={a.id} className="bg-white border border-ink-200 rounded-2xl p-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-ink-900">{a.street} {a.number}</p>
                  {a.isDefault && <Badge label="Predeterminada" variant="blue" />}
                </div>
                <p className="text-sm text-ink-500">
                  {a.floor && `Piso ${a.floor} `}{a.apartment && `Depto ${a.apartment} · `}
                  {a.city}, {a.province} (CP {a.postalCode})
                </p>
                {a.reference && <p className="text-xs text-ink-400 mt-1">{a.reference}</p>}
              </div>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => openEdit(a)} className="text-sm text-brand-600 font-medium hover:underline">Editar</button>
                <button onClick={() => handleDelete(a.id)} className="text-sm text-red-500 hover:underline">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
