import { LwPromptDiffSegment } from './prompt.models';

/** 공백 단위 토큰을 LCS로 비교한다. 같은 종류의 연속 토큰은 한 구간으로 합친다. */
export function diffWords(oldText: string, newText: string): LwPromptDiffSegment[] {
  const a = oldText ? oldText.split(/(\s+)/) : [];
  const b = newText ? newText.split(/(\s+)/) : [];
  const rows = a.length + 1;
  const cols = b.length + 1;
  const lcs = new Uint32Array(rows * cols);

  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i * cols + j] = a[i] === b[j] ? lcs[(i + 1) * cols + j + 1] + 1 : Math.max(lcs[(i + 1) * cols + j], lcs[i * cols + j + 1]);
    }
  }

  const segments: LwPromptDiffSegment[] = [];
  const push = (type: LwPromptDiffSegment['type'], text: string): void => {
    const last = segments[segments.length - 1];
    if (last && last.type === type) {
      segments[segments.length - 1] = { type, text: last.text + text };
    } else {
      segments.push({ type, text });
    }
  };

  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push('equal', a[i]);
      i++;
      j++;
    } else if (lcs[(i + 1) * cols + j] >= lcs[i * cols + j + 1]) {
      push('removed', a[i++]);
    } else {
      push('added', b[j++]);
    }
  }
  while (i < a.length) push('removed', a[i++]);
  while (j < b.length) push('added', b[j++]);
  return segments;
}
