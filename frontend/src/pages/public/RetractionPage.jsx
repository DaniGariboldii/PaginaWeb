import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { legalService } from '../../services/legal.service';
import { Button } from '../../components/ui/Button';
import { Seo } from '../../components/ui/Seo';
import { ErrorMessage } from '../../components/ui/ErrorMessage';

const schema = z.object({
  name: z.string().min(2, 'Ingresá tu nombre completo'),
  email: z.string().email('Email inválido'),
  orderNumber: z.string().min(1, 'Ingresá el número de pedido'),
  reason: z.string().optional(),
});

const inputClass =
  'w-full border border-ink-200 rounded-xl px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition';

export const RetractionPage = () => {
  const [done, setDone] = useState(null); // { code, date }
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const res = await legalService.retraction(data);
      setDone(res.data.data);
    } catch (err) {
      setServerError(err.response?.data?.message || 'No se pudo registrar la solicitud. Intentá de nuevo.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <Seo title="Botón de arrepentimiento" description="Ejercé tu derecho de arrepentimiento de compra." />
      <h1 className="text-3xl font-bold text-ink-900 mb-2">Botón de arrepentimiento</h1>
      <p className="text-ink-500 mb-6">
        Según la normativa de Defensa del Consumidor (Resolución 424/2020), podés arrepentirte de tu compra
        dentro de los <strong>10 días corridos</strong> de recibido el producto o de celebrado el contrato,
        sin costo ni justificación. Completá el formulario y te enviaremos un comprobante.
      </p>

      {done ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
          <span className="grid place-items-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto mb-4">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <h2 className="text-lg font-bold text-ink-900 mb-1">Solicitud registrada</h2>
          <p className="text-sm text-ink-600">Guardá tu comprobante. Te contactaremos para coordinar la devolución y el reintegro.</p>
          <p className="mt-4 text-sm text-ink-700">
            <strong>Comprobante:</strong> {done.code}<br />
            <strong>Fecha:</strong> {done.date}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-ink-200 rounded-2xl p-6 space-y-4">
          {serverError && <ErrorMessage message={serverError} />}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Nombre y apellido</label>
              <input {...register('name')} className={inputClass} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Email de la compra</label>
              <input {...register('email')} type="email" className={inputClass} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Número de pedido</label>
            <input {...register('orderNumber')} placeholder="Ej: a1b2c3d4" className={inputClass} />
            {errors.orderNumber && <p className="text-red-500 text-xs mt-1">{errors.orderNumber.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Motivo (opcional)</label>
            <textarea {...register('reason')} rows={3} className={inputClass} />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar solicitud de arrepentimiento'}
          </Button>
        </form>
      )}
    </div>
  );
};
