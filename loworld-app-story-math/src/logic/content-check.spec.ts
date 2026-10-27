import { describe, expect, it } from 'vitest';
import curriculum from '../data/curriculum.json';
import { QUEST_FILES } from '../data/quests';
import { STORY_LENGTH, buildActs, checkContent } from './content-check';

/**
 * 규칙을 시험하는 퀘스트. 진짜 자료는 사용자와 작가가 계속 고치므로, 규칙의 시험은 진짜 자료에 기대지 않는다.
 * 목차의 첫 단원(g1-1-01)을 쓴다.
 */
/** 그 막의 길이(STORY_LENGTH)와 문단 수에 드는 이야기. 1막은 문단 일곱 개 420자, 7막부터는 일곱 개 847자 */
const storyFor = (grade: number): string[] => {
  const p = '양이 나갈 때마다 돌을 하나씩 넣어요. 양이 들어오면 돌을 하나씩 꺼내요. 돌이 남으면 양이 덜 온 거예요.';
  return Array(7).fill(grade >= 7 ? `${p} ${p}` : p);
};

const sample = (): Record<string, any> => ({
  id: 'g1-1-01',
  title: '시험용 퀘스트',
  kind: 'birth',
  status: 'draft',
  source: '',
  story: storyFor(1),
  questions: [
    {
      id: 'q1',
      prompt: '같을까요, 다를까요?',
      choices: [
        { label: '같아요', says: ['같'] },
        { label: '달라요', says: ['달라', '다르'] },
      ],
      answer: 0,
      explain: '같아요.',
    },
    {
      id: 'q2',
      prompt: '양일까요, 돌일까요?',
      choices: [
        { label: '양', says: ['양'] },
        { label: '돌', says: ['돌'] },
      ],
      answer: 1,
      explain: '돌이에요.',
    },
  ],
});

describe('스토리매스 자료', () => {
  it('지금 저장소의 자료는 틀린 곳이 없다', () => {
    expect(checkContent(curriculum, QUEST_FILES)).toEqual([]);
  });

  it('퀘스트는 목차의 단원 순서로 놓이고 단원 이름을 topic으로 갖는다', () => {
    const acts = buildActs(curriculum, QUEST_FILES);
    expect(acts).toHaveLength(12);
    expect(acts[0].quests[0].id).toBe('g1-1-01');
    expect(acts[0].quests[0].topic).toBe('9까지의 수');
  });

  it('시험용 퀘스트는 통과한다', () => {
    expect(checkContent(curriculum, [sample()])).toEqual([]);
  });

  it('목차에 없는 단원의 퀘스트를 막는다', () => {
    const quest = sample();
    quest['id'] = 'g1-1-99';
    expect(checkContent(curriculum, [quest]).join('\n')).toContain('목차에 이 id의 단원이 없다');
  });

  it('겹치는 says를 막는다', () => {
    const quest = sample();
    quest['questions'][0]['choices'][1] = { label: '같지 않아요', says: ['같지않'] };
    expect(checkContent(curriculum, [quest]).join('\n')).toContain('알아듣지 못한다');
  });

  it('너무 긴 문단과 답의 범위를 막는다', () => {
    const quest = sample();
    quest['story'][0] = '가'.repeat(201);
    quest['questions'][0]['answer'] = 2;
    const errors = checkContent(curriculum, [quest]).join('\n');
    expect(errors).toContain('201자');
    expect(errors).toContain('answer는 0이나 1');
  });

  it('학년의 한도보다 긴 문장을 막는다', () => {
    const quest = sample();
    quest['story'][1] = `${'가'.repeat(46)}. 짧은 문장이에요.`;
    const errors = checkContent(curriculum, [quest]).join('\n');
    expect(errors).toContain('47자다(1학년은 45자까지)');
    expect(errors).not.toContain('짧은 문장이에요');
  });

  it('읽어 주는 글의 숫자·기호와 화면 이야기를 막는다', () => {
    const quest = sample();
    quest['story'][0] = '사과 3개가 있어요.';
    quest['questions'][0]['prompt'] = '그림을 보세요. 같을까요, 다를까요?';
    quest['questions'][1]['explain'] = '돌 더하기 돌 = 돌이에요.';
    const errors = checkContent(curriculum, [quest]).join('\n');
    expect(errors).toContain('"3"');
    expect(errors).toContain('"그림을 보"');
    expect(errors).toContain('"="');
  });

  it('고르기와 풀이의 꼴을 막는다', () => {
    const quest = sample();
    quest['questions'][0]['choices'][0] = { label: '첫째 것', says: ['첫 것'] };
    quest['questions'][1]['explain'] = '맞았어요. 돌이에요.';
    const errors = checkContent(curriculum, [quest]).join('\n');
    expect(errors).toContain('"첫째", "둘째"를 쓰지 않는다');
    expect(errors).toContain('띄어쓰기가 있다');
    expect(errors).toContain('"맞았어요"는 앱이');
  });

  it('답이 모두 같은 자리면 막는다', () => {
    const quest = sample();
    quest['questions'][1]['answer'] = 0;
    expect(checkContent(curriculum, [quest]).join('\n')).toContain('답이 모두 첫째다');
  });

  it('승인된 탄생 비화에는 source가 있어야 한다', () => {
    const quest = sample();
    quest['status'] = 'ready';
    expect(checkContent(curriculum, [quest]).join('\n')).toContain('source');
  });

  it('틀린 자료로는 막을 만들지 않는다', () => {
    expect(() => buildActs({ acts: [] }, [])).toThrow('막이 12개가 아니라 0개');
  });

  it('막 번호로 학교를 정한다', () => {
    const acts = buildActs(curriculum, QUEST_FILES);
    expect(acts.map((a) => a.school)).toEqual([
      ...Array(6).fill('elementary'),
      ...Array(3).fill('middle'),
      ...Array(3).fill('high'),
    ]);
  });

  it('고등학교 단원 id(g10~g12)를 받고 그 학년의 문장 한도를 쓴다', () => {
    const quest = sample();
    quest['id'] = 'g10-1-01';
    quest['story'] = storyFor(10);
    expect(checkContent(curriculum, [quest])).toEqual([]);
    quest['story'][1] = `${'가'.repeat(80)}. 짧은 문장이에요.`;
    expect(checkContent(curriculum, [quest]).join('\n')).toContain('81자다(10학년은 80자까지)');
  });

  it('읽어 주는 글의 로마자와 수학 기호를 막는다', () => {
    for (const word of ['x', '√', 'π', '≤']) {
      const quest = sample();
      quest['story'][0] = `모르는 수를 ${word}라고 불러요.`;
      expect(checkContent(curriculum, [quest]).join('\n')).toContain(`"${word}"를 TTS가 읽지 못한다`);
    }
  });

  it('막의 길이와 문단 수를 벗어난 이야기를 막는다', () => {
    const short = sample();
    short['story'] = short['story'].slice(0, 4);
    const errors = checkContent(curriculum, [short]).join('\n');
    expect(errors).toContain('문단이 5~8개가 아니라 4개다');
    expect(errors).toContain('이야기가 240자다(1막은 400~600자)');

    const high = sample();
    high['id'] = 'g10-1-01';
    expect(checkContent(curriculum, [high]).join('\n')).toContain('이야기가 420자다(10막은 700~1000자)');
    expect(STORY_LENGTH[12]).toEqual({ min: 700, max: 1000 });
  });

  it('고등학교 단원에 과목이 없으면 막는다', () => {
    const broken = structuredClone(curriculum) as { acts: { units: Record<string, unknown>[] }[] };
    delete broken.acts[9].units[0]['course'];
    expect(checkContent(broken, []).join('\n')).toContain('g10-1-01: 고등학교 단원에는 course(과목)가 있어야 한다');
  });
});
