import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

// Bouton réutilisable avec 3 variantes et un état de chargement intégré.
// L'active:scale donne un feedback tactile subtil au clic.
const variants = {
  primary:
    'bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:bg-slate-950 ' +
    'disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none',
  secondary:
    'bg-white text-slate-700 ring-1 ring-slate-200 shadow-sm hover:bg-slate-50 hover:ring-slate-300 ' +
    'active:bg-slate-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:ring-slate-200',
  ghost:
    'text-slate-700 hover:bg-slate-100 active:bg-slate-200 disabled:text-slate-400',
} as const;

export function Button({
  variant = 'primary',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={
        'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium ' +
        'transition-all duration-150 ease-out-expo active:scale-[0.98] disabled:cursor-not-allowed ' +
        'disabled:active:scale-100 ' +
        variants[variant] +
        ' ' +
        className
      }
      {...rest}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {children}
    </button>
  );
}
