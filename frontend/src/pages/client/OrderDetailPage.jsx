import { useParams, Link } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { ordersService, paymentsService } from '../../services/orders.service';
import { PageSpinner } from '../../components/ui/Spinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatPrice, formatDate, orderStatusInfo, paymentStatusInfo } from '../../utils/format';
import { useState } from 'react';
import { useToast } from '../../context/ToastContext';

const CANCELLABLE = ['PENDING_PAYMENT', 'PAID'];

export const OrderDetailPage = () => {
  const { id } = useParams();
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch(() => ordersService.getById(id), [id]);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const order = data?.order;

  if (loading) return <PageSpinner />;
  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <ErrorMessage message="Pedido no encontrado" />
        <Link to="/mis-pedidos" className="mt-4 inline-block text-brand-600 hover:underline">Volver a mis pedidos</Link>
      </div>
    );
  }

  const info = orderStatusInfo(order.status);
  const a = order.address;

  const handleSimulate = async (outcome) => {
    setPayError('');
    setPaying(true);
    try {
      await paymentsService.simulate(order.id, outcome);
      refetch();
    } catch (err) {
      setPayError(err.response?.data?.message || 'Error en el pago');
    } finally {
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('¿Seguro que querés cancelar este pedido?')) return;
    setPayError('');
    setCancelling(true);
    try {
      await ordersService.cancel(order.id);
      toast.success('Pedido cancelado');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo cancelar el pedido');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/mis-pedidos" className="text-sm text-ink-500 hover:text-ink-700 flex items-center gap-1 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver
      </Link>

      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Pedido #{order.id.slice(0, 8)}</h1>
          <p className="text-sm text-ink-500 mt-1">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge label={info.label} variant={info.variant} />
          {CANCELLABLE.includes(order.status) && (
            <Button onClick={handleCancel} disabled={cancelling} variant="secondary" size="sm">
              {cancelling ? 'Cancelando...' : 'Cancelar pedido'}
            </Button>
          )}
        </div>
      </div>

      {payError && <div className="mb-4"><ErrorMessage message={payError} /></div>}

      {/* Pago pendiente: ofrecer completar */}
      {order.status === 'PENDING_PAYMENT' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <p className="text-sm text-amber-800 font-medium mb-3">Este pedido está pendiente de pago.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleSimulate('approved')} disabled={paying} size="sm">Simular pago aprobado</Button>
            <Button onClick={() => handleSimulate('rejected')} disabled={paying} size="sm" variant="danger">Simular rechazo</Button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {/* Items */}
        <div className="sm:col-span-2 bg-white border border-ink-200 rounded-2xl p-6">
          <h2 className="font-semibold text-ink-900 mb-4">Productos</h2>
          <div className="divide-y divide-ink-100">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-ink-900">{item.productName}</p>
                  <p className="text-xs text-ink-500">{item.quantity} × {formatPrice(item.unitPrice)}</p>
                </div>
                <p className="text-sm font-semibold text-ink-900">{formatPrice(item.subtotal)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-ink-100 mt-4 pt-4 space-y-1.5">
            <div className="flex justify-between text-sm text-ink-600">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal ?? order.total)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Descuento{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                <span>−{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-ink-600">
              <span>Envío</span>
              <span>{Number(order.shippingCost) > 0 ? formatPrice(order.shippingCost) : 'Gratis'}</span>
            </div>
            <div className="flex justify-between font-bold text-ink-900 pt-1.5 border-t border-ink-100 mt-1.5">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Dirección */}
        {a && (
          <div className="bg-white border border-ink-200 rounded-2xl p-6">
            <h2 className="font-semibold text-ink-900 mb-2">Entrega</h2>
            <p className="text-sm text-ink-600">{a.street} {a.number}{a.floor && `, Piso ${a.floor}`}{a.apartment && ` Depto ${a.apartment}`}</p>
            <p className="text-sm text-ink-600">{a.city}, {a.province} (CP {a.postalCode})</p>
            {a.reference && <p className="text-xs text-ink-400 mt-1">{a.reference}</p>}
          </div>
        )}

        {/* Pago */}
        <div className="bg-white border border-ink-200 rounded-2xl p-6">
          <h2 className="font-semibold text-ink-900 mb-2">Pago</h2>
          <p className="text-sm text-ink-600">Método: Mercado Pago</p>
          <p className="text-sm text-ink-600">
            Estado: {paymentStatusInfo(order.payment?.status).label}
          </p>
        </div>
      </div>
    </div>
  );
};
