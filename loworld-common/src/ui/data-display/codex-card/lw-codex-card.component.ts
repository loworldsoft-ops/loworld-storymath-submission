import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../form/button/button.component';

import { CodexBaseTierService } from '../../../services/services/codex-base-tier.service';
import { LwStoryPlayThemeService } from '../../../services/services/story-play-theme.service';
import { StoryBottomSheetStore } from '../../../services/services/stores/story-bottom-sheet.store';
import { injectTheme } from '../../../services/theme/lw-theme.util';
import { type CodexCardVm, type CodexCardKind, type CodexCardParagraphStory } from '../../../services/models/codex-card.model';
import { type LwActionEvent } from '../../../services/models/action-event.model';

const KIND_LABEL_MAP: Record<CodexCardKind, { label: string; className: string } | null> = {
  unique: { label: 'UNIQUE', className: 'codex-card__badge--unique' },
  set_piece: { label: 'SET PIECE', className: 'codex-card__badge--set' },
  runeword: { label: 'RUNEWORD', className: 'codex-card__badge--runeword' },
  skill: { label: 'SKILL', className: 'codex-card__badge--skill' },
  personality: null,
  base: null,
  gem: null,
  rune: null,
  affix: null,
  character: null,
  monster: null,
  party: null,
  custom: null,
};

/**
 * [SOLID Principles Compliant] 전 도감(장비, 성격, 스킬, 캐릭터, 몬스터, 파티, 배틀 FAB) 공통 통합 아케인 카드 컴포넌트
 *
 * - SRP: 카드 컨테이너 기하학(848:1264 황금비)과 도감/영웅 메타데이터 렌더링/인터랙션을 캡슐화.
 * - OCP: [cardBadges], [cardTopActions], [cardMeta], [cardChips], [cardActions] 슬롯으로 자유로운 확장 지원.
 * - LSP: LwInteractiveElement 규격을 충실히 따라 일관된 포커스, 선택, 액션 이벤트 제공.
 * - DIP: CodexBaseTierService 주입을 통해 D2 3대 베이스 티어(Normal, Exceptional, Elite) 자동 판별.
 */
@Component({
  selector: 'lw-codex-card',
  standalone: true,
  imports: [CommonModule, LwButtonComponent],
  templateUrl: './lw-codex-card.component.html',
  styleUrl: './lw-codex-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'lw-game-play-bridge lw-game-play-themed',
    '[attr.data-lw-play-theme]': 'theme() || playThemeService?.activeTheme() || (isDark() ? "dark" : "light")',
  },
})
export class LwCodexCardComponent {
  private readonly _themeContext = injectTheme();
  readonly isDark = this._themeContext.isDark;

  protected readonly playThemeService = inject(LwStoryPlayThemeService, { optional: true });
  protected readonly bottomSheetStore = inject(StoryBottomSheetStore, { optional: true });
  protected readonly baseTierService = inject(CodexBaseTierService);

  readonly theme = input<string | null>(null);
  readonly vm = input.required<CodexCardVm>();
  readonly selected = input(false);
  readonly interactive = input(true);
  readonly media = input(true);
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly selectItem = output<string>();
  readonly cardAction = output<LwActionEvent<CodexCardVm>>();
  readonly paragraphStoryClick = output<{ story: CodexCardParagraphStory; cardVm: CodexCardVm }>();

  protected readonly tierMeta = computed(() => {
    const item = this.vm();
    return this.baseTierService.getTierMeta(item.tier);
  });

  protected readonly kindBadge = computed(() => {
    const k = this.vm().kind;
    if (!k) return null;
    return KIND_LABEL_MAP[k] || null;
  });

  protected readonly isDiscovered = computed(() => {
    const v = this.vm();
    return v.discovered !== false;
  });

  protected readonly previewSrc = computed(() => {
    const item = this.vm();
    return (
      item.previewUrl?.trim() ||
      item.iconFallback ||
      'assets/novel/item-icons/webp/meta/set-piece.webp'
    );
  });

  readonly activePhaseIndex = signal<number | null>(null);

  protected readonly selectedPhaseIndex = computed(() => {
    const overridden = this.activePhaseIndex();
    if (overridden != null) return overridden;
    return this.vm().paragraphStory?.activePhaseIndex ?? 0;
  });

  onSelectPhase(index: number, event: Event): void {
    event.stopPropagation();
    this.activePhaseIndex.set(index);
    this.onOpenParagraphStory(event, index);
  }

  onOpenParagraphStory(event: Event, phaseIndexOverride?: number): void {
    event.stopPropagation();
    const story = this.vm().paragraphStory;
    if (!story) return;

    const phaseIdx = phaseIndexOverride ?? this.selectedPhaseIndex();

    if (this.bottomSheetStore) {
      this.bottomSheetStore.open('paragraph-story', {
        title: `${this.vm().name} · 장비 스토리`,
        kicker: 'PARAGRAPH STORY CODEX',
        payload: {
          story: {
            ...story,
            activePhaseIndex: phaseIdx,
          },
          cardVm: this.vm(),
        },
      });
    }

    this.paragraphStoryClick.emit({
      story,
      cardVm: this.vm(),
    });

    this.cardAction.emit({
      actionId: 'OPEN_PARAGRAPH_STORY',
      payload: this.vm(),
    });
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && this.vm().iconFallback) {
      target.src = this.vm().iconFallback!;
    }
  }

  onCardPressed(event: Event): void {
    if (!this.interactive() || this.vm().disabled) return;
    event.stopPropagation();
    this.selectItem.emit(this.vm().id);
    this.cardAction.emit({
      actionId: 'SELECT_CODEX_ITEM',
      payload: this.vm(),
    });
  }

}
