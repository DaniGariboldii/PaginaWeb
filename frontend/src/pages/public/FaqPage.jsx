import { useState } from 'react';
import { Seo } from '../../components/ui/Seo';

const FAQS = [
  { q: '¿Cómo realizo una compra?', a: 'Agregá productos al carrito, iniciá sesión, elegí tu dirección de entrega y pagá de forma segura con Mercado Pago.' },
  { q: '¿Qué medios de pago aceptan?', a: 'Aceptamos todos los medios disponibles en Mercado Pago: tarjetas de crédito, débito y dinero en cuenta.' },
  { q: '¿Cuánto demora el envío?', a: 'Los envíos se despachan dentro de las 24-72hs hábiles una vez confirmado el pago. El tiempo de entrega depende de tu localidad.' },
  { q: '¿Puedo seguir mi pedido?', a: 'Sí. Desde "Mis pedidos" podés ver el estado de cada compra: pagado, en preparación, enviado y entregado.' },
  { q: '¿Cómo recupero mi contraseña?', a: 'En la pantalla de inicio de sesión, hacé clic en "¿Olvidaste tu contraseña?" y te enviaremos un enlace por email.' },
  { q: '¿Puedo dejar una opinión de un producto?', a: 'Sí, podés calificar y opinar sobre los productos que hayas comprado, desde la página de cada producto.' },
];

const Item = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-ink-100 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="font-medium text-ink-900">{q}</span>
        <svg className={`w-5 h-5 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <p className="text-sm text-ink-600 pb-4 leading-relaxed">{a}</p>}
    </div>
  );
};

export const FaqPage = () => (
  <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
    <Seo title="Preguntas frecuentes" description="Respuestas a las dudas más comunes sobre compras, pagos y envíos." />
    <h1 className="text-3xl font-bold text-ink-900 mb-2">Preguntas frecuentes</h1>
    <p className="text-ink-500 mb-8">Encontrá respuestas rápidas a las consultas más comunes.</p>
    <div className="bg-white border border-ink-200 rounded-2xl px-6">
      {FAQS.map((f) => <Item key={f.q} {...f} />)}
    </div>
  </div>
);
