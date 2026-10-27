import { matchChoice } from './story-math-match';
import type { MathAct, MathChoice, MathQuest, MathQuestion, MathSchool, MathUnit } from './story-math.model';

/** 막은 초1~고3, 열두 개다(사용자, 2026-10-24). 막 하나 = 학년 하나 */
export const ACT_COUNT = 12;
/** TTS가 한 번에 읽는 문단이 너무 길면 듣다가 놓친다. */
export const MAX_PARAGRAPH_LENGTH = 200;
/**
 * 이야기 전체(문단을 이은 것, 띄어쓰기 포함)의 글자 수. TTS로 1분 30초~3분이 되게 한다(WRITING-GUIDE 2.7).
 * 짧으면 다섯 장면(2.1)이 들어가지 않는다. W12에서 146편을 이 안으로 다시 썼다
 */
export const STORY_LENGTH: Readonly<Record<number, { readonly min: number; readonly max: number }>> = {
  1: { min: 400, max: 600 }, 2: { min: 450, max: 650 }, 3: { min: 500, max: 700 }, 4: { min: 550, max: 750 },
  5: { min: 600, max: 800 }, 6: { min: 600, max: 800 }, 7: { min: 600, max: 900 }, 8: { min: 600, max: 900 },
  9: { min: 600, max: 900 }, 10: { min: 700, max: 1000 }, 11: { min: 700, max: 1000 }, 12: { min: 700, max: 1000 },
};

/** 문단 수(2.7). 중·고는 이야기가 길어 문단을 늘린다. 문단 하나를 길게 하지 않는다(MAX_PARAGRAPH_LENGTH) */
export function storyParagraphs(grade: number): { readonly min: number; readonly max: number } {
  return grade >= 7 ? { min: 6, max: 9 } : { min: 5, max: 8 };
}
export const QUESTIONS_PER_QUEST = { min: 2, max: 5 } as const;
/** 귀로만 들으면 긴 문장은 놓친다. 학년마다 이야기 한 문장의 글자 수(띄어쓰기 포함) 한도다(WRITING-GUIDE 2.4). 7~9는 중1~중3, 10~12는 고1~고3 */
export const MAX_SENTENCE_LENGTH: Readonly<Record<number, number>> = { 1: 45, 2: 50, 3: 60, 4: 60, 5: 70, 6: 70, 7: 75, 8: 75, 9: 75, 10: 80, 11: 80, 12: 80 };
/**
 * TTS가 이상하게 읽는 숫자와 기호. 엔진마다 로마자와 그리스 글자를 다르게 읽어서(엑스, 곱하기, 안 읽음) 이것도 막는다.
 * 글에는 말로 풀어 쓰고("엑스", "루트 이"), 숫자와 로마자는 says에만 넣는다(WRITING-GUIDE 3.5).
 */
const UNSPOKEN = /[0-9A-Za-zΑ-Ωα-ω+=×÷%½°−√²³π∑∫∞≤≥<>^\/]/;
/** 차 안에서는 화면을 보지 않는다(WRITING-GUIDE 0.4). */
const SCREEN_WORDS = ['그림을 보', '화면을 보', '다음 중', '보기에서'];
/** 앱이 풀이 앞에 붙여 읽는 말이다(WRITING-GUIDE 3.4). */
const FEEDBACK_WORDS = ['맞았어요', '아니에요'];

/** 막 번호로 학교를 정한다. 목차에 따로 적지 않는다(두 곳에 적으면 어긋난다) */
export const MATH_SCHOOLS: readonly { readonly key: MathSchool; readonly label: string; readonly lastAct: number }[] = [
  { key: 'elementary', label: '초등학교', lastAct: 6 },
  { key: 'middle', label: '중학교', lastAct: 9 },
  { key: 'high', label: '고등학교', lastAct: 12 },
];

/** n막의 학교. 1~6 초등학교, 7~9 중학교, 10~12 고등학교 */
export function schoolOf(actNo: number): MathSchool {
  return (MATH_SCHOOLS.find((s) => actNo <= s.lastAct) ?? MATH_SCHOOLS[MATH_SCHOOLS.length - 1]).key;
}

/** 학년은 1~12다. 정렬하면 g10이 g2 앞에 오므로 순서는 늘 목차의 배열이 정한다 */
const UNIT_ID = /^g([1-9]|1[0-2])-([12])-(\d{2})$/;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isTextList = (v: unknown): v is string[] => Array.isArray(v) && v.length > 0 && v.every(isText);
/** 마침표, 물음표, 느낌표 뒤에서 문장을 나눈다. 말줄임표(…)에서는 나누지 않는다. */
const sentences = (text: string): string[] => text.split(/(?<=[.?!])\s+/).filter((t) => t.trim().length > 0);

/** 읽어 주는 글에 숫자·기호와 화면 이야기가 없는지 본다. */
function checkSpoken(text: string, at: string, errors: string[]): void {
  const symbol = UNSPOKEN.exec(text);
  if (symbol) errors.push(`${at}: "${symbol[0]}"를 TTS가 읽지 못한다. 말로 풀어 쓴다`);
  const screen = SCREEN_WORDS.find((w) => text.includes(w));
  if (screen) errors.push(`${at}: "${screen}" — 듣는 사람은 화면을 보지 않는다`);
}

/**
 * 목차와 퀘스트 파일을 검사한다. 틀린 곳을 모두 글로 돌려준다(빈 목록이면 통과).
 * 자료는 사람(과 Claude)이 손으로 쓰는 JSON이라 타입이 지켜 주지 못한다. 그래서 읽기 전에 여기서 막는다.
 */
export function checkContent(curriculum: unknown, quests: readonly unknown[]): string[] {
  const errors: string[] = [];
  const units = checkCurriculum(curriculum, errors);
  const seen = new Set<string>();
  quests.forEach((quest, index) => {
    const where = isObj(quest) && isText(quest['id']) ? quest['id'] : `퀘스트 ${index + 1}번째`;
    if (isObj(quest) && isText(quest['id'])) {
      if (seen.has(quest['id'])) errors.push(`${where}: 같은 id의 퀘스트가 둘이다`);
      seen.add(quest['id']);
      if (!units.has(quest['id'])) errors.push(`${where}: 목차에 이 id의 단원이 없다`);
    }
    checkQuest(quest, where, errors);
  });
  return errors;
}

function checkCurriculum(curriculum: unknown, errors: string[]): Set<string> {
  const ids = new Set<string>();
  if (!isObj(curriculum) || !Array.isArray(curriculum['acts'])) {
    errors.push('목차: acts 목록이 없다');
    return ids;
  }
  const acts = curriculum['acts'];
  if (acts.length !== ACT_COUNT) errors.push(`목차: 막이 ${ACT_COUNT}개가 아니라 ${acts.length}개다`);
  acts.forEach((act: unknown, index: number) => {
    const where = `목차 ${index + 1}막`;
    if (!isObj(act)) {
      errors.push(`${where}: 객체가 아니다`);
      return;
    }
    if (act['id'] !== `act-${index + 1}`) errors.push(`${where}: id는 act-${index + 1}이어야 한다`);
    if (!isText(act['title']) || !isText(act['grade'])) errors.push(`${where}: title과 grade가 있어야 한다`);
    if (!Array.isArray(act['units'])) {
      errors.push(`${where}: units 목록이 없다`);
      return;
    }
    act['units'].forEach((unit: unknown) => {
      if (!isObj(unit) || !isText(unit['id']) || !isText(unit['name'])) {
        errors.push(`${where}: 단원에 id와 name이 있어야 한다`);
        return;
      }
      const id = unit['id'];
      const m = UNIT_ID.exec(id);
      if (!m) errors.push(`${id}: 단원 id는 g<학년>-<학기>-<두 자리 순서> 꼴이어야 한다`);
      else {
        if (Number(m[1]) !== index + 1) errors.push(`${id}: ${index + 1}막에 있는데 학년이 ${m[1]}이다`);
        if (Number(m[2]) !== unit['semester']) errors.push(`${id}: semester가 id의 학기(${m[2]})와 다르다`);
      }
      // 고등학교는 학기 대신 과목으로 나뉜다. 막 화면이 과목 이름을 학기 이름 대신 쓴다.
      const high = schoolOf(index + 1) === 'high';
      if (high && !isText(unit['course'])) errors.push(`${id}: 고등학교 단원에는 course(과목)가 있어야 한다`);
      if (!high && unit['course'] !== undefined) errors.push(`${id}: course는 고등학교(10~12막) 단원에만 둔다`);
      if (ids.has(id)) errors.push(`${id}: 목차에 같은 id가 둘이다`);
      ids.add(id);
    });
  });
  return ids;
}

function checkQuest(quest: unknown, where: string, errors: string[]): void {
  if (!isObj(quest)) {
    errors.push(`${where}: 객체가 아니다`);
    return;
  }
  if (!isText(quest['title'])) errors.push(`${where}: title이 없다`);
  if (quest['kind'] !== 'birth' && quest['kind'] !== 'principle') errors.push(`${where}: kind는 birth나 principle이다`);
  if (quest['status'] !== 'draft' && quest['status'] !== 'ready') errors.push(`${where}: status는 draft나 ready다`);
  if (quest['kind'] === 'birth' && quest['status'] === 'ready' && !isText(quest['source'])) {
    errors.push(`${where}: 승인(ready)된 탄생 비화에는 source(무엇이 실제이고 어디서 왔나)가 있어야 한다`);
  }
  const grade = isText(quest['id']) ? Number(UNIT_ID.exec(quest['id'])?.[1]) : NaN;
  const maxSentence = MAX_SENTENCE_LENGTH[grade];
  const story = quest['story'];
  if (!isTextList(story)) errors.push(`${where}: story는 빈 글이 없는 문단 목록이다`);
  else {
    const paragraphs = storyParagraphs(grade);
    if (story.length < paragraphs.min || story.length > paragraphs.max) {
      errors.push(`${where}: 문단이 ${paragraphs.min}~${paragraphs.max}개가 아니라 ${story.length}개다`);
    }
    const length = STORY_LENGTH[grade];
    const total = story.join('').length;
    if (length && (total < length.min || total > length.max)) {
      errors.push(`${where}: 이야기가 ${total}자다(${grade}막은 ${length.min}~${length.max}자)`);
    }
    story.forEach((p, i) => {
      const at = `${where} ${i + 1}번째 문단`;
      if (p.length > MAX_PARAGRAPH_LENGTH) errors.push(`${at}이 ${p.length}자다(${MAX_PARAGRAPH_LENGTH}자까지)`);
      if (maxSentence) {
        sentences(p)
          .filter((t) => t.length > maxSentence)
          .forEach((t) => errors.push(`${at}: 문장이 ${t.length}자다(${grade}학년은 ${maxSentence}자까지). 나눈다: ${t}`));
      }
      checkSpoken(p, at, errors);
    });
  }
  const questions = quest['questions'];
  if (!Array.isArray(questions)) {
    errors.push(`${where}: questions 목록이 없다`);
    return;
  }
  if (questions.length < QUESTIONS_PER_QUEST.min || questions.length > QUESTIONS_PER_QUEST.max) {
    errors.push(`${where}: 문제가 ${QUESTIONS_PER_QUEST.min}~${QUESTIONS_PER_QUEST.max}개가 아니라 ${questions.length}개다`);
  }
  const qids = new Set<string>();
  questions.forEach((q: unknown, i: number) => {
    const at = `${where} 문제 ${i + 1}`;
    if (!isObj(q)) {
      errors.push(`${at}: 객체가 아니다`);
      return;
    }
    if (!isText(q['id'])) errors.push(`${at}: id가 없다`);
    else if (qids.has(q['id'])) errors.push(`${at}: 같은 id(${q['id']})가 둘이다`);
    else qids.add(q['id']);
    if (!isText(q['prompt'])) errors.push(`${at}: prompt가 없다`);
    else checkSpoken(q['prompt'], `${at} 물음`, errors);
    if (!isText(q['explain'])) errors.push(`${at}: explain이 없다`);
    else {
      checkSpoken(q['explain'], `${at} 풀이`, errors);
      const said = FEEDBACK_WORDS.find((w) => (q['explain'] as string).trim().startsWith(w));
      if (said) errors.push(`${at} 풀이: "${said}"는 앱이 앞에 붙여 읽는다. 다시 쓰지 않는다`);
    }
    if (q['answer'] !== 0 && q['answer'] !== 1) errors.push(`${at}: answer는 0이나 1이다`);
    const choices = q['choices'];
    if (!Array.isArray(choices) || choices.length !== 2) {
      errors.push(`${at}: choices는 꼭 두 개다`);
      return;
    }
    const ok = choices.every((c: unknown) => isObj(c) && isText(c['label']) && isTextList(c['says']));
    if (!ok) {
      errors.push(`${at}: 고르기마다 label과 says(빈 글 없는 목록)가 있어야 한다`);
      return;
    }
    // 고르기의 이름을 그대로 말했을 때 그쪽으로 알아들어야 한다. 아니면 says가 겹친 것이다(예: '같'과 '같지 않아').
    const pair = choices as unknown as readonly [MathChoice, MathChoice];
    pair.forEach((c, ci) => {
      if (matchChoice(c.label, pair) !== ci) errors.push(`${at}: "${c.label}"이라고 말하면 알아듣지 못한다. says가 서로 겹치지 않게 한다`);
      // 들은 글은 띄어쓰기를 지우고 본다. 띄어쓰기가 든 낱말은 끝내 맞지 않는다.
      if (c.says.some((w) => /\s/.test(w))) errors.push(`${at}: "${c.label}"의 says에 띄어쓰기가 있다. 지운다`);
      checkSpoken(c.label, `${at} 고르기 "${c.label}"`, errors);
      // "첫째", "둘째"는 앱이 자리 이름으로 알아듣는다(story-math-match).
      if (/첫째|둘째/.test(c.label)) errors.push(`${at}: 고르기 이름에 "첫째", "둘째"를 쓰지 않는다`);
    });
  });
  // 답이 늘 같은 자리면 아이가 듣지 않고 자리로 답한다.
  const answers = questions.filter(isObj).map((q) => q['answer']);
  if (answers.length >= 2 && answers.every((a) => a === answers[0]) && (answers[0] === 0 || answers[0] === 1)) {
    errors.push(`${where}: 답이 모두 ${answers[0] === 0 ? '첫째' : '둘째'}다. 답의 자리를 섞는다`);
  }
}

/**
 * 검사를 통과한 자료로 막을 만든다. 통과하지 못하면 틀린 곳을 모두 담아 던진다.
 * 퀘스트는 목차의 단원 순서로 놓고, 단원 이름을 topic으로 채운다.
 */
export function buildActs(curriculum: unknown, quests: readonly unknown[]): MathAct[] {
  const errors = checkContent(curriculum, quests);
  if (errors.length) throw new Error(`스토리매스 자료가 틀렸다:\n${errors.join('\n')}`);
  const byId = new Map((quests as readonly Obj[]).map((q) => [q['id'] as string, q]));
  const acts = (curriculum as { acts: { id: string; title: string; grade: string; units: MathUnit[] }[] }).acts;
  return acts.map((act, index) => ({
    id: act.id,
    title: act.title,
    grade: act.grade,
    school: schoolOf(index + 1),
    units: act.units,
    quests: act.units.flatMap((unit) => {
      const raw = byId.get(unit.id);
      if (!raw) return [];
      const quest: MathQuest = {
        id: unit.id,
        title: raw['title'] as string,
        topic: unit.name,
        kind: raw['kind'] as MathQuest['kind'],
        status: raw['status'] as MathQuest['status'],
        story: raw['story'] as string[],
        questions: raw['questions'] as MathQuestion[],
      };
      return [quest];
    }),
  }));
}
