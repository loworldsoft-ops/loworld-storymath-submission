import { resolveRpgHeroIllustrationUrl } from '../../../../../services/utils/rpg-hero-illustration.util';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { LwIconComponent } from '../../../../../ui/media/icon/icon.component';
import { LwButtonComponent } from '../../../../../ui/form/button/button.component';
import { LwBadgeComponent } from '../../../../../ui/data-display/badge/badge.component';
import { LwProgressBarComponent } from '../../../../../ui/data-display/progress-bar/progress-bar.component';
import { LwAvatarComponent } from '../../../../../ui/data-display/avatar/avatar.component';
import { LwCardComponent } from '../../../../../ui/data-display/card/card.component';
import { getCharacterSummaryClassLabel, resolveCharacterSummaryIconName, type CharacterSummaryVm } from '../../../../collection/items/character-summary-card/character-summary.model';

/**
 * 👤 LwCharacterSessionMenuComponent
 * 캐릭터 프로필 정보, HP/MP 바이탈, 핵심 세션 액션(상세보기, 변경/생성, 로그아웃) 및 로스터 빠른 전환을
 * 단일화하여 제공하는 공통 캐릭터 세션 정보 패널/메뉴 컴포넌트.
 * - 데스크톱: LwCharacterSessionControl 플로팅 드롭다운 메뉴로 렌더링
 * - 모바일: LwBottomSheet 바텀시트 컨텐츠로 렌더링
 */
@Component({
  selector: 'lw-character-session-menu',
  standalone: true,
  imports: [CommonModule, LwIconComponent, LwButtonComponent, LwBadgeComponent, LwProgressBarComponent, LwAvatarComponent, LwCardComponent],
  templateUrl: './character-session-menu.component.html',
  styleUrl: './character-session-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwCharacterSessionMenuComponent {
  /** 대상 캐릭터 요약 뷰모델 */
  readonly summary = input<CharacterSummaryVm | null>(null);

  /** 동행 파티원 / 로스터 캐릭터 목록 */
  readonly otherCharacters = input<CharacterSummaryVm[]>([]);

  /** 로그아웃 액션 라벨 */
  readonly logoutLabel = input<string>('캐릭터 세션 제거');

  /** 상세 보기 요청 */
  readonly detailClick = output<CharacterSummaryVm>();

  /** 캐릭터 변경/새로 생성 요청 */
  readonly selectClick = output<void>();

  /** 동행 파티원 빠른 전환 요청 (targetId) */
  readonly switchClick = output<string>();

  /** 세션 로그아웃 요청 */
  readonly logoutClick = output<void>();

  /** 이미지 로드 실패 시 아이콘으로 폴백 */
  readonly avatarImageFailed = signal<boolean>(false);

  readonly effectiveAvatarUrl = computed<string | null>(() => {
    const s = this.summary();
    if (!s) return null;
    if (s.avatarUrl?.trim()) {
      return s.avatarUrl.trim();
    }
    const classId = (s as any).classId || s.class;
    const gender = (s as any).gender || 'male';
    return resolveRpgHeroIllustrationUrl(classId, gender);
  });

  readonly iconName = computed<string>(() => {
    const s = this.summary();
    if (!s) return 'party-wanderer';
    return resolveCharacterSummaryIconName(s);
  });

  readonly classLabel = computed<string>(() => {
    const s = this.summary();
    if (!s) return '용사';
    return getCharacterSummaryClassLabel(s);
  });

  readonly hpRatio = computed<number>(() => {
    const s = this.summary();
    if (!s || !s.maxLife) return 100;
    return Math.min(100, Math.max(0, Math.round((s.life / s.maxLife) * 100)));
  });

  readonly mpRatio = computed<number>(() => {
    const s = this.summary();
    if (!s || !s.maxMana) return 100;
    return Math.min(100, Math.max(0, Math.round((s.mana / s.maxMana) * 100)));
  });

  protected onAvatarError(): void {
    this.avatarImageFailed.set(true);
  }

  resolveOtherAvatarUrl(other: CharacterSummaryVm): string | null {
    if (other.avatarUrl?.trim()) return other.avatarUrl.trim();
    const classId = (other as any).classId || other.class;
    const gender = (other as any).gender || 'male';
    return resolveRpgHeroIllustrationUrl(classId, gender);
  }

  protected onDetailClick(event: MouseEvent): void {
    event.stopPropagation();
    const s = this.summary();
    if (s) {
      this.detailClick.emit(s);
    }
  }

  protected onSelectClick(event: MouseEvent): void {
    event.stopPropagation();
    this.selectClick.emit();
  }

  protected onSwitchClick(event: MouseEvent, targetId: string): void {
    event.stopPropagation();
    this.switchClick.emit(targetId);
  }

  protected onLogoutClick(event: MouseEvent): void {
    event.stopPropagation();
    this.logoutClick.emit();
  }
}
