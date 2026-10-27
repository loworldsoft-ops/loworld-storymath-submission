import { InjectionToken, inject } from '@angular/core';
import { LW_STORAGE_PORT, type LwStoragePort } from '../ports/storage.port';

export type StorageEngine = LwStoragePort;

/**
 * Injection Token for abstracting Storage Engine access (DIP).
 * Uses LW_STORAGE_PORT adapter internally for unified SSR safety and in-memory fallback.
 */
export const STORAGE_ENGINE = new InjectionToken<StorageEngine>('STORAGE_ENGINE', {
  providedIn: 'root',
  factory: () => inject(LW_STORAGE_PORT),
});
