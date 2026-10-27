import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { LwSavedLibraryStorageKind } from '../../facades/saved-library/saved-library.types';

export const STORAGE_KIND_LABELS: Readonly<Record<string, string>> = {
  firebase: 'Firebase 저장',
  indexeddb: '로컬 저장',
  sqlite: 'SQLite 저장',
  mysql: 'MySQL 저장',
};

/**
 * 로컬 및 클라우드 저장소 용량 사용량을 뱃지 형태로 표시하는 컴포넌트입니다.
 */
@Component({
  selector: 'lw-storage-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './storage-badge.component.html',
  styleUrl: './storage-badge.component.scss',
})
export class LwStorageBadgeComponent {
  readonly kind = input<LwSavedLibraryStorageKind>('unknown');
  readonly label = input<string | null>(null);

  readonly resolvedLabel = computed(() => {
    const custom = this.label();
    if (custom) return custom;
    return STORAGE_KIND_LABELS[this.kind()] ?? '저장소 미확인';
  });
}