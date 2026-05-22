import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';

import { useDeleteNoteMutation, useUpdateNoteMutation } from '../store/api';
import { LIMITS } from '../constants';
import { highlight } from '../utils/highlight';
import { formatRelativeDate } from '../utils/relativeDate';
import type { Note } from '../types';
import { Button } from './Button';
import { ErrorBanner } from './ErrorBanner';
import { UserAvatar } from './UserAvatar';

interface Props {
  note: Note;
  searchQuery?: string;
}

export function NoteCard({ note, searchQuery = '' }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [draftTitle, setDraftTitle] = useState(note.title);
  const [draftContent, setDraftContent] = useState(note.content);
  const [updateNote, { isLoading: isUpdating, error: updateError, reset: resetUpdate }] =
    useUpdateNoteMutation();
  const [deleteNote, { isLoading: isDeleting, error: deleteError, reset: resetDelete }] =
    useDeleteNoteMutation();

  // Détecte si le contenu dépasse les 4 lignes du line-clamp pour afficher "Voir plus".
  // Skip la mesure en mode expanded (clamp désactivé = scrollHeight === clientHeight, mesure fausse).
  // Réagit aussi au resize pour recalculer si la largeur de la card change (sidebar mobile, etc.).
  useEffect(() => {
    if (expanded) return;
    const el = contentRef.current;
    if (!el) return;

    const check = () => setHasOverflow(el.scrollHeight > el.clientHeight + 1);
    check();

    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [note.content, expanded]);

  // On reset l'erreur précédente et on re-synchronise les drafts à chaque entrée en édition.
  const startEdit = () => {
    resetUpdate();
    setDraftTitle(note.title);
    setDraftContent(note.content);
    setEditing(true);
  };

  const cancelEdit = () => {
    resetUpdate();
    setEditing(false);
  };

  const save = async () => {
    const t = draftTitle.trim();
    const c = draftContent.trim();
    if (!t || !c) return;
    try {
      await updateNote({
        workspaceId: note.workspaceId,
        noteId: note.id,
        title: t,
        content: c,
      }).unwrap();
      setEditing(false);
    } catch {
      /* erreur affichée plus bas */
    }
  };

  // Pattern "armed state" : clic sur la corbeille n'efface pas immédiatement,
  // la card passe en mode confirmation avec une barre rouge intégrée.
  // Plus élégant que window.confirm, et non bloquant pour le reste de l'UI.
  const askDelete = () => {
    resetDelete();
    setConfirmingDelete(true);
  };

  const cancelDelete = () => setConfirmingDelete(false);

  const confirmDelete = async () => {
    try {
      await deleteNote({ workspaceId: note.workspaceId, noteId: note.id }).unwrap();
      // succès : la note disparaît de la liste naturellement (cache invalidé)
    } catch {
      /* erreur affichée plus bas, on reste en mode confirmation */
    }
  };

  const isUpdateConflict =
    updateError && 'status' in updateError && updateError.status === 409;

  // Mode édition : inputs avec mêmes tokens visuels que les modals pour la cohérence.
  if (editing) {
    const inputStyle =
      'w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm ring-1 ring-inset ring-slate-200 ' +
      'placeholder:text-slate-400 transition-all duration-150 ' +
      'focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none';

    return (
      <div className="rounded-xl bg-white p-5 shadow-card-hover ring-1 ring-blue-200 animate-fade-in">
        <input
          autoFocus
          type="text"
          className={inputStyle + ' mb-3 font-semibold text-slate-900'}
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          maxLength={LIMITS.noteTitle.max}
          placeholder="Titre"
        />
        <textarea
          className={inputStyle + ' h-32 resize-none leading-relaxed'}
          value={draftContent}
          onChange={(e) => setDraftContent(e.target.value)}
          maxLength={LIMITS.noteContent.max}
          placeholder="Contenu"
        />
        {updateError && (
          <div className="mt-3">
            <ErrorBanner
              message={
                isUpdateConflict
                  ? 'Une note avec ce titre existe déjà dans ce workspace.'
                  : 'La mise à jour a échoué. Réessaie.'
              }
            />
          </div>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={cancelEdit} disabled={isUpdating}>
            Annuler
          </Button>
          <Button
            onClick={save}
            loading={isUpdating}
            disabled={!draftTitle.trim() || !draftContent.trim()}
          >
            {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <article
      className={
        'group relative rounded-xl bg-white p-5 shadow-card ring-1 transition-all duration-200 ease-out-expo ' +
        (confirmingDelete
          ? 'ring-red-200'
          : 'ring-slate-200/60 hover:-translate-y-0.5 hover:shadow-card-hover hover:ring-slate-300/80') +
        (isDeleting ? ' pointer-events-none opacity-50' : '')
      }
    >
      <header className="mb-2 flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug tracking-tight text-slate-900">
          {highlight(note.title, searchQuery)}
        </h3>
        {!confirmingDelete && (
          <div className="flex gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              onClick={startEdit}
              aria-label="Modifier la note"
              title="Modifier"
              className="rounded-md p-1.5 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
            <button
              type="button"
              onClick={askDelete}
              aria-label="Supprimer la note"
              title="Supprimer"
              className="rounded-md p-1.5 text-slate-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          </div>
        )}
      </header>

      <p
        ref={contentRef}
        className={
          'whitespace-pre-wrap text-sm leading-relaxed text-slate-600 ' +
          (expanded ? 'mb-4' : 'mb-4 line-clamp-4')
        }
      >
        {highlight(note.content, searchQuery)}
      </p>

      {/* Toggle "Voir plus / Voir moins" : visible uniquement si le contenu
          déborde réellement du line-clamp (mesuré dynamiquement). */}
      {hasOverflow && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={
            'mb-3 -mt-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500 ' +
            'transition-colors duration-150 hover:text-slate-900'
          }
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" strokeWidth={2.5} />
              Voir moins
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" strokeWidth={2.5} />
              Voir plus
            </>
          )}
        </button>
      )}

      <footer className="flex items-center gap-2 text-xs text-slate-500">
        <UserAvatar userId={note.authorId} size="xs" />
        <span className="font-medium text-slate-600 tabular-nums">{note.authorId}</span>
        <span className="text-slate-300">·</span>
        <time dateTime={note.createdAt} title={new Date(note.createdAt).toLocaleString('fr-FR')}>
          {formatRelativeDate(note.createdAt)}
        </time>
        {new Date(note.updatedAt).getTime() - new Date(note.createdAt).getTime() > 1000 && (
          <>
            <span className="text-slate-300">·</span>
            <span className="italic text-slate-400">modifiée</span>
          </>
        )}
      </footer>

      {confirmingDelete && (
        <div
          className={
            'mt-4 -mx-5 -mb-5 flex flex-wrap items-center justify-between gap-3 ' +
            'rounded-b-xl border-t border-red-100 bg-red-50/60 px-5 py-3 animate-fade-in'
          }
        >
          <p className="text-sm font-medium text-red-700">Supprimer cette note&nbsp;?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancelDelete}
              disabled={isDeleting}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-white disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={isDeleting}
              className={
                'rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm ' +
                'transition-all duration-150 ease-out-expo ' +
                'hover:bg-red-700 active:scale-[0.98] disabled:opacity-60'
              }
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      )}

      {deleteError && (
        <div className="mt-3">
          <ErrorBanner message="Impossible de supprimer cette note. Réessaie." />
        </div>
      )}
    </article>
  );
}