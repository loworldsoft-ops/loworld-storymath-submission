import type { RpgSkillRegistryEntry } from '../models/rpg-skill.model';
import type { SkillDefinition } from '../models/skill.model';
import { getRpgSkillRegistry } from '../data/rpg-skill-loader.util';
import { characterClassToSkillDiscipline } from './rpg-skill-class.util';

const KIND_ICON_HINT: Record<RpgSkillRegistryEntry['kind'], string> = {
  active: '⚔️',
  passive: '📈',
  aura: '✨',
  summon: '💀',
  'charge-up': '🐯',
  finisher: '💥',
  corpse: '☠️',
};

export function mapRpgRegistryEntryToSkillDefinition(
  entry: RpgSkillRegistryEntry,
): SkillDefinition {
  return {
    id: entry.id,
    name: entry.nameKo,
    description: entry.descriptionKo || entry.rpgName,
    type: entry.type,
    discipline: characterClassToSkillDiscipline(entry.discipline),
    iconHint: KIND_ICON_HINT[entry.kind] ?? '📜',
    elementAffinity: entry.elementAffinity,
    iconId: entry.iconId,
    rpg: {
      rpgName: entry.rpgName,
      charclass: entry.charclass,
      treePage: entry.treePage,
      treeRow: entry.treeRow,
      treeColumn: entry.treeColumn,
      treeLabelKo: entry.treeLabelKo,
      reqlevel: entry.reqlevel,
      maxLevel: entry.maxLevel,
      prerequisites: entry.prerequisites,
      synergies: entry.synergies,
      kind: entry.kind,
      manaLevel1: entry.manaLevel1,
      manaLevel20: entry.manaLevel20,
    },
  };
}

export function buildRpgSkillCatalog(): SkillDefinition[] {
  return getRpgSkillRegistry().map(mapRpgRegistryEntryToSkillDefinition);
}

export function getRpgSkillDefinition(skillId: string): SkillDefinition | undefined {
  return buildRpgSkillCatalog().find((s) => s.id === skillId);
}

export function resolveSkillIconId(
  skill: Pick<SkillDefinition, 'id' | 'iconId'>,
): string {
  return skill.iconId ?? skill.id;
}
