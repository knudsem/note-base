import { useState } from 'react';
import { Check, UserPlus } from 'lucide-react';

import { useAddMemberMutation } from '../store/api';
import { LIMITS } from '../constants';
import type { Workspace } from '../types';
import { Button } from './Button';
import { ErrorBanner } from './ErrorBanner';
import { Modal } from './Modal';
import { UserAvatar } from './UserAvatar';

interface Props {
  open: boolean;
  workspace: Workspace;
  onClose: () => void;
}

export function InviteMemberDialog({ open, workspace, onClose }: Props) {
  const [userId, setUserId] = useState('');
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [addMember, { isLoading, error, reset }] = useAddMemberMutation();

  const close = () => {
    setUserId('');
    setJustAdded(null);
    reset();
    onClose();
  };

  // À l'ajout réussi, on garde le feedback "vient d'être ajouté" sur le chip
  // pendant 2s pour confirmer visuellement, puis l'utilisateur peut en inviter d'autres.
  const submit = async () => {
    const trimmed = userId.trim();
    if (!trimmed) return;
    try {
      await addMember({ workspaceId: workspace.id, userId: trimmed }).unwrap();
      setUserId('');
      setJustAdded(trimmed);
      window.setTimeout(() => setJustAdded(null), 2000);
    } catch {
      /* erreur affichée plus bas */
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Gérer les membres"
      description={`${workspace.memberIds.length} ${workspace.memberIds.length === 1 ? 'personne a accès' : 'personnes ont accès'} à "${workspace.name}".`}
    >
      <div className="space-y-5">
        {/* Liste des membres existants, en chips compactes. */}
        <div className="flex flex-wrap gap-1.5">
          {workspace.memberIds.map((id) => {
            const isNew = id === justAdded;
            return (
              <div
                key={id}
                className={
                  'inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-sm transition-all duration-300 ' +
                  (isNew
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/60')
                }
              >
                <UserAvatar userId={id} size="xs" />
                <span className="font-medium tabular-nums">{id}</span>
                {isNew && <Check className="h-3 w-3" strokeWidth={2.5} />}
              </div>
            );
          })}
        </div>

        {/* Bloc d'invitation, mis en avant avec un fond légèrement teinté. */}
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/60">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <UserPlus className="h-3.5 w-3.5 text-slate-500" strokeWidth={2.25} />
            Inviter un membre
          </div>
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              className={
                'flex-1 rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-inset ring-slate-200 ' +
                'placeholder:text-slate-400 transition-all duration-150 ' +
                'focus:ring-2 focus:ring-blue-500 focus:outline-none'
              }
              placeholder="Identifiant utilisateur (ex. 2)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              maxLength={LIMITS.userId.max}
            />
            <Button onClick={submit} loading={isLoading} disabled={!userId.trim()}>
              Ajouter
            </Button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            L'utilisateur verra ce workspace en se connectant avec son identifiant.
          </p>
        </div>

        {error && <ErrorBanner message="Impossible d'ajouter ce membre. Vérifie l'identifiant et réessaie." />}

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={close}>
            Terminé
          </Button>
        </div>
      </div>
    </Modal>
  );
}