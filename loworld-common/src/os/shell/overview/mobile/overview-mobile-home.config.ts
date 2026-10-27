import type { OverviewExplorerItem } from '../../../../services/models/os.types';

export interface OverviewMobileAppPage {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  apps: readonly OverviewExplorerItem[];
}

export { appShortLabel as cleanAppLabel, pinShortLabel as cleanPinLabel, pinIconImage as getPinAppImage, appIconImage as getAppIconImage } from '../../../platform/core/domain-registry/app-look';
