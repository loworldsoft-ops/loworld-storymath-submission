export const RPG_HERO_ASSET_BASE_URL = '/assets/d2r-heroes' as const;
export const MARTIAL_HERO_ASSET_BASE_URL = '/assets/wuxia-heroes' as const;

export type RpgHeroGender = 'male' | 'female';

export const RPG_HERO_CLASS_FILENAME_MAP: Record<string, string> = {
  amazon: 'amazon',
  아마존: 'amazon',
  rogue: 'amazon',
  sorceress: 'sorceress',
  원소술사: 'sorceress',
  mage: 'sorceress',
  necromancer: 'necromancer',
  강령술사: 'necromancer',
  paladin: 'paladin',
  성기사: 'paladin',
  barbarian: 'barbarian',
  야만용사: 'barbarian',
  warrior: 'barbarian',
  druid: 'druid',
  드루이드: 'druid',
  assassin: 'assassin',
  암살자: 'assassin',
};

/** 무협 소속 문파별 이미지 파일 접두사 매핑 */
export const MARTIAL_HERO_CLASS_FILENAME_MAP: Record<string, string> = {
  'hwashan-sword': 'hwashan',
  'hwashan-swordsman': 'hwashan',
  'hwashan_sword': 'hwashan',
  'hwashan': 'hwashan',
  '화산파': 'hwashan',
  '화산': 'hwashan',
  '화산파 (화산파)': 'hwashan',
  '화산파 (華山派)': 'hwashan',
  '화산파 검수': 'hwashan',
  'shaolin-monk': 'shaolin',
  'shaolin_monk': 'shaolin',
  'shaolin': 'shaolin',
  '소림사': 'shaolin',
  '소림': 'shaolin',
  '소림사 (소림사)': 'shaolin',
  '소림사 (少林寺)': 'shaolin',
  '소림사 권승': 'shaolin',
  'dangmun-ranger': 'dangmun',
  'dangmun_ranger': 'dangmun',
  'dangmun': 'dangmun',
  '사천당가': 'dangmun',
  '사천당가 (사천당가)': 'dangmun',
  '사천당가 (四川唐門)': 'dangmun',
  '당가': 'dangmun',
  '당문': 'dangmun',
  '당문 암기사': 'dangmun',
  'tang-assassin': 'dangmun',
  'cult-berserker': 'cult',
  'cult_berserker': 'cult',
  'cult': 'cult',
  '천마신교': 'cult',
  '천마신교 (마교)': 'cult',
  '천마신교 (天魔神敎)': 'cult',
  '천마': 'cult',
  '마교': 'cult',
  '마교 광전사': 'cult',
  'wudang-taoist': 'wudang',
  'wudang_taoist': 'wudang',
  'wudang': 'wudang',
  '무당파': 'wudang',
  '무당': 'wudang',
  '무당파 (무당파)': 'wudang',
  '무당파 (武當派)': 'wudang',
  '무당파 도사': 'wudang',
  'namgung-spear': 'namgung',
  'namgung_spear': 'namgung',
  'namgung': 'namgung',
  '남궁세가': 'namgung',
  '남궁': 'namgung',
  '남궁세가 (남궁세가)': 'namgung',
  '남궁세가 (南宮世家)': 'namgung',
  '남궁세가 창술사': 'namgung',
};

/**
 * Resolves absolute browser asset URL for a hero illustration with gender variant support.
 * Supports both D2R heroes and Wuxia sect heroes.
 */
export function resolveRpgHeroIllustrationUrl(
  classKey?: string | null,
  gender: RpgHeroGender = 'male',
): string {
  if (!classKey) {
    return `${RPG_HERO_ASSET_BASE_URL}/paladin_${gender}.png`;
  }

  const raw = classKey.trim();
  const normalized = raw.toLowerCase();

  // 1. 무협 소속 문파 전용 고화질 일러스트 우선 매핑
  const directMartial = MARTIAL_HERO_CLASS_FILENAME_MAP[normalized] || MARTIAL_HERO_CLASS_FILENAME_MAP[raw];
  if (directMartial) {
    return `${MARTIAL_HERO_ASSET_BASE_URL}/${directMartial}_${gender}.png`;
  }

  // 1-1. 무협 문파 키워드 퍼지 매칭 (화산, 소림, 당가/당문, 마교/천마, 무당, 남궁)
  if (normalized.includes('hwashan') || raw.includes('화산')) {
    return `${MARTIAL_HERO_ASSET_BASE_URL}/hwashan_${gender}.png`;
  }
  if (normalized.includes('shaolin') || raw.includes('소림')) {
    return `${MARTIAL_HERO_ASSET_BASE_URL}/shaolin_${gender}.png`;
  }
  if (normalized.includes('dangmun') || normalized.includes('tang') || raw.includes('당문') || raw.includes('당가')) {
    return `${MARTIAL_HERO_ASSET_BASE_URL}/dangmun_${gender}.png`;
  }
  if (normalized.includes('cult') || raw.includes('천마') || raw.includes('마교')) {
    return `${MARTIAL_HERO_ASSET_BASE_URL}/cult_${gender}.png`;
  }
  if (normalized.includes('wudang') || raw.includes('무당')) {
    return `${MARTIAL_HERO_ASSET_BASE_URL}/wudang_${gender}.png`;
  }
  if (normalized.includes('namgung') || raw.includes('남궁')) {
    return `${MARTIAL_HERO_ASSET_BASE_URL}/namgung_${gender}.png`;
  }

  // 2. D2R 클래스 매핑
  const filename = RPG_HERO_CLASS_FILENAME_MAP[normalized] || 'paladin';
  return `${RPG_HERO_ASSET_BASE_URL}/${filename}_${gender}.png`;
}
