import { InjectionToken } from '@angular/core';
import type { StoryPack } from '../narrative/narrative.model';

export interface StoryContentRef {
  readonly contentId: string;
  readonly version: string;
}

/** 콘텐츠 저장소의 `content.json`. 공통은 작품을 모르고 이 모양만 안다. */
export interface StoryContentManifest {
  readonly schema: number;
  readonly id: string;
  readonly version: string;
  readonly title: string;
  readonly packs: readonly string[];
  readonly codex: { readonly schema: string; readonly files: readonly string[] };
  readonly assets: Readonly<Record<string, string>>;
}

/** 연 콘텐츠 하나. 무엇을 언제 내려받을지는 쓰는 쪽이 정한다(도감은 메뉴를 열 때만 받는 식). */
export interface StoryContentHandle {
  readonly manifest: StoryContentManifest;
  loadPack(packId: string): Promise<StoryPack>;
  /** `codex.files`의 이름 하나. 모양은 `codex.schema`가 정한다. 지금은 novel의 모양 그대로라 unknown으로 준다 */
  loadCodex(file: string): Promise<unknown>;
  /**
   * `assets/` 아래의 경로를 실제 주소로 바꾼다. 예: assetUrl('wuxia-heroes/hwashan_male.png')
   * 도감 자료의 옛 경로('/assets/novel/…')를 그대로 넘겨도 된다. 앞의 '/assets/'를 떼고 붙인다. 빈 경로면 자리 표시 그림을 준다.
   */
  assetUrl(path: string): string;
}

export interface StoryContentPort {
  open(ref: StoryContentRef): Promise<StoryContentHandle>;
}

export const STORY_CONTENT_PORT = new InjectionToken<StoryContentPort>('STORY_CONTENT_PORT');

/**
 * 콘텐츠의 기준 주소. `{id}` 자리에 콘텐츠 id가 들어간다.
 * 개발: '/content/{id}' (prepare.mjs가 옆의 콘텐츠 저장소 dist를 잇는다), 출시: 'https://loworld-content-{id}.pages.dev'
 */
export const LW_CONTENT_BASE_URL = new InjectionToken<string>('LW_CONTENT_BASE_URL', { factory: () => '/content/{id}' });
