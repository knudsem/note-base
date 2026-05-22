import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, FolderKanban, AlertCircle, Loader2, X } from 'lucide-react';

import { useListWorkspacesQuery } from '../store/api';
import { colorForWorkspace } from '../utils/colorForWorkspace';
import { NewWorkspaceModal } from './NewWorkspaceModal';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function WorkspaceSidebar({ open, onClose }: Props) {
  const { data, isLoading, isError } = useListWorkspacesQuery();
  const { workspaceId: activeId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const selectWorkspace = (id: string) => {
    navigate(`/workspaces/${id}`);
    onClose();
  };

  return (
    <aside
      className={
        // Mobile : drawer pleine hauteur (inset-y-0 couvre tout, y compris la TopBar).
        'fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col ' +
        'border-r border-slate-200/80 bg-white shadow-xl ' +
        'transition-transform duration-300 ease-out-expo ' +
        // Desktop : position normale dans le flux, toujours visible.
        'md:relative md:inset-y-auto md:z-auto md:shadow-none ' +
        'md:bg-white/40 md:backdrop-blur-xl md:transition-none ' +
        (open ? 'translate-x-0' : '-translate-x-full md:translate-x-0')
      }
    >
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <FolderKanban className="h-4 w-4 text-slate-400" strokeWidth={2.25} />
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Workspaces
        </h2>
        {data && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 tabular-nums">
            {data.total}
          </span>
        )}
        {/* Bouton fermer visible uniquement sur mobile. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le menu"
          className="ml-auto rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 md:hidden"
        >
          <X className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {isLoading && (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Chargement...
          </div>
        )}
        {isError && (
          <div className="flex items-start gap-2 px-3 py-2 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} />
            <span>Impossible de charger les workspaces.</span>
          </div>
        )}
        {data && data.items.length === 0 && (
          <div className="px-4 py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <FolderKanban className="h-5 w-5 text-slate-400" strokeWidth={2} />
            </div>
            <p className="mb-1 text-sm font-medium text-slate-700">Aucun workspace</p>
            <p className="text-xs leading-relaxed text-slate-500">
              Crée le premier pour commencer à prendre des notes.
            </p>
          </div>
        )}
        <nav className="space-y-0.5">
          {data?.items.map((w) => {
            const isActive = w.id === activeId;
            const accent = colorForWorkspace(w.name);
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => selectWorkspace(w.id)}
                className={
                  'group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm ' +
                  'transition-all duration-150 ease-out-expo ' +
                  (isActive
                    ? 'bg-slate-900 font-medium text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100/80')
                }
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${accent} ${isActive ? 'opacity-90' : 'opacity-70'}`} />
                <span className="truncate flex-1">{w.name}</span>
                <span
                  className={
                    'rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ' +
                    (isActive ? 'bg-white/15 text-white/90' : 'text-slate-400 group-hover:text-slate-600')
                  }
                >
                  {w.memberIds.length}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-100 p-2">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={
            'flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 ' +
            'text-sm font-medium text-slate-600 transition-colors duration-150 ' +
            'hover:bg-slate-100 hover:text-slate-900 active:scale-[0.99]'
          }
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Nouveau workspace
        </button>
      </div>

      <NewWorkspaceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(id) => { navigate(`/workspaces/${id}`); onClose(); }}
      />
    </aside>
  );
}