import { Injectable, type Type } from '@angular/core';
import type { ComponentMeta } from '../../../services/models/os.types';

type DomainId = ComponentMeta['domain'];

const PREVIEW_LOADERS: Record<DomainId, () => Promise<Type<unknown>>> = {
  note: () => import('../demos/document-demo.component').then(m => m.DocumentDemoComponent),
  calendar: () => import('../demos/schedule-demo.component').then(m => m.ScheduleDemoComponent),
  'homework': () => import('../demos/curriculum-demo.component').then(m => m.CurriculumDemoComponent),
  'novel': () => import('../demos/common-demo.component').then(m => m.CommonDemoComponent),
  curriculum: () => import('../demos/curriculum-demo.component').then(m => m.CurriculumDemoComponent),
  story: () => import('../demos/common-demo.component').then(m => m.CommonDemoComponent),
  db: () => import('../demos/directory-demo.component').then(m => m.DirectoryDemoComponent),
  plan: () => import('../demos/strategy-demo.component').then(m => m.StrategyDemoComponent),
  develop: () => import('../demos/dx-demo.component').then(m => m.DxDemoComponent),
  common: () => import('../demos/common-demo.component').then(m => m.CommonDemoComponent),
  showcase: () => import('../demos/showcase-demo.component').then(m => m.ShowcaseDemoComponent),
};


export const SIMULATION_SUPPORTED_IDS = new Set<string>([
  'lw-component-tile-grid',
  'calendar-add-subscription',
  'calendar-remove-subscription',
  'calendar-sync-calendar',
  'lw-account-role-badge',
  'lw-account-row',
  'lw-app-icon',
  'lw-app-titlebar',
  'lw-avatar',
  'lw-badge',
  'lw-button',
  'lw-card',
  'lw-chatbot',
  'lw-chip',
  'lw-component-vessel',
  'lw-dialog-host',
  'lw-document-card',
  'lw-document-category-filter',
  'lw-document-editor',
  'lw-document-grid-card',
  'lw-document-trash-card',
  'lw-document-viewer',
  'lw-document-workspace',
  'lw-grid',
  'lw-list',
  'lw-list-item',
  'lw-modal',
  'lw-progress-bar',
  'lw-schedule-agenda',
  'lw-schedule-day-grid',
  'lw-schedule-event-detail',
  'lw-schedule-header',
  'lw-schedule-month-grid',
  'lw-schedule-pomodoro',
  'lw-schedule-settings',
  'lw-schedule-sidebar',
  'lw-schedule-subscription-dialog',
  'lw-schedule-trash-panel',
  'lw-schedule-week-grid',
  'lw-schedule-year-grid',
  'lw-search-input',
  'lw-section-header',
  'lw-certification-panel',
  'lw-classroom-card',
  'lw-stage-progress-list',
  'lw-step-progress',
  'lw-tooltip',
  'lw-unified-card-item',
  'member-list',
  'lw-wbs-tree',
  'lw-strategy-spec-panel',
  // Common 도메인 누락 컴포넌트
  'lw-informational-badge',
  'lw-info-badge',
  'lw-unified-list-item',
  'lw-empty-state',
  'lw-fab',
  'lw-titlebar-frame',
  'lw-selectable-list',
  // Novel 도메인 누락 컴포넌트
  'lw-progress-chip',
  'lw-slide-switch',
  'lw-cube-recipe-view',
  // Showcase 도메인 누락 컴포넌트
  'lw-component-detail',
  'app-all-components',
]);

@Injectable({ providedIn: 'root' })
export class ComponentPreviewRegistryService {
  private readonly cache = new Map<DomainId, Type<unknown>>();

  async load(domain: DomainId): Promise<Type<unknown> | null> {
    if (this.cache.has(domain)) {
      return this.cache.get(domain)!;
    }
    const loader = PREVIEW_LOADERS[domain];
    if (!loader) return null;
    const comp = await loader();
    this.cache.set(domain, comp);
    return comp;
  }

  resolve(domain: DomainId): Type<unknown> | null {
    return this.cache.get(domain) ?? null;
  }

  /** 해당 컴포넌트가 현재 실시간 동작 시뮬레이션(라이브 데모)을 지원하는지 여부 */
  hasSimulation(comp: ComponentMeta | { id?: string; selector?: string; domain?: string } | null | undefined): boolean {
    if (!comp) return false;
    if (comp.domain && PREVIEW_LOADERS[comp.domain as DomainId]) return true;
    if (comp.id && SIMULATION_SUPPORTED_IDS.has(comp.id)) return true;
    if (comp.selector) {
      const parts = comp.selector.split(',').map(s => s.trim().replace(/^\[|\]$/g, ''));
      if (parts.some(p => SIMULATION_SUPPORTED_IDS.has(p))) return true;
    }
    return false;
  }
}