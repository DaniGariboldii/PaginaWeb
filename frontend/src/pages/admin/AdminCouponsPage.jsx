import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFetch } from '../../hooks/useFetch';
import { couponsService } from '../../services/orders.service';
import { PageSpinner } from '../../components/ui/Spinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatPrice } from '../../utils/format';

const schema = z.object({
  code: z.string().min(3, 'Mínimo 3 caracteres'),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.coerce.number().positive('Valor inválido'),
  minPurchase: z.coerce.number().min(0).optional().or(z.literal('')),
  maxUses: z.coerce.number().int().positive().optional().or(z.literal('')),
});

const inputClass =
  'w-full border border-ink-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition';

export const AdminCouponsPage = () => {
  const { data, loading, refetch } = useFetch(() => couponsService.list(), []);
  const [error, setError] = useState('');
  const coupons = data?.coupons || [];

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: 'PERCENTAGE' },
  });
  const type = watch('type');

  const onCreate = async (values) => {
    setError('');
    const payload = {
      code: values.code,
      type: values.type,
      value: values.value,
      minPurchase: values.minPurchase === '' ? null : values.minPurchase,
      maxUses: values.maxUses === '' ? null : values.maxUses,
    };
    try {
      await couponsService.create(payload);
      reset({ type: 'PERCENTAGE', code: '', value: '', minPurchase: '', maxUses: '' });
      refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear el cupón');
    }
  };

  const toggleActive = async (c) => {
    try { await couponsService.update(c.id, { active: !c.active }); refetch(); }
    catch (err) { setError(err.response?.data?.message || 'Error'); }
  };

  const remove = async (id) => {
    if (!window.confirm('¿Eliminar cupón?')) return;
    try { await couponsService.remove(id); refetch(); }
    catch (err) { setError(err.response?.data?.message || 'Error'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-6">Cupones de descuento</h1>
      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

      {/* Crear cupón */}
      <form onSubmit={handleSubmit(onCreate)} className="bg-white border border-ink-200 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-ink-900 mb-4">Nuevo cupón</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Código</label>
            <input {...register('code')} placeholder="VERANO10" className={`${inputClass} uppercase`} />
            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Tipo</label>
            <select {...register('type')} className={inputClass}>
              <option value="PERCENTAGE">Porcentaje (%)</option>
              <option value="FIXED">Monto fijo ($)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">{type === 'PERCENTAGE' ? 'Porcentaje' : 'Monto'}</label>
            <input {...register('value')} type="number" step="0.01" className={inputClass} />
            {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Compra mín.</label>
            <input {...register('minPurchase')} type="number" placeholder="opcional" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Usos máx.</label>
            <input {...register('maxUses')} type="number" placeholder="opcional" className={inputClass} />
          </div>
        </div>
        <div className="mt-4">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Crear cupón'}</Button>
        </div>
      </form>

      {/* Lista */}
      {loading ? <PageSpinner /> : (
        <div className="bg-white rounded-2xl border border-ink-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 border-b border-ink-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-ink-500">Código</th>
                  <th className="text-left px-4 py-3 font-medium text-ink-500">Descuento</th>
                  <th className="text-left px-4 py-3 font-medium text-ink-500">Mín.</th>
                  <th className="text-center px-4 py-3 font-medium text-ink-500">Usos</th>
                  <th className="text-center px-4 py-3 font-medium text-ink-500">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-ink-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-ink-50">
                    <td className="px-4 py-3 font-semibold text-ink-900">{c.code}</td>
                    <td className="px-4 py-3 text-ink-700">
                      {c.type === 'PERCENTAGE' ? `${Number(c.value)}%` : formatPrice(c.value)}
                    </td>
                    <td className="px-4 py-3 text-ink-500">{c.minPurchase ? formatPrice(c.minPurchase) : '—'}</td>
                    <td className="px-4 py-3 text-center text-ink-700">
                      {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ''}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge label={c.active ? 'Activo' : 'Inactivo'} variant={c.active ? 'green' : 'gray'} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => toggleActive(c)} className="text-xs font-medium text-amber-600 hover:underline">
                          {c.active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button onClick={() => remove(c.id)} className="text-xs font-medium text-red-500 hover:underline">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {coupons.length === 0 && <p className="text-center text-ink-400 py-10">No hay cupones aún.</p>}
        </div>
      )}
    </div>
  );
};
