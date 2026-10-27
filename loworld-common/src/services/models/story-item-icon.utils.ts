import { ItemIconId } from './item-icon.model';
import { Item } from './item.model';
import { resolveItemIconId } from './item-icon.utils';
import { STORY_ITEM_ICON_DATASET_BASE, STORY_ITEM_ICON_MEDIA_BY_ID, STORY_ITEM_ICON_SVG_PATH_BY_ID } from './story-item-icon-paths.generated';

export const STORY_ITEM_ICON_NAMESPACE = 'story-item' as const;
export const STORY_ITEM_ICON_PREFIX = `${STORY_ITEM_ICON_NAMESPACE}:` as const;

/** Codex / story asset SVG id (e.g. weapon-sword-02, shield-buckler-01). */
export const STORY_CODEX_ASSET_ID_PATTERN =
  /^(weapon|armor|helmet|shield|boots|gloves|belt|ring|amulet)-[a-z0-9]+(?:-[0-9]{2})?$/;

/**
 * Default story asset per legacy inline icon family.
 * Keeps mock items (short-sword, leather-boots) visually aligned with codex defaults.
 */
export const LEGACY_ITEM_ICON_TO_STORY_ASSET_ID: Record<ItemIconId, string> = {
  sword: 'weapon-sword-01',
  'crystal-sword': 'weapon-crystal-01',
  dagger: 'weapon-dagger-01',
  bow: 'weapon-bow-01',
  shield: 'shield-round-01',
  armor: 'armor-leather-01',
  helmet: 'helmet-iron-01',
  boots: 'boots-leather-01',
  gloves: 'gloves-leather-01',
  belt: 'belt-sash-01',
  ring: 'ring-plain-01',
  amulet: 'amulet-pendant-01',
  'quest-scroll': 'weapon-relic-01',
};

const DEFAULT_STORY_ASSET_ID = LEGACY_ITEM_ICON_TO_STORY_ASSET_ID.sword;

/**
 * 33종 RPG 룬 영문 및 한글 명칭 → 정규화된 룬 코드(r01 ~ r33) 매핑 사전
 */
export const RPG_RUNE_NAME_TO_CODE: Record<string, string> = {
  // English lowercase
  el: 'r01',
  eld: 'r02',
  tir: 'r03',
  nef: 'r04',
  eth: 'r05',
  ith: 'r06',
  tal: 'r07',
  ral: 'r08',
  ort: 'r09',
  thul: 'r10',
  amn: 'r11',
  sol: 'r12',
  shael: 'r13',
  dol: 'r14',
  hel: 'r15',
  io: 'r16',
  lum: 'r17',
  ko: 'r18',
  fal: 'r19',
  lem: 'r20',
  pul: 'r21',
  um: 'r22',
  mal: 'r23',
  ist: 'r24',
  gul: 'r25',
  vex: 'r26',
  ohm: 'r27',
  lo: 'r28',
  sur: 'r29',
  ber: 'r30',
  jah: 'r31',
  cham: 'r32',
  zod: 'r33',
  // Korean
  엘: 'r01',
  엘드: 'r02',
  티르: 'r03',
  네프: 'r04',
  에트: 'r05',
  에드: 'r05',
  이더: 'r06',
  아이드: 'r06',
  탈: 'r07',
  랄: 'r08',
  오르트: 'r09',
  주울: 'r10',
  앰: 'r11',
  솔: 'r12',
  샤엘: 'r13',
  돌: 'r14',
  헬: 'r15',
  이오: 'r16',
  룸: 'r17',
  코: 'r18',
  팔: 'r19',
  렘: 'r20',
  풀: 'r21',
  움: 'r22',
  말: 'r23',
  이스트: 'r24',
  굴: 'r25',
  벡스: 'r26',
  옴: 'r27',
  로: 'r28',
  수르: 'r29',
  베르: 'r30',
  자: 'r31',
  참: 'r32',
  조드: 'r33',
};

/**
 * 임의의 문자열(접두사, ID, 영문/한글 이름 등)에서 정규 룬 코드(r01 ~ r33)를 추출
 */
export function resolveRpgRuneCode(rawInput: string | null | undefined): string | null {
  if (!rawInput) return null;
  let str = rawInput.trim().toLowerCase();
  while (str.startsWith('story-item:')) str = str.slice(11);
  while (str.startsWith('novel:')) str = str.slice(6);
  while (str.startsWith('socketable:')) str = str.slice(11);
  if (str.startsWith('rpg_rune_')) str = str.slice(9);
  if (str.startsWith('d2_rune_')) str = str.slice(8);
  if (str.startsWith('rune_')) str = str.slice(5);
  if (str.startsWith('rune-')) str = str.slice(5);
  if (str.startsWith('rune')) str = str.slice(4);

  // r01 ~ r33 format
  if (/^r0?[1-9]$|^r[1-2][0-9]$|^r3[0-3]$/.test(str)) {
    const num = parseInt(str.replace(/^r0?/, ''), 10);
    return `r${String(num).padStart(2, '0')}`;
  }

  // 1 ~ 33 number
  if (/^[1-9]$|^[1-2][0-9]$|^3[0-3]$/.test(str)) {
    const num = parseInt(str, 10);
    return `r${String(num).padStart(2, '0')}`;
  }

  // Name match
  if (str in RPG_RUNE_NAME_TO_CODE) {
    return RPG_RUNE_NAME_TO_CODE[str];
  }

  return null;
}

export function sanitizeStoryAssetId(input: string | null | undefined): string {
  if (!input) return DEFAULT_STORY_ASSET_ID;

  const runeCode = resolveRpgRuneCode(input);
  if (runeCode) {
    return runeCode;
  }

  let clean = input.trim();

  // 1. Strip all leading prefixes
  while (clean.startsWith('story-item:')) {
    clean = clean.slice(11);
  }
  while (clean.startsWith('novel:')) {
    clean = clean.slice(6);
  }

  // 2. If input is a URL or file path, extract file basename
  if (clean.includes('/')) {
    const filename = clean.split('/').pop() ?? clean;
    clean = filename.replace(/\.(svg|png|webp|jpg)$/i, '');
  } else {
    clean = clean.replace(/\.(svg|png|webp|jpg)$/i, '');
  }

  return clean;
}

export function isStoryCodexAssetId(value: string | null | undefined): boolean {
  if (!value) return false;
  const clean = sanitizeStoryAssetId(value);
  if (resolveRpgRuneCode(clean)) return true;
  return STORY_CODEX_ASSET_ID_PATTERN.test(clean);
}

export function isStoryItemIconName(value: string | null | undefined): boolean {
  return !!value && (value.startsWith(STORY_ITEM_ICON_PREFIX) || value.startsWith('novel:'));
}

export function isStoryItemIconKnownAsset(assetId: string | null | undefined): boolean {
  if (!assetId) {
    return false;
  }
  const clean = sanitizeStoryAssetId(assetId);
  const runeCode = resolveRpgRuneCode(clean);
  if (runeCode && runeCode in STORY_ITEM_ICON_MEDIA_BY_ID) {
    return true;
  }
  return (
    isStoryCodexAssetId(clean) ||
    clean in STORY_ITEM_ICON_MEDIA_BY_ID ||
    clean in STORY_ITEM_ICON_SVG_PATH_BY_ID
  );
}

export function toStoryItemIconName(assetId: string): string {
  const runeCode = resolveRpgRuneCode(assetId);
  if (runeCode) {
    return `${STORY_ITEM_ICON_PREFIX}${runeCode}`;
  }
  const cleanId = sanitizeStoryAssetId(assetId);
  if (isStoryItemIconKnownAsset(cleanId)) {
    return `${STORY_ITEM_ICON_PREFIX}${cleanId}`;
  }
  return `${STORY_ITEM_ICON_PREFIX}${DEFAULT_STORY_ASSET_ID}`;
}

/**
 * RPG 베이스 장비 및 유명 유니크/룬워드 명칭 → 도감 에셋 ID 정규 매핑 테이블
 */
export const RPG_BASE_EQUIPMENT_KEYWORDS: Array<{ patterns: string[]; assetId: string }> = [
  // ── Armor (갑옷) ──
  { patterns: ['메이지 플레이트', '메이지플레이트', 'mage plate', '메이지'], assetId: 'armor-heavy-01' },
  { patterns: ['아콘 플레이트', '아콘플레이트', 'archon plate', '수수께끼', 'enigma', '더스크 슈라우드', 'dusk shroud', '세이크리드 아머', 'sacred armor'], assetId: 'armor-relic-02' },
  { patterns: ['샤크스킨 아머', '샤크스킨아머', 'sharkskin armor', '독사마술사', 'skin of the vipermagi', '소서교복'], assetId: 'armor-heavy-02' },
  { patterns: ['브레스트 플레이트', '브레스트플레이트', 'breast plate'], assetId: 'armor-heavy-03' },
  { patterns: ['고딕 플레이트', '고딕플레이트', 'gothic plate'], assetId: 'armor-plate-01' },
  { patterns: ['풀 플레이트', '풀플레이트', 'full plate'], assetId: 'armor-plate-02' },
  { patterns: ['에인션트 아머', '에인션트아머', 'ancient armor'], assetId: 'armor-plate-03' },
  { patterns: ['본위브', 'boneweave'], assetId: 'armor-relic-01' },
  { patterns: ['체인메일', 'chain mail'], assetId: 'armor-leather-02' },
  { patterns: ['퀼티드', 'quilted', '레더아머', 'leather armor', '가죽 갑옷'], assetId: 'armor-leather-01' },

  // ── Shields (방패) ──
  { patterns: ['모나크', '모너크', 'monarch', '스피릿 방패', '영혼 방패', 'spirit shield'], assetId: 'shield-mystic-01' },
  { patterns: ['세이크리드 타아지', '세이크리드타아지', 'sacred targe'], assetId: 'shield-relic-01' },
  { patterns: ['자카럼', 'zakarum', '헤럴드 오브 자카럼', '호라즌'], assetId: 'shield-relic-02' },
  { patterns: ['보어텍스', 'vortex shield'], assetId: 'shield-relic-03' },
  { patterns: ['그림 쉴드', '그림쉴드', 'grim shield'], assetId: 'shield-kite-01' },
  { patterns: ['본 쉴드', '본쉴드', 'bone shield'], assetId: 'shield-buckler-02' },
  { patterns: ['스파이크 쉴드', '스파이크쉴드', 'spiked shield'], assetId: 'shield-buckler-03' },
  { patterns: ['타워 쉴드', '타워쉴드', 'tower shield'], assetId: 'shield-round-04' },
  { patterns: ['카이트 쉴드', '카이트쉴드', 'kite shield'], assetId: 'shield-round-03' },
  { patterns: ['스몰 쉴드', '스몰쉴드', 'small shield'], assetId: 'shield-round-02' },
  { patterns: ['버클러', 'buckler'], assetId: 'shield-round-01' },

  // ── Helmets (투구) ──
  { patterns: ['본 비지즈', '본비지즈', 'bone visage', '안다리엘', 'andariel'], assetId: 'helmet-mystic-03' },
  { patterns: ['샤코', 'shako', '할리퀸', 'harlequin'], assetId: 'helmet-crown-02' },
  { patterns: ['다이어뎀', 'diadem', '그리폰', 'griffon', '티아라', 'tiara', '서클릿', 'circlet'], assetId: 'helmet-relic-03' },
  { patterns: ['아리앗', 'arreat', '슬레이어 가드', '어벤져 가드'], assetId: 'helmet-horn-01' },
  { patterns: ['길리엄', 'guillaume', '윙드 헬름', 'winged helm'], assetId: 'helmet-relic-01' },
  { patterns: ['스틸 셰이드', 'steel shade'], assetId: 'helmet-relic-02' },
  { patterns: ['스파이어드 헬름', 'spired helm', '밤날개', 'nightwing'], assetId: 'helmet-mystic-01' },
  { patterns: ['그레이트 헬름', 'great helm'], assetId: 'helmet-hood-01' },
  { patterns: ['본 헬름', 'bone helm'], assetId: 'helmet-hood-04' },
  { patterns: ['스컬 캡', 'skull cap'], assetId: 'helmet-iron-02' },
  { patterns: ['풀 헬름', 'full helm'], assetId: 'helmet-iron-04' },
  { patterns: ['캡', 'cap'], assetId: 'helmet-iron-01' },

  // ── Weapons (무기) ──
  { patterns: ['페이즈 블레이드', '패이즈 블레이드', 'phase blade', '고뇌', 'grief', '마소', 'last wish'], assetId: 'weapon-relic-01' },
  { patterns: ['크리스탈 소드', '크리스탈소드', 'crystal sword', '스피릿 검', '영혼 검'], assetId: 'weapon-crystal-01' },
  { patterns: ['디멘셔널 블레이드', 'dimensional blade'], assetId: 'weapon-crystal-02' },
  { patterns: ['프레일', 'flail', '오크의 심장', 'heart of the oak', '오심', 'hoto', '스커지', 'scourge', '메이스', 'mace'], assetId: 'weapon-mace-02' },
  { patterns: ['클럽', 'club', '워 해머', 'war hammer'], assetId: 'weapon-mace-01' },
  { patterns: ['그랜드 메이트런', 'grand matron', '하이드라 보우', 'hydra bow', '윈드포스', 'windforce', '신뢰', 'faith', '롱 보우', 'long bow'], assetId: 'weapon-bow-03' },
  { patterns: ['헌터즈 보우', 'hunter'], assetId: 'weapon-bow-02' },
  { patterns: ['숏 보우', 'short bow', '보우', '활'], assetId: 'weapon-bow-01' },
  { patterns: ['석궁', 'crossbow', '발리스타', 'ballista'], assetId: 'weapon-crossbow-02' },
  { patterns: ['라이트 석궁', 'light crossbow'], assetId: 'weapon-crossbow-01' },
  { patterns: ['버서커 액스', 'berserker axe', '죽숨', 'botd', '죽음의 숨결', '폴액스', '자이언트 쓰레셔', 'giant thresher', '쓰레셔', 'thresher', '무한', 'infinity', '콜로서스 불스', '통찰', 'insight'], assetId: 'weapon-polearm-02' },
  { patterns: ['창', 'spear', '파이크', 'pike'], assetId: 'weapon-polearm-01' },
  { patterns: ['단검', 'dagger', '위저드스파이크', 'wizardspike', '더크', 'dirk', '크리스', 'kris'], assetId: 'weapon-dagger-01' },
  { patterns: ['지팡이', 'staff', '완드', 'wand', '오큘러스', 'oculus', '엘드리치', 'eschuta'], assetId: 'weapon-crystal-01' },
  { patterns: ['콜로서스 블레이드', 'colossus blade', '워 소드', 'war sword', '그랜드파더', 'grandfather', '츠바이핸더'], assetId: 'weapon-sword-04' },
  { patterns: ['배스터드 소드', 'bastard sword'], assetId: 'weapon-sword-05' },
  { patterns: ['브로드 소드', 'broad sword', '롱소드', 'long sword'], assetId: 'weapon-sword-02' },
  { patterns: ['숏 소드', 'short sword', '소드', '검'], assetId: 'weapon-sword-01' },

  // ── Gloves (장갑) ──
  { patterns: ['오우거 건틀릿', 'ogre gauntlets', '강철찢개', 'steelrend'], assetId: 'gloves-claw-03' },
  { patterns: ['뱀브레이스', 'vambraces', '드라쿨', 'dracul'], assetId: 'gloves-claw-02' },
  { patterns: ['뱀파이어본', 'vampirebone'], assetId: 'gloves-claw-01' },
  { patterns: ['배틀 건틀릿', 'battle gauntlets', '워 건틀릿', 'war gauntlets'], assetId: 'gloves-gauntlet-02' },
  { patterns: ['스틸 건틀릿', 'steel gauntlets', '크루세이더 건틀릿'], assetId: 'gloves-mystic-01' },
  { patterns: ['레더 글러브', 'leather gloves', '챈스 가드', 'chance guards', '메이지피스트', 'magefist', '마수', '가죽 장갑'], assetId: 'gloves-leather-01' },
  { patterns: ['건틀릿', 'gauntlets'], assetId: 'gloves-cloth-01' },

  // ── Belts (벨트) ──
  { patterns: ['스파이더웹 새시', 'spiderweb sash', '스웹', '아라크니드 메쉬', 'arachnid mesh'], assetId: 'belt-plated-02' },
  { patterns: ['미스릴 코일', 'mithril coil', '베르둔고', 'verdungo'], assetId: 'belt-utility-03' },
  { patterns: ['뱀파이어팽', 'vampirefang', '노스페라투', 'nosferatu'], assetId: 'belt-plated-03' },
  { patterns: ['플레이트 벨트', 'plated belt', '선더갓', 'thundergod', '천둥신'], assetId: 'belt-relic-03' },
  { patterns: ['샤크스킨 벨트', 'sharkskin belt', '레이저테일', 'razortail', '관통 벨트'], assetId: 'belt-leather-02' },
  { patterns: ['메쉬 벨트', 'mesh belt', '골드랩', 'goldwrap', '금박 허리띠'], assetId: 'belt-leather-01' },
  { patterns: ['워 벨트', 'war belt'], assetId: 'belt-leather-04' },
  { patterns: ['라이트 벨트', 'light belt', '새시', 'sash'], assetId: 'belt-sash-01' },

  // ── Boots (신발) ──
  { patterns: ['배틀 부츠', 'battle boots', '워 트래블러', 'war traveler', '배추'], assetId: 'boots-travel-02' },
  { patterns: ['워 부츠', 'war boots', '고어 라이더', 'gore rider', '선혈 기수'], assetId: 'boots-travel-03' },
  { patterns: ['스캐럽쉘', 'scarabshell', '모래폭풍', 'sandstorm'], assetId: 'boots-greaves-01' },
  { patterns: ['본위브 부츠', 'boneweave boots', '골수걸음', 'marrowwalk'], assetId: 'boots-greaves-02' },
  { patterns: ['그리브', 'greaves', '물나그네', 'waterwalk'], assetId: 'boots-cloth-01' },
  { patterns: ['부츠', 'boots', '핫스퍼', 'hotspur', '가죽 부츠'], assetId: 'boots-leather-01' },

  // ── Rings (반지) ──
  { patterns: ['조던', 'soj', 'stone of jordan', '요르단'], assetId: 'ring-plain-03' },
  { patterns: ['불-카토스', '불카토스', 'bul-kathos', '웨딩링', '결혼반지'], assetId: 'ring-royal-01' },
  { patterns: ['레이븐', 'raven frost', '칠흑서리'], assetId: 'ring-gem-01' },
  { patterns: ['위스프', 'wisp projector'], assetId: 'ring-gem-02' },
  { patterns: ['나겔링', 'nagelring'], assetId: 'ring-plain-01' },
  { patterns: ['마날드', 'manald'], assetId: 'ring-plain-02' },
  { patterns: ['드워프', 'dwarf star', '왜소'], assetId: 'ring-plain-04' },
  { patterns: ['반지', 'ring'], assetId: 'ring-plain-01' },

  // ── Amulets (목걸이) ──
  { patterns: ['마라의 만화경', '마라', 'mara'], assetId: 'amulet-medallion-01' },
  { patterns: ['하이로드', 'highlord', '대군주'], assetId: 'amulet-royal-01' },
  { patterns: ['아트마', 'atma'], assetId: 'amulet-rune-01' },
  { patterns: ['고양이의 눈', 'cat'], assetId: 'amulet-talisman-03' },
  { patterns: ['초승달', 'crescent moon'], assetId: 'amulet-talisman-02' },
  { patterns: ['아뮬렛', '목걸이', 'amulet'], assetId: 'amulet-pendant-01' },
];

/**
 * Maps any item icon field / id / type to an `lw-icon` name (`story-item:assetId`).
 */
export function resolveStoryItemIconName(item: Pick<Item, 'id' | 'type' | 'icon'> & { name?: string; category?: string }): string {
  // 1. 룬 아이템 식별 (icon, id, name, type)
  if (item.icon) {
    const runeFromIcon = resolveRpgRuneCode(item.icon);
    if (runeFromIcon) return `${STORY_ITEM_ICON_PREFIX}${runeFromIcon}`;
  }

  if (item.id) {
    const runeFromId = resolveRpgRuneCode(item.id);
    if (runeFromId) return `${STORY_ITEM_ICON_PREFIX}${runeFromId}`;
  }

  const isExplicitRune =
    item.type === 'rune' ||
    (item as any).category === 'rune' ||
    item.id.toLowerCase().includes('rune') ||
    (item.name !== undefined && (item.name.includes('룬') || /\brune\b/i.test(item.name)));

  if (isExplicitRune) {
    if (item.name) {
      for (const [key, code] of Object.entries(RPG_RUNE_NAME_TO_CODE)) {
        if (item.name.toLowerCase().includes(key)) {
          return `${STORY_ITEM_ICON_PREFIX}${code}`;
        }
      }
    }
    return `${STORY_ITEM_ICON_PREFIX}r01`;
  }

  // 2. 명시된 icon 또는 id가 이미 유효한 도감 에셋인 경우
  if (item.icon) {
    const cleanIcon = sanitizeStoryAssetId(item.icon);
    if (isStoryItemIconKnownAsset(cleanIcon)) {
      return `${STORY_ITEM_ICON_PREFIX}${cleanIcon}`;
    }
  }

  if (item.id) {
    const cleanItemId = sanitizeStoryAssetId(item.id);
    if (isStoryItemIconKnownAsset(cleanItemId)) {
      return `${STORY_ITEM_ICON_PREFIX}${cleanItemId}`;
    }
  }

  // 3. RPG 베이스 장비 및 유명 아이템 명칭/키워드 정밀 매칭
  const searchText = `${item.id} ${item.name ?? ''} ${item.type ?? ''}`.toLowerCase();
  for (const entry of RPG_BASE_EQUIPMENT_KEYWORDS) {
    for (const pattern of entry.patterns) {
      if (searchText.includes(pattern)) {
        return `${STORY_ITEM_ICON_PREFIX}${entry.assetId}`;
      }
    }
  }

  const legacyId = resolveItemIconId(item);
  const assetId = LEGACY_ITEM_ICON_TO_STORY_ASSET_ID[legacyId] ?? DEFAULT_STORY_ASSET_ID;
  return `${STORY_ITEM_ICON_PREFIX}${assetId}`;
}

/**
 * Converts icon input passed to `lw-item-icon` (legacy id, asset id, or story name) to `lw-icon` name.
 */
function resolveStoryItemIconRelativePath(assetId: string): string {
  const cleanId = sanitizeStoryAssetId(assetId);
  const media = STORY_ITEM_ICON_MEDIA_BY_ID[cleanId];
  if (media?.path) {
    return media.path;
  }
  const svgPath = STORY_ITEM_ICON_SVG_PATH_BY_ID[cleanId];
  if (svgPath) {
    return svgPath;
  }
  const category = cleanId.split('-')[0] ?? 'weapon';
  const fallbackAssetId = LEGACY_ITEM_ICON_TO_STORY_ASSET_ID[category as ItemIconId] ?? DEFAULT_STORY_ASSET_ID;
  const fallbackMedia = STORY_ITEM_ICON_MEDIA_BY_ID[fallbackAssetId];
  if (fallbackMedia?.path) {
    return fallbackMedia.path;
  }
  return `png/${category}/${cleanId}.png`;
}

/** Absolute URL path for a story codex asset id (vector or raster). */
export function resolveStoryItemIconMediaUrl(assetId: string, base: string = STORY_ITEM_ICON_DATASET_BASE): string {
  return `${base}/${resolveStoryItemIconRelativePath(assetId)}`;
}

/** Returns the content-relative path (e.g. 'novel/item-icons/png/weapon/weapon-sword-01.png') for use with StoryContentHandle.assetUrl */
export function toContentStoryItemAssetPath(assetId: string): string {
  return `novel/item-icons/${resolveStoryItemIconRelativePath(assetId)}`;
}

/** RPG socketable code (gcv, r01, …) → PNG path map with PNG fallback. */
export function resolveSocketableIconUrl(code: string, kind: 'gem' | 'rune', base: string = STORY_ITEM_ICON_DATASET_BASE): string {
  const mapped = STORY_ITEM_ICON_MEDIA_BY_ID[code];
  if (mapped?.path) {
    return `${base}/${mapped.path}`;
  }
  return `${base}/png/${kind}/${code}.png`;
}

/** Whether the asset is a raster image (PNG/WebP) rather than SVG. */
export function isStoryItemIconRaster(assetId: string): boolean {
  const cleanId = sanitizeStoryAssetId(assetId);
  const media = STORY_ITEM_ICON_MEDIA_BY_ID[cleanId];
  if (media) {
    return media.kind === 'raster';
  }
  const relPath = resolveStoryItemIconRelativePath(cleanId);
  return /\.(png|webp|jpg|jpeg|gif)(\?.*)?$/i.test(relPath) || relPath.includes('png/');
}

/** @deprecated Prefer resolveStoryItemIconMediaUrl — alias for backward compatibility. */
export function resolveStoryItemIconSvgUrl(assetId: string): string {
  return resolveStoryItemIconMediaUrl(assetId);
}

export function toLwIconNameFromIconKey(iconKey: string): string {
  if (!iconKey) {
    return `${STORY_ITEM_ICON_PREFIX}${DEFAULT_STORY_ASSET_ID}`;
  }
  const runeCode = resolveRpgRuneCode(iconKey);
  if (runeCode) {
    return `${STORY_ITEM_ICON_PREFIX}${runeCode}`;
  }
  if (isStoryItemIconName(iconKey)) {
    const key = iconKey.startsWith(STORY_ITEM_ICON_PREFIX)
      ? iconKey.slice(STORY_ITEM_ICON_PREFIX.length)
      : iconKey.slice('novel:'.length);
    const runeFromKey = resolveRpgRuneCode(key);
    if (runeFromKey) {
      return `${STORY_ITEM_ICON_PREFIX}${runeFromKey}`;
    }
    return iconKey;
  }
  const cleanKey = iconKey.startsWith('socketable:') ? iconKey.replace('socketable:', '') : iconKey;
  const cleanRune = resolveRpgRuneCode(cleanKey);
  if (cleanRune) {
    return `${STORY_ITEM_ICON_PREFIX}${cleanRune}`;
  }
  if (
    isStoryCodexAssetId(cleanKey) ||
    cleanKey in STORY_ITEM_ICON_MEDIA_BY_ID ||
    cleanKey in STORY_ITEM_ICON_SVG_PATH_BY_ID
  ) {
    return toStoryItemIconName(cleanKey);
  }
  const legacy = cleanKey as ItemIconId;
  if (legacy in LEGACY_ITEM_ICON_TO_STORY_ASSET_ID) {
    return toStoryItemIconName(LEGACY_ITEM_ICON_TO_STORY_ASSET_ID[legacy]);
  }
  return toStoryItemIconName(DEFAULT_STORY_ASSET_ID);
}
