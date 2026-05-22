import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import type { Note, Paginated, Workspace } from '../types';
import type { RootState } from './index';

// Type des arguments de listNotes, factorisé pour le casting dans les optimistic updates.
type ListNotesArgs = {
  workspaceId: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const userId = (getState() as RootState).user.userId;
      if (userId) headers.set('X-User-Id', userId);
      return headers;
    },
  }),
  tagTypes: ['Workspace', 'Note'],
  endpoints: (build) => ({
    listWorkspaces: build.query<Paginated<Workspace>, void>({
      query: () => '/workspaces',
      providesTags: ['Workspace'],
    }),
    createWorkspace: build.mutation<Workspace, { name: string }>({
      query: (body) => ({ url: '/workspaces', method: 'POST', body }),
      invalidatesTags: ['Workspace'],
    }),
    addMember: build.mutation<Workspace, { workspaceId: string; userId: string }>({
      query: ({ workspaceId, userId }) => ({
        url: `/workspaces/${workspaceId}/members`,
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: ['Workspace'],
    }),

    listNotes: build.query<Paginated<Note>, ListNotesArgs>({
      query: ({ workspaceId, search, page = 1, pageSize = 20 }) => {
        const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
        if (search) params.set('search', search);
        return `/workspaces/${workspaceId}/notes?${params}`;
      },
      providesTags: (_result, _err, { workspaceId }) => [{ type: 'Note', id: workspaceId }],
    }),
    createNote: build.mutation<Note, { workspaceId: string; title: string; content: string }>({
      query: ({ workspaceId, title, content }) => ({
        url: `/workspaces/${workspaceId}/notes`,
        method: 'POST',
        body: { title, content },
      }),
      invalidatesTags: (_result, _err, { workspaceId }) => [{ type: 'Note', id: workspaceId }],
    }),

    updateNote: build.mutation<
      Note,
      { workspaceId: string; noteId: string; title?: string; content?: string }
    >({
      query: ({ workspaceId, noteId, title, content }) => ({
        url: `/workspaces/${workspaceId}/notes/${noteId}`,
        method: 'PATCH',
        body: { title, content },
      }),
      invalidatesTags: (_result, _err, { workspaceId }) => [{ type: 'Note', id: workspaceId }],
      // Optimistic update : on patche immédiatement toutes les queries listNotes en cache
      // pour ce workspace (toutes les pages, toutes les searches actives).
      // Si l'API renvoie une erreur, on rollback toutes les modifications.
      async onQueryStarted(
        { workspaceId, noteId, title, content },
        { dispatch, queryFulfilled, getState }
      ) {
        const state = getState() as RootState;
        const now = new Date().toISOString();

        const patches = api.util
          .selectInvalidatedBy(state, [{ type: 'Note', id: workspaceId }])
          .filter((entry) => entry.endpointName === 'listNotes')
          .map((entry) =>
            dispatch(
              api.util.updateQueryData(
                'listNotes',
                entry.originalArgs as ListNotesArgs,
                (draft) => {
                  const note = draft.items.find((n) => n.id === noteId);
                  if (!note) return;
                  if (title !== undefined) note.title = title;
                  if (content !== undefined) note.content = content;
                  note.updatedAt = now;
                }
              )
            )
          );

        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
    }),

    deleteNote: build.mutation<void, { workspaceId: string; noteId: string }>({
      query: ({ workspaceId, noteId }) => ({
        url: `/workspaces/${workspaceId}/notes/${noteId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, { workspaceId }) => [{ type: 'Note', id: workspaceId }],
      // Optimistic delete : la note disparaît immédiatement de la liste, le total est
      // décrémenté. Si l'API échoue (par exemple le user n'est plus membre), rollback.
      async onQueryStarted({ workspaceId, noteId }, { dispatch, queryFulfilled, getState }) {
        const state = getState() as RootState;

        const patches = api.util
          .selectInvalidatedBy(state, [{ type: 'Note', id: workspaceId }])
          .filter((entry) => entry.endpointName === 'listNotes')
          .map((entry) =>
            dispatch(
              api.util.updateQueryData(
                'listNotes',
                entry.originalArgs as ListNotesArgs,
                (draft) => {
                  const idx = draft.items.findIndex((n) => n.id === noteId);
                  if (idx === -1) return;
                  draft.items.splice(idx, 1);
                  draft.total = Math.max(0, draft.total - 1);
                }
              )
            )
          );

        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
    }),
  }),
});

export const {
  useListWorkspacesQuery,
  useCreateWorkspaceMutation,
  useAddMemberMutation,
  useListNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} = api;