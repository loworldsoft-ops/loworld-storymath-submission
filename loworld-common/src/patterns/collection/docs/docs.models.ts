/** 문서 뷰어(가이드) 공용 모델. */

export interface DocNavIndex {
  readonly url: string;
  readonly name: string;
  readonly desc?: string;
}

export interface DocNavNode {
  readonly type: 'root' | 'folder' | 'page';
  readonly name: string;
  readonly url?: string;
  readonly desc?: string;
  /** 폴더 이름을 눌렀을 때 여는 색인 문서 */
  readonly index?: DocNavIndex;
  readonly children?: readonly DocNavNode[];
}

export interface DocTocItem {
  readonly id: string;
  readonly depth: number;
  readonly text: string;
}

export interface DocArticle {
  readonly path: string;
  readonly title: string;
  readonly desc?: string;
  readonly toc: readonly DocTocItem[];
  readonly html: string;
}

export interface DocPagerItem {
  readonly path: string;
  readonly label: string;
}

export interface DocPager {
  readonly prev?: DocPagerItem;
  readonly next?: DocPagerItem;
}

/** 검색 색인 한 건: 문서 하나 */
export interface DocSearchEntry {
  readonly path: string;
  readonly title: string;
  readonly desc: string;
  /** [앵커 id, 소제목] */
  readonly heads: readonly (readonly [string, string])[];
  readonly text: string;
}

export interface DocSearchResult {
  readonly id: string;
  readonly kind: 'page' | 'heading';
  readonly path: string;
  /** 소제목 결과면 이동할 앵커 */
  readonly anchor?: string;
  readonly title: string;
  readonly sub: string;
}

export interface DocLinkTarget {
  readonly path: string;
  readonly anchor?: string;
}

export interface DocPdfItem {
  readonly key: string;
  readonly label: string;
  /** 같은 그룹끼리 묶어 보여 준다 */
  readonly group?: string;
}

export interface DocPdfRequest {
  readonly keys: readonly string[];
  readonly merge: boolean;
}
