import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { LwThemeStore } from './lw-theme.store';

export function provideLwTheme(): EnvironmentProviders {
  return makeEnvironmentProviders([LwThemeStore]);
}
