import { useEffect, useRef, useState, useCallback } from 'react';
import { ProductCard } from './ProductCard';

/**
 * Carrusel horizontal de productos.
 * - Flechas para avanzar/retroceder.
 * - Auto-avance cada few segundos (se pausa al pasar el mouse).
 * - Scroll por "snap" y táctil en mobile.
 */
export const ProductCarousel = ({ products = [], autoPlay = true, interval = 3500 }) => {
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [paused, setPaused] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  const scrollByPage = useCallback((dir) => {
    const el = trackRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.85, 280);
    // Si llega al final avanzando, vuelve al inicio (loop)
    if (dir > 0 && el.scrollLeft + el.clientWidth >= el.scrollWidth - 8) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: amount * dir, behavior: 'smooth' });
    }
  }, []);

  // Recalcular flechas al montar / cambiar productos / hacer scroll / resize
  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows, products]);

  // Auto-avance
  useEffect(() => {
    if (!autoPlay || paused || products.length <= 1) return;
    const id = setInterval(() => scrollByPage(1), interval);
    return () => clearInterval(id);
  }, [autoPlay, paused, interval, products.length, scrollByPage]);

  if (products.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Flecha izquierda */}
      <button
        type="button"
        onClick={() => scrollByPage(-1)}
        aria-label="Anterior"
        className={`hidden sm:grid place-items-center absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-white border border-ink-200 shadow-md text-ink-700 hover:bg-ink-50 transition ${
          canPrev ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Pista */}
      <div
        ref={trackRef}
        className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <div key={p.id} className="snap-start shrink-0 w-60 sm:w-64">
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      {/* Flecha derecha */}
      <button
        type="button"
        onClick={() => scrollByPage(1)}
        aria-label="Siguiente"
        className={`hidden sm:grid place-items-center absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-10 h-10 rounded-full bg-white border border-ink-200 shadow-md text-ink-700 hover:bg-ink-50 transition ${
          canNext ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};
