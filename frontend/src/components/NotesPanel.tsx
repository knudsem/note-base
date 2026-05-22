import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Inbox, Plus } from 'lucide-react';

import { useListWorkspacesQuery } from '../store/api';
import { NewNoteModal } from './NewNoteModal';
import { NotesList } from './NotesList';
import { WorkspacePanelHeader } from './WorkspacePanelHeader';

export function NotesPanel() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [newNoteOpen, setNewNoteOpen] = useState(false);
  const [noteCount, setNoteCount] = useState<number | undefined>(undefined);
  const { data: wsList } = useListWorkspacesQuery();
  const workspace = wsList?.items.find((w) => w.id === workspaceId);

  // Reset du compteur quand on change de workspace, pour éviter d'afficher l'ancien total.
  useEffect(() => {
    setNoteCount(undefined);
  }, [workspaceId]);

  if (!workspaceId) {
    return <NoWorkspaceSelected />;
  }

  if (!workspace) {
    return null;
  }

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      <WorkspacePanelHeader workspace={workspace} noteCount={noteCount} />
      <NotesList workspaceId={workspaceId} onTotalChange={setNoteCount} />

      {/* Bouton compact centré : taille naturelle, pas pleine largeur. */}
      <div className="border-t border-slate-200/80 bg-white/60 px-6 py-2.5 flex justify-center backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setNewNoteOpen(true)}
          className={
            'inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-5 py-1.5 ' +
            'text-sm font-medium text-white shadow-sm transition-all duration-150 ease-out-expo ' +
            'hover:bg-slate-800 active:scale-[0.98] active:bg-slate-950'
          }
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Nouvelle note
        </button>
      </div>

      <NewNoteModal
        open={newNoteOpen}
        workspaceId={workspaceId}
        onClose={() => setNewNoteOpen(false)}
      />
    </main>
  );
}

function NoWorkspaceSelected() {
  return (
    <main className="flex flex-1 items-center justify-center">
      <div className="max-w-sm px-6 text-center animate-fade-in">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-card ring-1 ring-slate-200/60">
          <Inbox className="h-7 w-7 text-slate-400" strokeWidth={1.75} />
        </div>
        <h2 className="mb-1.5 text-base font-semibold tracking-tight text-slate-900">
          Aucun workspace sélectionné
        </h2>
        <p className="text-sm leading-relaxed text-slate-500">
          <span className="md:hidden">
            Appuie sur le menu en haut à gauche pour accéder à tes workspaces.
          </span>
          <span className="hidden md:inline">
            Choisis un workspace dans la barre latérale, ou crées-en un nouveau pour commencer.
          </span>
        </p>
      </div>
    </main>
  );
}