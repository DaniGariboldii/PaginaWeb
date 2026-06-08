import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { adminService } from '../../services/admin.service';
import { PageSpinner } from '../../components/ui/Spinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/format';

const MOVEMENT_LABELS = {
  IN: { label: 'Entrada', variant: 'green' },
  OUT: { label: 'Salida', variant: 'red' },
  ADJUSTMENT: { label: 'Ajuste', variant: 'blue' },
};

export const AdminStockPage = () => {
  const [lowOnly, setLowOnly] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // { id, value, reason }

  const { data, loading, refetch } = useFetch(
    () => adminService.stockOverview(lowOnly ? { lowOnly: true } : {}),
    [lowOnly]
  );
  const { data: movData, refetch: refetchMov } = useFetch(() => adminService.stockMovements({ limit: 15 }), []);

  const products = data?.products || [];
  const threshold = data?.threshold ?? 5;
  const movements = movData?.movements || [];

  const startEdit = (p) => setEditing({ id: p.id, value: String(p.stock), reason: '' });

  const saveEdit = async () => {
    setError('');
    try {
      await adminService.adjustStock(editing.id, Number(editing.value), editing.reason);
      setEditing(null);
      refetch();
      refetchMov();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo ajustar el stock');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Control de stock</h1>
        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} className="rounded" />
          Solo stock bajo (≤ {threshold})
        </label>
      </div>

      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tabla de productos */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-ink-200 overflow-hidden">
          {loading ? <PageSpinner /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 border-b border-ink-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-ink-500">Producto</th>
                    <th className="text-left px-4 py-3 font-medium text-ink-500">Categoría</th>
                    <th className="text-center px-4 py-3 font-medium text-ink-500">Stock</th>
                    <th className="text-right px-4 py-3 font-medium text-ink-500">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-ink-50">
                      <td className="px-4 py-3 font-medium text-ink-900">{p.name}</td>
                      <td className="px-4 py-3 text-ink-500">{p.category?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-center">
                        {editing?.id === p.id ? (
                          <input
                            type="number" min="0" autoFocus
                            value={editing.value}
                            onChange={(e) => setEditing((s) => ({ ...s, value: e.target.value }))}
                            className="w-20 border border-ink-300 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        ) : p.stock === 0 ? (
                          <Badge label="Sin stock" variant="red" />
                        ) : p.stock <= threshold ? (
                          <span className="font-semibold text-amber-600">{p.stock}</span>
                        ) : (
                          <span className="font-medium text-ink-700">{p.stock}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editing?.id === p.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <input
                              placeholder="Motivo"
                              value={editing.reason}
                              onChange={(e) => setEditing((s) => ({ ...s, reason: e.target.value }))}
                              className="w-28 border border-ink-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                            <button onClick={saveEdit} className="text-xs font-medium text-emerald-600 hover:underline">Guardar</button>
                            <button onClick={() => setEditing(null)} className="text-xs text-ink-400 hover:underline">Cancelar</button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(p)} className="text-xs font-medium text-brand-600 hover:underline">Ajustar</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && <p className="text-center text-ink-400 py-10">Sin productos.</p>}
            </div>
          )}
        </div>

        {/* Movimientos recientes */}
        <div className="bg-white rounded-2xl border border-ink-200 p-6">
          <h2 className="font-semibold text-ink-900 mb-4">Movimientos recientes</h2>
          {movements.length === 0 ? (
            <p className="text-sm text-ink-400 text-center py-6">Sin movimientos</p>
          ) : (
            <div className="space-y-3">
              {movements.map((m) => {
                const info = MOVEMENT_LABELS[m.type] || { label: m.type, variant: 'gray' };
                // Efecto con signo: OUT resta, IN suma, ADJUSTMENT ya viene firmado (delta)
                const signed = m.type === 'OUT' ? -Math.abs(m.quantity) : m.quantity;
                return (
                  <div key={m.id} className="flex items-start justify-between gap-2 pb-3 border-b border-ink-100 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">{m.product?.name}</p>
                      <p className="text-xs text-ink-400">{formatDate(m.createdAt)}</p>
                      {m.reason && <p className="text-xs text-ink-400 truncate">{m.reason}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <Badge label={info.label} variant={info.variant} />
                      <p className={`text-xs font-semibold mt-1 ${signed >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {signed > 0 ? `+${signed}` : signed}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
