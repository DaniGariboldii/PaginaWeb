import { useEffect, useCallback } from 'react';

// Lightbox a pantalla completa para ver las imágenes del producto en grande.
// Soporta navegación (flechas/teclado) cuando hay varias imágenes.
export const ImageLightbox = ({ images = [], index = 0, onIndexChange, onClose }) => {
  const total = images.length;
  const current = images[index];

  const go = useCallback(
    (dir) => {
      if (total < 2) return;
      onIndexChange((index + dir + total) % total);
    },
    [index, total, onIndexChange]
  );

  // Teclado: Esc cierra, flechas navegan. Bloquea el scroll del body mientras está abierto.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [go, onClose]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Imagen ampliada del producto"
    >
      {/* Cerrar */}
      <button
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-4 right-4 grid place-items-center w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Imagen (el click sobre ella no cierra) */}
      <img
        src={current.url}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-[88vh] object-contain rounded-lg select-none"
      />

      {total > 1 && (
        <>
          {/* Anterior */}
          <button
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            aria-label="Anterior"
            className="absolute left-4 top-1/2 -translate-y-1/2 grid place-items-center w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {/* Siguiente */}
          <button
            onClick={(e) => { e.stopPropagation(); go(1); }}
            aria-label="Siguiente"
            className="absolute right-4 top-1/2 -translate-y-1/2 grid place-items-center w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {/* Contador */}
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-white/10 px-3 py-1 rounded-full">
            {index + 1} / {total}
          </span>
        </>
      )}
    </div>
  );
};
