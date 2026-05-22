import { useState } from 'react';
import { Menu } from 'lucide-react';
import { NotebookPen } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';

import { setUserId } from '../store/userSlice';
import type { RootState } from '../store';
import { UserAvatar } from './UserAvatar';

interface Props {
  onMenuToggle: () => void;
}

export function TopBar({ onMenuToggle }: Props) {
  const current = useSelector((s: RootState) => s.user.userId);
  const dispatch = useDispatch();
  const [draft, setDraft] = useState(current);

  const commit = () => {
    const next = draft.trim();
    if (!next || next === current) {
      setDraft(current);
      return;
    }
    dispatch(setUserId(next));
  };

  return (
    <header className="select-none flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-xl sm:gap-4 sm:px-5">
      {/* Bouton hamburger : visible uniquement sur mobile pour ouvrir/fermer la sidebar. */}
      <button
        type="button"
        onClick={onMenuToggle}
        aria-label="Ouvrir le menu"
        className="rounded-md p-1.5 text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
      >
        <Menu className="h-5 w-5" strokeWidth={2.25} />
      </button>

      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
          <NotebookPen className="h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
        <span className="select-none hidden text-[15px] font-semibold tracking-tight text-slate-900 sm:inline">
          Note Base
        </span>
      </div>

      <span className="hidden h-5 w-px bg-slate-200 sm:block" aria-hidden />

      <div className="flex items-center gap-2">
        <span
          className="select-none text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500"
          aria-hidden="true"
        >
          Identité
        </span>
        <input
          id="x-user-id"
          type="text"
          aria-label="X-User-Id courant"
          className={
            'w-24 rounded-lg border-0 bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-900 sm:w-32 ' +
            'ring-1 ring-inset ring-transparent transition-all duration-150 ' +
            'focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none'
          }
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'Escape') setDraft(current);
          }}
        />
      </div>

      <div className="ml-auto">
        <UserAvatar userId={current} size="md" />
      </div>
    </header>
  );
}