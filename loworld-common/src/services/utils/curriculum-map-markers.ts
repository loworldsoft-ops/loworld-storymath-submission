import type { Certification, CertMapMarker, CountryRankItem, GeoLocation, CurriculumRoom } from '../models/curriculum.model';
import { CES_COUNTRY_CENTERS } from '../models/curriculum.model';

// ── 국가별 도시 좌표 (실제 위경도) ──────────────────────────────────────
const COUNTRY_CITIES: Record<string, Array<{ city: string; lat: number; lng: number }>> = {
  KR: [
    { city: '서울', lat: 37.5665, lng: 126.978 },
    { city: '부산', lat: 35.1796, lng: 129.0756 },
    { city: '인천', lat: 37.4563, lng: 126.7052 },
    { city: '대구', lat: 35.8714, lng: 128.6014 },
    { city: '광주', lat: 35.1595, lng: 126.8526 },
  ],
  MN: [
    { city: '울란바타르', lat: 47.9077, lng: 106.8832 },
    { city: '다르항', lat: 49.47, lng: 105.97 },
    { city: '에르데넷', lat: 49.02, lng: 104.04 },
    { city: '초이발산', lat: 48.07, lng: 114.53 },
  ],
  VN: [
    { city: '하노이', lat: 21.0285, lng: 105.8542 },
    { city: '호찌민', lat: 10.8231, lng: 106.6297 },
    { city: '다낭', lat: 16.0471, lng: 108.2068 },
    { city: '후에', lat: 16.4637, lng: 107.5909 },
  ],
  ID: [
    { city: '자카르타', lat: -6.2088, lng: 106.8456 },
    { city: '발리', lat: -8.6705, lng: 115.2126 },
    { city: '수라바야', lat: -7.2504, lng: 112.7688 },
    { city: '메단', lat: 3.5952, lng: 98.6722 },
  ],
  KH: [
    { city: '프놈펜', lat: 11.5625, lng: 104.916 },
    { city: '시엠레아프', lat: 13.3622, lng: 103.8597 },
    { city: '바탐방', lat: 13.1, lng: 103.2 },
  ],
  TH: [
    { city: '방콕', lat: 13.7563, lng: 100.5018 },
    { city: '치앙마이', lat: 18.7883, lng: 98.9853 },
    { city: '파타야', lat: 12.9274, lng: 100.8776 },
  ],
  PH: [
    { city: '마닐라', lat: 14.5995, lng: 120.9842 },
    { city: '세부', lat: 10.3157, lng: 123.8854 },
    { city: '다바오', lat: 7.1907, lng: 125.4553 },
  ],
  JP: [
    { city: '도쿄', lat: 35.6762, lng: 139.6503 },
    { city: '오사카', lat: 34.6937, lng: 135.5023 },
    { city: '후쿠오카', lat: 33.5904, lng: 130.4017 },
  ],
  CN: [
    { city: '베이징', lat: 39.9042, lng: 116.4074 },
    { city: '상하이', lat: 31.2304, lng: 121.4737 },
    { city: '선전', lat: 22.5431, lng: 114.0579 },
  ],
  MM: [
    { city: '양곤', lat: 16.8661, lng: 96.1951 },
    { city: '만달레이', lat: 21.9588, lng: 96.0891 },
  ],
};

/** menteeId 기반 고정 도시 매핑 (시드·쇼케이스와 동일 규칙) */
const MENTEE_CITY_MAP: Record<string, { countryCode: string; cityIdx: number }> = {
  'mt-kr-01': { countryCode: 'KR', cityIdx: 0 },
  'mt-kr-02': { countryCode: 'KR', cityIdx: 1 },
  'mt-kr-03': { countryCode: 'KR', cityIdx: 2 },
  'mt-mn-01': { countryCode: 'MN', cityIdx: 0 },
  'mt-mn-02': { countryCode: 'MN', cityIdx: 1 },
  'mt-mn-03': { countryCode: 'MN', cityIdx: 2 },
  'mt-vn-01': { countryCode: 'VN', cityIdx: 0 },
  'mt-vn-02': { countryCode: 'VN', cityIdx: 1 },
  'mt-id-01': { countryCode: 'ID', cityIdx: 0 },
  'mt-kh-01': { countryCode: 'KH', cityIdx: 0 },
  'mt-hw-1': { countryCode: 'KR', cityIdx: 0 },
  'mt-hw-2': { countryCode: 'KR', cityIdx: 1 },
  'mt-hw-3': { countryCode: 'KR', cityIdx: 2 },
  'mt-hw-4': { countryCode: 'KR', cityIdx: 3 },
  'mt-hw-5': { countryCode: 'KR', cityIdx: 4 },
  'mt-hw-6': { countryCode: 'KR', cityIdx: 0 },
  'mt-hw-7': { countryCode: 'KR', cityIdx: 1 },
  'mt-hw-8': { countryCode: 'KR', cityIdx: 2 },
  'mtroom-1': { countryCode: 'KR', cityIdx: 0 },
  'mtroom-2': { countryCode: 'MN', cityIdx: 0 },
  'mtroom-3': { countryCode: 'VN', cityIdx: 0 },
  'mtroom-4': { countryCode: 'KH', cityIdx: 0 },
  'mtroom-5': { countryCode: 'KR', cityIdx: 1 },
  'mtroom-6': { countryCode: 'MN', cityIdx: 1 },
  'mtroom-7': { countryCode: 'ID', cityIdx: 0 },
  'mtroom-8': { countryCode: 'TH', cityIdx: 0 },
  'mtroom-9': { countryCode: 'PH', cityIdx: 0 },
  'mtroom-10': { countryCode: 'VN', cityIdx: 1 },
  'mtroom-11': { countryCode: 'KR', cityIdx: 2 },
  'mtroom-12': { countryCode: 'JP', cityIdx: 0 },
};

/**
 * 멘티 ID 또는 그룹(국가 코드)으로 지도 표시용 좌표를 결정한다.
 * loworld-study MapFacade와 쇼케이스가 동일 규칙을 쓰도록 라이브러리에 단일 구현으로 둔다.
 */
export function resolveCurriculumRoomGeoLocation(
  menteeId: string,
  groupId?: string,
  regions?: Record<string, GeoLocation>,
): GeoLocation | null {
  const centers = regions ?? CES_COUNTRY_CENTERS;
  const mapped = MENTEE_CITY_MAP[menteeId];
  if (mapped) {
    const cities = COUNTRY_CITIES[mapped.countryCode];
    const city = cities?.[mapped.cityIdx];
    if (city) {
      const center = centers[mapped.countryCode];
      return {
        lat: city.lat,
        lng: city.lng,
        countryCode: mapped.countryCode,
        countryNameKo: center?.countryNameKo ?? mapped.countryCode,
        city: city.city,
      };
    }
  }

  if (groupId && centers[groupId]) {
    const center = centers[groupId];
    const cities = COUNTRY_CITIES[groupId];
    return {
      ...center,
      city: cities?.[0]?.city ?? center.city,
    };
  }

  return null;
}

/**
 * menteeId를 결정적 해시로 변환해 ±0.6° 범위의 미세 좌표 오프셋을 만든다.
 * 동일 나라 중심에 다수 멤버 핀이 정확히 겹치는 것을 방지한다.
 */
function menteeGeoJitter(menteeId: string): { dLat: number; dLng: number } {
  let h = 0;
  for (let i = 0; i < menteeId.length; i++) {
    h = (h * 31 + menteeId.charCodeAt(i)) | 0;
  }
  const a = (h & 0xffff) / 0xffff;
  const b = ((h >>> 16) & 0xffff) / 0xffff;
  return { dLat: (a - 0.5) * 1.2, dLng: (b - 0.5) * 1.2 };
}

export interface BuildCurriculumMapMarkersOptions {
  /** `completed` 방에 대해서만 호출되어 수료증 좌표·메타 보조에 사용 */
  getCertificationForRoom?: (roomId: string) => Certification | undefined;
  /** 멘티 ID → 멤버 지정 나라(국가코드). 지정 시 최우선으로 해당 나라 좌표에 핀 표기 */
  getMenteeCountry?: (menteeId: string) => string | undefined;
  /** 커스텀 등록 나라 좌표(`studyRegions`). 미지정 시 라이브러리 기본 상수 사용 */
  regions?: Record<string, GeoLocation>;
}

/** 방 목록을 지도 마커 배열로 변환 (앱·쇼케이스 공통, 단일 진실 원천) */
export function buildCurriculumMapMarkers(
  rooms: CurriculumRoom[],
  options?: BuildCurriculumMapMarkersOptions,
): CertMapMarker[] {
  const getCert = options?.getCertificationForRoom;
  const centers = options?.regions
    ? { ...CES_COUNTRY_CENTERS, ...options.regions }
    : CES_COUNTRY_CENTERS;
  const results: CertMapMarker[] = [];

  for (const room of rooms) {
    const cert =
      room.status === 'completed' && getCert ? getCert(room.id) : undefined;

    // 1순위: 멤버가 직접 지정한 나라 → 해당 나라 중심 + 결정적 지터
    let location: GeoLocation | null = null;
    const memberCountry = options?.getMenteeCountry?.(room.menteeId);
    if (memberCountry && centers[memberCountry]) {
      const center = centers[memberCountry];
      const j = menteeGeoJitter(room.menteeId);
      location = { ...center, lat: center.lat + j.dLat, lng: center.lng + j.dLng };
    }

    // 폴백: 하드코딩 도시 매핑 → room.groupId → 수료증 좌표
    if (!location) {
      location =
        resolveCurriculumRoomGeoLocation(room.menteeId, room.groupId ?? undefined, centers) ??
        cert?.location ??
        null;
    }

    if (!location) continue;

    results.push({
      certificationId: cert?.id ?? room.id,
      roomId: room.id,
      menteeName: room.menteeName,
      mentorName: room.mentorName,
      countryCode: location.countryCode,
      countryNameKo: location.countryNameKo,
      city: location.city,
      regionLabel: location.regionLabel,
      lat: location.lat,
      lng: location.lng,
      issuedAt: cert?.issuedAt ?? room.updatedAt,
      certificateNumber: cert?.certificateNumber ?? '',
      status: room.status,
    });
  }

  return results;
}

export function filterCertMapMarkersByIssuedYear(
  markers: CertMapMarker[],
  year: number | null,
): CertMapMarker[] {
  if (year === null) return markers;
  return markers.filter(m => new Date(m.issuedAt).getFullYear() === year);
}

export function countryRankingFromCertMapMarkers(markers: CertMapMarker[]): CountryRankItem[] {
  const counts = new Map<string, CountryRankItem>();
  for (const m of markers) {
    const existing = counts.get(m.countryCode);
    if (existing) {
      existing.count++;
    } else {
      counts.set(m.countryCode, {
        countryCode: m.countryCode,
        countryNameKo: m.countryNameKo,
        regionLabel: m.regionLabel,
        count: 1,
      });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

/**
 * 동일 좌표 마커가 겹쳐 하나처럼 보일 때 표시용으로만 원형 분산 (Leaflet 등 렌더러에서 사용).
 */
export function spreadOverlappingCertMapMarkers(markers: CertMapMarker[]): CertMapMarker[] {
  const PRECISION = 5;
  const keyOf = (lat: number, lng: number) =>
    `${lat.toFixed(PRECISION)},${lng.toFixed(PRECISION)}`;

  const buckets = new Map<string, CertMapMarker[]>();
  for (const m of markers) {
    const k = keyOf(m.lat, m.lng);
    const arr = buckets.get(k) ?? [];
    arr.push(m);
    buckets.set(k, arr);
  }

  const out: CertMapMarker[] = [];
  for (const group of buckets.values()) {
    if (group.length === 1) {
      out.push(group[0]);
      continue;
    }
    const n = group.length;
    const lat0 = group[0].lat;
    const latRad = (lat0 * Math.PI) / 180;
    const cosLat = Math.max(0.2, Math.cos(latRad));
    const ringScale = Math.max(1, Math.sqrt((n - 1) / 6));
    const baseR = 0.004 * ringScale;

    group.forEach((m, i) => {
      const theta = (2 * Math.PI * i) / n - Math.PI / 2;
      const dLat = baseR * Math.cos(theta);
      const dLng = baseR * Math.sin(theta) / cosLat;
      out.push({ ...m, lat: m.lat + dLat, lng: m.lng + dLng });
    });
  }
  return out;
}
