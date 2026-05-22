import { AlertCircle } from 'lucide-react';

interface Props {
  message: string;
}

// Bannière d'erreur inline, utilisée dans les modals et sous les cards.
export function ErrorBanner({ message }: Props) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-200/60 animate-fade-in"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}
