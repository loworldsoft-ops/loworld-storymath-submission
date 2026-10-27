import { Signal, effect, inject, signal } from '@angular/core';
import { STORAGE_ENGINE } from '../tokens/storage-engine.token';

export interface StorageOptions<T> {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
}

/**
 * Functional composition helper for LocalStorage state synchronization with Signals.
 * Safe for SSR and automatically updates storage on Signal value change.
 */
export function injectLocalStorage<T>(
  key: string,
  defaultValue: T,
  options?: StorageOptions<T>
): { value: Signal<T>; set: (val: T) => void; update: (fn: (prev: T) => T) => void } {
  const engine = inject(STORAGE_ENGINE);
  const serialize = options?.serializer ?? JSON.stringify;
  const deserialize = options?.deserializer ?? JSON.parse;

  const readInitial = (): T => {
    try {
      const item = engine.getItem(key);
      if (item === null) return defaultValue;
      // Handle simple string fallback if deserialization isn't JSON
      if (typeof defaultValue === 'string' && item && !item.startsWith('"')) {
        return item as unknown as T;
      }
      return deserialize(item);
    } catch {
      return defaultValue;
    }
  };

  const state = signal<T>(readInitial());

  effect(() => {
    const val = state();
    try {
      const serialized = typeof val === 'string' ? val : serialize(val);
      engine.setItem(key, serialized);
    } catch (e) {
      console.warn(`[injectLocalStorage] Failed to set key: ${key}`, e);
    }
  });

  return {
    value: state.asReadonly(),
    set: (val: T) => state.set(val),
    update: (fn: (prev: T) => T) => state.update(fn),
  };
}
