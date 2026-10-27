import type { ComponentMeta, OverviewLaunchGroupDef, OverviewLaunchItem } from '../../../../services/models/os.types';
import type { DomainDefinition, DomainId } from '../../../../host/host.types';

export type { DomainId, LwAppMobile, DomainDefinition } from '../../../../host/host.types';

export interface DomainRegistryPort {
  getDomains(): readonly DomainDefinition[];
  getDomain(id: DomainId): DomainDefinition | undefined;
  getCatalog(id: DomainId): readonly ComponentMeta[];
  getLaunchGroupDefs(): readonly OverviewLaunchGroupDef[];
  getLaunchItems(): readonly OverviewLaunchItem[];
}