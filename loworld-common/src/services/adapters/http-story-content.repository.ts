import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { StoryPack } from '../narrative/narrative.model';
import { LW_CONTENT_BASE_URL, type StoryContentHandle, type StoryContentManifest, type StoryContentPort, type StoryContentRef } from '../ports/story-content.port';

/** 콘텐츠를 HTTP로 받는다. 로컬 개발 폴더와 CDN이 같은 모양이라 주소만 다르다. */
@Injectable()
export class HttpStoryContentRepository implements StoryContentPort {
  private readonly http = inject(HttpClient);
  private readonly baseTemplate = inject(LW_CONTENT_BASE_URL);

  async open(ref: StoryContentRef): Promise<StoryContentHandle> {
    const root = `${this.baseTemplate.replace('{id}', ref.contentId)}/${ref.version}`;
    const get = <T>(path: string) => firstValueFrom(this.http.get<T>(`${root}/${path}`));
    const manifest = await get<StoryContentManifest>('content.json');
    if (manifest.id !== ref.contentId || manifest.version !== ref.version) {
      throw new Error(`콘텐츠가 다르다: ${ref.contentId}@${ref.version}를 열었는데 ${manifest.id}@${manifest.version}가 왔다`);
    }
    return {
      manifest,
      loadPack: (packId) => {
        if (!manifest.packs.includes(packId)) return Promise.reject(new Error(`${manifest.id}@${manifest.version}에 팩 ${packId}가 없다`));
        return get<StoryPack>(`packs/${packId}/pack.compiled.json`);
      },
      loadCodex: (file) => {
        if (!manifest.codex.files.includes(file)) return Promise.reject(new Error(`${manifest.id}@${manifest.version}에 도감 ${file}이 없다`));
        return get<unknown>(`codex/${file}`);
      },
      assetUrl: (path) => `${root}/assets/${(path || manifest.assets['placeholder'] || '').replace(/^\/?assets\//, '')}`,
    };
  }
}
