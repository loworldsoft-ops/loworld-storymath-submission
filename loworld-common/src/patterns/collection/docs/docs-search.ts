import { DocSearchEntry, DocSearchResult } from './docs.models';

const SNIPPET_BEFORE = 40;
const SNIPPET_AFTER = 80;

export function searchTerms(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

function snippet(text: string, term: string): string {
  const index = text.toLowerCase().indexOf(term);
  if (index < 0) return text.slice(0, SNIPPET_BEFORE + SNIPPET_AFTER);
  const start = Math.max(0, index - SNIPPET_BEFORE);
  const end = Math.min(text.length, index + term.length + SNIPPET_AFTER);
  return (start > 0 ? '…' : '') + text.slice(start, end).trim() + (end < text.length ? '…' : '');
}

/**
 * 모든 단어가 들어 있는 문서와 소제목을 찾아 점수순으로 돌려준다.
 * 제목 일치 > 소제목 일치 > 설명 일치 > 본문 일치 순으로 높게 친다.
 */
export function searchDocs(entries: readonly DocSearchEntry[], query: string, limit = 30): DocSearchResult[] {
  const terms = searchTerms(query);
  if (terms.length === 0) return [];

  const scored: { score: number; result: DocSearchResult }[] = [];
  for (const entry of entries) {
    const title = entry.title.toLowerCase();
    const desc = entry.desc.toLowerCase();
    const text = entry.text.toLowerCase();
    const everyIn = (haystack: string): boolean => terms.every((t) => haystack.includes(t));

    if (everyIn(`${title} ${desc} ${text}`)) {
      const score = (everyIn(title) ? 10 : 0) + (title.startsWith(terms[0]) ? 3 : 0) + (everyIn(desc) ? 2 : 0) + 1;
      scored.push({
        score,
        result: { id: entry.path, kind: 'page', path: entry.path, title: entry.title, sub: entry.desc || snippet(entry.text, terms[0]) },
      });
    }
    for (const [anchor, head] of entry.heads) {
      if (everyIn(head.toLowerCase())) {
        scored.push({
          score: 6,
          result: { id: `${entry.path}#${anchor}`, kind: 'heading', path: entry.path, anchor, title: head, sub: entry.title },
        });
      }
    }
  }
  // 점수가 같으면 색인 순서(목차 순서)를 유지한다.
  return scored
    .map((item, order) => ({ ...item, order }))
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map((item) => item.result);
}

export interface HighlightPart {
  readonly text: string;
  readonly hit: boolean;
}

/** 검색어와 일치하는 부분을 표시할 수 있게 텍스트를 나눈다. */
export function highlightParts(text: string, terms: readonly string[]): HighlightPart[] {
  const active = terms.filter(Boolean);
  if (active.length === 0) return [{ text, hit: false }];
  const lower = text.toLowerCase();
  const parts: HighlightPart[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    let next = -1;
    let length = 0;
    for (const term of active) {
      const index = lower.indexOf(term, cursor);
      if (index >= 0 && (next < 0 || index < next)) {
        next = index;
        length = term.length;
      }
    }
    if (next < 0) break;
    if (next > cursor) parts.push({ text: text.slice(cursor, next), hit: false });
    parts.push({ text: text.slice(next, next + length), hit: true });
    cursor = next + length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), hit: false });
  return parts;
}
