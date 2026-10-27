import type { AffinityType } from '../models/affinity.model';
import type { SkillDefinition } from '../models/skill.model';

const SKILL_ID_AFFINITY: Record<string, AffinityType> = {
  'sword-wind': 'wind',
  fireball: 'fire',
  'frost-nova': 'water',
  'chain-lightning': 'wind',
  meteor: 'fire',
  'magic-arrow': 'wind',
  'raise-skeleton': 'dark',
  'bone-spear': 'dark',
  'poison-nova': 'dark',
  'holy-bolt': 'light',
  'smite': 'light',
  'shield-bash': 'earth',
};

/** 스킬 카탈로그 정의 → 전투 원소 (명시 필드 > id 맵 > iconHint 힌트) */
export function resolveSkillElementAffinity(
  definition: Pick<SkillDefinition, 'id' | 'iconHint' | 'elementAffinity'>,
): AffinityType {
  if (definition.elementAffinity) {
    return definition.elementAffinity;
  }
  const mapped = SKILL_ID_AFFINITY[definition.id];
  if (mapped) {
    return mapped;
  }
  const hint = definition.iconHint ?? '';
  if (hint.includes('🔥')) return 'fire';
  if (hint.includes('❄️') || hint.includes('💧')) return 'water';
  if (hint.includes('⚡') || hint.includes('💨') || hint.includes('🌪')) return 'wind';
  if (hint.includes('⛰') || hint.includes('🛡')) return 'earth';
  if (hint.includes('☀️') || hint.includes('✨')) return 'light';
  if (hint.includes('💀') || hint.includes('😈')) return 'dark';
  return 'none';
}
