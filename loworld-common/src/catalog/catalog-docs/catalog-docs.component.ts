import { DOCUMENT, NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core';
import { DocLinkTarget } from '../../patterns/collection/docs/docs.models';
import { LwDocsPageComponent } from '../../patterns/collection/docs/page/lw-docs-page.component';
import { LwDocsSearchModalComponent } from '../../patterns/collection/docs/search-modal/lw-docs-search-modal.component';
import { LwDocsShellComponent } from '../../patterns/collection/docs/shell/lw-docs-shell.component';
import { LwThemeStore } from '../../services/theme/lw-theme.store';
import { SaveFeedbackService } from '../../services/services/save-feedback.service';
import { LwButtonComponent } from '../../ui/form/button/button.component';
import { LwEmptyStateComponent } from '../../ui/data-display/empty-state/empty-state.component';
import { LwSelectComponent } from '../../ui/form/select/select.component';
import { LwTabItem, LwTabsComponent } from '../../ui/navigation/tabs/tabs.component';
import { PlatformSupportType } from '../../services/models/os.types';
import { CatalogDocsStore } from './catalog-docs.store';
import { CatalogDomain, CatalogLayer, DOMAIN_LABELS, PLATFORM_LABELS } from './data/catalog-labels';
import { legacyRouteToPath } from './data/catalog-legacy-route';
import { CATALOG_SECTIONS, CatalogSectionKey } from './data/catalog-nav.builder';

const ALL = 'all';

const optionsOf = (allLabel: string, labels: Readonly<Record<string, string>>): { label: string; value: string }[] => [
  { label: allLabel, value: ALL },
  ...Object.entries(labels).map(([value, label]) => ({ label, value })),
];

/** 컴포넌트 도감 앱 셸. 화면 틀은 `lw-docs-shell`이 맡고 여기서는 컴포넌트 필터와 페이지 위젯을 얹는다. */
@Component({
  selector: 'lw-catalog-docs',
  standalone: true,
  imports: [NgComponentOutlet, LwButtonComponent, LwEmptyStateComponent, LwSelectComponent, LwTabsComponent, LwDocsShellComponent, LwDocsPageComponent, LwDocsSearchModalComponent],
  providers: [CatalogDocsStore],
  templateUrl: './catalog-docs.component.html',
  styleUrl: './catalog-docs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-lw-theme]': 'effectiveTheme()' },
})
export class CatalogDocsComponent {
  private readonly themeStore = inject(LwThemeStore);
  private readonly feedback = inject(SaveFeedbackService);
  private readonly doc = inject(DOCUMENT);
  protected readonly store = inject(CatalogDocsStore);

  /** 창 시스템이 내려 주는 테마. 없으면 전역 테마를 따른다. */
  readonly themeMode = input<'light' | 'dark' | 'system' | null>(null);
  /** 예전 경로형 주소(`/all-components/:section/:detailId`)의 조각. 문서 경로로 바꿔 연다. */
  readonly routeSection = input<string | null | undefined>(undefined);
  readonly routeDetailId = input<string | null | undefined>(undefined);

  protected readonly sectionTabs: readonly LwTabItem[] = CATALOG_SECTIONS.map((s) => ({ key: s.key, label: s.label }));
  protected readonly layerTabs: readonly LwTabItem[] = [
    { key: ALL, label: '전체' },
    { key: 'primitive', label: 'L1' },
    { key: 'composite', label: 'L2' },
    { key: 'container', label: '컨테이너' },
    { key: 'shell', label: 'L3' },
  ];
  protected readonly platformOptions = optionsOf('모든 플랫폼', PLATFORM_LABELS);
  protected readonly domainOptions = optionsOf('모든 도메인', DOMAIN_LABELS);

  protected readonly effectiveTheme = computed<'light' | 'dark'>(() => {
    const direct = this.themeMode();
    return direct === 'dark' || direct === 'light' ? direct : this.themeStore.resolved();
  });
  protected readonly isDark = computed(() => this.effectiveTheme() === 'dark');
  protected readonly missingMessage = computed(() => `${this.store.path()} 문서를 찾을 수 없습니다.`);

  constructor() {
    // 주소에 문서 경로가 이미 있으면 처음 한 번은 예전 경로 조각을 무시한다(새로고침 시 덮어쓰지 않도록).
    let skip = this.store.startedFromUrl;
    effect(() => {
      const path = legacyRouteToPath(this.routeSection(), this.routeDetailId());
      if (skip) {
        skip = false;
        return;
      }
      if (path) untracked(() => this.store.open(path));
    });
  }

  protected toggleTheme(): void {
    this.themeStore.toggle();
  }

  protected onNavigate(target: DocLinkTarget): void {
    this.store.open(target.path, target.anchor ?? '');
  }

  protected onSection(key: string): void {
    this.store.openSection(key as CatalogSectionKey);
  }

  protected onLayer(key: string): void {
    this.store.setLayer(key as typeof ALL | CatalogLayer);
  }

  protected onPlatform(value: string): void {
    this.store.setPlatform(value as typeof ALL | PlatformSupportType);
  }

  protected onDomain(value: string): void {
    this.store.setDomain(value as typeof ALL | CatalogDomain);
  }

  protected onCopyPage(text: string): void {
    const clipboard = this.doc.defaultView?.navigator.clipboard;
    if (!clipboard) {
      this.feedback.showError('이 환경에서는 클립보드를 쓸 수 없습니다.');
      return;
    }
    clipboard.writeText(text).then(
      () => this.feedback.showSaved('본문을 복사했습니다.'),
      () => this.feedback.showError('클립보드에 복사하지 못했습니다.'),
    );
  }
}
