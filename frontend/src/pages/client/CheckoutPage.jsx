import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { addressesService, ordersService, paymentsService, couponsService, shippingService } from '../../services/orders.service';
import { PageSpinner } from '../../components/ui/Spinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { AddressFormFields } from './AddressesPage';
import { GuestCheckoutPage } from './GuestCheckoutPage';
import { TrustBadges } from '../../components/ui/TrustBadges';
import { formatPrice } from '../../utils/format';
import { trackBeginCheckout } from '../../lib/analytics';
import { useAuth } from '../../context/AuthContext';

const addrSchema = z.object({
  province: z.string().min(2, 'Requerido'),
  city: z.string().min(2, 'Requerido'),
  postalCode: z.string().min(3, 'Requerido'),
  street: z.string().min(2, 'Requerido'),
  number: z.string().min(1, 'Requerido'),
  floor: z.string().optional(),
  apartment: z.string().optional(),
  reference: z.string().optional(),
  isDefault: z.boolean().default(false),
});

// Punto de entrada de /checkout: el invitado usa el flujo sin cuenta.
export const CheckoutPage = () => {
  const { user } = useAuth();
  return user ? <RegisteredCheckout /> : <GuestCheckoutPage />;
};

const RegisteredCheckout = () => {
  const { cart, loading: cartLoading, refresh } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddr, setSelectedAddr] = useState('');
  const [loadingAddr, setLoadingAddr] = useState(true);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  // Estado de pago simulado: { orderId }
  const [simulation, setSimulation] = useState(null);
  // Cupón
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null); // { code, discount }
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  // Envío
  const [shipping, setShipping] = useState(null); // { cost, free, zoneName }

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(addrSchema),
    defaultValues: { isDefault: true },
  });

  const loadAddresses = async () => {
    setLoadingAddr(true);
    try {
      const { data } = await addressesService.list();
      const list = data.data.addresses || [];
      setAddresses(list);
      const def = list.find((a) => a.isDefault) || list[0];
      if (def) setSelectedAddr(def.id);
      setShowAddrForm(list.length === 0);
    } finally {
      setLoadingAddr(false);
    }
  };

  useEffect(() => { loadAddresses(); }, []);

  // analytics: inicio de checkout (una sola vez, cuando el carrito ya tiene total)
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (!checkoutTracked.current && cart?.total > 0) {
      checkoutTracked.current = true;
      trackBeginCheckout(cart.total);
    }
  }, [cart?.total]);

  // Cotizar envío cuando cambia la dirección seleccionada o el total del carrito
  useEffect(() => {
    const addr = addresses.find((a) => a.id === selectedAddr);
    if (!addr) { setShipping(null); return; }
    shippingService.quote(addr.province, cart.total)
      .then(({ data }) => setShipping(data.data))
      .catch(() => setShipping(null));
  }, [selectedAddr, addresses, cart.total]);

  const onCreateAddress = async (values) => {
    setError('');
    try {
      const { data } = await addressesService.create(values);
      await loadAddresses();
      setSelectedAddr(data.data.address.id);
      setShowAddrForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear la dirección');
    }
  };

  const applyCoupon = async () => {
    setCouponError('');
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    try {
      const { data } = await couponsService.validate(couponInput.trim(), cart.total);
      setCoupon({ code: data.data.code, discount: data.data.discount });
    } catch (err) {
      setCoupon(null);
      setCouponError(err.response?.data?.message || 'Cupón inválido');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const discount = coupon?.discount ?? 0;
  const shippingCost = shipping?.cost ?? 0;
  const finalTotal = Math.max(0, cart.total - discount) + shippingCost;

  const handlePay = async () => {
    setError('');
    if (!selectedAddr) { setError('Seleccioná una dirección de entrega'); return; }

    setProcessing(true);
    try {
      // 1. Crear pedido (con cupón si se aplicó)
      const { data: orderData } = await ordersService.create(selectedAddr, coupon?.code);
      const orderId = orderData.data.order.id;

      // 2. Crear preferencia de pago
      const { data: prefData } = await paymentsService.createPreference(orderId);

      if (prefData.data.simulated) {
        // Modo simulación (sin credenciales MP): mostrar panel de prueba
        setSimulation({ orderId, amount: prefData.data.amount });
      } else {
        // Modo real: redirigir a Mercado Pago
        window.location.href = prefData.data.initPoint;
      }
      refresh(); // el carrito quedó vacío
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo procesar el pedido');
    } finally {
      setProcessing(false);
    }
  };

  const handleSimulate = async (outcome) => {
    setProcessing(true);
    try {
      await paymentsService.simulate(simulation.orderId, outcome);
      navigate(outcome === 'approved' ? '/pago/exitoso' : '/pago/rechazado');
    } catch (err) {
      setError(err.response?.data?.message || 'Error en el pago simulado');
    } finally {
      setProcessing(false);
    }
  };

  if (cartLoading || loadingAddr) return <PageSpinner />;

  // Panel de simulación de pago
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
          <p className="text-sm text-ink-500 mb-1">Mercado Pago no está configurado.</p>
          <p className="text-sm text-ink-500 mb-6">Elegí el resultado para probar el flujo completo.</p>
          <p className="text-2xl font-bold text-ink-900 mb-6">{formatPrice(simulation.amount)}</p>
          {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
          <div className="flex flex-col gap-3">
            <Button onClick={() => handleSimulate('approved')} disabled={processing}>
              Simular pago aprobado
            </Button>
            <Button variant="danger" onClick={() => handleSimulate('rejected')} disabled={processing}>
              Simular pago rechazado
            </Button>
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
      <h1 className="text-3xl font-bold text-ink-900 mb-8">Finalizar compra</h1>

      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Dirección + items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dirección de entrega */}
          <div className="bg-white border border-ink-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink-900">Dirección de entrega</h2>
              {addresses.length > 0 && (
                <button onClick={() => setShowAddrForm((v) => !v)} className="text-sm text-brand-600 font-medium hover:underline">
                  {showAddrForm ? 'Elegir existente' : '+ Nueva'}
                </button>
              )}
            </div>

            {showAddrForm ? (
              <form onSubmit={handleSubmit(onCreateAddress)} className="space-y-4">
                <AddressFormFields register={register} errors={errors} />
                <Button type="submit">Guardar dirección</Button>
              </form>
            ) : (
              <div className="space-y-2">
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                      selectedAddr === a.id ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-ink-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddr === a.id}
                      onChange={() => setSelectedAddr(a.id)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-ink-900 text-sm">{a.street} {a.number}
                        {a.floor && `, Piso ${a.floor}`}{a.apartment && ` Depto ${a.apartment}`}
                      </p>
                      <p className="text-sm text-ink-500">{a.city}, {a.province} (CP {a.postalCode})</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white border border-ink-200 rounded-2xl p-6">
            <h2 className="font-semibold text-ink-900 mb-4">Tu pedido ({cart.itemCount})</h2>
            <div className="divide-y divide-ink-100">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-ink-100 rounded-lg overflow-hidden shrink-0">
                      {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-900">{item.name}</p>
                      <p className="text-xs text-ink-500">{item.quantity} × {formatPrice(item.unitPrice)}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-ink-900">{formatPrice(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-ink-200 rounded-2xl p-6 sticky top-20">
            <h2 className="font-semibold text-ink-900 mb-4">Resumen</h2>

            {/* Cupón */}
            <div className="mb-4">
              {coupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                  <span className="text-sm font-medium text-emerald-700">Cupón {coupon.code}</span>
                  <button onClick={removeCoupon} className="text-xs text-emerald-700 hover:underline">Quitar</button>
                </div>
              ) : (
                <>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">¿Tenés un cupón?</label>
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                      placeholder="Código de descuento"
                      className="flex-1 min-w-0 border border-ink-200 rounded-xl px-3.5 py-2.5 text-sm uppercase placeholder:normal-case placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={applyingCoupon || !couponInput.trim()}
                      className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold border border-ink-200 text-ink-700 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      {applyingCoupon ? '...' : 'Aplicar'}
                    </button>
                  </div>
                  {couponError && <p className="text-red-500 text-xs mt-1.5">{couponError}</p>}
                </>
              )}
            </div>

            <div className="flex justify-between text-sm text-ink-600 mb-2">
              <span>Subtotal</span>
              <span>{formatPrice(cart.total)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 mb-2">
                <span>Descuento</span>
                <span>−{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-ink-600 mb-2">
              <span>Envío{shipping?.zoneName ? ` · ${shipping.zoneName}` : ''}</span>
              {!selectedAddr ? (
                <span className="text-ink-400">Elegí dirección</span>
              ) : shipping?.free ? (
                <span className="text-emerald-600 font-medium">Gratis</span>
              ) : (
                <span>{formatPrice(shippingCost)}</span>
              )}
            </div>
            {shipping && !shipping.free && shipping.freeThreshold && (
              <p className="text-xs text-ink-400 mb-2">
                Envío gratis en compras desde {formatPrice(shipping.freeThreshold)}
              </p>
            )}
            <div className="border-t border-ink-100 mt-4 pt-4 flex justify-between font-bold text-ink-900 text-lg">
              <span>Total</span>
              <span>{formatPrice(finalTotal)}</span>
            </div>

            <Button onClick={handlePay} disabled={processing} className="w-full mt-6" size="lg">
              {processing ? 'Procesando...' : 'Confirmar y pagar'}
            </Button>
            <Link to="/carrito" className="block text-center text-sm text-ink-500 hover:text-ink-700 mt-4">
              Volver al carrito
            </Link>

            {/* Señales de confianza: reducen el abandono justo antes de pagar */}
            <TrustBadges layout="list" className="border-t border-ink-100 mt-5 pt-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
