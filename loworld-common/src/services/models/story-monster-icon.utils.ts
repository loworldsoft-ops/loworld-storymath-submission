import { STORY_MONSTER_ICON_DATASET_BASE, STORY_MONSTER_ICON_MEDIA_BY_ID } from './story-monster-icon-paths.generated';
import { STORY_PARTY_ICON_MEDIA_BY_ID } from './story-party-icon-paths.generated';
import { toStoryPartyAssetId, toStoryPartyIconName } from './story-party-icon.utils';

export const STORY_MONSTER_ICON_NAMESPACE = 'story-monster' as const;
export const STORY_MONSTER_ICON_PREFIX = `${STORY_MONSTER_ICON_NAMESPACE}:` as const;

export function toStoryMonsterAssetId(monsterId: string): string {
  return monsterId.startsWith('monster-') ? monsterId : `monster-${monsterId}`;
}

export function isStoryMonsterIconName(value: string | null | undefined): boolean {
  return !!value && (value.startsWith(STORY_MONSTER_ICON_PREFIX) || value.startsWith('novel-monster:'));
}

export function toStoryMonsterIconName(monsterId: string): string {
  const assetId = toStoryMonsterAssetId(monsterId);
  return `${STORY_MONSTER_ICON_PREFIX}${assetId}`;
}

/** 전투 미니언 카드 초상 — 몬스터 도감 id, 영웅/용병 파티 id 모두 다형성 지원 */
export function resolveStoryBattlePortraitIconName(combatantId: string): string {
  if (!combatantId) {
    return 'story-party:party-wanderer';
  }

  const cleanId = combatantId.toLowerCase().trim();

  // 1. 주인공 / 영웅 식별자 매핑
  if (['hero', 'player', 'protagonist', 'wanderer', '방랑자', '성기사'].includes(cleanId)) {
    return 'story-party:party-wanderer';
  }

  // 2. 용병 식별자 매핑
  if (['mercenary', 'rogue', 'd2_act1_rogue', 'rogue_scout', '용병', '프라비', '카샤의 용병'].includes(cleanId)) {
    return 'story-party:party-silvana';
  }
  if (['desert_mercenary', 'iron_wolf', 'barbarian', '사막용병', '야만용사'].includes(cleanId)) {
    return 'story-party:party-guard_cain';
  }

  // 3. 몬스터 아이콘 맵 정밀 매칭
  const monsterAssetId = toStoryMonsterAssetId(combatantId);
  if (STORY_MONSTER_ICON_MEDIA_BY_ID[monsterAssetId]) {
    return toStoryMonsterIconName(combatantId);
  }

  // 4. 파티 아이콘 맵 정밀 매칭
  const partyAssetId = toStoryPartyAssetId(combatantId);
  if (STORY_PARTY_ICON_MEDIA_BY_ID[partyAssetId]) {
    return toStoryPartyIconName(partyAssetId);
  }

  // 5. 몬스터 키워드 기반 스마트 추론 매핑
  if (cleanId.includes('skel') || cleanId.includes('bone') || cleanId.includes('skull') || cleanId.includes('해골')) {
    return toStoryMonsterIconName('skeleton_warrior');
  }
  if (cleanId.includes('zombie') || cleanId.includes('corpse') || cleanId.includes('rot') || cleanId.includes('시체') || cleanId.includes('타락')) {
    return toStoryMonsterIconName('zombie');
  }
  if (cleanId.includes('wolf') || cleanId.includes('hound') || cleanId.includes('boar') || cleanId.includes('늑대') || cleanId.includes('야수')) {
    return toStoryMonsterIconName('mountain_wolf');
  }
  if (cleanId.includes('boss') || cleanId.includes('lord') || cleanId.includes('king') || cleanId.includes('guardian') || cleanId.includes('보스') || cleanId.includes('수호자')) {
    return toStoryMonsterIconName('abyss_knight');
  }
  if (cleanId.includes('devil') || cleanId.includes('imp') || cleanId.includes('fiend') || cleanId.includes('악마') || cleanId.includes('혈투')) {
    return toStoryMonsterIconName('ash_devil');
  }

  // 6. 동적 몬스터 생성 식별자 기본 폴백 (`dung_mob_`, `gr_m`, `gr_g`)
  if (cleanId.startsWith('dung_mob') || cleanId.startsWith('gr_') || cleanId.includes('mob') || cleanId.includes('monster')) {
    return toStoryMonsterIconName('fallen');
  }

  return 'story-party:party-wanderer';
}

/** BattleEnemy.portraitMonsterId 우선 (균열 runtime id와 아이콘 SSOT 분리) */
export function resolveStoryBattleEnemyPortraitIconName(enemy: {
  id: string;
  portraitMonsterId?: string;
}): string {
  if (enemy.portraitMonsterId) {
    return toStoryMonsterIconName(enemy.portraitMonsterId);
  }
  return resolveStoryBattlePortraitIconName(enemy.id);
}

function resolveStoryMonsterIconRelativePath(monsterId: string): string {
  const assetId = toStoryMonsterAssetId(monsterId);
  const media = STORY_MONSTER_ICON_MEDIA_BY_ID[assetId];
  if (media?.path) {
    return media.path;
  }
  return `png/${assetId}.png`;
}

/** Absolute URL path for a monster icon PNG. */
export function resolveStoryMonsterIconMediaUrl(monsterId: string, base: string = STORY_MONSTER_ICON_DATASET_BASE): string {
  return `${base}/${resolveStoryMonsterIconRelativePath(monsterId)}`;
}

/** Returns the content-relative path (e.g. 'novel/monster-icons/png/monster-zombie.png') for use with StoryContentHandle.assetUrl */
export function toContentStoryMonsterAssetPath(monsterId: string): string {
  return `novel/monster-icons/${resolveStoryMonsterIconRelativePath(monsterId)}`;
}

export function isStoryMonsterIconRaster(monsterId: string): boolean {
  const assetId = toStoryMonsterAssetId(monsterId);
  const kind = STORY_MONSTER_ICON_MEDIA_BY_ID[assetId]?.kind;
  return kind !== 'vector';
}
