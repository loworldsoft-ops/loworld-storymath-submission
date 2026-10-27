/** PII 정규식 매칭 순수 함수. UI 의존성이 없다. */

export interface PiiRule {
  readonly name: string;
  readonly regex: string;
}

export interface PiiSegment {
  readonly text: string;
  /** 매칭된 규칙 이름. 일반 텍스트면 null */
  readonly rule: string | null;
}

interface Match {
  readonly start: number;
  readonly end: number;
  readonly rule: string;
}

export function isValidRegex(source: string): boolean {
  if (!source.trim()) return false;
  try {
    new RegExp(source);
    return true;
  } catch {
    return false;
  }
}

function collectMatches(text: string, rules: readonly PiiRule[]): Match[] {
  const matches: Match[] = [];
  for (const rule of rules) {
    let re: RegExp;
    try {
      re = new RegExp(rule.regex, 'g');
    } catch {
      continue;
    }
    for (const m of text.matchAll(re)) {
      if (m[0].length > 0 && m.index !== undefined) {
        matches.push({ start: m.index, end: m.index + m[0].length, rule: rule.name });
      }
    }
  }
  // 앞에서부터, 겹치면 먼저 시작한 것만 남긴다.
  matches.sort((a, b) => a.start - b.start || b.end - a.end);
  const result: Match[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start >= cursor) {
      result.push(m);
      cursor = m.end;
    }
  }
  return result;
}

/** 텍스트를 일반 구간과 매칭 구간으로 나눈다. */
export function segmentText(text: string, rules: readonly PiiRule[]): PiiSegment[] {
  const segments: PiiSegment[] = [];
  let cursor = 0;
  for (const m of collectMatches(text, rules)) {
    if (m.start > cursor) segments.push({ text: text.slice(cursor, m.start), rule: null });
    segments.push({ text: text.slice(m.start, m.end), rule: m.rule });
    cursor = m.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), rule: null });
  return segments;
}

export function maskSegments(segments: readonly PiiSegment[]): string {
  return segments.map((s) => (s.rule ? '*'.repeat(s.text.length) : s.text)).join('');
}

export function countByRule(segments: readonly PiiSegment[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const s of segments) {
    if (s.rule) counts.set(s.rule, (counts.get(s.rule) ?? 0) + 1);
  }
  return [...counts].map(([name, count]) => ({ name, count }));
}
