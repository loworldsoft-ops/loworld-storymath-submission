import type { CharacterClass } from '../models/character-base.model';
import type { RpgSkillRegistryEntry } from '../models/rpg-skill.model';
import { MARTIAL_SKILL_REGISTRY, MARTIAL_SKILL_BY_ID } from './chronicle-skills-registry.data';

/**
 * D2R LoD 7-직업 + 무협 문파 스킬 레지스트리 비동기 지연 로더 (성능/번들 최적화)
 * 5,280줄(156KB) 크기의 정적 스킬 데이터를 필요 시점에 온디맨드로 동적 로드하여
 * loworld-ui-core 초기 번들 크기를 경량화합니다.
 */

let cachedRegistry: readonly RpgSkillRegistryEntry[] | null = null;
let cachedById: Record<string, RpgSkillRegistryEntry> | null = null;
let cachedByDiscipline: Record<CharacterClass, RpgSkillRegistryEntry[]> | null = null;
let loadingPromise: Promise<{
  registry: readonly RpgSkillRegistryEntry[];
  byId: Record<string, RpgSkillRegistryEntry>;
  byDiscipline: Record<CharacterClass, RpgSkillRegistryEntry[]>;
}> | null = null;

/**
 * 스킬 레지스트리가 메모리에 로드되었는지 여부
 */
export function isRpgSkillsRegistryLoaded(): boolean {
  return cachedRegistry !== null;
}

/**
 * 대용량 스킬 레지스트리를 비동기 온디맨드 dynamic import 방식으로 로드
 */
export async function loadRpgSkillsRegistryAsync(): Promise<{
  registry: readonly RpgSkillRegistryEntry[];
  byId: Record<string, RpgSkillRegistryEntry>;
  byDiscipline: Record<CharacterClass, RpgSkillRegistryEntry[]>;
}> {
  if (cachedRegistry && cachedById && cachedByDiscipline) {
    return {
      registry: cachedRegistry,
      byId: cachedById,
      byDiscipline: cachedByDiscipline,
    };
  }

  if (!loadingPromise) {
    loadingPromise = (async () => {
      try {
        const mod = await import('./rpg-skills-registry.generated');
        cachedRegistry = mod.RPG_SKILL_REGISTRY;
        cachedById = mod.RPG_SKILL_BY_ID;
        cachedByDiscipline = mod.RPG_SKILLS_BY_DISCIPLINE;
        return {
          registry: cachedRegistry,
          byId: cachedById,
          byDiscipline: cachedByDiscipline,
        };
      } catch (err) {
        console.warn('[d2-skill-loader] Failed to dynamic import d2-skills-registry.generated:', err);
        return {
          registry: MARTIAL_SKILL_REGISTRY,
          byId: MARTIAL_SKILL_BY_ID as Record<string, RpgSkillRegistryEntry>,
          byDiscipline: {} as Record<CharacterClass, RpgSkillRegistryEntry[]>,
        };
      } finally {
        loadingPromise = null;
      }
    })();
  }
  return await loadingPromise;
}

/**
 * 테스트 및 사전 시딩용 수동 레지스트리 주입
 */
export function setCachedRpgSkillsRegistry(
  registry: readonly RpgSkillRegistryEntry[],
  byId?: Record<string, RpgSkillRegistryEntry>,
  byDiscipline?: Record<CharacterClass, RpgSkillRegistryEntry[]>
): void {
  cachedRegistry = registry;
  cachedById = byId ?? Object.fromEntries(registry.map(s => [s.id, s]));
  if (byDiscipline) {
    cachedByDiscipline = byDiscipline;
  }
}

/**
 * 동기적 스킬 레지스트리 반환.
 * 미로드 상태에서는 안전한 경량 무협 스킬 레지스트리를 반환하여 크래시를 방지합니다.
 */
export function getRpgSkillRegistry(): readonly RpgSkillRegistryEntry[] {
  return cachedRegistry ?? MARTIAL_SKILL_REGISTRY;
}

/**
 * 스킬 ID로 단일 엔트리 조회.
 */
export function getRpgSkillById(skillId: string): RpgSkillRegistryEntry | undefined {
  if (cachedById) {
    return cachedById[skillId];
  }
  return MARTIAL_SKILL_BY_ID[skillId];
}

/**
 * 직업/문파별 스킬 목록 조회.
 */
export function getRpgSkillsByDiscipline(discipline: CharacterClass): readonly RpgSkillRegistryEntry[] {
  if (cachedByDiscipline && cachedByDiscipline[discipline]) {
    return cachedByDiscipline[discipline];
  }
  return (cachedRegistry ?? MARTIAL_SKILL_REGISTRY).filter((s) => s.discipline === discipline);
}

/**
 * RPG_SKILL_REGISTRY 투명 프록시 (100% 하위 호환성)
 */
export const RPG_SKILL_REGISTRY: readonly RpgSkillRegistryEntry[] = new Proxy([] as readonly RpgSkillRegistryEntry[], {
  get(target, prop, receiver) {
    const list = getRpgSkillRegistry();
    const val = Reflect.get(list, prop, receiver);
    return typeof val === 'function' ? val.bind(list) : val;
  },
  has(target, prop) {
    return Reflect.has(getRpgSkillRegistry(), prop);
  },
  ownKeys(target) {
    return Reflect.ownKeys(getRpgSkillRegistry());
  },
  getOwnPropertyDescriptor(target, prop) {
    return Reflect.getOwnPropertyDescriptor(getRpgSkillRegistry(), prop);
  },
});

/**
 * RPG_SKILL_BY_ID 투명 프록시 (100% 하위 호환성)
 */
export const RPG_SKILL_BY_ID: Record<string, RpgSkillRegistryEntry> = new Proxy({} as Record<string, RpgSkillRegistryEntry>, {
  get(target, prop, receiver) {
    if (typeof prop === 'string') {
      return getRpgSkillById(prop);
    }
    return Reflect.get(target, prop, receiver);
  },
  has(target, prop) {
    if (typeof prop === 'string') {
      return Boolean(getRpgSkillById(prop));
    }
    return Reflect.has(target, prop);
  },
  ownKeys(target) {
    return getRpgSkillRegistry().map((s) => s.id);
  },
  getOwnPropertyDescriptor(target, prop) {
    if (typeof prop === 'string') {
      const entry = getRpgSkillById(prop);
      if (entry) {
        return { configurable: true, enumerable: true, value: entry, writable: false };
      }
    }
    return undefined;
  },
});
