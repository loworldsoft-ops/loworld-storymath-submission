import { ChangeDetectionStrategy, Component, inject, input, output, signal, computed } from '@angular/core';
import { ComponentMeta, APP_LABELS, OverviewThemeMode } from '../../services/models/os.types';
import { DomainPresentationService } from '../presentation/domain-presentation.service';
import { resolveDesignSystemFamily, resolveDesignSystemPrimitives } from '../query/design-system-resolver';
import { LwIconComponent } from '../../ui/media/icon/icon.component';
import { LwButtonComponent } from '../../ui/form/button/button.component';
import { LwCardComponent } from '../../ui/data-display/card/card.component';
import { LwBadgeComponent } from '../../ui/data-display/badge/badge.component';
import { LwInputComponent } from '../../ui/form/input/input.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-component-tile-grid',
  standalone: true,
  imports: [LwIconComponent, LwButtonComponent, LwCardComponent, LwBadgeComponent, LwInputComponent],
  templateUrl: './component-tile-grid.component.html',
  styleUrl: './component-tile-grid.component.scss',
})
export class ComponentTileGridComponent {
  private readonly domainPresentation = inject(DomainPresentationService);

  readonly components = input.required<readonly ComponentMeta[]>();
  readonly themeMode = input<OverviewThemeMode>('light');
  readonly categories = input<Array<{ id: string; label: string; icon: string }>>([
    { id: 'layout', label: 'Layout & Containers', icon: 'system:windows' },
    { id: 'navigation', label: 'Navigation', icon: 'system:menu' },
    { id: 'forms', label: 'Form Controls', icon: 'system:note' },
    { id: 'buttons', label: 'Buttons & Indicators', icon: 'system:components' },
    { id: 'popups', label: 'Popups & Modals', icon: 'system:restore' },
    { id: 'data', label: 'Data Display', icon: 'system:database' },
    { id: 'view', label: 'View & Pages', icon: 'system:monitor' },
  ]);
  readonly statLabels = input<{ first: string; second: string }>({
    first: 'Inputs',
    second: 'Outputs'
  });

  readonly hoverText = input<string>('🔍 샌드박스 진입');
  readonly hoverTextResolver = input<((comp: ComponentMeta) => string) | null>(null);
  readonly iconMap = input<Record<string, string>>({});
  readonly iconResolver = input<((comp: ComponentMeta) => string) | null>(null);
  readonly bgMap = input<Record<string, string>>({});
  readonly bgResolver = input<((comp: ComponentMeta) => string) | null>(null);

  readonly searchPlaceholder = input<string>('컴포넌트 검색...');
  readonly mobileLayout = input<boolean>(false);

  readonly componentSelect = output<string>();

  protected readonly categoryFilter = signal<string>('all');
  protected readonly searchQuery = signal<string>('');

  protected readonly APP_LABELS = APP_LABELS;

  /** 필터 및 검색이 적용된 컴포넌트 목록 계산 */
  protected readonly filteredComponents = computed(() => {
    const list = this.components();
    const cat = this.categoryFilter();
    const query = this.searchQuery().trim().toLowerCase();

    return list.filter(c => {
      // 카테고리 필터링
      if (cat !== 'all' && c.category !== cat) {
        return false;
      }
      // 검색어 필터링 (이름, 셀렉터, 설명 등)
      if (query) {
        const nameMatch = c.name.toLowerCase().includes(query);
        const englishMatch = c.englishName?.toLowerCase().includes(query) ?? false;
        const selectorMatch = c.selector.toLowerCase().includes(query);
        const descMatch = c.description.toLowerCase().includes(query);
        return nameMatch || englishMatch || selectorMatch || descMatch;
      }
      return true;
    });
  });

  protected getCategoryCount(catId: string): number {
    return this.components().filter(c => c.category === catId).length;
  }

  protected getDomainIcon(domain: ComponentMeta['domain']): string {
    return this.domainPresentation.getDomainIcon(domain);
  }

  protected getHoverText(comp: ComponentMeta): string {
    const resolver = this.hoverTextResolver();
    if (resolver) {
      return resolver(comp);
    }
    return this.hoverText();
  }

  protected getComponentBg(comp: ComponentMeta): string | null {
    const resolver = this.bgResolver();
    if (resolver) {
      return resolver(comp);
    }
    const mapped = this.bgMap()[comp.id];
    if (mapped) {
      return mapped;
    }
    return null;
  }

  /** 성격 도감 (Personality Codex) 에셋 맵 */
  static readonly PERSONALITY_CODEX_ICON_MAP: Record<string, string> = {
    // 6대 성격 도감 엔트리
    p_courage: '/assets/novel/personality/entries/p_courage.png',
    p_wisdom: '/assets/novel/personality/entries/p_wisdom.png',
    p_humility: '/assets/novel/personality/entries/p_humility.png',
    p_pride: '/assets/novel/personality/entries/p_pride.png',
    p_wrath: '/assets/novel/personality/entries/p_wrath.png',
    p_greed: '/assets/novel/personality/entries/p_greed.png',
    // 4대 성격 대봉인 (Seals)
    seal_virtues_sins: '/assets/novel/personality/seal_virtues_sins.png',
    seal_four_seven: '/assets/novel/personality/seal_four_seven.png',
    seal_desires: '/assets/novel/personality/seal_desires.png',
    seal_morality: '/assets/novel/personality/seal_morality.png',
  };

  protected isImageUrl(val: string | null | undefined): boolean {
    if (!val) return false;
    return val.startsWith('/') || val.startsWith('http') || val.endsWith('.png') || val.endsWith('.webp');
  }

  /** 성격 도감 이미지 URL 확인 및 반환 */
  protected getComponentImageUrl(comp: ComponentMeta): string | null {
    // 1. 커스텀 iconResolver 확인
    const resolver = this.iconResolver();
    if (resolver) {
      const res = resolver(comp);
      if (this.isImageUrl(res)) return res;
      if (ComponentTileGridComponent.PERSONALITY_CODEX_ICON_MAP[res]) {
        return ComponentTileGridComponent.PERSONALITY_CODEX_ICON_MAP[res];
      }
    }

    // 2. 바인딩된 iconMap 확인
    const mapped = this.iconMap()[comp.id];
    if (mapped) {
      if (this.isImageUrl(mapped)) return mapped;
      if (ComponentTileGridComponent.PERSONALITY_CODEX_ICON_MAP[mapped]) {
        return ComponentTileGridComponent.PERSONALITY_CODEX_ICON_MAP[mapped];
      }
    }

    // 3. 성격 도감 기본 매핑 반환
    return this.getDefaultPersonalityImage(comp);
  }

  /** 컴포넌트 특성에 맞춘 성격 도감(Personality Codex) 기본 엠블럼 매핑 */
  protected getDefaultPersonalityImage(comp: ComponentMeta): string {
    // 소설 카탈로그 전용 매핑
    if (comp.id === 'wuxia') {
      return '/assets/novel/covers/wuxia_cover.jpg';
    }
    if (comp.id === 'd2r') {
      return '/assets/novel/covers/diablo_cover.jpg';
    }
    if (comp.id === 'loworld-novel-sample') {
      return ComponentTileGridComponent.PERSONALITY_CODEX_ICON_MAP['p_courage'];
    }
    if (comp.id === 'cyberpunk-neo-seoul') {
      return ComponentTileGridComponent.PERSONALITY_CODEX_ICON_MAP['p_wisdom'];
    }
    if (comp.id === 'lunar-base-mystery') {
      return ComponentTileGridComponent.PERSONALITY_CODEX_ICON_MAP['p_pride'];
    }

    // 카테고리별 성격 도감 분기
    if (comp.category === 'wuxia') {
      return '/assets/novel/covers/wuxia_cover.jpg';
    }
    const iconKey = ComponentTileGridComponent.CATEGORY_CODEX_ICON_KEY_MAP[comp.category];
    return ComponentTileGridComponent.PERSONALITY_CODEX_ICON_MAP[iconKey ?? 'seal_virtues_sins'];
  }

  private static readonly CATEGORY_CODEX_ICON_KEY_MAP: Record<string, string> = {
    fantasy: 'p_courage',
    'sci-fi': 'p_wisdom',
    mystery: 'p_pride',
    layout: 'seal_four_seven',
    navigation: 'seal_morality',
    forms: 'p_humility',
    buttons: 'p_courage',
    popups: 'p_wisdom',
    data: 'p_greed',
    view: 'seal_virtues_sins',
  };

  private static readonly CATEGORY_BADGE_MAP: Record<string, { label: string; tone: string }> = {
    layout: { label: '성격: 4기질의 인', tone: 'temperament' },
    navigation: { label: '성격: 도덕의 천칭', tone: 'morality' },
    forms: { label: '성격: 겸손·절제', tone: 'humility' },
    buttons: { label: '성격: 용기·결단', tone: 'courage' },
    popups: { label: '성격: 통찰·지혜', tone: 'wisdom' },
    data: { label: '성격: 탐욕·집적', tone: 'greed' },
  };

  /** 성격 도감 테마 태그 정보 반환 */
  protected getPersonalityBadge(comp: ComponentMeta): { label: string; tone: string } {
    if (comp.id === 'wuxia' || comp.category === 'wuxia') {
      return { label: '강호 무림 · 50부작', tone: 'courage' };
    }
    if (comp.id === 'd2r') {
      return { label: '성역 서사 · 50부작', tone: 'wisdom' };
    }
    if (comp.id === 'loworld-novel-sample' || comp.category === 'fantasy') {
      return { label: '성격: 용기·신념', tone: 'courage' };
    }
    if (comp.id === 'cyberpunk-neo-seoul' || comp.category === 'sci-fi') {
      return { label: '성격: 지혜·탐구', tone: 'wisdom' };
    }
    if (comp.id === 'lunar-base-mystery' || comp.category === 'mystery') {
      return { label: '성격: 교만·야망', tone: 'pride' };
    }
    return ComponentTileGridComponent.CATEGORY_BADGE_MAP[comp.category] ?? { label: '성격: 칠덕칠죄 대봉인', tone: 'seal' };
  }

  private static readonly DEFAULT_COMPONENT_ICON_MAP: Record<string, string> = {
    'lw-commerce-panel': 'novel:ring-gem-03',
    'lw-narrative-reader': 'novel:weapon-sword-04',
    'lw-battle-arena': 'novel:weapon-crystal-02',
    'lw-character-affinity-panel': 'novel:boots-relic-02',
    'lw-affinity-card': 'novel:amulet-talisman-02',
    'lw-paragraph-manager': 'novel:belt-utility-01',
    'lw-artifice-cube-panel': 'novel:weapon-relic-01',
  };

  protected getComponentIconName(comp: ComponentMeta): string {
    const resolver = this.iconResolver();
    if (resolver) {
      return resolver(comp);
    }

    const mapped = this.iconMap()[comp.id];
    if (mapped) {
      return mapped;
    }

    return ComponentTileGridComponent.DEFAULT_COMPONENT_ICON_MAP[comp.id] ?? 'system:settings';
  }

  protected getDomainLabel(domain: ComponentMeta['domain']): string {
    return this.domainPresentation.getDomainLabel(domain);
  }

  protected selectComponent(id: string): void {
    this.componentSelect.emit(id);
  }

  protected getComponentDsFamily(comp: ComponentMeta): string {
    return resolveDesignSystemFamily(comp);
  }

  protected getComponentDsPrimitives(comp: ComponentMeta): string[] {
    return resolveDesignSystemPrimitives(comp);
  }

  private static readonly DS_FAMILY_LABELS: Record<string, string> = {
    buttons: '🔘 버튼',
    badges: '🏷️ 배지',
    cards: '🃏 카드',
    modals: '🪟 모달',
    sheets: '📱 시트',
    chips: '🏷️ 칩스',
    'app-icons': '📱 앱아이콘',
    grids: '📐 그리드',
    navigation: '🧭 네비',
    forms: '📝 폼',
  };

  protected getDsFamilyLabel(family: string): string {
    return ComponentTileGridComponent.DS_FAMILY_LABELS[family] ?? family;
  }
}
