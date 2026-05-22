export interface Workspace {
  id: string;
  name: string;
  memberIds: string[];
  createdAt: string;
}

export interface Note {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  error: string;
  message: string;
}
