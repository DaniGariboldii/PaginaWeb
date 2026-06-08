import { useFetch } from '../../hooks/useFetch';
import { adminService } from '../../services/admin.service';
import { PageSpinner } from '../../components/ui/Spinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Badge } from '../../components/ui/Badge';
import { formatPrice } from '../../utils/format';

const StatCard = ({ label, value }) => (
  <div className="bg-white rounded-2xl border border-ink-200 p-5">
    <p className="text-sm text-ink-500 mb-1">{label}</p>
    <p className="text-2xl font-bold text-ink-900">{value}</p>
  </div>
);

// Gráfico de barras simple (sin dependencias externas)
const SalesChart = ({ data }) => {
  if (!data.length) return <p className="text-sm text-ink-400 text-center py-10">Sin ventas en el período</p>;
  const max = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="flex items-end gap-1.5 h-48 mt-4">
      {data.map((d) => (
        <div key={d.day} className="flex-1 h-full flex flex-col items-center justify-end group relative">
          <div
            className="w-full bg-brand-500 rounded-t-md hover:bg-brand-600 transition-colors min-h-1"
            style={{ height: `${(d.revenue / max) * 100}%` }}
          />
          <div className="absolute bottom-full mb-1 hidden group-hover:block bg-ink-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
            {d.day.slice(5)}: {formatPrice(d.revenue)}
          </div>
        </div>
      ))}
    </div>
  );
};

export const AdminReportsPage = () => {
  const { data: sales, loading: sLoading, error: sError } = useFetch(() => adminService.salesReport({ days: 30 }), []);
  const { data: stock, loading: stLoading } = useFetch(() => adminService.stockReport(), []);

  if (sLoading || stLoading) return <PageSpinner />;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-ink-900">Reportes</h1>

      {sError && <ErrorMessage message={sError} />}

      {/* ── Ventas ─────────────────────────────────────────────────────── */}
      {sales && (
        <section>
          <h2 className="text-lg font-semibold text-ink-900 mb-4">Ventas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            <StatCard label="Ingresos totales" value={formatPrice(sales.summary.totalRevenue)} />
            <StatCard label="Pedidos pagados" value={sales.summary.paidOrders} />
            <StatCard label="Ticket promedio" value={formatPrice(sales.summary.avgOrderValue)} />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-ink-200 p-6">
              <h3 className="font-semibold text-ink-900">Ingresos últimos 30 días</h3>
              <SalesChart data={sales.salesByDay} />
            </div>

            <div className="bg-white rounded-2xl border border-ink-200 p-6">
              <h3 className="font-semibold text-ink-900 mb-4">Top productos</h3>
              {sales.topProducts.length === 0 ? (
                <p className="text-sm text-ink-400 text-center py-6">Sin ventas</p>
              ) : (
                <div className="space-y-3">
                  {sales.topProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3">
                      <span className="grid place-items-center w-6 h-6 rounded-md bg-brand-50 text-brand-600 text-xs font-bold shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-900 truncate">{p.name}</p>
                        <p className="text-xs text-ink-400">{p.unitsSold} u.</p>
                      </div>
                      <span className="text-sm font-semibold text-ink-700">{formatPrice(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Stock ──────────────────────────────────────────────────────── */}
      {stock && (
        <section>
          <h2 className="text-lg font-semibold text-ink-900 mb-4">Inventario</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-6">
            <StatCard label="Productos" value={stock.summary.totalProducts} />
            <StatCard label="Unidades en stock" value={stock.summary.totalUnits} />
            <StatCard label="Valor de inventario" value={formatPrice(stock.summary.inventoryValue)} />
            <StatCard label="Sin stock" value={stock.summary.outOfStockCount} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-ink-200 p-6">
              <h3 className="font-semibold text-ink-900 mb-4">Stock bajo (≤ {stock.summary.threshold})</h3>
              {stock.lowStock.length === 0 ? (
                <p className="text-sm text-ink-400 text-center py-6">Todo en orden ✓</p>
              ) : (
                <div className="space-y-2">
                  {stock.lowStock.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span className="text-ink-700">{p.name}</span>
                      <Badge label={`${p.stock} u.`} variant="yellow" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-ink-200 p-6">
              <h3 className="font-semibold text-ink-900 mb-4">Sin stock</h3>
              {stock.outOfStock.length === 0 ? (
                <p className="text-sm text-ink-400 text-center py-6">Ninguno ✓</p>
              ) : (
                <div className="space-y-2">
                  {stock.outOfStock.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span className="text-ink-700">{p.name}</span>
                      <Badge label="Agotado" variant="red" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
