import { ChangeDetectionStrategy, Component, computed, inject, input, signal, effect } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { resolveStoryItemIconMediaUrl, isStoryItemIconRaster } from '../../../services/models/story-item-icon.utils';
import { resolveStorySkillIconMediaUrl, isStorySkillIconRaster } from '../../../services/models/story-skill-icon.utils';
import { resolveStoryMonsterIconMediaUrl, isStoryMonsterIconRaster } from '../../../services/models/story-monster-icon.utils';
import { resolveStoryPartyIconMediaUrl, isStoryPartyIconRaster } from '../../../services/models/story-party-icon.utils';
import { getSystemIconPath, SYSTEM_ICON_PATHS } from './icon.registry';

@Component({
  selector: 'lw-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
  host: {
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[attr.aria-hidden]': 'decorative()',
  },
})
export class LwIconComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly name = input.required<string>();
  readonly size = input(20);
  readonly decorative = input(true);
  readonly label = input('');

  /**
   * 렌더링 모드 (SVG 전용 — raster PNG는 항상 `<img>` full-color):
   * - 'mask': CSS mask-image (단색 실루엣, 테마 색상 호환, 기본값)
   * - 'rich': 인라인 SVG 주입 (opacity/fill 레이어 보존, 시각적 깊이)
   */
  readonly renderMode = input<'mask' | 'rich'>('mask');

  // ── 네임스페이스 파싱 ──
  protected readonly parsedName = computed(() => {
    const raw = this.name();
    if (!raw) {
      return { namespace: 'system', key: '' };
    }
    if (raw.includes(':')) {
      const [namespace, key] = raw.split(':');
      return { namespace, key };
    }
    if (raw.startsWith('party-') || raw.startsWith('story-party-') || raw.startsWith('novel-party-')) {
      const key = raw.replace(new RegExp('^novel-party-'), 'party-').replace(new RegExp('^story-party-'), 'party-');
      return { namespace: 'story-party', key };
    }
    if (raw.startsWith('monster-') || raw.startsWith('story-monster-') || raw.startsWith('novel-monster-')) {
      const key = raw.replace(new RegExp('^novel-monster-'), 'monster-').replace(new RegExp('^story-monster-'), 'monster-');
      return { namespace: 'story-monster', key };
    }
    if (
      raw.startsWith('item-') ||
      raw.startsWith('weapon-') ||
      raw.startsWith('armor-') ||
      raw.startsWith('shield-') ||
      raw.startsWith('potion-') ||
      raw.startsWith('ring-') ||
      raw.startsWith('amulet-') ||
      raw.startsWith('rune-')
    ) {
      return { namespace: 'story-item', key: raw };
    }
    if (raw.startsWith('skill-') || raw.startsWith('story-skill-') || raw.startsWith('novel-skill-')) {
      const key = raw.replace(new RegExp('^novel-skill-'), 'skill-').replace(new RegExp('^story-skill-'), 'skill-');
      return { namespace: 'story-skill', key };
    }
    return { namespace: 'system', key: raw };
  });

  // ── 동적 에셋 여부 (system이 아닐 경우) ──
  protected readonly isDynamic = computed(() => {
    const { namespace } = this.parsedName();
    return namespace !== 'system';
  });

  // ── 물리적 동적 미디어 파일 경로 ──
  protected readonly mediaUrl = computed(() => {
    const { namespace, key } = this.parsedName();
    const category = key.split('-')[0];

    if (namespace === 'story-item' || namespace === 'novel') {
      return resolveStoryItemIconMediaUrl(key);
    }
    if (namespace === 'story-skill' || namespace === 'novel-skill') {
      return resolveStorySkillIconMediaUrl(key);
    }
    if (namespace === 'story-monster' || namespace === 'novel-monster') {
      return resolveStoryMonsterIconMediaUrl(key);
    }
    if (namespace === 'story-party' || namespace === 'novel-party') {
      return resolveStoryPartyIconMediaUrl(key);
    }
    if (namespace === 'eznote') {
      return `/assets/shared-icons/eznote/png/eznote/${key}.png`;
    }
    if (namespace === 'ezcalendar') {
      return `/assets/shared-icons/ezcalendar/png/ezcalendar/${key}.png`;
    }
    return `/assets/shared-icons/${namespace}/${category}/${key}.png`;
  });

  /** @deprecated Use mediaUrl — alias for templates still referencing svgUrl. */
  protected readonly svgUrl = this.mediaUrl;

  protected readonly isRaster = computed(() => {
    const url = this.mediaUrl();
    if (url && (/\.(png|webp|jpg|jpeg|gif)(\?.*)?$/i.test(url) || url.includes('/png/'))) {
      return true;
    }
    const { namespace, key } = this.parsedName();
    if (namespace === 'story-skill' || namespace === 'novel-skill') {
      return isStorySkillIconRaster(key);
    }
    if (namespace === 'story-monster' || namespace === 'novel-monster') {
      return isStoryMonsterIconRaster(key);
    }
    if (namespace === 'story-party' || namespace === 'novel-party') {
      return isStoryPartyIconRaster(key);
    }
    return (namespace === 'story-item' || namespace === 'novel') && isStoryItemIconRaster(key);
  });

  protected readonly inlineIconKey = computed(() => this.parsedName().key);

  /** 시스템 벡터 SVG 패스 바이패스 (검증된 레지스트리에서만 추출) */
  protected readonly systemIconSvg = computed<SafeHtml>(() => {
    const key = this.inlineIconKey();
    const path = getSystemIconPath(key);
    return this.sanitizer.bypassSecurityTrustHtml(path);
  });

  protected readonly hasError = signal(false);

  protected readonly fallbackText = computed(() => {
    const { namespace, key } = this.parsedName();
    const cleanKey = key.replace(/^(party-|monster-|skill-|item-)/, '');
    const parts = cleanKey.split(/[\s_\-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return cleanKey.slice(0, 2).toUpperCase();
  });

  constructor() {
    effect(() => {
      this.mediaUrl();
      this.hasError.set(false);
    });
  }

  protected handleImageError(event: Event): void {
    this.hasError.set(true);
  }
}
