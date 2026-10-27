/** 2지선다의 한쪽이다. says는 말로 답할 때 알아들을 낱말이다(들은 글에 하나라도 들어 있으면 이쪽). */
export interface MathChoice {
  readonly label: string;
  readonly says: readonly string[];
}

/** 문제 하나. 답은 언제나 둘 중 하나다. */
export interface MathQuestion {
  readonly id: string;
  /** 읽어 주는 물음. 두 답을 물음 안에 넣는다("양일까요, 돌일까요?") */
  readonly prompt: string;
  readonly choices: readonly [MathChoice, MathChoice];
  readonly answer: 0 | 1;
  /** 맞든 틀리든 읽어 주는 풀이. 답이 무엇인지 들어 있어야 한다 */
  readonly explain: string;
}

/** 이야기의 종류. 실제로 태어난 이야기가 있으면 birth(탄생 비화), 없으면 principle(원리를 이야기로 푼 것)이다. */
export type MathStoryKind = 'birth' | 'principle';

/** draft는 Claude가 쓴 시안, ready는 사용자가 듣고 승인한 것이다. */
export type MathQuestStatus = 'draft' | 'ready';

/** 퀘스트 하나 = 단원 하나. 이야기를 듣고 문제를 푼다. */
export interface MathQuest {
  /** 단원의 id와 같다. 예: 'g1-1-01' */
  readonly id: string;
  readonly title: string;
  /** 단원 이름. 퀘스트 파일에는 없고 목차(curriculum.json)에서 채운다 */
  readonly topic: string;
  readonly kind: MathStoryKind;
  readonly status: MathQuestStatus;
  /** 이야기. 문단 하나를 한 번에 읽어 준다 */
  readonly story: readonly string[];
  readonly questions: readonly MathQuestion[];
}

/** 목차의 단원 하나. */
export interface MathUnit {
  /** g<학년>-<학기>-<순서 두 자리>. 학년은 1~12(초1~고3). 예: 'g1-1-01', 'g10-2-03' */
  readonly id: string;
  readonly semester: 1 | 2;
  readonly name: string;
  /** 고등학교(10~12막) 단원의 과목. 예: '공통수학1'. 고등학교는 학기 대신 과목으로 나뉘어 막 화면이 이 이름을 쓴다 */
  readonly course?: string;
}

/** 학교. 막 번호로 정해진다(content-check.ts의 schoolOf) */
export type MathSchool = 'elementary' | 'middle' | 'high';

/** 막 하나 = 학년 하나. quests는 단원 순서대로이고, 퀘스트 파일이 없는 단원은 빠진다. */
export interface MathAct {
  readonly id: string;
  readonly title: string;
  readonly grade: string;
  readonly school: MathSchool;
  readonly units: readonly MathUnit[];
  readonly quests: readonly MathQuest[];
}
