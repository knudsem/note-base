import { useState } from 'react';

import { useCreateNoteMutation } from '../store/api';
import { LIMITS } from '../constants';
import { Button } from './Button';
import { ErrorBanner } from './ErrorBanner';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  workspaceId: string;
  onClose: () => void;
}

export function NewNoteModal({ open, workspaceId, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [createNote, { isLoading, error, reset }] = useCreateNoteMutation();

  const close = () => {
    setTitle('');
    setContent('');
    reset();
    onClose();
  };

  const submit = async () => {
    const t = title.trim();
    const c = content.trim();
    if (!t || !c) return;
    try {
      await createNote({ workspaceId, title: t, content: c }).unwrap();
      close();
    } catch {
      /* erreur affichée plus bas */
    }
  };

  // 409 = titre déjà utilisé dans ce workspace, message dédié plus utile.
  const isConflict = error && 'status' in error && error.status === 409;

  const inputStyle =
    'w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm ring-1 ring-inset ring-slate-200 ' +
    'placeholder:text-slate-400 transition-all duration-150 ' +
    'focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none';

  return (
    <Modal open={open} onClose={close} title="Nouvelle note">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">Titre</label>
          <input
            autoFocus
            type="text"
            className={inputStyle}
            placeholder="Onboarding d'un nouveau développeur"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={LIMITS.noteTitle.max}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">Contenu</label>
          <textarea
            className={inputStyle + ' h-36 resize-none leading-relaxed'}
            placeholder="Cloner le repo, copier .env.example, lancer docker-compose up..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={LIMITS.noteContent.max}
          />
        </div>
        {error && (
          <ErrorBanner
            message={
              isConflict
                ? 'Une note avec ce titre existe déjà dans ce workspace.'
                : 'Impossible de créer la note. Vérifie les champs et réessaie.'
            }
          />
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={close} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={submit} loading={isLoading} disabled={!title.trim() || !content.trim()}>
            {isLoading ? 'Création...' : 'Créer la note'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
