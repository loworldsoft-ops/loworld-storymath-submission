/**
 * ISO 3166-1 alpha-2 국가코드를 국기 이모지(지역 표시 기호)로 변환한다.
 *
 * 19개국 하드코딩 맵 없이 임의의 2자리 국가코드를 일반 변환하므로,
 * `studyRegions`에 등록된 모든 나라의 국기를 표시할 수 있다.
 *
 * @param code 국가코드(예: 'KR'). 빈 값/형식 오류 시 지구본(🌐) 반환.
 */
export function countryFlagEmoji(code?: string | null): string {
  if (!code) return '🌐';
  const cc = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return '🌐';
  const BASE = 0x1f1e6; // Regional Indicator Symbol Letter A
  return String.fromCodePoint(
    BASE + (cc.charCodeAt(0) - 65),
    BASE + (cc.charCodeAt(1) - 65),
  );
}
