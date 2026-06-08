const Star = ({ filled, half, className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <defs>
      <linearGradient id="half-fill">
        <stop offset="50%" stopColor="currentColor" />
        <stop offset="50%" stopColor="transparent" />
      </linearGradient>
    </defs>
    <path
      d="M12 17.27l5.18 3.12-1.37-5.9 4.59-3.97-6.04-.52L12 4.5 9.64 9.99l-6.04.52 4.59 3.97-1.37 5.9z"
      fill={half ? 'url(#half-fill)' : filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

/** Muestra una valoración (0-5). Si onRate se pasa, es interactiva. */
export const StarRating = ({ value = 0, onRate, size = 'w-5 h-5' }) => {
  const interactive = typeof onRate === 'function';
  return (
    <div className="inline-flex items-center gap-0.5 text-amber-400">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = value >= n;
        const half = !filled && value >= n - 0.5;
        return interactive ? (
          <button
            key={n}
            type="button"
            onClick={() => onRate(n)}
            className={`${size} hover:scale-110 transition-transform`}
            aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
          >
            <Star filled={filled} half={half} className="w-full h-full" />
          </button>
        ) : (
          <Star key={n} filled={filled} half={half} className={size} />
        );
      })}
    </div>
  );
};
