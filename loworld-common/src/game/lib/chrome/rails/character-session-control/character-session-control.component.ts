import { resolveRpgHeroIllustrationUrl } from '../../../../../services/utils/rpg-hero-illustration.util';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnInit, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LwAvatarComponent } from '../../../../../ui/data-display/avatar/avatar.component';
import { LwIconComponent } from '../../../../../ui/media/icon/icon.component';
import { LwButtonComponent } from '../../../../../ui/form/button/button.component';
import { STORAGE_ENGINE } from '../../../../../services/tokens/storage-engine.token';
import { type Character } from '../../../../../services/models/character.model';
import { type LwActionEvent } from '../../../../../services/models/action-event.model';
import { buildCharacterSummaryVm, getCharacterSummaryClassLabel, resolveCharacterSummaryIconName, type CharacterSummaryVm } from '../../../../collection/items/character-summary-card/character-summary.model';

import { LwCharacterSessionMenuComponent } from './character-session-menu.component';

/**
 * 기본 캐릭터 세션 LocalStorage 키
 */
export const DEFAULT_CHARACTER_SESSION_STORAGE_KEY = 'loworld-ui.character-session';

/**
 * 상단 타이틀바용 캐릭터 세션 컨트롤.
 * - 캐릭터 미선택: 캐릭터 로그인/선택 트리거 버튼 제공.
 * - 캐릭터 선택 완료: 캐릭터 아바타 및 레벨 뱃지 노출, 클릭 시 상세 모달 오픈, 드롭다운 퀵 메뉴 제공.
 * - LocalStorage 자동 영속성: 캐릭터 선택/전환 시 세션 자동 저장, 해제 시 삭제, 마운트 시 복원 이벤트 방출.
 */
@Component({
  selector: 'lw-character-session-control',
  standalone: true,
  imports: [CommonModule, LwIconComponent, LwButtonComponent, LwCharacterSessionMenuComponent, LwAvatarComponent],
  templateUrl: './character-session-control.component.html',
  styleUrl: './character-session-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwCharacterSessionControlComponent implements OnInit {
  private readonly elementRef = inject(ElementRef);
  private readonly storageEngine = inject(STORAGE_ENGINE, { optional: true });

  readonly character = input<Character | null>(null);
  readonly characterSummary = input<CharacterSummaryVm | null>(null);
  readonly characterSummaries = input<CharacterSummaryVm[] | null>(null);
  readonly isMobile = input<boolean>(false);
  readonly compact = input<boolean>(false);
  readonly showChevron = input<boolean>(false);
  readonly unselectedLabel = input<string>('캐릭터 선택');
  readonly logoutLabel = input<string>('캐릭터 세션 제거');
  readonly storageKey = input<string>(DEFAULT_CHARACTER_SESSION_STORAGE_KEY);
  readonly autoPersist = input<boolean>(true);

  readonly characterSelectClick = output<void>();
  readonly characterDetailClick = output<CharacterSummaryVm>();
  readonly characterSwitch = output<string>();
  readonly characterLogoutClick = output<void>();
  readonly characterRestore = output<string>();
  readonly actionEvent = output<LwActionEvent<any>>();

  readonly isMenuOpen = signal(false);

  constructor() {
try {
      effect(() => {
        if (!this.autoPersist()) return;
        const char = this.character();
        const summary = this.effectiveSummary();
        if (char || summary) {
          this.saveSession();
        }
      });
    } catch {
      // In isolated environments without effect scheduler
    }
  }

  saveSession(charId?: string): void {
    if (!this.autoPersist()) return;
    const key = this.storageKey();
    if (!key) return;
    const idToSave =
      charId ||
      this.effectiveSummary()?.id ||
      this.character()?.id ||
      this.effectiveSummary()?.name ||
      this.character()?.name;
    if (idToSave) {
      try {
        this.storageEngine?.setItem(key, idToSave);
      } catch {
        // fallback silently
      }
    }
  }

  clearSession(): void {
    if (!this.autoPersist()) return;
    const key = this.storageKey();
    if (!key) return;
    try {
      this.storageEngine?.removeItem(key);
    } catch {
      // fallback silently
    }
  }

  ngOnInit(): void {
    if (this.autoPersist() && !this.character() && !this.characterSummary()) {
      try {
        const key = this.storageKey();
        const savedId = this.storageEngine?.getItem(key);
        if (savedId && savedId.trim().length > 0) {
          this.characterRestore.emit(savedId);
          this.actionEvent.emit({
            actionId: 'RESTORE_CHARACTER_SESSION',
            payload: { characterId: savedId },
            source: 'lw-character-session-control',
          });
        }
      } catch {
        // ignore
      }
    }
  }

  readonly effectiveSummary = computed<CharacterSummaryVm | null>(() => {
    const char = this.character();
    if (!char) return null;
    const summary = this.characterSummary();
    if (summary && (summary.id === char.id || summary.name === char.name)) {
      return summary;
    }
    return buildCharacterSummaryVm(char);
  });

  readonly isSelected = computed<boolean>(() => !!this.character() && !!this.effectiveSummary());

  /** 이미지 로드 실패 시 아이콘으로 폴백 */
  readonly avatarImageFailed = signal<boolean>(false);

  readonly effectiveAvatarUrl = computed<string | null>(() => {
    const s = this.effectiveSummary();
    if (!s) return null;
    if (s.avatarUrl?.trim()) {
      return s.avatarUrl.trim();
    }
    const classId = (s as any).classId || s.class;
    const gender = (s as any).gender || 'male';
    return resolveRpgHeroIllustrationUrl(classId, gender);
  });

  protected onAvatarError(): void {
    this.avatarImageFailed.set(true);
  }

  readonly iconName = computed<string>(() => {
    const s = this.effectiveSummary();
    if (!s) return 'party-wanderer';
    return resolveCharacterSummaryIconName(s);
  });

  readonly classLabel = computed<string>(() => {
    const s = this.effectiveSummary();
    if (!s) return '용사';
    return getCharacterSummaryClassLabel(s);
  });

  readonly name = computed<string>(() => {
    return this.effectiveSummary()?.name ?? '영웅';
  });

  readonly level = computed<number>(() => {
    return this.effectiveSummary()?.level ?? 1;
  });

  readonly combatPower = computed<number>(() => {
    return this.effectiveSummary()?.combatPower ?? 0;
  });

  readonly hpRatio = computed<number>(() => {
    const s = this.effectiveSummary();
    if (!s || !s.maxLife) return 100;
    return Math.min(100, Math.max(0, Math.round((s.life / s.maxLife) * 100)));
  });

  readonly mpRatio = computed<number>(() => {
    const s = this.effectiveSummary();
    if (!s || !s.maxMana) return 100;
    return Math.min(100, Math.max(0, Math.round((s.mana / s.maxMana) * 100)));
  });

  readonly otherCharacters = computed<CharacterSummaryVm[]>(() => {
    const active = this.effectiveSummary();
    const list = this.characterSummaries();
    if (!list || list.length === 0) return [];
    if (!active) return list;
    return list.filter((c) => c.id !== active.id && c.name !== active.name);
  });

  protected onSelectTriggerClick(event: MouseEvent): void {
    event.stopPropagation();
    this.closeMenu();
    this.characterSelectClick.emit();
    this.actionEvent.emit({
      actionId: 'OPEN_CHARACTER_SELECT',
      payload: undefined,
      source: 'lw-character-session-control',
    });
  }

  protected onLogoutClick(event: MouseEvent): void {
    event.stopPropagation();
    this.closeMenu();
    this.clearSession();
    this.characterLogoutClick.emit();
    this.actionEvent.emit({
      actionId: 'CHARACTER_LOGOUT',
      payload: undefined,
      source: 'lw-character-session-control',
    });
  }

  protected onAvatarClick(event: MouseEvent): void {
    event.stopPropagation();
    const summary = this.effectiveSummary();
    if (!summary) {
      this.onSelectTriggerClick(event);
      return;
    }
    if (this.isMobile()) {
      // 📱 모바일: 뷰포트 레벨 바텀시트 오픈을 위해 상위로 이벤트 방출
      this.characterDetailClick.emit(summary);
      this.actionEvent.emit({
        actionId: 'CHARACTER_DETAIL_REQUESTED',
        payload: { summary },
        source: 'lw-character-session-control',
      });
      return;
    }
    this.toggleMenu(event);
  }

  protected toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.isSelected()) {
      this.onSelectTriggerClick(event);
      return;
    }
    this.isMenuOpen.set(!this.isMenuOpen());
  }

  protected closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  protected onDetailFromMenu(summary: CharacterSummaryVm): void {
    this.closeMenu();
    this.characterDetailClick.emit(summary);
    this.actionEvent.emit({
      actionId: 'CHARACTER_DETAIL_REQUESTED',
      payload: { summary },
      source: 'lw-character-session-control',
    });
  }

  protected onSelectFromMenu(): void {
    this.closeMenu();
    this.characterSelectClick.emit();
    this.actionEvent.emit({
      actionId: 'OPEN_CHARACTER_SELECT',
      payload: undefined,
      source: 'lw-character-session-control',
    });
  }

  protected onLogoutFromMenu(): void {
    this.closeMenu();
    this.clearSession();
    this.characterLogoutClick.emit();
    this.actionEvent.emit({
      actionId: 'CHARACTER_LOGOUT',
      payload: undefined,
      source: 'lw-character-session-control',
    });
  }

  protected onSwitchFromMenu(targetId: string): void {
    this.closeMenu();
    this.saveSession(targetId);
    this.characterSwitch.emit(targetId);
    this.actionEvent.emit({
      actionId: 'SELECT_PARTY_MEMBER',
      payload: { memberId: targetId },
      source: 'lw-character-session-control',
    });
  }

  protected onOpenDetailFromMenu(event: MouseEvent): void {
    event.stopPropagation();
    const summary = this.effectiveSummary();
    if (summary) {
      this.onDetailFromMenu(summary);
    }
  }

  protected onSwitchCharacter(event: MouseEvent, targetId: string): void {
    event.stopPropagation();
    this.onSwitchFromMenu(targetId);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.isMenuOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.isMenuOpen()) {
      this.closeMenu();
    }
  }
}
