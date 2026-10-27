import { Type } from '@angular/core';
import type { WindowTabContext, WindowTabRegistration, WindowTabSettingsMode } from '../../../../host/host.types';

export type {
  WindowTabContext,
  WindowTabPresentation,
  WindowTabRegistration,
  WindowTabSettingsMode,
} from '../../../../host/host.types';

export interface WindowTabRegistryPort {
  register(registration: WindowTabRegistration): void;
  has(tab: string): boolean;
  get(tab: string): WindowTabRegistration | undefined;
  getComponent(tab: string): Type<unknown> | undefined;
  getLoadComponent(tab: string): (() => Promise<Type<unknown>>) | undefined;
  resolveInputs(tab: string, context: WindowTabContext): Record<string, unknown>;
  shouldWrapInScrollPage(tab: string): boolean;
  mobileTabOf(tab: string): string;
  desktopTabOf(tab: string): string;
  settingsModeOf(tab: string): WindowTabSettingsMode | undefined;
}
