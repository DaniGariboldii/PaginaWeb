import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { ordersService } from '../../services/orders.service';
import { PageSpinner } from '../../components/ui/Spinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Badge } from '../../components/ui/Badge';
import { formatPrice, formatDate, orderStatusInfo, ORDER_STATUS } from '../../utils/format';

// Estados que el admin puede asignar manualmente (PAID se asigna solo al pagar)
const ADMIN_STATUSES = ['PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export const AdminOrdersPage = () => {
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [shipModal, setShipModal] = useState(null); // { id } al marcar como enviado
  const [tracking, setTracking] = useState({ trackingNumber: '', carrier: '' });
  const { data, loading, refetch } = useFetch(
    () => ordersService.listAll(filter ? { status: filter, limit: 50 } : { limit: 50 }),
    [filter]
  );

  const orders = data?.orders || [];

  const applyStatus = async (id, status, extra = {}) => {
    setError('');
    try {
      await ordersService.updateStatus(id, status, extra);
      refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cambiar el estado');
    }
  };

  const handleStatusChange = (id, status) => {
    // Al despachar pedimos el número de seguimiento (se envía por email al cliente)
    if (status === 'SHIPPED') {
      setTracking({ trackingNumber: '', carrier: '' });
      setShipModal({ id });
      return;
    }
    applyStatus(id, status);
  };

  const confirmShip = async () => {
    const { id } = shipModal;
    setShipModal(null);
    await applyStatus(id, 'SHIPPED', {
      trackingNumber: tracking.trackingNumber.trim() || undefined,
      carrier: tracking.carrier.trim() || undefined,
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Pedidos</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-ink-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ORDER_STATUS).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

      {loading ? <PageSpinner /> : (
        <div className="bg-white rounded-2xl border border-ink-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 border-b border-ink-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-ink-500">Pedido</th>
                  <th className="text-left px-4 py-3 font-medium text-ink-500">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-ink-500">Fecha</th>
                  <th className="text-right px-4 py-3 font-medium text-ink-500">Total</th>
                  <th className="text-center px-4 py-3 font-medium text-ink-500">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-ink-500">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {orders.map((o) => {
                  const info = orderStatusInfo(o.status);
                  return (
                    <tr key={o.id} className="hover:bg-ink-50">
                      <td className="px-4 py-3 font-medium text-ink-900">#{o.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-ink-600">
                        {o.user ? `${o.user.firstName} ${o.user.lastName}` : (o.guestName || 'Invitado')}
                        {!o.user && <span className="ml-1 text-[10px] font-semibold text-amber-600 uppercase">invitado</span>}
                        <span className="block text-xs text-ink-400">{o.user?.email ?? o.guestEmail}</span>
                      </td>
                      <td className="px-4 py-3 text-ink-500 text-xs">{formatDate(o.createdAt)}</td>
                      <td className="px-4 py-3 text-right font-medium text-ink-900">{formatPrice(o.total)}</td>
                      <td className="px-4 py-3 text-center"><Badge label={info.label} variant={info.variant} /></td>
                      <td className="px-4 py-3 text-right">
                        <select
                          value=""
                          onChange={(e) => e.target.value && handleStatusChange(o.id, e.target.value)}
                          className="border border-ink-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                          disabled={['CANCELLED', 'REJECTED', 'DELIVERED'].includes(o.status)}
                        >
                          <option value="">Cambiar a...</option>
                          {ADMIN_STATUSES.filter((s) => s !== o.status).map((s) => (
                            <option key={s} value={s}>{orderStatusInfo(s).label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && <p className="text-center text-ink-400 py-10">No hay pedidos.</p>}
        </div>
      )}

      {/* Modal: número de seguimiento al despachar */}
      {shipModal && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" onClick={() => setShipModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold text-ink-900 mb-1">Marcar como enviado</h2>
            <p className="text-sm text-ink-500 mb-4">Se enviará un email al cliente con el seguimiento.</p>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Número de seguimiento (opcional)</label>
            <input
              value={tracking.trackingNumber}
              onChange={(e) => setTracking((t) => ({ ...t, trackingNumber: e.target.value }))}
              placeholder="Ej: AR123456789"
              className="w-full border border-ink-200 rounded-xl px-3.5 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Transportista (opcional)</label>
            <input
              value={tracking.carrier}
              onChange={(e) => setTracking((t) => ({ ...t, carrier: e.target.value }))}
              placeholder="Ej: Correo Argentino, Andreani"
              className="w-full border border-ink-200 rounded-xl px-3.5 py-2.5 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShipModal(null)} className="px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100 rounded-lg">
                Cancelar
              </button>
              <button onClick={confirmShip} className="px-4 py-2 text-sm font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-700">
                Marcar enviado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
