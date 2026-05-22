import { useState } from 'react';
import { UserPlus, Users } from 'lucide-react';

import type { Workspace } from '../types';
import { InviteMemberDialog } from './InviteMemberDialog';
import { UserAvatar } from './UserAvatar';

interface Props {
  workspace: Workspace;
  noteCount: number | undefined;
}

export function WorkspacePanelHeader({ workspace, noteCount }: Props) {
  const [inviteOpen, setInviteOpen] = useState(false);

  const visibleMembers = workspace.memberIds.slice(0, 3);
  const extraCount = Math.max(0, workspace.memberIds.length - visibleMembers.length);

  return (
    <div className="border-b border-slate-200/80 bg-white/60 px-7 py-3 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900">
            {workspace.name}
          </h1>
          <span className="hidden sm:inline-flex shrink-0 items-center gap-1 text-xs text-slate-500 tabular-nums">
            <Users className="h-3.5 w-3.5" strokeWidth={2} />
            {workspace.memberIds.length}
          </span>
          {noteCount !== undefined && (
            <>
              <span className="hidden sm:inline text-slate-300">·</span>
              <span className="hidden sm:inline shrink-0 text-xs text-slate-500 tabular-nums">
                {noteCount} {noteCount === 1 ? 'note' : 'notes'}
              </span>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden -space-x-2 md:flex">
            {visibleMembers.map((id) => (
              <UserAvatar key={id} userId={id} size="sm" />
            ))}
            {extraCount > 0 && (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 ring-2 ring-white tabular-nums">
                +{extraCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className={
              'inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium ' +
              'text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all duration-150 ease-out-expo ' +
              'hover:bg-slate-50 hover:ring-slate-300 active:scale-[0.98]'
            }
          >
            <UserPlus className="h-3.5 w-3.5" strokeWidth={2.25} />
            Inviter
          </button>
        </div>
      </div>

      <InviteMemberDialog
        open={inviteOpen}
        workspace={workspace}
        onClose={() => setInviteOpen(false)}
      />
    </div>
  );
}