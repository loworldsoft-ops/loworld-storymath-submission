import type { CharacterClass } from '../models/character-base.model';
import { resolveProtagonistClassId } from './protagonist-class.util';

/** Diablo II 7대 클래스 — UI·Inspector 공통 한글 SSOT */
export const RPG_CHARACTER_CLASS_LABELS: Record<CharacterClass, string> = {
  warrior: '야만용사',
  sorceress: '원소술사',
  rogue: '아마존',
  paladin: '성기사',
  necromancer: '강령술사',
  druid: '드루이드',
  assassin: '암살자',
};

export const RPG_CHARACTER_CLASS_OPTIONS: ReadonlyArray<{ value: CharacterClass; label: string }> = (
  Object.entries(RPG_CHARACTER_CLASS_LABELS) as [CharacterClass, string][]
).map(([value, label]) => ({ value, label }));

export const STORY_EXTENDED_CLASS_LABELS: Record<string, string> = {
  'hwashan-sword': '화산파',
  'shaolin-monk': '소림사',
  'dangmun-ranger': '사천당가',
  'tang-assassin': '사천당가',
  'cult-berserker': '천마신교',
  'demonic-berserker': '천마신교',
  'wudang-taoist': '무당파',
  'namgung-spear': '남궁세가',
  // 구버전 및 세이브 데이터 하위 호환 매핑
  '화산파 검수': '화산파',
  '소림사 권승': '소림사',
  '당문 암기사': '사천당가',
  '마교 광전사': '천마신교',
  '무당파 도사': '무당파',
  '남궁세가 창술사': '남궁세가',
};

export function getRpgCharacterClassLabel(classId: CharacterClass | string | null | undefined): string {
  if (!classId) {
    return RPG_CHARACTER_CLASS_LABELS.warrior;
  }
  const rawKey = String(classId).trim();
  if (STORY_EXTENDED_CLASS_LABELS[rawKey]) {
    return STORY_EXTENDED_CLASS_LABELS[rawKey];
  }
  const resolved = resolveProtagonistClassId(classId, 'warrior');
  if (RPG_CHARACTER_CLASS_LABELS[resolved as CharacterClass]) {
    return RPG_CHARACTER_CLASS_LABELS[resolved as CharacterClass];
  }
  if (STORY_EXTENDED_CLASS_LABELS[resolved]) {
    return STORY_EXTENDED_CLASS_LABELS[resolved];
  }
  return String(classId);
}
