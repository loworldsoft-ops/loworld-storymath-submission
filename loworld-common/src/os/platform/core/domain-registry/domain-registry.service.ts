import { Injectable, InjectionToken, inject } from '@angular/core';
import type { DomainDefinition, DomainId, DomainRegistryPort } from './domain-registry.types';
import type { ComponentMeta, OverviewLaunchGroupDef, OverviewLaunchItem } from '../../../../services/models/os.types';

/** OS에 보일 앱의 정의. 띄우는 쪽이 넣는다. */
export const LW_OS_DOMAINS = new InjectionToken<readonly DomainDefinition[]>('LW_OS_DOMAINS', {
  providedIn: 'root',
  factory: () => [],
});

@Injectable({ providedIn: 'root' })
export class DomainRegistryService implements DomainRegistryPort {
  private readonly definitions = inject(LW_OS_DOMAINS);

  getDomains(): readonly DomainDefinition[] {
    return this.definitions;
  }

  getDomain(id: DomainId): DomainDefinition | undefined {
    return this.definitions.find(domain => domain.id === id);
  }

  getCatalog(id: DomainId): readonly ComponentMeta[] {
    return this.getDomain(id)?.catalog ?? [];
  }

  getLaunchGroupDefs(): readonly OverviewLaunchGroupDef[] {
    return this.definitions.map(domain => domain.launchGroup);
  }

  getLaunchItems(): readonly OverviewLaunchItem[] {
    return this.definitions.flatMap(domain => domain.launchItems);
  }
}