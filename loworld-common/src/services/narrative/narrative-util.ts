/** 글에서 늘 같은 수를 낸다. 난수 대신 쓴다. */
export function stableHash(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** 씨앗에서 0 이상 1 미만의 수를 차례로 낸다(mulberry32). */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `items`를 씨앗에 따라 정해진 순서로 늘어놓는다. */
export function stableOrder<T>(items: readonly T[], seed: string, keyOf: (item: T) => string): T[] {
  return [...items].sort((a, b) => {
    const diff = stableHash(`${seed}:${keyOf(a)}`) - stableHash(`${seed}:${keyOf(b)}`);
    return diff !== 0 ? diff : keyOf(a).localeCompare(keyOf(b));
  });
}

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

/** 낱말의 마지막 글자에 받침이 있는가. 한글이 아니면 null. */
export function hasFinalConsonant(word: string): boolean | null {
  const trimmed = word.trim();
  if (!trimmed) return null;
  const last = trimmed.charCodeAt(trimmed.length - 1);
  if (last >= HANGUL_START && last <= HANGUL_END) {
    return (last - HANGUL_START) % 28 !== 0;
  }
  if (/[0-9]$/.test(trimmed)) return /[013678]$/.test(trimmed);
  return null;
}

/**
 * 낱말에 맞는 조사를 붙인다. `pair`는 `을/를`처럼 받침이 있을 때/없을 때의 꼴이다.
 * `으로/로`는 ㄹ 받침을 받침 없는 것으로 본다.
 */
export function withJosa(word: string, pair: string): string {
  const [withFinal, withoutFinal] = pair.split('/');
  if (withoutFinal === undefined) return `${word}${pair}`;
  const final = hasFinalConsonant(word);
  if (final === null) return `${word}${withFinal}(${withoutFinal})`;
  if (withFinal === '으로' && final) {
    const last = word.trim().charCodeAt(word.trim().length - 1);
    const isRieul = last >= HANGUL_START && last <= HANGUL_END && (last - HANGUL_START) % 28 === 8;
    return `${word}${isRieul ? withoutFinal : withFinal}`;
  }
  return `${word}${final ? withFinal : withoutFinal}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
