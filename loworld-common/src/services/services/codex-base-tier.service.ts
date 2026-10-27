import { Injectable } from '@angular/core';
import type { CodexBaseTier, CodexNumericTier, CodexBaseTierMeta, CodexEquipCheckResult } from '../models/codex-base-tier.model';

export const CODEX_BASE_TIER_METADATA: Record<CodexBaseTier, CodexBaseTierMeta> = {
  normal: {
    tier: 'normal',
    numericTier: 1,
    label: '노말 (Normal)',
    shortLabel: '노말',
    defaultRequiredLevel: 1,
    badgeClass: 'tier-badge--normal',
    themeColor: '#94a3b8',
    statMultiplier: 1.0,
    description: '기초 베이스 단계의 도감 항목',
  },
  exceptional: {
    tier: 'exceptional',
    numericTier: 2,
    label: '익셉셔널 (Exceptional)',
    shortLabel: '익셉셔널',
    defaultRequiredLevel: 25,
    badgeClass: 'tier-badge--exceptional',
    themeColor: '#38bdf8',
    statMultiplier: 1.5,
    description: '강화된 중급 베이스 단계의 도감 항목',
  },
  elite: {
    tier: 'elite',
    numericTier: 3,
    label: '엘리트 (Elite)',
    shortLabel: '엘리트',
    defaultRequiredLevel: 50,
    badgeClass: 'tier-badge--elite',
    themeColor: '#eab308',
    statMultiplier: 2.2,
    description: '최상위 정점의 하이엔드 베이스 도감 항목',
  },
};

/**
 * [SSOT Singleton Service] 전 도감 공통 디아블로2 식 베이스 티어(Normal · Exceptional · Elite) 및 착용 레벨 요구치 계산 싱글톤 서비스.
 */
@Injectable({ providedIn: 'root' })
export class CodexBaseTierService {
  readonly tierMetadata = CODEX_BASE_TIER_METADATA;

  /**
   * 임의의 티어 값(1, 2, 3 또는 'normal', 'exceptional', 'elite')을 정규화된 CodexBaseTier로 변환
   */
  resolveBaseTier(tierOrNumeric?: string | number | null): CodexBaseTier {
    if (typeof tierOrNumeric === 'number') {
      if (tierOrNumeric >= 3) return 'elite';
      if (tierOrNumeric === 2) return 'exceptional';
      return 'normal';
    }
    if (typeof tierOrNumeric === 'string') {
      const lower = tierOrNumeric.toLowerCase();
      if (lower.includes('elite') || lower === '3' || lower.includes('엘리트')) return 'elite';
      if (lower.includes('exceptional') || lower === '2' || lower.includes('익셉')) return 'exceptional';
      return 'normal';
    }
    return 'normal';
  }

  /**
   * 티어 메타데이터 조회
   */
  getTierMeta(tierOrNumeric?: string | number | null): CodexBaseTierMeta {
    const baseTier = this.resolveBaseTier(tierOrNumeric);
    return this.tierMetadata[baseTier];
  }

  /**
   * 도감 엔트리의 요구 레벨(Required Level) 계산
   * - 명시된 `requiredLevel`이 있으면 해당 값 우선
   * - 없으면 티어 기본값 (Normal: Lv.1, Exceptional: Lv.25, Elite: Lv.50) 반환
   */
  getRequiredLevel(entry?: { tier?: any; baseTier?: any; requiredLevel?: number } | null): number {
    if (!entry) return 1;
    if (typeof entry.requiredLevel === 'number' && entry.requiredLevel > 0) {
      return entry.requiredLevel;
    }
    const meta = this.getTierMeta(entry.baseTier || entry.tier);
    return meta.defaultRequiredLevel;
  }

  /**
   * 캐릭터 레벨 기반 착용 가능 여부 판정
   */
  canEquip(
    entry?: { tier?: any; baseTier?: any; requiredLevel?: number } | null,
    characterLevel: number = 1
  ): boolean {
    const req = this.getRequiredLevel(entry);
    return characterLevel >= req;
  }

  /**
   * 장비/아이템 엔트리의 디아블로 2 정통 베이스 티어(노말, 익셉셔널, 엘리트) 판정
   */
  resolveEquipmentBaseTier(entry?: {
    tier?: any;
    baseTier?: any;
    requiredLevel?: number;
    ilvl?: number;
    label?: string;
    name?: string;
    id?: string;
  } | null): CodexBaseTierMeta {
    if (!entry) return this.tierMetadata.normal;

    // 1. 명시적 티어 설정이 있는 경우
    if (entry.baseTier) {
      return this.getTierMeta(entry.baseTier);
    }
    if (entry.tier != null) {
      return this.getTierMeta(entry.tier);
    }

    // 2. 명칭/ID 기반 디아블로 2 엘리트/익셉셔널 베이스 키워드 판별
    const name = `${entry.label || ''} ${entry.name || ''} ${entry.id || ''}`.toLowerCase();

    // 엘리트 (Elite) 키워드
    const ELITE_KEYWORDS = [
      '샤코', 'shako', '아칸', 'archon', '모너크', 'monarch', '페이즈', 'phase',
      '코로나', 'corona', '콜로서스', 'colossus', '발록', 'balrog', '세이크리드', 'sacred',
      '더스크', 'dusk shroud', '웜하이드', 'wyrmhide', '스캐럽', 'scarab', '와이어', 'wire fleece',
      '미르미돈', 'myrmidon', '미스릴', 'mithril', '스파이더웹', 'spiderweb', '크립틱', 'cryptic',
      '디멘셔널', 'dimensional', '컨퀘스트', 'conquest', '하이드라', 'hydraskull', '본 비지즈', 'bone visage',
      '이지스', 'aegis', '워드', 'ward', '트롤', 'troll', '오우거', 'ogre', '뱀브레이스', 'vambrace',
    ];
    if (ELITE_KEYWORDS.some((kw) => name.includes(kw))) {
      return this.tierMetadata.elite;
    }

    // 익셉셔널 (Exceptional) 키워드
    const EXCEPTIONAL_KEYWORDS = [
      '워 햇', 'war hat', '메이지', 'mage plate', '드래곤 실드', 'dragon shield',
      '디멘셔널', '배틀 소드', 'battle sword', '룬 소드', 'rune sword', '그랜드 크라운', 'grand crown',
      '샐릿', 'sallet', '카스크', 'casque', '바시넷', 'basinet', '그림 헬름', 'grim helm',
      '고스트 아머', 'ghost armor', '서펀트', 'serpentskin', '데몬하이드', 'demonhide',
      '퀴래스', 'cuirass', '러셋', 'russet', '템플러', 'templar coat', '샤크투스', 'sharktooth',
      '오네이트', 'ornate', '디펜더', 'defender', '라운드 실드', 'round shield', '스쿠툼', 'scutum',
      '파비스', 'pavise', '글라디우스', 'gladius', '커틀러스', 'cutlass', '샴쉬르', 'shamshir',
      '샤크스킨', 'sharkskin', '배틀 부츠', 'battle boots', '워 부츠', 'war boots', '워 벨트', 'war belt',
    ];
    if (EXCEPTIONAL_KEYWORDS.some((kw) => name.includes(kw))) {
      return this.tierMetadata.exceptional;
    }

    // 3. 요구 레벨/아이템 레벨 기반 판별
    const reqLvl = entry.requiredLevel ?? 0;
    const ilvl = entry.ilvl ?? 0;
    if (reqLvl >= 50 || ilvl >= 60) {
      return this.tierMetadata.elite;
    }
    if (reqLvl >= 25 || ilvl >= 30) {
      return this.tierMetadata.exceptional;
    }

    return this.tierMetadata.normal;
  }

  /**
   * 종합 착용 조건 검사 결과 반환
   */
  getEquipRequirementCheck(
    entry?: { tier?: any; baseTier?: any; requiredLevel?: number; name?: string } | null,
    characterLevel: number = 1
  ): CodexEquipCheckResult {
    const tierMeta = this.getTierMeta(entry?.baseTier || entry?.tier);
    const requiredLevel = this.getRequiredLevel(entry);
    const canEquip = characterLevel >= requiredLevel;

    let reason: string | undefined;
    if (!canEquip) {
      const diff = requiredLevel - characterLevel;
      reason = `착용 요구 레벨 부족: Lv.${requiredLevel} 이상 필요 (현재 Lv.${characterLevel}, ${diff} 레벨 부족)`;
    }

    return {
      canEquip,
      requiredLevel,
      characterLevel,
      tierMeta,
      reason,
    };
  }
}
