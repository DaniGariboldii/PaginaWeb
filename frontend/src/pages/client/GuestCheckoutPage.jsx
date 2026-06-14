import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ordersService, paymentsService, shippingService } from '../../services/orders.service';
import { PageSpinner } from '../../components/ui/Spinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { AddressFormFields } from './AddressesPage';
import { formatPrice } from '../../utils/format';
import { trackBeginCheckout } from '../../lib/analytics';

const schema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Ingresá tu nombre y apellido'),
  phone: z.string().optional(),
  province: z.string().min(2, 'Requerido'),
  city: z.string().min(2, 'Requerido'),
  postalCode: z.string().min(3, 'Requerido'),
  street: z.string().min(2, 'Requerido'),
  number: z.string().min(1, 'Requerido'),
  floor: z.string().optional(),
  apartment: z.string().optional(),
  reference: z.string().optional(),
});

const inputClass =
  'w-full border border-ink-200 rounded-xl px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition';

export const GuestCheckoutPage = () => {
  const { cart, loading: cartLoading, clear, refresh } = useCart();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [shipping, setShipping] = useState(null);
  const [simulation, setSimulation] = useState(null); // { orderId, amount }

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const province = watch('province');

  // analytics: inicio de checkout
  useEffect(() => {
    if (cart?.total > 0) trackBeginCheckout(cart.total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cotizar envío al elegir provincia
  useEffect(() => {
    if (!province) { setShipping(null); return; }
    shippingService.quote(province, cart.total)
      .then(({ data }) => setShipping(data.data))
      .catch(() => setShipping(null));
  }, [province, cart.total]);

  const shippingCost = shipping?.cost ?? 0;
  const finalTotal = cart.total + shippingCost;

  const onSubmit = async (values) => {
    setError('');
    if (!cart.items.length) { setError('Tu carrito está vacío'); return; }

    setProcessing(true);
    try {
      const payload = {
        email: values.email,
        name: values.name,
        phone: values.phone || undefined,
        address: {
          province: values.province, city: values.city, postalCode: values.postalCode,
          street: values.street, number: values.number,
          floor: values.floor || undefined, apartment: values.apartment || undefined,
          reference: values.reference || undefined,
        },
        items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      };

      const { data: orderData } = await ordersService.createGuest(payload);
      const orderId = orderData.data.order.id;

      const { data: prefData } = await paymentsService.createGuestPreference(orderId);

      await clear(); // el carrito local ya se convirtió en pedido

      if (prefData.data.simulated) {
        setSimulation({ orderId, amount: prefData.data.amount ?? finalTotal });
      } else {
        window.location.href = prefData.data.initPoint;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo procesar el pedido');
      refresh(); // por si algún item quedó sin stock, refrescar el carrito
    } finally {
      setProcessing(false);
    }
  };

  const handleSimulate = async (outcome) => {
    setProcessing(true);
    try {
      await paymentsService.guestSimulate(simulation.orderId, outcome);
      const path = outcome === 'approved' ? '/pago/exitoso' : '/pago/rechazado';
      navigate(`${path}?external_reference=${simulation.orderId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error en el pago simulado');
    } finally {
      setProcessing(false);
    }
  };

  if (cartLoading) return <PageSpinner />;

  // Panel de simulación de pago (sin credenciales reales de MP)
  if (simulation) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-ink-200 rounded-2xl p-8">
          <span className="grid place-items-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 mx-auto mb-4">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </span>
          <h1 className="text-xl font-bold text-ink-900 mb-2">Simulación de pago</h1>
          <p className="text-sm text-ink-500 mb-6">Mercado Pago no está configurado. Elegí el resultado para probar el flujo.</p>
          <p className="text-2xl font-bold text-ink-900 mb-6">{formatPrice(simulation.amount)}</p>
          {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
          <div className="flex flex-col gap-3">
            <Button onClick={() => handleSimulate('approved')} disabled={processing}>Simular pago aprobado</Button>
            <Button variant="danger" onClick={() => handleSimulate('rejected')} disabled={processing}>Simular pago rechazado</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!cart.items.length) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-ink-900 mb-3">Tu carrito está vacío</h1>
        <Button as="link" to="/productos">Ver productos</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-ink-900 mb-2">Finalizar compra</h1>
      <p className="text-ink-500 mb-8">
        Comprá sin crear cuenta. ¿Ya tenés una?{' '}
        <Link to="/login" state={{ from: '/checkout' }} className="text-brand-600 font-medium hover:underline">Iniciá sesión</Link>.
      </p>

      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

      <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-8">
        {/* Datos + dirección */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contacto */}
          <div className="bg-white border border-ink-200 rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-ink-900">Tus datos</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
                <input type="email" {...register('email')} className={inputClass} placeholder="tu@email.com" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                <p className="text-xs text-ink-400 mt-1">Te enviaremos la confirmación y el seguimiento acá.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Nombre y apellido</label>
                <input {...register('name')} className={inputClass} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
            </div>
            <div className="sm:w-1/2">
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Teléfono (opcional)</label>
              <input {...register('phone')} className={inputClass} placeholder="11 1234-5678" />
            </div>
          </div>

          {/* Dirección de envío */}
          <div className="bg-white border border-ink-200 rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-ink-900">Dirección de entrega</h2>
            <AddressFormFields register={register} errors={errors} />
          </div>
        </div>

        {/* Resumen */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-ink-200 rounded-2xl p-6 sticky top-20">
            <h2 className="font-semibold text-ink-900 mb-4">Tu pedido ({cart.itemCount})</h2>
            <div className="divide-y divide-ink-100 mb-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2.5 gap-2">
                  <span className="text-sm text-ink-700 min-w-0 truncate">{item.name} × {item.quantity}</span>
                  <span className="text-sm font-medium text-ink-900 shrink-0">{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-sm text-ink-600 mb-2">
              <span>Subtotal</span><span>{formatPrice(cart.total)}</span>
            </div>
            <div className="flex justify-between text-sm text-ink-600 mb-2">
              <span>Envío{shipping?.zoneName ? ` · ${shipping.zoneName}` : ''}</span>
              {!province ? (
                <span className="text-ink-400">Elegí provincia</span>
              ) : shipping?.free ? (
                <span className="text-emerald-600 font-medium">Gratis</span>
              ) : (
                <span>{formatPrice(shippingCost)}</span>
              )}
            </div>
            {shipping && !shipping.free && shipping.freeThreshold && (
              <p className="text-xs text-ink-400 mb-2">Envío gratis desde {formatPrice(shipping.freeThreshold)}</p>
            )}
            <div className="border-t border-ink-100 mt-4 pt-4 flex justify-between font-bold text-ink-900 text-lg">
              <span>Total</span><span>{formatPrice(finalTotal)}</span>
            </div>

            <Button type="submit" disabled={processing} className="w-full mt-6" size="lg">
              {processing ? 'Procesando...' : 'Confirmar y pagar'}
            </Button>
            <Link to="/carrito" className="block text-center text-sm text-ink-500 hover:text-ink-700 mt-4">
              Volver al carrito
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};
