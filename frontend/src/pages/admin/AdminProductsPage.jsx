import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { productsService } from '../../services/products.service';
import { PageSpinner } from '../../components/ui/Spinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatPrice } from '../../utils/format';

export const AdminProductsPage = () => {
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState('');

  const { data, loading, error, refetch } = useFetch(
    () => productsService.list({ page, limit: 20 }),
    [page]
  );

  const products = data?.products || [];
  const pagination = data?.pagination;

  const handleToggleActive = async (product) => {
    try {
      await productsService.update(product.id, { active: !product.active });
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Error al actualizar');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar o desactivar este producto?')) return;
    try {
      setActionError('');
      await productsService.remove(id);
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const thumb = (p) => p.images?.find((i) => i.isPrimary)?.url ?? p.images?.[0]?.url ?? null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Productos</h1>
        <Button as="link" to="/admin/productos/nuevo" size="sm">
          + Nuevo producto
        </Button>
      </div>

      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
      {actionError && <div className="mb-4"><ErrorMessage message={actionError} /></div>}

      {loading ? <PageSpinner /> : (
        <>
          <div className="bg-white rounded-2xl border border-ink-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 border-b border-ink-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-ink-500">Producto</th>
                    <th className="text-left px-4 py-3 font-medium text-ink-500">Categoría</th>
                    <th className="text-right px-4 py-3 font-medium text-ink-500">Precio</th>
                    <th className="text-center px-4 py-3 font-medium text-ink-500">Stock</th>
                    <th className="text-center px-4 py-3 font-medium text-ink-500">Estado</th>
                    <th className="text-right px-4 py-3 font-medium text-ink-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-ink-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-ink-100 overflow-hidden shrink-0 grid place-items-center">
                            {thumb(p) ? (
                              <img src={thumb(p)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-5 h-5 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-ink-900 line-clamp-1">{p.name}</p>
                            {p.brand && <p className="text-xs text-ink-400">{p.brand.name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-600">{p.category?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-ink-900 font-medium">
                        {formatPrice(p.discountPrice || p.price)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={p.stock === 0 ? 'text-red-500 font-semibold' : 'text-ink-700'}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge label={p.active ? 'Activo' : 'Inactivo'} variant={p.active ? 'green' : 'gray'} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link to={`/admin/productos/${p.id}/editar`} className="text-brand-600 hover:underline text-xs font-medium">
                            Editar
                          </Link>
                          <button onClick={() => handleToggleActive(p)} className="text-amber-600 hover:underline text-xs font-medium">
                            {p.active ? 'Desactivar' : 'Activar'}
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline text-xs font-medium">
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {products.length === 0 && (
              <p className="text-center text-ink-400 py-10">No hay productos aún.</p>
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 bg-white border border-ink-200 rounded-xl text-sm font-medium text-ink-700 disabled:opacity-40 hover:bg-ink-50 transition"
              >
                Anterior
              </button>
              <span className="text-sm text-ink-500">{page} / {pagination.totalPages}</span>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 bg-white border border-ink-200 rounded-xl text-sm font-medium text-ink-700 disabled:opacity-40 hover:bg-ink-50 transition"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
