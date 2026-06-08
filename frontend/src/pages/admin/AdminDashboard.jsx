import { Link } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { adminService } from '../../services/admin.service';
import { PageSpinner } from '../../components/ui/Spinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Badge } from '../../components/ui/Badge';
import { formatPrice, formatDate, orderStatusInfo } from '../../utils/format';

// Clases literales para que Tailwind las genere (no usar interpolación dinámica)
const ACCENTS = {
  brand: 'bg-brand-50 text-brand-600',
  amber: 'bg-amber-50 text-amber-600',
};

const MetricCard = ({ label, value, sub, icon, accent = 'brand' }) => (
  <div className="bg-white rounded-2xl border border-ink-200 p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-ink-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-ink-900">{value}</p>
        {sub && <p className="text-xs text-ink-400 mt-1">{sub}</p>}
      </div>
      <span className={`grid place-items-center w-11 h-11 rounded-xl shrink-0 ${ACCENTS[accent]}`}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </span>
    </div>
  </div>
);

export const AdminDashboard = () => {
  const { data, loading, error } = useFetch(() => adminService.dashboard(), []);

  if (loading) return <PageSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const { metrics, ordersByStatus, recentOrders, topProducts } = data;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-1">Dashboard</h1>
      <p className="text-ink-500 mb-8">Resumen general de tu tienda</p>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <MetricCard
          label="Ingresos totales" value={formatPrice(metrics.totalRevenue)}
          sub="Pedidos pagados"
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <MetricCard
          label="Pedidos" value={metrics.ordersCount}
          sub={`${metrics.pendingOrders} pendientes de pago`}
          icon="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
        <MetricCard
          label="Clientes" value={metrics.usersCount}
          icon="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-3a4 4 0 11-8 0 4 4 0 018 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z"
        />
        <MetricCard
          label="Productos activos" value={metrics.productsCount}
          icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
        <MetricCard
          label="Stock bajo" value={metrics.lowStockCount}
          sub="Necesitan reposición" accent={metrics.lowStockCount > 0 ? 'amber' : 'brand'}
          icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
        <MetricCard
          label="Pendientes de pago" value={metrics.pendingOrders}
          accent={metrics.pendingOrders > 0 ? 'amber' : 'brand'}
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pedidos recientes */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-ink-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-900">Pedidos recientes</h2>
            <Link to="/admin/pedidos" className="text-sm text-brand-600 font-medium hover:underline">Ver todos</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-ink-400 py-6 text-center">Sin pedidos aún</p>
          ) : (
            <div className="divide-y divide-ink-100">
              {recentOrders.map((o) => {
                const info = orderStatusInfo(o.status);
                return (
                  <div key={o.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-ink-900">#{o.id.slice(0, 8)} · {o.customer}</p>
                      <p className="text-xs text-ink-400">{formatDate(o.createdAt)} · {o.itemsCount} ítem(s)</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge label={info.label} variant={info.variant} />
                      <span className="text-sm font-semibold text-ink-900 w-24 text-right">{formatPrice(o.total)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top productos */}
        <div className="bg-white rounded-2xl border border-ink-200 p-6">
          <h2 className="font-semibold text-ink-900 mb-4">Más vendidos</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-ink-400 py-6 text-center">Sin ventas aún</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="grid place-items-center w-7 h-7 rounded-lg bg-brand-50 text-brand-600 text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{p.name}</p>
                    <p className="text-xs text-ink-400">{p.unitsSold} vendidos</p>
                  </div>
                  <span className="text-sm font-semibold text-ink-700">{formatPrice(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Estados de pedidos */}
          {ordersByStatus.length > 0 && (
            <div className="mt-6 pt-6 border-t border-ink-100">
              <h3 className="text-sm font-semibold text-ink-900 mb-3">Pedidos por estado</h3>
              <div className="space-y-2">
                {ordersByStatus.map((s) => {
                  const info = orderStatusInfo(s.status);
                  return (
                    <div key={s.status} className="flex items-center justify-between text-sm">
                      <Badge label={info.label} variant={info.variant} />
                      <span className="text-ink-700 font-medium">{s.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
