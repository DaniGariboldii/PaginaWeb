import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useFetch } from '../../hooks/useFetch';
import { shippingService } from '../../services/orders.service';
import { PageSpinner } from '../../components/ui/Spinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatPrice } from '../../utils/format';
import { AR_PROVINCES } from '../../utils/provinces';

const inputClass =
  'w-full border border-ink-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition';

export const AdminShippingPage = () => {
  const { data, loading, refetch } = useFetch(() => shippingService.listZones(), []);
  const [error, setError] = useState('');
  const zones = data?.zones || [];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { provinces: [], isDefault: false },
  });

  const onCreate = async (values) => {
    setError('');
    const payload = {
      name: values.name,
      cost: Number(values.cost),
      freeThreshold: values.freeThreshold === '' || values.freeThreshold == null ? null : Number(values.freeThreshold),
      provinces: Array.isArray(values.provinces) ? values.provinces : (values.provinces ? [values.provinces] : []),
      isDefault: !!values.isDefault,
    };
    if (!payload.name || payload.name.length < 2) { setError('Ingresá un nombre'); return; }
    try {
      await shippingService.createZone(payload);
      reset({ provinces: [], isDefault: false, name: '', cost: '', freeThreshold: '' });
      refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear la zona');
    }
  };

  const toggleActive = async (z) => {
    try { await shippingService.updateZone(z.id, { active: !z.active }); refetch(); }
    catch (err) { setError(err.response?.data?.message || 'Error'); }
  };

  const remove = async (id) => {
    if (!window.confirm('¿Eliminar zona de envío?')) return;
    try { await shippingService.removeZone(id); refetch(); }
    catch (err) { setError(err.response?.data?.message || 'Error'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-1">Costos de envío</h1>
      <p className="text-ink-500 mb-6">Configurá el costo por zona y el monto para envío gratis.</p>
      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

      {/* Crear zona */}
      <form onSubmit={handleSubmit(onCreate)} className="bg-white border border-ink-200 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-ink-900 mb-4">Nueva zona</h2>
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Nombre</label>
            <input {...register('name')} placeholder="Ej: Patagonia" className={inputClass} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Costo ($)</label>
            <input {...register('cost')} type="number" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Envío gratis desde ($)</label>
            <input {...register('freeThreshold')} type="number" placeholder="opcional" className={inputClass} />
          </div>
        </div>

        <label className="block text-xs font-medium text-ink-600 mb-2">Provincias que cubre</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-4">
          {AR_PROVINCES.map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm text-ink-600">
              <input type="checkbox" value={p} {...register('provinces')} className="rounded" />
              <span className="truncate">{p}</span>
            </label>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-700 mb-4">
          <input type="checkbox" {...register('isDefault')} className="rounded" />
          Usar como zona por defecto (provincias no listadas en otras zonas)
        </label>

        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Crear zona'}</Button>
      </form>

      {/* Lista */}
      {loading ? <PageSpinner /> : (
        <div className="space-y-3">
          {zones.map((z) => (
            <div key={z.id} className="bg-white border border-ink-200 rounded-2xl p-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-semibold text-ink-900">{z.name}</p>
                  {z.isDefault && <Badge label="Por defecto" variant="blue" />}
                  <Badge label={z.active ? 'Activa' : 'Inactiva'} variant={z.active ? 'green' : 'gray'} />
                </div>
                <p className="text-sm text-ink-600">
                  Costo: {formatPrice(z.cost)}
                  {z.freeThreshold ? ` · Gratis desde ${formatPrice(z.freeThreshold)}` : ''}
                </p>
                <p className="text-xs text-ink-400 mt-1">
                  {z.provinces.length ? z.provinces.join(', ') : (z.isDefault ? 'Todas las no listadas' : 'Sin provincias asignadas')}
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => toggleActive(z)} className="text-xs font-medium text-amber-600 hover:underline">
                  {z.active ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => remove(z.id)} className="text-xs font-medium text-red-500 hover:underline">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          {zones.length === 0 && (
            <p className="text-center text-ink-400 py-10 bg-white border border-ink-200 rounded-2xl">
              No hay zonas configuradas. Sin zonas, el envío es gratis.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
