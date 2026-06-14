import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Seo } from '../../components/ui/Seo';
import { legalService } from '../../services/legal.service';

const schema = z.object({
  name: z.string().min(2, 'Ingresá tu nombre'),
  email: z.string().email('Email inválido'),
  message: z.string().min(10, 'Contanos un poco más (mín. 10 caracteres)'),
});

const inputClass =
  'w-full border border-ink-200 rounded-xl px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition';

export const ContactPage = () => {
  const toast = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await legalService.contact(data);
      toast.success('¡Mensaje enviado! Te responderemos a la brevedad.');
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo enviar el mensaje');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <Seo title="Contacto" description="Ponete en contacto con MiTienda. Estamos para ayudarte." />
      <div className="grid md:grid-cols-2 gap-10">
        {/* Info */}
        <div>
          <h1 className="text-3xl font-bold text-ink-900 mb-3">Contacto</h1>
          <p className="text-ink-500 mb-8">¿Tenés una consulta? Escribinos y te respondemos lo antes posible.</p>
          <ul className="space-y-4 text-sm">
            <li className="flex items-center gap-3">
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand-50 text-brand-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </span>
              <span className="text-ink-700">hola@mitienda.com</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand-50 text-brand-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </span>
              <span className="text-ink-700">+54 11 1234 5678</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand-50 text-brand-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </span>
              <span className="text-ink-700">Buenos Aires, Argentina</span>
            </li>
          </ul>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-ink-200 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Nombre</label>
            <input {...register('name')} className={inputClass} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
            <input {...register('email')} type="email" className={inputClass} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Mensaje</label>
            <textarea {...register('message')} rows={5} className={inputClass} />
            {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
          </Button>
        </form>
      </div>
    </div>
  );
};
