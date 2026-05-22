export const LIMITS = {
  workspaceName: { min: 1, max: 80 },
  noteTitle: { min: 1, max: 200 },
  noteContent: { min: 1, max: 10000 },
  userId: { min: 1, max: 64 },
} as const;

export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 100,
} as const;

export const SEARCH_DEBOUNCE_MS = 300;
