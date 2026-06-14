// Botón flotante de WhatsApp. El número y el mensaje se configuran por variables
// de entorno (VITE_WHATSAPP_NUMBER en formato internacional, ej: 5491112345678).
const RAW_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '';
const NUMBER = RAW_NUMBER.replace(/\D/g, ''); // solo dígitos
const MESSAGE = import.meta.env.VITE_WHATSAPP_MESSAGE || 'Hola! Tengo una consulta sobre la tienda.';

export const WhatsAppButton = () => {
  // Si no hay número configurado, no se muestra nada
  if (!NUMBER) return null;

  const href = `https://wa.me/${NUMBER}?text=${encodeURIComponent(MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="group fixed bottom-6 right-6 z-40 flex items-center gap-2"
    >
      {/* Etiqueta que aparece al pasar el mouse (desktop) */}
      <span className="hidden md:block opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all bg-ink-900 dark:bg-ink-100 dark:border dark:border-ink-200 text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
        ¿Necesitás ayuda?
      </span>

      {/* Botón */}
      <span className="relative grid place-items-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all">
        {/* Anillo de pulso */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 animate-ping" />
        <svg className="relative w-7 h-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.738-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      </span>
    </a>
  );
};
