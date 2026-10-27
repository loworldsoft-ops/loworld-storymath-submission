import type { CharacterClass } from '../models/character-base.model';
import type { SkillDiscipline } from '../models/skill.model';
import { resolveProtagonistClassId } from './protagonist-class.util';

/** CharacterClass (rogue) ↔ SkillDiscipline (archer) */
export function characterClassToSkillDiscipline(classId: CharacterClass | string): SkillDiscipline {
  const resolved = resolveProtagonistClassId(classId, 'warrior');
  if (resolved === 'rogue') return 'archer' as SkillDiscipline;
  return resolved as SkillDiscipline;
}

export function skillDisciplineToCharacterClass(discipline: SkillDiscipline): CharacterClass {
  if (discipline === 'archer') return 'rogue';
  return discipline as CharacterClass;
}

export const RPG_SKILL_TREE_PAGE_LABELS: Record<number, { en: string; ko: string }> = {
  1: { en: 'Tree I', ko: '트리 I' },
  2: { en: 'Tree II', ko: '트리 II' },
  3: { en: 'Tree III', ko: '트리 III' },
};
