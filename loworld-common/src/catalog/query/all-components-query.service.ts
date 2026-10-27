import { Injectable, computed, type Signal } from '@angular/core';
import { ALL_CATALOG } from '../all-catalog';
import type { AppId, ComponentMeta, DesignSystemFamily, PlatformSupportType } from '../../services/models/os.types';

import { COMPONENT_INTERSECTION_CENSUS_MAP } from '../all-components-census-data';
import { getPlatformSupportType, resolvePlatformSpec, getPlatformSupportLabel, getPlatformSupportIcon } from '../all-components-platform-census';

import {
  resolveDesignSystemFamily,
  resolveDesignSystemPrimitives,
  matchesDesignSystemFamily,
} from './design-system-resolver';

export {
  resolveDesignSystemFamily,
  resolveDesignSystemPrimitives,
  matchesDesignSystemFamily,
};

type AppFilter = 'all' | AppId;
type DomainFilter = 'all' | ComponentMeta['domain'];
type CategoryFilter = 'all' | ComponentMeta['category'];
export type UsageSortBy = 'usage' | 'reuse' | 'coverage' | 'name';

const CATEGORY_ORDER: ComponentMeta['category'][] = [
  'layout',
  'navigation',
  'forms',
  'buttons',
  'cards',
  'popups',
  'data',
  'view'
];

@Injectable({ providedIn: 'root' })
export class AllComponentsQueryService {
  readonly totalCount = ALL_CATALOG.length;
  readonly noteCount = ALL_CATALOG.filter(component => component.domain === 'note').length;
  readonly calendarCount = ALL_CATALOG.filter(component => component.domain === 'calendar').length;
  readonly curriculumCount = ALL_CATALOG.filter(component => component.domain === 'homework' || (component.domain as string) === 'curriculum').length;
  readonly dbCount = ALL_CATALOG.filter(component => component.domain === 'db').length;
  readonly storyCount = ALL_CATALOG.filter(component => component.domain === 'novel').length;
  readonly planCount = ALL_CATALOG.filter(component => component.domain === 'plan').length;
  readonly developCount = ALL_CATALOG.filter(component => component.domain === 'develop').length;
  readonly commonCount = ALL_CATALOG.filter(component => component.domain === 'common').length;
  readonly showcaseCount = ALL_CATALOG.filter(component => component.domain === 'showcase').length;

  readonly noteAppCount = ALL_CATALOG.filter(component => component.usedIn?.some(usage => usage.app === 'eznote')).length;
  readonly calendarAppCount = ALL_CATALOG.filter(component => component.usedIn?.some(usage => usage.app === 'ezcalendar')).length;
  readonly loworldStudyCount = ALL_CATALOG.filter(component => component.usedIn?.some(usage => usage.app === 'loworld-study')).length;
  readonly loworldDbCount = ALL_CATALOG.filter(component => component.usedIn?.some(usage => usage.app === 'loworld-db')).length;
  readonly loworldStoryCount = ALL_CATALOG.filter(component => component.usedIn?.some(usage => usage.app === 'loworld-novel')).length;
  readonly loworldPlanCount = ALL_CATALOG.filter(component => component.usedIn?.some(usage => usage.app === 'loworld-plan')).length;
  readonly loworldDevelopCount = ALL_CATALOG.filter(component => component.usedIn?.some(usage => usage.app === 'loworld-develop')).length;
  readonly primitiveCount = computed(() => ALL_CATALOG.filter(c => c.layer === 'primitive').length);
  readonly compositeCount = computed(() => ALL_CATALOG.filter(c => c.layer === 'composite').length);
  readonly containerCount = computed(() => ALL_CATALOG.filter(c => c.layer === 'container').length);
  readonly shellCount = computed(() => ALL_CATALOG.filter(c => c.layer === 'shell').length);

  // App Factory Dashboard Metrics
  readonly factoryHealthScore = computed(() => {
    const reusable = ALL_CATALOG.filter(c => c.domain === 'common' || c.domain === 'showcase' || c.layer === 'primitive' || c.layer === 'composite').length;
    return Math.round((reusable / ALL_CATALOG.length) * 100);
  });

  readonly globalReuseIndex = computed(() => {
    const totalInstances = ALL_CATALOG.reduce((sum, c) => sum + (c.usedIn?.length ?? 0), 0);
    return Math.round((totalInstances / ALL_CATALOG.length) * 10) / 10;
  });

  readonly zeroDuplicationRate = computed(() => {
    const safeCount = ALL_CATALOG.filter(c => c.duplicationRisk !== 'warn' && c.duplicationRisk !== 'critical').length;
    return Math.round((safeCount / ALL_CATALOG.length) * 100);
  });

  readonly totalReferenceInvocations = computed(() => {
    return ALL_CATALOG.reduce((sum, comp) => sum + (comp.usedIn?.length ?? 0), 0);
  });

  readonly topUsedComponent = computed(() => {
    let top: ComponentMeta | null = null;
    let max = -1;
    for (const comp of ALL_CATALOG) {
      const count = comp.usedIn?.length ?? 0;
      if (count > max) {
        max = count;
        top = comp;
      }
    }
    return top;
  });

  getTotalUsageCount(component: ComponentMeta): number {
    return component.usedIn?.length ?? 0;
  }

  getAppCoverageCount(component: ComponentMeta): number {
    if (!component.usedIn) return 0;
    return new Set(component.usedIn.map(u => u.app)).size;
  }

  getReusabilityIndex(component: ComponentMeta): number {
    return component.reusabilityIndex ?? (component.usedIn?.length ?? 0);
  }

  readonly buttonsFamilyCount = computed(() => ALL_CATALOG.filter(c => matchesDesignSystemFamily('buttons', resolveDesignSystemPrimitives(c), c)).length);
  readonly badgesFamilyCount = computed(() => ALL_CATALOG.filter(c => matchesDesignSystemFamily('badges', resolveDesignSystemPrimitives(c), c)).length);
  readonly cardsFamilyCount = computed(() => ALL_CATALOG.filter(c => matchesDesignSystemFamily('cards', resolveDesignSystemPrimitives(c), c)).length);
  readonly modalsFamilyCount = computed(() => ALL_CATALOG.filter(c => matchesDesignSystemFamily('modals', resolveDesignSystemPrimitives(c), c)).length);
  readonly sheetsFamilyCount = computed(() => ALL_CATALOG.filter(c => matchesDesignSystemFamily('sheets', resolveDesignSystemPrimitives(c), c)).length);
  readonly chipsFamilyCount = computed(() => ALL_CATALOG.filter(c => matchesDesignSystemFamily('chips', resolveDesignSystemPrimitives(c), c)).length);
  readonly appIconsFamilyCount = computed(() => ALL_CATALOG.filter(c => matchesDesignSystemFamily('app-icons', resolveDesignSystemPrimitives(c), c)).length);
  readonly avatarsFamilyCount = computed(() => ALL_CATALOG.filter(c => matchesDesignSystemFamily('avatars', resolveDesignSystemPrimitives(c), c)).length);
  readonly gridsFamilyCount = computed(() => ALL_CATALOG.filter(c => matchesDesignSystemFamily('grids', resolveDesignSystemPrimitives(c), c)).length);
  readonly listsFamilyCount = computed(() => ALL_CATALOG.filter(c => matchesDesignSystemFamily('lists', resolveDesignSystemPrimitives(c), c)).length);
  readonly sideMenusFamilyCount = computed(() => ALL_CATALOG.filter(c => matchesDesignSystemFamily('side-menus', resolveDesignSystemPrimitives(c), c)).length);
  readonly navigationFamilyCount = computed(() => ALL_CATALOG.filter(c => matchesDesignSystemFamily('navigation', resolveDesignSystemPrimitives(c), c)).length);
  readonly formsFamilyCount = computed(() => ALL_CATALOG.filter(c => matchesDesignSystemFamily('forms', resolveDesignSystemPrimitives(c), c)).length);

  /** 📱🖥️ 듀얼 모드 플랫폼 아키텍처별 전수조사 카운트 */
  readonly desktopOnlyCount = computed(() => ALL_CATALOG.filter(c => getPlatformSupportType(c) === 'desktop-only').length);
  readonly mobileOnlyCount = computed(() => ALL_CATALOG.filter(c => getPlatformSupportType(c) === 'mobile-only').length);
  readonly adaptiveCount = computed(() => ALL_CATALOG.filter(c => getPlatformSupportType(c) === 'adaptive').length);
  readonly sharedCount = computed(() => ALL_CATALOG.filter(c => getPlatformSupportType(c) === 'shared-primitive').length);

  createViewModel(filters: {
    appFilter: Signal<AppFilter>;
    domainFilter: Signal<DomainFilter>;
    categoryFilter: Signal<CategoryFilter>;
    layerFilter: Signal<'all' | 'primitive' | 'composite_shell' | 'composite' | 'container' | 'shell'>;
    designSystemFilter?: Signal<'all' | DesignSystemFamily>;
    platformFilter?: Signal<'all' | PlatformSupportType>;
    searchQuery: Signal<string>;
    sortBy?: Signal<UsageSortBy>;
  }) {
    const filteredCatalog = computed(() => {
      const app = filters.appFilter();
      const domain = filters.domainFilter();
      const category = filters.categoryFilter();
      const layer = filters.layerFilter();
      const dsFamily = filters.designSystemFilter ? filters.designSystemFilter() : 'all';
      const platform = filters.platformFilter ? filters.platformFilter() : 'all';
      const query = filters.searchQuery().toLowerCase().trim();

      return ALL_CATALOG.filter(component => {
        if (app !== 'all' && !component.usedIn?.some(usage => usage.app === app)) return false;
        if (domain !== 'all' && component.domain !== domain) return false;
        if (category !== 'all' && component.category !== category) return false;
        if (dsFamily !== 'all') {
          const adoptedPrims = resolveDesignSystemPrimitives(component);
          if (!matchesDesignSystemFamily(dsFamily, adoptedPrims, component)) return false;
        }
        if (platform !== 'all' && getPlatformSupportType(component) !== platform) return false;
        if (layer === 'composite_shell') {
          if (component.layer !== 'composite' && component.layer !== 'shell') return false;
        } else if (layer !== 'all' && (component.layer ?? 'composite') !== layer) {
          return false;
        }
        if (
          query
          && !component.name.toLowerCase().includes(query)
          && !component.selector.toLowerCase().includes(query)
          && !component.description.toLowerCase().includes(query)
        ) {
          return false;
        }
        return true;
      });
    });

    const usageRankedCatalog = computed(() => {
      const list = [...filteredCatalog()];
      const sort = filters.sortBy ? filters.sortBy() : 'usage';

      return list.sort((a, b) => {
        if (sort === 'usage') {
          const countA = a.usedIn?.length ?? 0;
          const countB = b.usedIn?.length ?? 0;
          if (countB !== countA) return countB - countA;
          return a.name.localeCompare(b.name);
        }
        if (sort === 'reuse') {
          const indexA = this.getReusabilityIndex(a);
          const indexB = this.getReusabilityIndex(b);
          if (indexB !== indexA) return indexB - indexA;
          return a.name.localeCompare(b.name);
        }
        if (sort === 'coverage') {
          const covA = this.getAppCoverageCount(a);
          const covB = this.getAppCoverageCount(b);
          if (covB !== covA) return covB - covA;
          return a.name.localeCompare(b.name);
        }
        return a.name.localeCompare(b.name);
      });
    });

    return {
      filteredCatalog,
      usageRankedCatalog,
      groupedCatalog: computed(() => CATEGORY_ORDER
        .map(category => ({
          category,
          components: filteredCatalog().filter(component => component.category === category),
        }))
        .filter(group => group.components.length > 0)),
      matrixGroups: computed(() => CATEGORY_ORDER.map(category => ({
        category,
        components: filteredCatalog().filter(component => component.category === category)
      })).filter(group => group.components.length > 0)),
    };
  }

  getUsageForApp(component: ComponentMeta, appId: AppId) {
    return component.usedIn?.find(usage => usage.app === appId) ?? null;
  }
}