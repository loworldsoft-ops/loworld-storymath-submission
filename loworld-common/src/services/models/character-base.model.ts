/**
 * [LoworldUI] 기본 캐릭터 클래스 및 성별 모델 (SRP/단방향 분리)
 * character.model <-> d2-skill.model <-> skill.model 사이의 순환 참조를 해소합니다.
 */

export type CharacterClass =
  | 'warrior'
  | 'sorceress'
  | 'rogue'
  | 'paladin'
  | 'necromancer'
  | 'druid'
  | 'assassin'
  | (string & {});

/** D2 주인공 빌드 — 전체 모드 성별 선택 */
export type CharacterGender = 'male' | 'female';
