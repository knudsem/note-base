import { useState } from 'react';

import { useCreateWorkspaceMutation } from '../store/api';
import { LIMITS } from '../constants';
import { Button } from './Button';
import { ErrorBanner } from './ErrorBanner';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (workspaceId: string) => void;
}

export function NewWorkspaceModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [createWorkspace, { isLoading, error, reset }] = useCreateWorkspaceMutation();

  const close = () => {
    setName('');
    reset();
    onClose();
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const created = await createWorkspace({ name: trimmed }).unwrap();
      setName('');
      reset();
      onCreated?.(created.id);
      onClose();
    } catch {
      /* erreur affichée plus bas */
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Nouveau workspace"
      description="Un workspace est un espace isolé pour ton équipe. Les membres invités y verront toutes les notes."
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">Nom</label>
          <input
            autoFocus
            type="text"
            className={
              'w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm ring-1 ring-inset ring-slate-200 ' +
              'placeholder:text-slate-400 transition-all duration-150 ' +
              'focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none'
            }
            placeholder="Équipe Backend"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            maxLength={LIMITS.workspaceName.max}
          />
        </div>
        {error && <ErrorBanner message="Impossible de créer le workspace. Vérifie le nom et réessaie." />}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={close} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={submit} loading={isLoading} disabled={!name.trim()}>
            {isLoading ? 'Création...' : 'Créer le workspace'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
