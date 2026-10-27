import type { Character } from '../models/character.model';
import type { EquipmentSlots } from '../models/equipment.model';
import type { Item, ItemStat } from '../models/item.model';
import type { RpgCharacterAttributes, CampaignDifficulty, RpgResistDetail, RpgStatPair } from '../models/rpg-character-attributes.model';
import { MARTIAL_CLASS_ROSTER } from '../data/story-class-presets.data';

function parseStatValue(stats: ItemStat[] | undefined, keywords: string[]): number {
  if (!stats?.length) return 0;
  let total = 0;
  for (const entry of stats) {
    const label = entry.label.toLowerCase();
    if (keywords.some((kw) => label.includes(kw.toLowerCase()))) {
      total += Number(entry.value) || 0;
    }
  }
  return total;
}

function hasKeyword(stats: ItemStat[] | undefined, keywords: string[]): boolean {
  if (!stats?.length) return false;
  return stats.some((entry) => {
    const label = entry.label.toLowerCase();
    return keywords.some((kw) => label.includes(kw.toLowerCase()));
  });
}

function extractAllEquippedItems(equipment: EquipmentSlots | null | undefined): Item[] {
  if (!equipment) return [];
  return Object.values(equipment).filter((item): item is Item => !!item);
}

export function computeRpgCharacterAttributes(
  character: Partial<Character> & { id?: string; level?: number },
  equipment: EquipmentSlots | null | undefined,
  difficulty: CampaignDifficulty = 'normal',
  targetMonsterLevel = 80,
): RpgCharacterAttributes {
  const items = extractAllEquippedItems(equipment);
  const allStats = items.flatMap((item) => item.stats || []);

  const level = character.level ?? 1;
  const characterClass = character.class ?? 'warrior';
  const characterName = character.name ?? '용사';

  // 1. 핵심 능력치 연산
  const baseStr = character.stats?.strength ?? 25;
  const baseDex = character.stats?.dexterity ?? 20;
  const baseVit = character.stats?.vitality ?? 25;
  const baseEne = character.stats?.energy ?? 15;

  const bonusStr = parseStatValue(allStats, ['힘', 'strength']) + parseStatValue(allStats, ['모든 능력치', 'attributes']);
  const bonusDex = parseStatValue(allStats, ['민첩', 'dexterity']) + parseStatValue(allStats, ['모든 능력치', 'attributes']);
  const bonusVit = parseStatValue(allStats, ['활력', 'vitality']) + parseStatValue(allStats, ['모든 능력치', 'attributes']);
  const bonusEne = parseStatValue(allStats, ['에너지', '마력', 'energy']) + parseStatValue(allStats, ['모든 능력치', 'attributes']);

  const strength: RpgStatPair = { base: baseStr, bonus: bonusStr, total: baseStr + bonusStr };
  const dexterity: RpgStatPair = { base: baseDex, bonus: bonusDex, total: baseDex + bonusDex };
  const vitality: RpgStatPair = { base: baseVit, bonus: bonusVit, total: baseVit + bonusVit };
  const energy: RpgStatPair = { base: baseEne, bonus: bonusEne, total: baseEne + bonusEne };

  // 2. 생존 & 자원 연산 (HP / MP / Stamina)
  const baseLife = (character.stats?.life || 50) + (level - 1) * 2;
  const bonusLife = parseStatValue(allStats, ['생명력', 'life']) + vitality.total * 3;
  const maxLife = baseLife + bonusLife;
  const currentLife = Math.min(character.stats?.life ?? maxLife, maxLife);

  const baseMana = (character.stats?.mana || 20) + (level - 1) * 1.5;
  const bonusMana = parseStatValue(allStats, ['마나', 'mana']) + energy.total * 2;
  const maxMana = Math.floor(baseMana + bonusMana);
  const currentMana = Math.min(character.stats?.mana ?? maxMana, maxMana);

  const maxStamina = 80 + level * 2 + vitality.total * 2 + parseStatValue(allStats, ['지구력', 'stamina']);

  // 3. 기본 전투 수치 연산
  let weaponMinDamage = 1;
  let weaponMaxDamage = 4;
  let weaponEdPercent = 0;

  if (equipment?.weapon) {
    const wStats = equipment.weapon.stats || [];
    const flatDmg = parseStatValue(wStats, ['피해', '공격력', 'damage']);
    weaponEdPercent = parseStatValue(wStats, ['Enhanced Damage', '증가된 피해', '피해 %']);
    weaponMinDamage = 6 + Math.floor(flatDmg * 0.5);
    weaponMaxDamage = 12 + flatDmg;
  }

  const globalFlatDmg = parseStatValue(allStats, ['최소 피해', '최대 피해', '피해']);
  const strDmgMult = 1 + strength.total / 100 + weaponEdPercent / 100;

  const mainHandMin = Math.floor((weaponMinDamage + globalFlatDmg * 0.3) * strDmgMult);
  const mainHandMax = Math.floor((weaponMaxDamage + globalFlatDmg) * strDmgMult);

  const attackRating = Math.floor(
    (dexterity.total * 5 + level * 2 + parseStatValue(allStats, ['공격 등급', '명중', 'attack rating'])) *
      (1 + parseStatValue(allStats, ['명중률 %', 'bonus to attack rating']) / 100),
  );

  const chanceToHit = Math.min(
    95,
    Math.max(5, Math.floor(200 * (level / (level + targetMonsterLevel)) * (attackRating / (attackRating + 1000 || 1)))),
  );

  let armorBaseDef = character.stats?.defense ?? 10;
  for (const item of items) {
    armorBaseDef += parseStatValue(item.stats, ['방어', 'defense']);
  }
  const defense = Math.floor(armorBaseDef + dexterity.total / 4);
  const chanceToBeHit = Math.min(95, Math.max(5, 100 - chanceToHit));

  let chanceToBlock = 0;
  if (equipment?.shield) {
    const shieldBlock = 30 + parseStatValue(equipment.shield.stats, ['차단 확률', 'blocking', '블록']);
    chanceToBlock = Math.min(75, Math.floor((shieldBlock * (dexterity.total - 15)) / (level * 2 || 1)));
  }

  // 4. 원소 저항력 연산
  const penalty = difficulty === 'hell' ? -100 : difficulty === 'nightmare' ? -40 : 0;
  const allRes = parseStatValue(allStats, ['모든 저항', 'all resistances', '모든저항']);

  const calcRes = (resKey: string, maxKey: string): RpgResistDetail => {
    const specificRes = parseStatValue(allStats, [resKey]);
    const maxBonus = parseStatValue(allStats, [maxKey]);
    const maxCap = Math.min(95, 75 + maxBonus);
    const uncapped = allRes + specificRes;
    const value = Math.min(maxCap, uncapped + penalty);
    return { value, uncapped, maxCap, penalty };
  };

  const fireResist = calcRes('화염 저항', '최대 화염 저항');
  const coldResist = calcRes('냉기 저항', '최대 냉기 저항');
  const lightningResist = calcRes('번개 저항', '최대 번개 저항');
  const poisonResist = calcRes('독 저항', '최대 독 저항');

  // 5. 프레임 속도 연산
  const ias = parseStatValue(allStats, ['공격 속도', 'increased attack speed', 'ias']);
  const fcr = parseStatValue(allStats, ['시전 속도', 'faster cast rate', 'fcr']);
  const fhr = parseStatValue(allStats, ['타격 회복', '피격 회복', 'faster hit recovery', 'fhr']);
  const frw = parseStatValue(allStats, ['이동 속도', '달리기', 'faster run/walk', 'frw']);
  const fbr = parseStatValue(allStats, ['방어 속도', '차단 속도', 'faster block rate', 'fbr']);

  // 6. 고급 특수 공격 연산
  const crushingBlow = parseStatValue(allStats, ['강타', 'crushing blow']);
  const deadlyStrike = parseStatValue(allStats, ['치명타', '치명적 타격', 'deadly strike']);
  const openWounds = parseStatValue(allStats, ['상처 악화', '출혈', 'open wounds']);
  const ignoreTargetDefense = hasKeyword(allStats, ['적 방어 무시', 'ignore target defense']);
  const lifeSteal = parseStatValue(allStats, ['생명력 흡수', '생흡', 'life stolen']);
  const manaSteal = parseStatValue(allStats, ['마나 흡수', '마흡', 'mana stolen']);

  const pierceResistances = {
    fire: parseStatValue(allStats, ['적 화염 저항']),
    cold: parseStatValue(allStats, ['적 냉기 저항']),
    lightning: parseStatValue(allStats, ['적 번개 저항']),
    poison: parseStatValue(allStats, ['적 독 저항']),
  };

  // 7. 고급 특수 방어 & 생존 연산
  const replenishLife = parseStatValue(allStats, ['생명력 재생', 'replenish life']);
  const regenerateMana = parseStatValue(allStats, ['마나 재생', 'regenerate mana']);
  const drFlat = parseStatValue(allStats, ['피해 감소', 'damage reduced by']);
  const drPercent = Math.min(50, parseStatValue(allStats, ['피해 감소 %', 'physical damage reduction']));
  const magicDamageReduction = parseStatValue(allStats, ['마법 피해 감소', 'magic damage reduced by']);

  const cannotBeFrozen = hasKeyword(allStats, ['동결 불가', 'cannot be frozen']);
  const halfFreezeDuration = hasKeyword(allStats, ['결빙 시간 절반', 'half freeze duration']);

  const elementAbsorb = {
    fireFlat: parseStatValue(allStats, ['화염 흡수']),
    firePercent: parseStatValue(allStats, ['화염 흡수 %']),
    coldFlat: parseStatValue(allStats, ['냉기 흡수']),
    coldPercent: parseStatValue(allStats, ['냉기 흡수 %']),
    lightningFlat: parseStatValue(allStats, ['번개 흡수']),
    lightningPercent: parseStatValue(allStats, ['번개 흡수 %']),
  };

  // 8. 유틸리티 & 드랍 연산
  const magicFind = parseStatValue(allStats, ['매직 아이템 발견', 'magic find', '매찬']);
  const extraGold = parseStatValue(allStats, ['골드 획득', 'extra gold', '골찬']);
  const lightRadius = parseStatValue(allStats, ['시야', 'light radius']);
  const requirementsReduction = parseStatValue(allStats, ['요구치', 'requirements']);

  const skillBonusAll = parseStatValue(allStats, ['모든 스킬', '모든 기술', 'all skills']);
  const skillBonusClass = parseStatValue(allStats, ['직업 스킬', 'class skills']);

  return {
    characterName,
    characterClass,
    level,
    difficulty,
    strength,
    dexterity,
    vitality,
    energy,
    life: { current: currentLife, max: maxLife },
    mana: { current: currentMana, max: maxMana },
    stamina: { current: Math.floor(maxStamina), max: Math.floor(maxStamina) },
    mainHandDamage: { min: mainHandMin, max: mainHandMax },
    attackRating,
    chanceToHit,
    defense,
    chanceToBeHit,
    chanceToBlock,
    fireResist,
    coldResist,
    lightningResist,
    poisonResist,
    ias,
    fcr,
    fhr,
    frw,
    fbr,
    crushingBlow,
    deadlyStrike,
    openWounds,
    ignoreTargetDefense,
    lifeSteal,
    manaSteal,
    pierceResistances,
    replenishLife,
    regenerateMana,
    damageReduction: { flat: drFlat, percent: drPercent },
    magicDamageReduction,
    elementAbsorb,
    cannotBeFrozen,
    halfFreezeDuration,
    magicFind,
    extraGold,
    lightRadius,
    requirementsReduction,
    skillBonusAll,
    skillBonusClass,
  };
}

export interface RpgClassDefinition {
  key: string;
  name: string;
  title: string;
  icon: string;
  illustrationUrl: string;
  primaryStat: 'str' | 'dex' | 'vit' | 'ene';
}

export const RPG_CLASS_ROSTER: readonly RpgClassDefinition[] = [
  { key: 'amazon', name: '아마존', title: 'Amazon', icon: '🏹', illustrationUrl: '/assets/d2r-heroes/amazon.png', primaryStat: 'dex' },
  { key: 'sorceress', name: '원소술사', title: 'Sorceress', icon: '🔮', illustrationUrl: '/assets/d2r-heroes/sorceress.png', primaryStat: 'ene' },
  { key: 'necromancer', name: '강령술사', title: 'Necromancer', icon: '💀', illustrationUrl: '/assets/d2r-heroes/necromancer.png', primaryStat: 'ene' },
  { key: 'paladin', name: '성기사', title: 'Paladin', icon: '🛡️', illustrationUrl: '/assets/d2r-heroes/paladin.png', primaryStat: 'vit' },
  { key: 'barbarian', name: '야만용사', title: 'Barbarian', icon: '⚔️', illustrationUrl: '/assets/d2r-heroes/barbarian.png', primaryStat: 'str' },
  { key: 'druid', name: '드루이드', title: 'Druid', icon: '🐺', illustrationUrl: '/assets/d2r-heroes/druid.png', primaryStat: 'vit' },
  { key: 'assassin', name: '암살자', title: 'Assassin', icon: '🗡️', illustrationUrl: '/assets/d2r-heroes/assassin.png', primaryStat: 'dex' },
] as const;

const CODEX_ASSET_POOLS = {
  weapon: [
    { icon: 'weapon-sword-01', name: '치명적인 서리검', rarity: 'unique' as const },
    { icon: 'weapon-sword-02', name: '광기의 그레이트소드', rarity: 'set' as const },
    { icon: 'weapon-bow-01', name: '바람의 시그널 장궁', rarity: 'unique' as const },
    { icon: 'weapon-bow-02', name: '윈드포스 쉐도우보우', rarity: 'unique' as const },
    { icon: 'weapon-crystal-01', name: '영혼의 본 완드', rarity: 'rare' as const },
    { icon: 'weapon-crystal-02', name: '대천사의 아콘 지팡이', rarity: 'set' as const },
    { icon: 'weapon-dagger-01', name: '어둠의 단도', rarity: 'magic' as const },
    { icon: 'weapon-polearm-01', name: '통찰의 그레이브', rarity: 'unique' as const },
    { icon: 'weapon-crystal-01', name: '수정 대검', rarity: 'rare' as const },
    { icon: 'weapon-mace-01', name: '파괴의 버서커 메이스', rarity: 'unique' as const },
    { icon: 'weapon-polearm-02', name: '죽음의 롱 스피어', rarity: 'rare' as const },
    { icon: 'weapon-crossbow-01', name: '헬 캐논 십자창', rarity: 'set' as const },
  ],
  shield: [
    { icon: 'shield-tower-01', name: '영혼의 타워 실드', rarity: 'unique' as const },
    { icon: 'shield-round-01', name: '성스러운 라운드 방패', rarity: 'set' as const },
    { icon: 'shield-kite-01', name: '자카룸의 고딕 실드', rarity: 'unique' as const },
    { icon: 'shield-kite-02', name: '용맹의 카이트 실드', rarity: 'rare' as const },
    { icon: 'shield-buckler-01', name: '가시 방패', rarity: 'magic' as const },
  ],
  helmet: [
    { icon: 'helmet-relic-01', name: '할리퀸 크레스트 샤코', rarity: 'unique' as const },
    { icon: 'helmet-crown-01', name: '불멸의 왕관', rarity: 'set' as const },
    { icon: 'helmet-iron-01', name: '강철 기사의 투구', rarity: 'rare' as const },
    { icon: 'helmet-iron-02', name: '용맹의 대형 헬름', rarity: 'unique' as const },
    { icon: 'helmet-horn-01', name: '드루이드 뿔 투구', rarity: 'rare' as const },
    { icon: 'helmet-hood-01', name: '강령술사의 해골 서클릿', rarity: 'set' as const },
  ],
  bodyArmor: [
    { icon: 'armor-plate-01', name: '수수께끼 룬 갑옷', rarity: 'unique' as const },
    { icon: 'armor-plate-02', name: '인내의 플래티넘 플레이트', rarity: 'unique' as const },
    { icon: 'armor-heavy-01', name: '중갑 기사의 판금', rarity: 'rare' as const },
    { icon: 'armor-leather-01', name: '그림자 쉐도우 래더', rarity: 'set' as const },
    { icon: 'armor-mystic-01', name: '원소술사의 미스틱 로브', rarity: 'unique' as const },
    { icon: 'armor-relic-01', name: '고대 신성 갑옷', rarity: 'rare' as const },
  ],
  gloves: [
    { icon: 'gloves-leather-01', name: '뱀파이어 가죽 장갑', rarity: 'unique' as const },
    { icon: 'gloves-gauntlet-01', name: '강철 거인의 메일 글러브', rarity: 'set' as const },
    { icon: 'gloves-gauntlet-02', name: '신속의 판금 장갑', rarity: 'rare' as const },
    { icon: 'gloves-mystic-01', name: '마법사의 실크 장갑', rarity: 'unique' as const },
  ],
  belt: [
    { icon: 'belt-mystic-01', name: '스파이더웹 뱀파이어 벨트', rarity: 'unique' as const },
    { icon: 'belt-leather-01', name: '거인의 가죽 벨트', rarity: 'rare' as const },
    { icon: 'belt-plated-01', name: '수호자의 판금 벨트', rarity: 'set' as const },
    { icon: 'belt-sash-01', name: '룬 문양 벨트', rarity: 'magic' as const },
  ],
  boots: [
    { icon: 'boots-travel-01', name: '배틀 워 트래블러 부츠', rarity: 'unique' as const },
    { icon: 'boots-leather-01', name: '바람의 가죽 부츠', rarity: 'rare' as const },
    { icon: 'boots-greaves-01', name: '불사의 헤비 플레이트 부츠', rarity: 'set' as const },
    { icon: 'boots-mystic-01', name: '신속의 미스틱 신발', rarity: 'magic' as const },
  ],
  ring: [
    { icon: 'ring-gem-01', name: '조던의 루비 반지', rarity: 'unique' as const },
    { icon: 'ring-gem-02', name: '레이븐 사파이어 링', rarity: 'unique' as const },
    { icon: 'ring-gem-03', name: '자연의 에메랄드 반지', rarity: 'rare' as const },
    { icon: 'ring-gem-04', name: '결빙 불가 다이아 링', rarity: 'set' as const },
    { icon: 'ring-royal-01', name: '왕가의 황금 반지', rarity: 'unique' as const },
    { icon: 'ring-plain-01', name: '마법 강화 반지', rarity: 'magic' as const },
  ],
  amulet: [
    { icon: 'amulet-royal-01', name: '마라의 칼레이도스코프 목걸이', rarity: 'unique' as const },
    { icon: 'amulet-pendant-01', name: '대천사의 펜던트', rarity: 'unique' as const },
    { icon: 'amulet-relic-01', name: '고대 유물 룬 목걸이', rarity: 'rare' as const },
    { icon: 'amulet-talisman-01', name: '신성한 부적 목걸이', rarity: 'set' as const },
    { icon: 'amulet-rune-01', name: '지혜의 룬 아뮬렛', rarity: 'magic' as const },
  ],
};

export function generateRandomRpgCharacterPreset(requestedClassKey?: string): {
  character: Character;
  equipment: EquipmentSlots;
} {
  const chosenClass = (MARTIAL_CLASS_ROSTER.find((c) => c.key === requestedClassKey || c.name === requestedClassKey || c.affiliation === requestedClassKey || c.sect === requestedClassKey) as any) ||
    RPG_CLASS_ROSTER.find((c) => c.key === requestedClassKey || c.name === requestedClassKey) ||
    RPG_CLASS_ROSTER[Math.floor(Math.random() * RPG_CLASS_ROSTER.length)];

  const level = Math.floor(Math.random() * 25) + 75; // Lv 75 ~ 99
  const baseStr = 100 + Math.floor(Math.random() * 100);
  const baseDex = 100 + Math.floor(Math.random() * 100);
  const baseVit = 150 + Math.floor(Math.random() * 120);
  const baseEne = 40 + Math.floor(Math.random() * 80);

  const character: Character = {
    id: `hero-${chosenClass.key}-${Date.now()}`,
    name: `${chosenClass.name} 네임드`,
    class: chosenClass.name as any,
    level,
    stats: {
      strength: baseStr,
      dexterity: baseDex,
      vitality: baseVit,
      energy: baseEne,
      life: baseVit * 3 + level * 2,
      maxLife: baseVit * 3 + level * 2,
      mana: baseEne * 2 + level * 2,
      maxMana: baseEne * 2 + level * 2,
      defense: 100 + Math.floor(Math.random() * 200),
    },
    inventory: { items: [], maxSlots: 40, gold: 10000 },
    equipment: {} as any,
  };

  const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const randWeapon = pick(CODEX_ASSET_POOLS.weapon);
  const randShield = pick(CODEX_ASSET_POOLS.shield);
  const randHelmet = pick(CODEX_ASSET_POOLS.helmet);
  const randArmor = pick(CODEX_ASSET_POOLS.bodyArmor);
  const randGloves = pick(CODEX_ASSET_POOLS.gloves);
  const randBelt = pick(CODEX_ASSET_POOLS.belt);
  const randBoots = pick(CODEX_ASSET_POOLS.boots);
  const randRing1 = pick(CODEX_ASSET_POOLS.ring);
  const randRing2 = pick(CODEX_ASSET_POOLS.ring);
  const randAmulet = pick(CODEX_ASSET_POOLS.amulet);
  const randWeapon2 = pick(CODEX_ASSET_POOLS.weapon);
  const randShield2 = pick(CODEX_ASSET_POOLS.shield);

  const equipment: EquipmentSlots = {
    weapon: {
      id: `${randWeapon.icon}-${Date.now()}-w1`,
      icon: randWeapon.icon,
      name: `${chosenClass.name} ${randWeapon.name}`,
      type: 'weapon',
      rarity: randWeapon.rarity,
      description: '도감 등록 전설 무기',
      requiredLevel: 60,
      stats: [
        { label: 'Enhanced Damage %', value: randInt(150, 300) },
        { label: 'Increased Attack Speed (IAS)', value: randInt(20, 40) },
        { label: 'Crushing Blow %', value: randInt(20, 35) },
        { label: 'Deadly Strike %', value: randInt(15, 30) },
        { label: 'Life Steal %', value: randInt(6, 12) },
      ],
    },
    shield: {
      id: `${randShield.icon}-${Date.now()}-s1`,
      icon: randShield.icon,
      name: randShield.name,
      type: 'shield',
      rarity: randShield.rarity,
      description: '도감 등록 방패',
      requiredLevel: 60,
      stats: [
        { label: 'Faster Cast Rate (FCR)', value: randInt(25, 35) },
        { label: 'Faster Hit Recovery (FHR)', value: randInt(20, 55) },
        { label: 'All Resistances', value: randInt(35, 45) },
        { label: 'Increased Chance of Blocking %', value: randInt(30, 45) },
      ],
    },
    helmet: {
      id: `${randHelmet.icon}-${Date.now()}-h`,
      icon: randHelmet.icon,
      name: randHelmet.name,
      type: 'helmet',
      rarity: randHelmet.rarity,
      description: '도감 등록 투구',
      requiredLevel: 62,
      stats: [
        { label: 'All Skills', value: 2 },
        { label: 'Magic Find % (MF)', value: randInt(50, 75) },
        { label: 'All Attributes', value: 2 },
        { label: 'Life', value: 148 },
      ],
    },
    bodyArmor: {
      id: `${randArmor.icon}-${Date.now()}-a`,
      icon: randArmor.icon,
      name: randArmor.name,
      type: 'armor',
      rarity: randArmor.rarity,
      description: '도감 등록 갑옷',
      requiredLevel: 65,
      stats: [
        { label: 'All Skills', value: 2 },
        { label: 'Faster Run/Walk (FRW)', value: 45 },
        { label: 'Physical Damage Reduction %', value: 8 },
        { label: 'Magic Find % (MF)', value: randInt(80, 99) },
      ],
    },
    gloves: {
      id: `${randGloves.icon}-${Date.now()}-g`,
      icon: randGloves.icon,
      name: randGloves.name,
      type: 'gloves',
      rarity: randGloves.rarity,
      description: '도감 등록 장갑',
      requiredLevel: 76,
      stats: [
        { label: 'Increased Attack Speed (IAS)', value: 20 },
        { label: 'Life Steal %', value: randInt(7, 10) },
        { label: 'Open Wounds %', value: 25 },
        { label: 'Strength', value: randInt(10, 15) },
      ],
    },
    belt: {
      id: `${randBelt.icon}-${Date.now()}-b`,
      icon: randBelt.icon,
      name: randBelt.name,
      type: 'belt',
      rarity: randBelt.rarity,
      description: '도감 등록 벨트',
      requiredLevel: 80,
      stats: [
        { label: 'All Skills', value: 1 },
        { label: 'Faster Cast Rate (FCR)', value: 20 },
        { label: 'Enhanced Defense %', value: 120 },
      ],
    },
    boots: {
      id: `${randBoots.icon}-${Date.now()}-bt`,
      icon: randBoots.icon,
      name: randBoots.name,
      type: 'boots',
      rarity: randBoots.rarity,
      description: '도감 등록 부츠',
      requiredLevel: 42,
      stats: [
        { label: 'Faster Run/Walk (FRW)', value: 30 },
        { label: 'Magic Find % (MF)', value: randInt(30, 50) },
        { label: 'Faster Hit Recovery (FHR)', value: 10 },
        { label: 'Fire Resistance', value: randInt(20, 40) },
      ],
    },
    ringLeft: {
      id: `${randRing1.icon}-${Date.now()}-r1`,
      icon: randRing1.icon,
      name: randRing1.name,
      type: 'ring',
      rarity: randRing1.rarity,
      description: '도감 등록 반지',
      requiredLevel: 29,
      stats: [
        { label: 'All Skills', value: 1 },
        { label: 'Max Mana %', value: 25 },
        { label: 'Lightning Resistance', value: randInt(15, 30) },
      ],
    },
    ringRight: {
      id: `${randRing2.icon}-${Date.now()}-r2`,
      icon: randRing2.icon,
      name: randRing2.name,
      type: 'ring',
      rarity: randRing2.rarity,
      description: '도감 등록 반지',
      requiredLevel: 45,
      stats: [
        { label: 'Cannot Be Frozen', value: 1 },
        { label: 'Attack Rating', value: randInt(150, 250) },
        { label: 'Dexterity', value: randInt(15, 20) },
        { label: 'Cold Absorb %', value: 20 },
      ],
    },
    amulet: {
      id: `${randAmulet.icon}-${Date.now()}-am`,
      icon: randAmulet.icon,
      name: randAmulet.name,
      type: 'amulet',
      rarity: randAmulet.rarity,
      description: '도감 등록 목걸이',
      requiredLevel: 67,
      stats: [
        { label: 'All Skills', value: 2 },
        { label: 'All Attributes', value: 5 },
        { label: 'All Resistances', value: randInt(20, 30) },
      ],
    },
    weapon2: {
      id: `${randWeapon2.icon}-${Date.now()}-w2`,
      icon: randWeapon2.icon,
      name: `[스왑] ${randWeapon2.name}`,
      type: 'weapon',
      rarity: randWeapon2.rarity,
      description: '도감 등록 스왑 무기',
      requiredLevel: 60,
      stats: [
        { label: 'All Skills', value: 1 },
        { label: 'Faster Cast Rate (FCR)', value: randInt(20, 35) },
      ],
    },
    shield2: {
      id: `${randShield2.icon}-${Date.now()}-s2`,
      icon: randShield2.icon,
      name: `[스왑] ${randShield2.name}`,
      type: 'shield',
      rarity: randShield2.rarity,
      description: '도감 등록 스왑 방패',
      requiredLevel: 60,
      stats: [
        { label: 'Faster Hit Recovery (FHR)', value: randInt(20, 35) },
        { label: 'All Resistances', value: randInt(20, 35) },
      ],
    },
  };

  character.equipment = equipment;
  return { character, equipment };
}
