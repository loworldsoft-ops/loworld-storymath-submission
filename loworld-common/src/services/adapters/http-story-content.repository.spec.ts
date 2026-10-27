import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HttpStoryContentRepository } from './http-story-content.repository';
import { LW_CONTENT_BASE_URL, type StoryContentManifest } from '../ports/story-content.port';

describe('HttpStoryContentRepository', () => {
  let repository: HttpStoryContentRepository;
  let httpTesting: HttpTestingController;

  const mockManifest: StoryContentManifest = {
    schema: 1,
    id: 'wuxia',
    version: '0.1.0',
    title: '무협',
    packs: ['wuxia-1'],
    codex: {
      schema: 'legacy-novel-1',
      files: ['characters.json', 'monsters.json'],
    },
    assets: {
      placeholder: '_placeholder.svg',
      portraits: 'wuxia-heroes',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        HttpStoryContentRepository,
        { provide: LW_CONTENT_BASE_URL, useValue: '/content/{id}' },
      ],
    });
    repository = TestBed.inject(HttpStoryContentRepository);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('열기(open): manifest를 읽고 handle을 반환한다', async () => {
    const handlePromise = repository.open({ contentId: 'wuxia', version: '0.1.0' });

    const req = httpTesting.expectOne('/content/wuxia/0.1.0/content.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockManifest);

    const handle = await handlePromise;
    expect(handle.manifest).toEqual(mockManifest);
  });

  it('열기(open): id나 version이 다르면 에러를 던진다', async () => {
    const handlePromise = repository.open({ contentId: 'wuxia', version: '0.1.0' });

    const req = httpTesting.expectOne('/content/wuxia/0.1.0/content.json');
    req.flush({ ...mockManifest, version: '0.2.0' });

    await expect(handlePromise).rejects.toThrow(/콘텐츠가 다르다/);
  });

  it('loadPack: 등록된 팩을 요청하고 반환한다', async () => {
    const handlePromise = repository.open({ contentId: 'wuxia', version: '0.1.0' });
    httpTesting.expectOne('/content/wuxia/0.1.0/content.json').flush(mockManifest);
    const handle = await handlePromise;

    const packPromise = handle.loadPack('wuxia-1');
    const packReq = httpTesting.expectOne('/content/wuxia/0.1.0/packs/wuxia-1/pack.compiled.json');
    packReq.flush({ id: 'wuxia-1', title: '무협 1' });

    const pack = await packPromise;
    expect((pack as unknown as { id: string }).id).toBe('wuxia-1');
  });

  it('loadPack: 없는 팩은 에러를 던진다', async () => {
    const handlePromise = repository.open({ contentId: 'wuxia', version: '0.1.0' });
    httpTesting.expectOne('/content/wuxia/0.1.0/content.json').flush(mockManifest);
    const handle = await handlePromise;

    await expect(handle.loadPack('unknown-pack')).rejects.toThrow(/팩 unknown-pack가 없다/);
  });

  it('loadCodex: 등록된 도감을 요청하고 반환한다', async () => {
    const handlePromise = repository.open({ contentId: 'wuxia', version: '0.1.0' });
    httpTesting.expectOne('/content/wuxia/0.1.0/content.json').flush(mockManifest);
    const handle = await handlePromise;

    const codexPromise = handle.loadCodex('characters.json');
    const codexReq = httpTesting.expectOne('/content/wuxia/0.1.0/codex/characters.json');
    codexReq.flush({ characters: [] });

    const codex = await codexPromise;
    expect(codex).toEqual({ characters: [] });
  });

  it('loadCodex: 없는 도감은 에러를 던진다', async () => {
    const handlePromise = repository.open({ contentId: 'wuxia', version: '0.1.0' });
    httpTesting.expectOne('/content/wuxia/0.1.0/content.json').flush(mockManifest);
    const handle = await handlePromise;

    await expect(handle.loadCodex('unknown.json')).rejects.toThrow(/도감 unknown.json이 없다/);
  });

  it('assetUrl: 상대 경로를 전체 URL로 변환하고 placeholder 처리를 수행한다', async () => {
    const handlePromise = repository.open({ contentId: 'wuxia', version: '0.1.0' });
    httpTesting.expectOne('/content/wuxia/0.1.0/content.json').flush(mockManifest);
    const handle = await handlePromise;

    expect(handle.assetUrl('wuxia-heroes/hwashan_male.png')).toBe(
      '/content/wuxia/0.1.0/assets/wuxia-heroes/hwashan_male.png'
    );
    expect(handle.assetUrl('/assets/novel/item-icons/png/sword.png')).toBe(
      '/content/wuxia/0.1.0/assets/novel/item-icons/png/sword.png'
    );
    expect(handle.assetUrl('')).toBe(
      '/content/wuxia/0.1.0/assets/_placeholder.svg'
    );
  });
});
