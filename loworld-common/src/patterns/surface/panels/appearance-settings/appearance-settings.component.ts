import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { LW_SKIN_OPTIONS, type LwAppearance, type LwDensity, type LwMotion, type LwScheme, type LwSkin } from '../../../../services/theme/lw-appearance.model';
import { LwThemeStore } from '../../../../services/theme/lw-theme.store';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';

interface Choice<T extends string> {
  readonly value: T;
  readonly label: string;
}

let nextId = 0;

/**
 * 모양 설정 패널. `LwAppearance`의 항목과 일대일로 맞는다.
 * 고르면 바로 `LwThemeStore`에 반영되고, 화면 전체가 따라 바뀐다.
 */
@Component({
  selector: 'lw-appearance-settings',
  standalone: true,
  imports: [LwButtonComponent],
  templateUrl: './appearance-settings.component.html',
  styleUrl: './appearance-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwAppearanceSettingsComponent {
  private readonly store = inject(LwThemeStore);

  /** 설정이 바뀔 때마다 바뀐 뒤의 값을 알린다. */
  readonly appearanceChange = output<LwAppearance>();

  protected readonly uid = `lw-appearance-${nextId++}`;
  protected readonly appearance = this.store.appearance;
  protected readonly resolved = this.store.resolved;
  protected readonly skins = LW_SKIN_OPTIONS;

  protected readonly schemes: readonly Choice<LwScheme>[] = [
    { value: 'system', label: '시스템' },
    { value: 'light', label: '라이트' },
    { value: 'dark', label: '다크' },
  ];
  protected readonly densities: readonly Choice<LwDensity>[] = [
    { value: 'comfortable', label: '넉넉하게' },
    { value: 'compact', label: '촘촘하게' },
  ];
  protected readonly motions: readonly Choice<LwMotion>[] = [
    { value: 'system', label: '시스템' },
    { value: 'full', label: '켬' },
    { value: 'reduced', label: '줄임' },
  ];

  /** 지금 스킨이 한 가지 화면 모드만 지원하면 그 사실을 알린다. */
  protected readonly schemeNote = computed<string | null>(() => {
    const option = this.skins.find((s) => s.id === this.appearance().skin);
    if (!option || option.schemes.length !== 1) return null;
    return `'${option.name}' 스킨은 ${option.schemes[0] === 'dark' ? '다크' : '라이트'} 모드로만 표시됩니다.`;
  });

  protected readonly isDefault = computed(() => {
    const a = this.appearance();
    return a.scheme === 'system' && a.skin === 'plain' && a.density === 'comfortable' && a.motion === 'system';
  });

  protected setScheme(scheme: LwScheme): void {
    this.apply({ scheme });
  }

  protected setSkin(skin: LwSkin): void {
    this.apply({ skin });
  }

  protected setDensity(density: LwDensity): void {
    this.apply({ density });
  }

  protected setMotion(motion: LwMotion): void {
    this.apply({ motion });
  }

  protected reset(): void {
    this.store.reset();
    this.appearanceChange.emit(this.store.appearance());
  }

  private apply(patch: Partial<Omit<LwAppearance, 'v'>>): void {
    this.store.set(patch);
    this.appearanceChange.emit(this.store.appearance());
  }
}
