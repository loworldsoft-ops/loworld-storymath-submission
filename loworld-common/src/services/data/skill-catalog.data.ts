import type { SkillDefinition, SkillDiscipline } from '../models/skill.model';
import { buildRpgSkillCatalog } from '../utils/rpg-skill-catalog.util';
import { SKILL_COMBAT_PROFILES } from './skill-combat-profiles.data';
import { getSkillParagraphStory } from './skill-paragraph-stories.data';

export const SKILL_DISCIPLINE_LABELS: Record<SkillDiscipline, string> = {
  warrior: '⚔️ 전사',
  sorceress: '🔥 마법사',
  archer: '🏹 궁수',
  necromancer: '💀 객사',
  paladin: '✨ 성기사',
  druid: '🌿 드루이드',
  assassin: '🗡️ 암살자',
};

export const DEFAULT_SKILL_CATALOG: SkillDefinition[] = [
  // ── 전사 (Barbarian) ──
  {
    id: 'sword-wind',
    name: '검풍',
    description: '검기를 일으켜 주변 적을 베어낸다. 회오리 베기에 해당.',
    type: 'physical',
    discipline: 'warrior',
    iconHint: '⚔️',
  },
  {
    id: 'mighty-blow',
    name: '맹격',
    description: '무기를 내리쳐 적을 기절시키는 강타.',
    type: 'physical',
    discipline: 'warrior',
    iconHint: '💥',
  },
  {
    id: 'leap-strike',
    name: '도약 참',
    description: '공중으로 뛰어올라 착지 지점의 적을 강타한다.',
    type: 'physical',
    discipline: 'warrior',
    iconHint: '🦘',
  },
  {
    id: 'iron-wall',
    name: '철벽',
    description: '내공으로 방어막을 펼쳐 받는 피해를 줄인다.',
    type: 'support',
    discipline: 'warrior',
    iconHint: '🛡️',
  },

  // ── 마법사 (Sorceress) ──
  {
    id: 'fireball',
    name: '화염구',
    description: '응축된 화염을 구체로 만들어 적에게 던진다.',
    type: 'magic',
    discipline: 'sorceress',
    iconHint: '🔥',
    elementAffinity: 'fire',
  },
  {
    id: 'frost-nova',
    name: '서리 폭발',
    description: '주변에 서리를 폭발시켜 적을 둔화시킨다.',
    type: 'magic',
    discipline: 'sorceress',
    iconHint: '❄️',
    elementAffinity: 'water',
  },
  {
    id: 'chain-lightning',
    name: '연쇄 번개',
    description: '번개가 연쇄적으로 튕겨 다수의 적을 타격한다.',
    type: 'magic',
    discipline: 'sorceress',
    iconHint: '⚡',
    elementAffinity: 'wind',
  },
  {
    id: 'meteor',
    name: '유성',
    description: '하늘에서 유성을 떨어뜨려 넓은 지역을 불태운다.',
    type: 'magic',
    discipline: 'sorceress',
    iconHint: '☄️',
  },

  // ── 궁수 (Amazon) ──
  {
    id: 'magic-arrow',
    name: '마력 화살',
    description: '마력을 담은 화살로 적의 방어를 무시한다.',
    type: 'physical',
    discipline: 'archer',
    iconHint: '🏹',
  },
  {
    id: 'multishot',
    name: '다발 사격',
    description: '한 번에 여러 발의 화살을 퍼부어 광역 타격한다.',
    type: 'physical',
    discipline: 'archer',
    iconHint: '🎯',
  },
  {
    id: 'guided-arrow',
    name: '유도 화살',
    description: '적을 추적하는 화살을 발사한다.',
    type: 'physical',
    discipline: 'archer',
    iconHint: '🔮',
  },
  {
    id: 'strafe',
    name: '요격',
    description: '이동하며 연속 사격으로 전장을 휩쓴다.',
    type: 'physical',
    discipline: 'archer',
    iconHint: '💨',
  },

  // ── 객사 (Necromancer) ──
  {
    id: 'raise-skeleton',
    name: '해골 소환',
    description: '시체에서 해골 병사를 일으켜 전투를 돕게 한다.',
    type: 'magic',
    discipline: 'necromancer',
    iconHint: '💀',
  },
  {
    id: 'bone-spear',
    name: '뼈 창',
    description: '뼈로 만든 창을 발사해 관통 피해를 준다.',
    type: 'magic',
    discipline: 'necromancer',
    iconHint: '🦴',
  },
  {
    id: 'corpse-explosion',
    name: '시체 폭발',
    description: '시체를 폭발시켜 주변 적에게 피해를 준다.',
    type: 'magic',
    discipline: 'necromancer',
    iconHint: '💣',
  },
  {
    id: 'bone-armor',
    name: '뼈 갑옷',
    description: '뼈 조각으로 방어막을 두르어 피해를 흡수한다.',
    type: 'support',
    discipline: 'necromancer',
    iconHint: '🦴',
  },

  // ── 성기사 (Paladin) ──
  {
    id: 'holy-bolt',
    name: '성광',
    description: '신성한 빛줄기로 언데드에게 강력한 피해를 준다.',
    type: 'magic',
    discipline: 'paladin',
    iconHint: '✨',
  },
  {
    id: 'zeal',
    name: '충격',
    description: '신앙의 열정으로 연속 공격을 가한다.',
    type: 'physical',
    discipline: 'paladin',
    iconHint: '⚡',
  },
  {
    id: 'blessed-hammer',
    name: '축복의 망치',
    description: '회전하는 성스러운 망치를 소환해 적을 타격한다.',
    type: 'magic',
    discipline: 'paladin',
    iconHint: '🔨',
  },
  {
    id: 'sacrifice',
    name: '희생',
    description: '자신의 체력을 바쳐 강력한 일격을 가한다.',
    type: 'physical',
    discipline: 'paladin',
    iconHint: '🩸',
  },

  // ── 드루이드 (Druid) ──
  {
    id: 'tornado',
    name: '회오리바람',
    description: '소형 회오리를 생성해 적을 밀어낸다.',
    type: 'magic',
    discipline: 'druid',
    iconHint: '🌪️',
  },
  {
    id: 'armageddon',
    name: '종말',
    description: '하늘에서 운석과 번개를 떨어뜨려 전장을 파괴한다.',
    type: 'magic',
    discipline: 'druid',
    iconHint: '🌋',
  },
  {
    id: 'werewolf',
    name: '늑대 변신',
    description: '늑대 형상으로 변해 공격력과 이동 속도가 상승한다.',
    type: 'physical',
    discipline: 'druid',
    iconHint: '🐺',
  },
  {
    id: 'cyclone-armor',
    name: '태풍 갑옷',
    description: '회오리 방어막으로 원거리 공격을 흡수한다.',
    type: 'support',
    discipline: 'druid',
    iconHint: '🌀',
  },

  // ── 암살자 (Assassin) ──
  {
    id: 'tiger-strike',
    name: '호랑이 일격',
    description: '연속 타격으로 기 축적 후 강력한 마무리 일격.',
    type: 'physical',
    discipline: 'assassin',
    iconHint: '🐯',
  },
  {
    id: 'dragon-claw',
    name: '용조',
    description: '발톱처럼 빠른 연속 공격으로 적을 찢는다.',
    type: 'physical',
    discipline: 'assassin',
    iconHint: '🐉',
  },
  {
    id: 'shadow-master',
    name: '그림자',
    description: '그림자 분신을 소환해 함께 전투한다.',
    type: 'magic',
    discipline: 'assassin',
    iconHint: '👤',
  },
  {
    id: 'flash-strike',
    name: '섬광',
    description: '순간 가속하여 적의 허를 찌르는 일섬.',
    type: 'physical',
    discipline: 'assassin',
    iconHint: '⚡',
  },
];

const DEFAULT_SKILL_CATALOG_WITH_COMBAT: SkillDefinition[] = DEFAULT_SKILL_CATALOG.map((skill) => ({
  ...skill,
  combat: skill.combat ?? SKILL_COMBAT_PROFILES[skill.id],
  story: skill.story ?? getSkillParagraphStory(skill.id, skill.name),
}));

let _rpgSkillCatalog: SkillDefinition[] | null = null;

/** D2R LoD 210 skills 온디맨드 지연 카탈로그 생성 */
export function getRpgSkillCatalog(): SkillDefinition[] {
  if (!_rpgSkillCatalog) {
    _rpgSkillCatalog = buildRpgSkillCatalog().map((skill) => ({
      ...skill,
      story: skill.story ?? getSkillParagraphStory(skill.id, skill.name),
    }));
  }
  return _rpgSkillCatalog;
}

/** D2R LoD 210 skills — 지연 초기화 Proxy (초기 번들 로드 시점 static evaluation 방지) */
export const RPG_SKILL_CATALOG: SkillDefinition[] = new Proxy([] as SkillDefinition[], {
  get(target, prop, receiver) {
    const list = getRpgSkillCatalog();
    const val = Reflect.get(list, prop, receiver);
    return typeof val === 'function' ? val.bind(list) : val;
  },
  has(target, prop) {
    return Reflect.has(getRpgSkillCatalog(), prop);
  },
  ownKeys(target) {
    return Reflect.ownKeys(getRpgSkillCatalog());
  },
  getOwnPropertyDescriptor(target, prop) {
    return Reflect.getOwnPropertyDescriptor(getRpgSkillCatalog(), prop);
  },
});

let runtimeSkillCatalog: SkillDefinition[] | null = null;
let runtimeUseRpgCatalog = false;

/** Firestore novelSkills 로드 후 런타임 카탈로그 교체 */
export function setRuntimeSkillCatalog(catalog: SkillDefinition[], options?: { rpg?: boolean }): void {
  runtimeSkillCatalog = catalog.map((skill) => ({
    ...skill,
    combat: skill.combat ?? SKILL_COMBAT_PROFILES[skill.id],
    story: skill.story ?? getSkillParagraphStory(skill.id, skill.name),
  }));
  runtimeUseRpgCatalog = options?.rpg ?? false;
}

export function getActiveSkillCatalog(options?: { rpg?: boolean }): SkillDefinition[] {
  if (runtimeSkillCatalog) {
    return runtimeSkillCatalog;
  }
  if (options?.rpg) {
    return RPG_SKILL_CATALOG;
  }
  return DEFAULT_SKILL_CATALOG_WITH_COMBAT;
}

export function isRpgSkillCatalogActive(): boolean {
  return runtimeUseRpgCatalog || runtimeSkillCatalog === RPG_SKILL_CATALOG;
}

export function getSkillDefinition(
  skillId: string,
  catalog = getActiveSkillCatalog(),
): SkillDefinition | undefined {
  return catalog.find((item) => item.id === skillId)
    ?? RPG_SKILL_CATALOG.find((item) => item.id === skillId)
    ?? DEFAULT_SKILL_CATALOG_WITH_COMBAT.find((item) => item.id === skillId);
}
