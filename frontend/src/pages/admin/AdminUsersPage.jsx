import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { adminService } from '../../services/admin.service';
import { PageSpinner } from '../../components/ui/Spinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/format';

export const AdminUsersPage = () => {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const { data, loading, refetch } = useFetch(
    () => adminService.listUsers(query ? { search: query, limit: 50 } : { limit: 50 }),
    [query]
  );

  const users = data?.users || [];

  const handleToggle = async (user) => {
    setError('');
    try {
      await adminService.setUserStatus(user.id, !user.active);
      refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo actualizar el usuario');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Usuarios</h1>
        <form onSubmit={(e) => { e.preventDefault(); setQuery(search); }} className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="border border-ink-200 rounded-xl pl-9 pr-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>
      </div>

      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

      {loading ? <PageSpinner /> : (
        <div className="bg-white rounded-2xl border border-ink-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 border-b border-ink-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-ink-500">Usuario</th>
                  <th className="text-left px-4 py-3 font-medium text-ink-500">Rol</th>
                  <th className="text-center px-4 py-3 font-medium text-ink-500">Pedidos</th>
                  <th className="text-left px-4 py-3 font-medium text-ink-500">Registro</th>
                  <th className="text-center px-4 py-3 font-medium text-ink-500">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-ink-500">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-ink-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-900">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-ink-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={u.role === 'ADMIN' ? 'Admin' : 'Cliente'} variant={u.role === 'ADMIN' ? 'blue' : 'gray'} />
                    </td>
                    <td className="px-4 py-3 text-center text-ink-700">{u._count?.orders ?? 0}</td>
                    <td className="px-4 py-3 text-ink-500 text-xs">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge label={u.active ? 'Activo' : 'Inactivo'} variant={u.active ? 'green' : 'red'} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role === 'ADMIN' ? (
                        <span className="text-xs text-ink-300">—</span>
                      ) : (
                        <button
                          onClick={() => handleToggle(u)}
                          className={`text-xs font-medium hover:underline ${u.active ? 'text-red-500' : 'text-emerald-600'}`}
                        >
                          {u.active ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && <p className="text-center text-ink-400 py-10">No se encontraron usuarios.</p>}
        </div>
      )}
    </div>
  );
};
