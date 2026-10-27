/**
 * 텍스트 내 볼드(**) 및 마크다운 특수문자 제거 정규화 유틸리티
 */
export function stripMarkdownBold(text?: string | null): string {
  if (!text) return '';
  return text.replace(/\*\*/g, '').trim();
}

/**
 * 아이템 희귀도(Rarity)에 따른 시맨틱 CSS 변수 문자열 반환
 */
export function resolveRarityCssVar(rarity?: string | null): string {
  switch (rarity) {
    case 'magic': return 'var(--lw-rarity-magic, #6ea8ff)';
    case 'rare': return 'var(--lw-rarity-rare, #f2d94e)';
    case 'unique': return 'var(--lw-rarity-unique, #d7b46a)';
    case 'set': return 'var(--lw-rarity-set, #64bf76)';
    case 'crafted': return 'var(--lw-rarity-crafted, #ff8800)';
    case 'runeword': return 'var(--lw-rarity-runeword, #d7b46a)';
    default: return 'var(--lw-rarity-normal, var(--lw-text-primary, #d7d6d3))';
  }
}

/**
 * 아이템 희귀도(Rarity)에 따른 기본 16진수 색상 코드 반환
 */
export function resolveRarityHexColor(rarity?: string | null): string {
  switch (rarity) {
    case 'magic': return '#6ea8ff';
    case 'rare': return '#f2d94e';
    case 'unique': return '#d7b46a';
    case 'set': return '#64bf76';
    case 'crafted': return '#ff8800';
    case 'runeword': return '#d7b46a';
    default: return '#d7d6d3';
  }
}

/**
 * 룬 코드(R01~R33)를 정규화하여 룬 명칭으로 변환
 */
export function formatRuneCodeToNameKo(codeText: string): { code: string; nameKo: string } | null {
  const match = /^R(\d{1,2})$/i.exec(codeText.trim());
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const padCode = `r${num < 10 ? '0' + num : num}`;
  return { code: padCode, nameKo: codeText };
}
