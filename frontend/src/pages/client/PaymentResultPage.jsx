import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { Button } from '../../components/ui/Button';

const results = {
  exitoso: {
    title: '¡Pago exitoso!',
    msg: 'Tu pedido fue confirmado. Te enviaremos las novedades por email.',
    color: 'text-emerald-600', bg: 'bg-emerald-100',
    icon: 'M5 13l4 4L19 7',
  },
  pendiente: {
    title: 'Pago pendiente',
    msg: 'Estamos esperando la confirmación de tu pago. Te avisaremos cuando se acredite.',
    color: 'text-amber-600', bg: 'bg-amber-100',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  rechazado: {
    title: 'Pago rechazado',
    msg: 'No pudimos procesar tu pago. Podés intentar nuevamente desde tus pedidos.',
    color: 'text-red-600', bg: 'bg-red-100',
    icon: 'M6 18L18 6M6 6l12 12',
  },
};

export const PaymentResultPage = ({ type }) => {
  const { refresh } = useCart();
  const [params] = useSearchParams();
  const r = results[type] || results.rechazado;

  // Mercado Pago agrega external_reference (= id del pedido) a la URL de retorno
  const orderId = params.get('external_reference');

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="bg-white border border-ink-200 rounded-2xl p-10">
        <span className={`grid place-items-center w-16 h-16 rounded-2xl ${r.bg} ${r.color} mx-auto mb-5`}>
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={r.icon} />
          </svg>
        </span>
        <h1 className="text-2xl font-bold text-ink-900 mb-2">{r.title}</h1>
        <p className="text-ink-500 mb-8">{r.msg}</p>
        <div className="flex flex-col gap-3">
          {orderId ? (
            <Button as="link" to={`/mis-pedidos/${orderId}`}>Ver mi pedido</Button>
          ) : (
            <Button as="link" to="/mis-pedidos">Ver mis pedidos</Button>
          )}
          <Button as="link" to="/productos" variant="secondary">Seguir comprando</Button>
        </div>
      </div>
    </div>
  );
};
