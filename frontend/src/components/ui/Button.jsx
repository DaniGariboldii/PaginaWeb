import { Link } from 'react-router-dom';

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-md active:scale-[0.98]',
  secondary: 'bg-white text-ink-900 border border-ink-200 hover:bg-ink-50 hover:border-ink-300',
  ghost: 'text-ink-700 hover:bg-ink-100',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  light: 'bg-white text-brand-700 hover:bg-brand-50 shadow-sm',
};

const sizes = {
  sm: 'text-sm px-3.5 py-2',
  md: 'text-sm px-5 py-2.5',
  lg: 'text-base px-7 py-3.5',
};

export const Button = ({
  as = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (as === 'link') {
    return (
      <Link className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};
