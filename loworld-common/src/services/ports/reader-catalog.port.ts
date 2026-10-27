import { InjectionToken } from '@angular/core';
import type { BookshelfBookItem } from '../models/story-reader.model';

export interface ReaderCatalogPort {
  loadCatalog(): Promise<readonly BookshelfBookItem[]>;
}

export const READER_CATALOG_PORT = new InjectionToken<ReaderCatalogPort>('READER_CATALOG_PORT');
