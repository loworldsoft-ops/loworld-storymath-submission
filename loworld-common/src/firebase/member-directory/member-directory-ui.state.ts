import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MemberDirectoryUiState {
  private readonly _selectedId = signal<string | null>(null);
  private readonly _actionError = signal<string | null>(null);

  readonly selectedId = this._selectedId.asReadonly();
  readonly actionError = this._actionError.asReadonly();

  selectMember(id: string | null): void {
    this._selectedId.set(id);
  }

  setActionError(message: string | null): void {
    this._actionError.set(message);
  }
}