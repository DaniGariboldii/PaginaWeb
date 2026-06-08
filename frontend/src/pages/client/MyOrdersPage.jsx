import { Link } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { ordersService } from '../../services/orders.service';
import { PageSpinner } from '../../components/ui/Spinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatPrice, formatDate, orderStatusInfo } from '../../utils/format';

export const MyOrdersPage = () => {
  const { data, loading, error } = useFetch(() => ordersService.myOrders({ limit: 50 }), []);
  const orders = data?.orders || [];

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-ink-900 mb-8">Mis pedidos</h1>

      {error && <ErrorMessage message={error} />}

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-ink-200 rounded-2xl">
          <svg className="w-14 h-14 mx-auto text-ink-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-ink-700 font-medium mb-1">Todavía no hiciste pedidos</p>
          <p className="text-sm text-ink-500 mb-6">Cuando compres algo, lo verás acá.</p>
          <Button as="link" to="/productos">Ver productos</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const info = orderStatusInfo(order.status);
            return (
              <Link
                key={order.id}
                to={`/mis-pedidos/${order.id}`}
                className="block bg-white border border-ink-200 rounded-2xl p-5 hover:border-brand-300 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">Pedido #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-ink-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <Badge label={info.label} variant={info.variant} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink-500">
                    {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                  </p>
                  <p className="font-bold text-ink-900">{formatPrice(order.total)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
