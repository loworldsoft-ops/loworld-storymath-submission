import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { DocsUrlAdapter } from './docs-navigation';

export interface DocsUrlParams {
  /** 현재 문서 경로를 담는 쿼리 이름 */
  readonly doc: string;
  /** 제목 위치를 담는 쿼리 이름 */
  readonly anchor: string;
  /** 이 경로는 주소에 남기지 않는다. */
  readonly defaultPath: string;
}

/** 현재 문서와 제목 위치를 쿼리스트링에 남긴다. 창마다 쿼리 이름을 달리해 서로 덮어쓰지 않게 한다. */
export function injectDocsUrlAdapter(params: DocsUrlParams): DocsUrlAdapter {
  const router = inject(Router);
  return {
    read() {
      const query = router.parseUrl(router.url).queryParams;
      const doc = query[params.doc];
      if (typeof doc !== 'string' || !doc.startsWith('/')) return null;
      const anchor = query[params.anchor];
      return { path: doc, anchor: typeof anchor === 'string' ? anchor : undefined };
    },
    write(target) {
      void router.navigate([], {
        queryParams: { [params.doc]: target.path === params.defaultPath ? null : target.path, [params.anchor]: target.anchor || null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    },
  };
}
