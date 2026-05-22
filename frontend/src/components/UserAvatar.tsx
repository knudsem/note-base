import { colorForUser } from '../utils/colorForUser';

interface Props {
  userId: string;
  size?: 'xs' | 'sm' | 'md';
}

// Avatar de l'utilisateur : initiale colorée déterministe.
// Le ring blanc permet l'empilement (overlap) sans collision visuelle.
const sizeClasses = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
} as const;

export function UserAvatar({ userId, size = 'sm' }: Props) {
  const color = colorForUser(userId);
  const initial = userId.charAt(0).toUpperCase();

  return (
    <span
      className={
        'inline-flex shrink-0 items-center justify-center select-none rounded-full ' +
        'font-semibold text-white ring-2 ring-white shadow-sm ' +
        sizeClasses[size] +
        ' ' +
        color
      }
      title={`Utilisateur ${userId}`}
    >
      {initial}
    </span>
  );
}
