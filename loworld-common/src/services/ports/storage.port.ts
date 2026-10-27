import { InjectionToken } from '@angular/core';

/**
 * 📦 LwStoragePort
 * 
 * 브라우저 전역 localStorage / sessionStorage에 대한 직접 결합을 제거하고
 * 의존 역전 원칙(DIP)을 준수하여 SSR 호환성 및 테스트 격리성을 제공하는 스토리지 포트 계약입니다.
 */
export interface LwStoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  key(index: number): string | null;
  readonly length: number;
}

/**
 * 🖥️ BrowserLocalStorageAdapter
 * 브라우저 환경에서 실제 window.localStorage를 안전하게 위임 호출하는 어댑터입니다.
 * SSR(Node.js 등) 환경에서는 인메모리 폴백으로 자동 전환되어 충돌을 방지합니다.
 */
export class BrowserLocalStorageAdapter implements LwStoragePort {
  private readonly _memory = new Map<string, string>();

  private get _isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  getItem(key: string): string | null {
    if (this._isBrowser) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return this._memory.get(key) ?? null;
      }
    }
    return this._memory.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this._isBrowser) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch {
        // QuotaExceeded or security error fallback to memory
      }
    }
    this._memory.set(key, value);
  }

  removeItem(key: string): void {
    if (this._isBrowser) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch {}
    }
    this._memory.delete(key);
  }

  clear(): void {
    if (this._isBrowser) {
      try {
        window.localStorage.clear();
      } catch {}
    }
    this._memory.clear();
  }

  key(index: number): string | null {
    if (this._isBrowser) {
      try {
        return window.localStorage.key(index);
      } catch {}
    }
    return Array.from(this._memory.keys())[index] ?? null;
  }

  get length(): number {
    if (this._isBrowser) {
      try {
        return window.localStorage.length;
      } catch {}
    }
    return this._memory.size;
  }
}

/**
 * 🧪 MemoryStorageAdapter
 * 단위 테스트나 독립적인 모의 환경을 위한 순수 인메모리 스토리지 어댑터입니다.
 */
export class MemoryStorageAdapter implements LwStoragePort {
  private readonly _store = new Map<string, string>();

  getItem(key: string): string | null {
    return this._store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this._store.set(key, value);
  }

  removeItem(key: string): void {
    this._store.delete(key);
  }

  clear(): void {
    this._store.clear();
  }

  key(index: number): string | null {
    return Array.from(this._store.keys())[index] ?? null;
  }

  get length(): number {
    return this._store.size;
  }
}

/**
 * 💉 전역 스토리지 의존성 주입 토큰 (DIP)
 */
export const LW_STORAGE_PORT = new InjectionToken<LwStoragePort>('LW_STORAGE_PORT', {
  providedIn: 'root',
  factory: () => new BrowserLocalStorageAdapter(),
});
