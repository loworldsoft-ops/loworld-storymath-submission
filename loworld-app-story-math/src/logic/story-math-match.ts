import type { MathChoice } from './story-math.model';

/** 답의 낱말을 알아듣지 못했을 때 자리로 고른다. 화면의 두 버튼에 "첫째", "둘째"가 적혀 있다. */
const ORDINALS: readonly [readonly string[], readonly string[]] = [
  ['첫째', '첫번째', '1번'],
  ['둘째', '두번째', '2번'],
];

/**
 * 들은 글에서 둘 중 어느 쪽을 말했는지 고른다.
 * 둘 다 들어 있으면 null이다(다시 묻는다). 띄어쓰기는 STT마다 달라서 지우고 본다.
 * 답의 낱말이 하나도 없으면 "첫째/둘째"를 본다(설정에서 끌 수 있다). 답의 낱말을 먼저 보는 까닭은 답이 "둘"일 때 "둘째"와 헷갈리지 않으려고다.
 */
export function matchChoice(heard: string, choices: readonly [MathChoice, MathChoice], ordinal = true): 0 | 1 | null {
  const text = heard.replace(/\s+/g, '');
  if (!text) return null;
  const pick = (words: readonly (readonly string[])[]): 0 | 1 | null => {
    const [first, second] = words.map((list) => list.some((word) => text.includes(word)));
    if (first && !second) return 0;
    if (second && !first) return 1;
    return null;
  };
  const bySays = choices.map((choice) => choice.says.some((word) => text.includes(word)));
  if (bySays[0] || bySays[1]) return pick(choices.map((choice) => choice.says));
  return ordinal ? pick(ORDINALS) : null;
}
