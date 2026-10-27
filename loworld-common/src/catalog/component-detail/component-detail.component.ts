import { NgComponentOutlet, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, type Type } from '@angular/core';
import { ComponentMeta, APP_LABELS, OverviewThemeMode } from '../../services/models/os.types';
import { DomainPresentationService } from '../presentation/domain-presentation.service';
import { LwButtonComponent } from '../../ui/form/button/button.component';
import { LwCardComponent } from '../../ui/data-display/card/card.component';
import { LwBadgeComponent } from '../../ui/data-display/badge/badge.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-component-detail',
  standalone: true,
  imports: [NgComponentOutlet, UpperCasePipe, LwButtonComponent, LwCardComponent, LwBadgeComponent],
  templateUrl: './component-detail.component.html',
  styleUrl: './component-detail.component.scss',
})
export class ComponentDetailComponent {
  private readonly domainPresentation = inject(DomainPresentationService);

  readonly comp   = input.required<ComponentMeta>();
  readonly domain = input.required<ComponentMeta['domain']>();
  readonly themeMode = input<OverviewThemeMode>('light');

  readonly openNav = output<void>();

  readonly APP_LABELS = APP_LABELS;
  readonly copied = signal(false);
  readonly activeTab = signal<'demo' | 'blueprint'>('demo');

  protected readonly previewComponent = signal<Type<unknown> | null>(null);

  constructor() {
    effect(() => {
      const domain = this.domain();
      this.previewComponent.set(null);
      import('../preview/registry/component-preview-registry.service').then(({ ComponentPreviewRegistryService }) => {
        const registry = new ComponentPreviewRegistryService();
        registry.load(domain).then(comp => {
          this.previewComponent.set(comp);
        });
      });
    });
  }
  protected readonly previewInputs = computed(() => ({ comp: this.comp(), themeMode: this.themeMode() }));

  protected readonly compDependencies = computed(() => this.comp().dependencies ?? []);
  protected readonly compReferencedBy = computed(() => this.comp().referencedBy ?? []);
  protected readonly hasDuplicationRisk = computed(() => this.comp().duplicationRisk === 'warn' || this.comp().duplicationRisk === 'critical');

  protected getDomainLabel(domain: ComponentMeta['domain']): string {
    return this.domainPresentation.getDomainLabel(domain);
  }

  protected copySelector(selector: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`<${selector}>`).then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      }).catch(() => {
        // Fallback
      });
    }
  }
}
