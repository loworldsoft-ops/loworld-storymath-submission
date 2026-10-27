import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { LwSavedLibrarySyncState } from '../../facades/saved-library/saved-library.types';

export const SYNC_STATE_LABELS: Readonly<Record<string, string>> = {
  synced: '동기화 완료',
  syncing: '동기화 중',
  offline: '오프라인',
  error: '동기화 오류',
};

/**
 * 실시간 데이터 동기화 상태(동기화됨, 동기화 중, 오프라인)를 나타내는 칩 컴포넌트입니다.
 */
@Component({
  selector: 'lw-sync-state-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sync-state-chip.component.html',
  styleUrl: './sync-state-chip.component.scss',
})
export class LwSyncStateChipComponent {
  readonly state = input<LwSavedLibrarySyncState>('synced');
  readonly label = input<string | null>(null);

  readonly resolvedLabel = computed(() => {
    const custom = this.label();
    if (custom) return custom;
    return SYNC_STATE_LABELS[this.state()] ?? '상태 미확인';
  });
}