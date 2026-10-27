import { buildActs } from '../logic/content-check';
import type { MathAct } from '../logic/story-math.model';
import curriculum from './curriculum.json';
import { QUEST_FILES } from './quests';

/** 막 6개(초1~초6). 목차와 퀘스트 파일로 만든다. 자료가 틀렸으면 여기서 멈춘다(content-check.ts). */
export const STORY_MATH_ACTS: readonly MathAct[] = buildActs(curriculum, QUEST_FILES);
