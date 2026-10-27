import { InjectionToken } from '@angular/core';
import type { CertMapMarker } from '../models/curriculum.model';

/**
 * Port: 지도 렌더러 추상화 인터페이스.
 *
 * 라이브러리(loworld-ui)는 이 인터페이스만 의존하며,
 * 실제 Leaflet 구현은 소비자 앱(loworld-study)이 Adapter로 제공한다.
 * eznote / ezcalendar 등 지도 불필요 앱은 이 토큰을 제공하지 않으므로
 * leaflet 패키지를 설치할 필요가 없다.
 */
export interface HwMapRenderer {
  /** 지도를 container DOM 엘리먼트에 초기화 */
  init(container: HTMLElement, options?: HwMapInitOptions): void;
  /** 마커 목록 전체 갱신 — 선택 콜백 포함 */
  setMarkers(markers: CertMapMarker[], onSelect: (m: CertMapMarker) => void): void;
  /** 특정 마커(방 ID) 선택 강제 갱신 */
  selectMarker?(roomId: string | null): void;
  /** 컨테이너 사이즈 변경 시 지도 갱신 */
  invalidateSize?(): void;
  /** 특정 좌표로 부드럽게 이동 */
  flyTo(lat: number, lng: number, zoom?: number): void;
  /** 지도 인스턴스 정리 (컴포넌트 destroy 시 호출) */
  destroy(): void;
}

export interface HwMapInitOptions {
  center?: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
}

/**
 * DI 토큰: 소비자 앱에서 `{ provide: HW_MAP_RENDERER, useClass: LeafletMapRendererService }`
 * 형태로 제공한다.
 */
export const HW_MAP_RENDERER = new InjectionToken<HwMapRenderer>('HW_MAP_RENDERER');
