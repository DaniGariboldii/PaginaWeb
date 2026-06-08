const variants = {
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-amber-100 text-amber-700',
  blue: 'bg-brand-100 text-brand-700',
  gray: 'bg-ink-100 text-ink-500',
};

export const Badge = ({ label, variant = 'gray' }) => (
  <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${variants[variant]}`}>
    {label}
  </span>
);
