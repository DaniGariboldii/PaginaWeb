import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { PageSpinner } from '../../components/ui/Spinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';

const formatPrice = (p) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(p);

export const CartPage = () => {
  const { cart, loading, updateItem, removeItem, clear } = useCart();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const handleQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;
    setError('');
    setBusyId(itemId);
    try {
      await updateItem(itemId, quantity);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo actualizar la cantidad');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (itemId) => {
    setError('');
    setBusyId(itemId);
    try {
      await removeItem(itemId);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo eliminar el producto');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <PageSpinner />;

  if (!cart.items.length) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h1>
        <p className="text-gray-500 mb-8">Agregá productos para comenzar tu compra.</p>
        <Link to="/productos" className="bg-brand-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-brand-700">
          Ver productos
        </Link>
      </div>
    );
  }

  const hasUnavailable = cart.items.some((i) => !i.available);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Mi carrito</h1>

      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Lista de ítems */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className={`flex gap-4 bg-white border rounded-xl p-4 ${item.available ? 'border-gray-200' : 'border-red-200 bg-red-50'}`}
            >
              {/* Imagen */}
              <Link to={`/productos/${item.slug}`} className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link to={`/productos/${item.slug}`} className="font-medium text-gray-900 hover:text-brand-600 line-clamp-1">
                  {item.name}
                </Link>
                <p className="text-sm text-gray-500 mt-1">{formatPrice(item.unitPrice)} c/u</p>

                {!item.available && (
                  <p className="text-xs text-red-600 mt-1">
                    Sin stock suficiente (disponible: {item.stock})
                  </p>
                )}

                {/* Controles de cantidad */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={() => handleQuantity(item.id, item.quantity - 1)}
                      disabled={busyId === item.id || item.quantity <= 1}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="px-4 py-1 text-sm font-medium border-x border-gray-300">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantity(item.id, item.quantity + 1)}
                      disabled={busyId === item.id || item.quantity >= item.stock}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={busyId === item.id}
                    className="text-sm text-red-500 hover:underline disabled:opacity-40"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Subtotal */}
              <div className="text-right shrink-0">
                <p className="font-semibold text-gray-900">{formatPrice(item.subtotal)}</p>
              </div>
            </div>
          ))}

          <button onClick={clear} className="text-sm text-gray-500 hover:text-red-500">
            Vaciar carrito
          </button>
        </div>

        {/* Resumen */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-20">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h2>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Productos ({cart.itemCount})</span>
              <span>{formatPrice(cart.total)}</span>
            </div>
            <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between font-bold text-gray-900">
              <span>Total</span>
              <span>{formatPrice(cart.total)}</span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              disabled={hasUnavailable || cart.total === 0}
              className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed mt-6 transition-colors"
            >
              Continuar compra
            </button>
            {hasUnavailable && (
              <p className="text-xs text-red-500 mt-2 text-center">
                Quitá los productos sin stock para continuar.
              </p>
            )}

            <Link to="/productos" className="block text-center text-sm text-brand-600 hover:underline mt-4">
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
