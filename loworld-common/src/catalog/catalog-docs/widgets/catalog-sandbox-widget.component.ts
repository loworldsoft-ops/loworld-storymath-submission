import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Type, computed, effect, inject, reflectComponentType, signal } from '@angular/core';
import { LwBadgeComponent } from '../../../ui/data-display/badge/badge.component';
import { LwEmptyStateComponent } from '../../../ui/data-display/empty-state/empty-state.component';
import { LwSelectComponent } from '../../../ui/form/select/select.component';
import { LwTabItem, LwTabsComponent } from '../../../ui/navigation/tabs/tabs.component';
import { ComponentPreviewRegistryService } from '../../preview/registry/component-preview-registry.service';
import { CatalogDocsStore } from '../catalog-docs.store';

type SandboxViewport = 'desktop' | 'mobile';

/** 컴포넌트 문서의 라이브 미리보기. 데스크톱/모바일 화면 크기와 테마를 바꿔 볼 수 있다. */
@Component({
  selector: 'lw-catalog-sandbox-widget',
  standalone: true,
  imports: [NgComponentOutlet, NgTemplateOutlet, LwBadgeComponent, LwEmptyStateComponent, LwSelectComponent, LwTabsComponent],
  templateUrl: './catalog-sandbox-widget.component.html',
  styleUrl: './catalog-sandbox-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogSandboxWidgetComponent {
  private readonly registry = inject(ComponentPreviewRegistryService);
  private readonly store = inject(CatalogDocsStore);

  protected readonly meta = this.store.activeComponent;

  protected readonly viewportTabs: readonly LwTabItem[] = [
    { key: 'desktop', label: 'Desktop', icon: 'monitor' },
    { key: 'mobile', label: 'Mobile 390px', icon: 'layout' },
  ];
  protected readonly themeOptions = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'Fantasy RPG', value: 'fantasy' },
    { label: 'Sci-Fi Cyberpunk', value: 'sci-fi' },
    { label: 'Wuxia', value: 'wuxia' },
  ];

  protected readonly viewport = signal<SandboxViewport>('desktop');
  protected readonly theme = signal<string>('light');
  protected readonly preview = signal<Type<unknown> | null>(null);
  protected readonly loading = signal<boolean>(false);

  protected readonly isMobile = computed(() => this.viewport() === 'mobile');
  protected readonly selectorLabel = computed(() => `<${this.meta()?.selector ?? ''}>`);
  /** 미리보기 컴포넌트에 넘길 입력. 도메인마다 받는 입력이 달라 선언된 것만 넘긴다. */
  protected readonly previewInputs = computed<Record<string, unknown>>(() => {
    const type = this.preview();
    const declared = new Set((type ? reflectComponentType(type)?.inputs : [])?.map((i) => i.templateName));
    const candidates: Record<string, unknown> = { comp: this.meta(), themeMode: this.theme() === 'light' ? 'light' : 'dark' };
    return Object.fromEntries(Object.entries(candidates).filter(([name]) => declared.has(name)));
  });
  protected readonly missingMessage = computed(() => `${this.selectorLabel()} 은(는) 단독 미리보기를 제공하지 않습니다.`);

  constructor() {
    // 보는 컴포넌트가 바뀌면 미리보기를 다시 불러온다.
    effect((onCleanup) => {
      const meta = this.meta();
      let cancelled = false;
      onCleanup(() => (cancelled = true));
      this.preview.set(null);
      if (!meta || !this.registry.hasSimulation(meta)) {
        this.loading.set(false);
        return;
      }
      this.loading.set(true);
      this.registry
        .load(meta.domain)
        .catch(() => null)
        .then((type) => {
          // 불러오는 사이 다른 컴포넌트로 바뀌었으면 버린다.
          if (cancelled) return;
          this.preview.set(type);
          this.loading.set(false);
        });
    });
  }

  protected setViewport(key: string): void {
    this.viewport.set(key === 'mobile' ? 'mobile' : 'desktop');
  }
}
