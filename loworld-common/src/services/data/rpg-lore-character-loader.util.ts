import type { LoreCharacterEntry, RpgCreatureType, RpgLoreCharacterEquippedItem, RpgLoreCharacterSkill } from '../models/rpg-lore-character.model';

export type {
  LoreCharacterEntry,
  RpgCreatureType,
  RpgLoreCharacterEquippedItem,
  RpgLoreCharacterSkill,
};

let cachedLoreCodex: readonly LoreCharacterEntry[] | null = null;
let cachedLoreByKey: Map<string, LoreCharacterEntry> | null = null;
let loadingPromise: Promise<{
  codex: readonly LoreCharacterEntry[];
  byKey: Map<string, LoreCharacterEntry>;
}> | null = null;

/**
 * D2 로어 인물 도감이 메모리에 로드되었는지 여부
 */
export function isRpgLoreCharacterCodexLoaded(): boolean {
  return cachedLoreCodex !== null;
}

/**
 * 42인 D2R 로어 캐릭터 도감을 온디맨드 비동기 dynamic import 방식으로 로드
 */
export async function loadRpgLoreCharacterCodexAsync(): Promise<{
  codex: readonly LoreCharacterEntry[];
  byKey: Map<string, LoreCharacterEntry>;
}> {
  if (cachedLoreCodex && cachedLoreByKey) {
    return { codex: cachedLoreCodex, byKey: cachedLoreByKey };
  }

  if (!loadingPromise) {
    loadingPromise = (async () => {
      try {
        const mod = await import('./rpg-lore-character-codex.data');
        cachedLoreCodex = mod.LORE_CHARACTER_CODEX;
        cachedLoreByKey = mod.RPG_LORE_CHARACTER_BY_KEY;
        return { codex: cachedLoreCodex, byKey: cachedLoreByKey };
      } finally {
        loadingPromise = null;
      }
    })();
  }
  return loadingPromise;
}

const DEFAULT_FALLBACK_LORE_CODEX: readonly LoreCharacterEntry[] = [];
const DEFAULT_FALLBACK_LORE_BY_KEY = new Map<string, LoreCharacterEntry>();

/**
 * 동기적 도감 목록 반환 (지연 평가 및 안전 폴백)
 */
export function getRpgLoreCharacterCodex(): readonly LoreCharacterEntry[] {
  return cachedLoreCodex ?? DEFAULT_FALLBACK_LORE_CODEX;
}

/**
 * 키/ID로 D2 로어 캐릭터 조회
 */
export function getRpgLoreCharacterByKey(key: string): LoreCharacterEntry | undefined {
  return (cachedLoreByKey ?? DEFAULT_FALLBACK_LORE_BY_KEY).get(key);
}

/**
 * LORE_CHARACTER_CODEX 투명 프록시 (100% 하위 호환성 보장)
 */
export const LORE_CHARACTER_CODEX: readonly LoreCharacterEntry[] = new Proxy(
  [] as readonly LoreCharacterEntry[],
  {
    get(target, prop, receiver) {
      const list = getRpgLoreCharacterCodex();
      const val = Reflect.get(list, prop, receiver);
      return typeof val === 'function' ? val.bind(list) : val;
    },
    has(target, prop) {
      return Reflect.has(getRpgLoreCharacterCodex(), prop);
    },
    ownKeys(target) {
      return Reflect.ownKeys(getRpgLoreCharacterCodex());
    },
    getOwnPropertyDescriptor(target, prop) {
      return Reflect.getOwnPropertyDescriptor(getRpgLoreCharacterCodex(), prop);
    },
  }
);

/**
 * RPG_LORE_CHARACTER_BY_KEY 투명 프록시 (100% 하위 호환성 보장)
 */
export const RPG_LORE_CHARACTER_BY_KEY: Map<string, LoreCharacterEntry> = new Proxy(
  new Map<string, LoreCharacterEntry>(),
  {
    get(target, prop, receiver) {
      if (!cachedLoreByKey) {
        getRpgLoreCharacterCodex();
      }
      const map = cachedLoreByKey ?? target;
      const val = Reflect.get(map, prop, receiver);
      return typeof val === 'function' ? val.bind(map) : val;
    },
    has(target, prop) {
      if (!cachedLoreByKey) {
        getRpgLoreCharacterCodex();
      }
      const map = cachedLoreByKey ?? target;
      return Reflect.has(map, prop);
    },
  }
);

/**
 * 키/영문명/한글명/별칭으로 D2 로어 인물 도감 조회
 */
export function findRpgLoreCharacter(key: string | null | undefined): LoreCharacterEntry | null {
  if (!key) return null;
  const normalized = key.toLowerCase().trim();
  const direct = getRpgLoreCharacterByKey(normalized);
  if (direct) return direct;
  return (
    getRpgLoreCharacterCodex().find((entry) => {
      if (entry.id === normalized || entry.englishName.toLowerCase() === normalized) return true;
      if (entry.name === key || entry.name.includes(key)) return true;
      if (entry.aliases.some((a) => a === key || key.includes(a))) return true;
      return false;
    }) ?? null
  );
}
