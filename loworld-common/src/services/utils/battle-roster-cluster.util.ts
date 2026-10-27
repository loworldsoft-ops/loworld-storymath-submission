import { MonsterCreatureType, StoryMonsterEntry, StoryPartyEntry, PartyGroup } from '../models/story-sidebar.model';

export interface LwBattleRosterGroupVm<T> {
  id: string;
  label: string;
  icon: string;
  entries: T[];
}

export const ALLY_GROUP_META: Record<PartyGroup, { label: string; icon: string }> = {
  human: { label: '인간', icon: '🧑' },
  elf: { label: '엘프', icon: '🧝' },
  druid: { label: '드루이드', icon: '🌿' },
  chronicle: { label: '연대기', icon: '📜' },
  'wuxia': { label: '무협', icon: '☯️' },
  fantasy: { label: '판타지', icon: '✨' },
};

export const ENEMY_TYPE_META: Record<MonsterCreatureType, { label: string; icon: string }> = {
  undead: { label: '언데드', icon: '💀' },
  demon: { label: '악마', icon: '👿' },
  beast: { label: '동물', icon: '🐗' },
  elite: { label: '정예', icon: '⚔️' },
  'wuxia': { label: '무협', icon: '☯️' },
  fantasy: { label: '판타지', icon: '✨' },
};

const ALLY_GROUP_ORDER: PartyGroup[] = ['human', 'elf', 'druid', 'chronicle', 'wuxia', 'fantasy'];
const ENEMY_TYPE_ORDER: MonsterCreatureType[] = ['undead', 'demon', 'beast', 'elite', 'wuxia', 'fantasy'];

export function isMonsterEntry(entry: StoryPartyEntry | StoryMonsterEntry): entry is StoryMonsterEntry {
  return 'area' in entry || 'creatureType' in entry || 'threatLevel' in entry;
}

export function mergeSandboxRosterById<T extends { id: string }>(
  primary: T[],
  extras: T[],
): T[] {
  const seen = new Set(primary.map((entry) => entry.id));
  const merged = [...primary];
  for (const entry of extras) {
    if (!seen.has(entry.id)) {
      seen.add(entry.id);
      merged.push(entry);
    }
  }
  return merged;
}

export function resolvePartyGroup(member: StoryPartyEntry): PartyGroup {
  if (member.group) {
    return member.group;
  }
  if (member.rosterSource === 'chronicle' || member.chronicleId) {
    return 'chronicle';
  }
  return 'human';
}

export function resolveMonsterCreatureType(monster: StoryMonsterEntry): MonsterCreatureType {
  if (monster.creatureType) {
    return monster.creatureType;
  }

  const badge = monster.badge?.toLowerCase() ?? '';
  if (badge.includes('wuxia') || badge.includes('무협')) {
    return 'wuxia';
  }
  if (badge.includes('fantasy') || badge.includes('판타지')) {
    return 'fantasy';
  }
  if (badge.includes('undead') || badge.includes('언데드')) {
    return 'undead';
  }
  if (badge.includes('elite') || badge.includes('정예')) {
    return 'elite';
  }
  if (badge.includes('beast') || badge.includes('동물')) {
    return 'beast';
  }
  if (badge.includes('demon') || badge.includes('악마')) {
    return 'demon';
  }
  return 'demon';
}

export function buildAllyRosterGroups(members: StoryPartyEntry[]): LwBattleRosterGroupVm<StoryPartyEntry>[] {
  return buildRosterGroups(members, resolvePartyGroup, ALLY_GROUP_META, ALLY_GROUP_ORDER);
}

export function buildEnemyRosterGroups(monsters: StoryMonsterEntry[]): LwBattleRosterGroupVm<StoryMonsterEntry>[] {
  return buildRosterGroups(monsters, resolveMonsterCreatureType, ENEMY_TYPE_META, ENEMY_TYPE_ORDER);
}

export function allyGroupLabel(group: PartyGroup): string {
  return ALLY_GROUP_META[group]?.label ?? group;
}

export function enemyTypeLabel(creatureType: MonsterCreatureType): string {
  return ENEMY_TYPE_META[creatureType]?.label ?? creatureType;
}

function buildRosterGroups<T extends { id: string }, GroupId extends string>(
  entries: T[],
  resolveGroupId: (entry: T) => GroupId,
  meta: Record<GroupId, { label: string; icon: string }>,
  order: GroupId[],
): LwBattleRosterGroupVm<T>[] {
  const buckets = new Map<GroupId, T[]>();

  for (const entry of entries) {
    const groupId = resolveGroupId(entry);
    const bucket = buckets.get(groupId) ?? [];
    bucket.push(entry);
    buckets.set(groupId, bucket);
  }

  return order
    .filter((groupId) => (buckets.get(groupId)?.length ?? 0) > 0)
    .map((groupId) => ({
      id: groupId,
      label: meta[groupId].label,
      icon: meta[groupId].icon,
      entries: buckets.get(groupId) ?? [],
    }));
}

export function buildUnifiedRosterGroups(
  entries: Array<StoryPartyEntry | StoryMonsterEntry>,
): LwBattleRosterGroupVm<StoryPartyEntry | StoryMonsterEntry>[] {
  const partyEntries = entries.filter((e): e is StoryPartyEntry => !isMonsterEntry(e));
  const monsterEntries = entries.filter((e): e is StoryMonsterEntry => isMonsterEntry(e));

  const groups: LwBattleRosterGroupVm<StoryPartyEntry | StoryMonsterEntry>[] = [];

  if (partyEntries.length > 0) {
    groups.push({
      id: 'party',
      label: '동료',
      icon: '🛡️',
      entries: partyEntries,
    });
  }

  const enemyGroups = buildEnemyRosterGroups(monsterEntries);
  for (const g of enemyGroups) {
    groups.push(g);
  }

  return groups;
}
