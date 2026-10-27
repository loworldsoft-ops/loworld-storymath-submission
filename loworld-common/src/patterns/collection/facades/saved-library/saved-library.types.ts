export type LwSavedLibraryStorageKind = 'firebase' | 'indexeddb' | 'sqlite' | 'mysql' | 'unknown';

export type LwSavedLibrarySyncState = 'synced' | 'syncing' | 'offline' | 'error';

export interface LwSavedLibraryItemView {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  tags: string[];
  icon?: string | null;
  storageKind: LwSavedLibraryStorageKind;
  storageLabel: string;
  syncState: LwSavedLibrarySyncState;
  ownerLabel: string | null;
  visibilityLabel: string | null;
  isPinned: boolean;
  isActive: boolean;
  createdAtLabel: string;
  updatedAtLabel: string;
  lastOpenedAtLabel: string | null;
  revisionLabel: string | null;
}

export interface LwSavedLibraryViewState {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  searchPlaceholder: string;
  storageSummaryLabel: string | null;
  items: LwSavedLibraryItemView[];
  activeItemId: string | null;
  loading: boolean;
  errorMessage: string | null;
  searchQuery: string;
}

export interface LwSavedLibraryAccessState {
  canRead: boolean;
  canWrite: boolean;
  signInRequired: boolean;
  message: string | null;
}

export interface LwSavedLibraryRepository<TDocument, TCreateInput = unknown, TUpdateInput = unknown> {
  list(): Promise<TDocument[]>;
  getById(id: string): Promise<TDocument | null>;
  create(input: TCreateInput): Promise<TDocument>;
  update(id: string, patch: TUpdateInput): Promise<TDocument>;
  delete(id: string): Promise<void>;
  duplicate?(id: string, title?: string): Promise<TDocument>;
  setActiveItemId(id: string | null): Promise<void>;
  getActiveItemId(): Promise<string | null>;
}

export interface LwSavedLibraryMapper<TDocument> {
  toItemView(document: TDocument, activeItemId: string | null): LwSavedLibraryItemView;
}