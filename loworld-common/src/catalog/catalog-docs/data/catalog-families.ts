import { APP_ICON_AUDIT_METRICS, APP_ICON_CENSUS_CATALOG, APP_ICON_PRESETS_CATALOG } from '../../app-icon-system-catalog';
import { AVATAR_AUDIT_METRICS, AVATAR_CENSUS_CATALOG, AVATAR_PRESETS_CATALOG } from '../../avatar-system-catalog';
import { BADGE_API_CHEATSHEET, BADGE_AUDIT_METRICS, BADGE_STYLE_FAMILIES } from '../../badge-system-catalog';
import { BOTTOM_SHEET_AUDIT_METRICS, BOTTOM_SHEET_CENSUS_CATALOG, BOTTOM_SHEET_PRESETS_CATALOG } from '../../bottom-sheet-system-catalog';
import { BUTTON_API_CHEATSHEET, BUTTON_AUDIT_METRICS, BUTTON_STYLE_FAMILIES } from '../../button-system-catalog';
import { CARD_API_CHEATSHEET, CARD_AUDIT_METRICS, CARD_STYLE_FAMILIES } from '../../card-system-catalog';
import { CHIP_AUDIT_METRICS, CHIP_CENSUS_CATALOG, CHIP_PRESETS_CATALOG } from '../../chip-system-catalog';
import { DIRECTIVES_API_CHEATSHEET, DIRECTIVES_AUDIT_METRICS, DIRECTIVES_CENSUS_CATALOG, DIRECTIVE_FAMILIES } from '../../directives-system-catalog';
import { GRID_AUDIT_METRICS, GRID_CENSUS_CATALOG, GRID_PRESETS_CATALOG } from '../../grid-system-catalog';
import { LIST_API_CHEATSHEET, LIST_AUDIT_METRICS, LIST_CENSUS_CATALOG, LIST_PRESETS_CATALOG } from '../../list-system-catalog';
import { MODAL_AUDIT_METRICS, MODAL_CENSUS_CATALOG, MODAL_VARIANTS_CATALOG } from '../../modal-system-catalog';
import { SIDE_MENU_API_CHEATSHEET, SIDE_MENU_AUDIT_METRICS, SIDE_MENU_CENSUS_CATALOG, SIDE_MENU_PRESETS_CATALOG, SIDE_MENU_STYLE_FAMILIES } from '../../side-menu-system-catalog';
import { SWIPE_API_CHEATSHEET, SWIPE_AUDIT_METRICS, SWIPE_CENSUS_CATALOG, SWIPE_PRESETS_CATALOG, SWIPE_STYLE_FAMILIES } from '../../swipe-system-catalog';

export interface CatalogFamilyGroup {
  readonly title: string;
  readonly rows: readonly object[];
}

/** 디자인 시스템 패밀리 한 종의 문서 재료. 새 패밀리는 여기에 한 항목만 추가한다. */
export interface CatalogFamilySpec {
  readonly id: string;
  readonly title: string;
  /** 대표 셀렉터 또는 지시자 이름 */
  readonly selector: string;
  readonly desc: string;
  readonly metrics: object & { readonly totalCount: number };
  readonly groups: readonly CatalogFamilyGroup[];
  /** 사용 예 코드 */
  readonly snippet?: string;
}

const STYLE = '스타일 패밀리';
const SAMPLES = '견본';
const PRESETS = '프리셋';
const CENSUS = '사용처 전수조사';
const API = 'API';

const samplesOf = (families: readonly { readonly items: readonly object[] }[]): object[] => families.flatMap((f) => f.items);

export const CATALOG_FAMILIES: readonly CatalogFamilySpec[] = [
  {
    id: 'buttons',
    title: '버튼',
    selector: 'lw-button',
    desc: '동작을 시작하는 버튼의 스타일 패밀리와 사용 규격.',
    metrics: BUTTON_AUDIT_METRICS,
    groups: [
      { title: STYLE, rows: BUTTON_STYLE_FAMILIES },
      { title: SAMPLES, rows: samplesOf(BUTTON_STYLE_FAMILIES) },
      { title: API, rows: BUTTON_API_CHEATSHEET },
    ],
  },
  {
    id: 'badges',
    title: '배지',
    selector: 'lw-badge',
    desc: '일자·상태·역할·수치 같은 정보성 표시의 스타일 패밀리와 사용 규격.',
    metrics: BADGE_AUDIT_METRICS,
    groups: [
      { title: STYLE, rows: BADGE_STYLE_FAMILIES },
      { title: SAMPLES, rows: samplesOf(BADGE_STYLE_FAMILIES) },
      { title: API, rows: BADGE_API_CHEATSHEET },
    ],
  },
  {
    id: 'cards',
    title: '카드 표면',
    selector: 'lw-card',
    desc: '카드 표면의 variant·레이아웃·고도 체계.',
    metrics: CARD_AUDIT_METRICS,
    groups: [
      { title: STYLE, rows: CARD_STYLE_FAMILIES },
      { title: SAMPLES, rows: samplesOf(CARD_STYLE_FAMILIES) },
      { title: API, rows: CARD_API_CHEATSHEET },
    ],
  },
  {
    id: 'modals',
    title: '모달',
    selector: 'lw-modal',
    desc: '모달 대화상자의 variant와 사용처.',
    metrics: MODAL_AUDIT_METRICS,
    groups: [
      { title: 'variant', rows: MODAL_VARIANTS_CATALOG },
      { title: CENSUS, rows: MODAL_CENSUS_CATALOG },
    ],
  },
  {
    id: 'sheets',
    title: '바텀시트',
    selector: 'lw-bottom-sheet',
    desc: '바텀시트의 스냅 프리셋과 사용처.',
    metrics: BOTTOM_SHEET_AUDIT_METRICS,
    groups: [
      { title: PRESETS, rows: BOTTOM_SHEET_PRESETS_CATALOG },
      { title: CENSUS, rows: BOTTOM_SHEET_CENSUS_CATALOG },
    ],
  },
  {
    id: 'chips',
    title: '칩',
    selector: 'lw-chip',
    desc: '필터·선택 칩의 프리셋과 사용처.',
    metrics: CHIP_AUDIT_METRICS,
    groups: [
      { title: PRESETS, rows: CHIP_PRESETS_CATALOG },
      { title: CENSUS, rows: CHIP_CENSUS_CATALOG },
    ],
  },
  {
    id: 'app-icons',
    title: '앱 아이콘',
    selector: 'lw-app-icon',
    desc: '앱 아이콘의 variant·크기·모양 프리셋과 사용처.',
    metrics: APP_ICON_AUDIT_METRICS,
    groups: [
      { title: PRESETS, rows: APP_ICON_PRESETS_CATALOG },
      { title: CENSUS, rows: APP_ICON_CENSUS_CATALOG },
    ],
  },
  {
    id: 'avatars',
    title: '아바타',
    selector: 'lw-avatar',
    desc: '아바타의 프리셋, 대체 표시 규칙, 사용처.',
    metrics: AVATAR_AUDIT_METRICS,
    groups: [
      { title: PRESETS, rows: AVATAR_PRESETS_CATALOG },
      { title: CENSUS, rows: AVATAR_CENSUS_CATALOG },
    ],
  },
  {
    id: 'grids',
    title: '그리드',
    selector: 'lw-grid',
    desc: '반응형 그리드 프리셋과 사용처.',
    metrics: GRID_AUDIT_METRICS,
    groups: [
      { title: PRESETS, rows: GRID_PRESETS_CATALOG },
      { title: CENSUS, rows: GRID_CENSUS_CATALOG },
    ],
  },
  {
    id: 'lists',
    title: '리스트',
    selector: 'lw-list',
    desc: '공통 리스트와 선택형 항목의 프리셋과 사용처.',
    metrics: LIST_AUDIT_METRICS,
    groups: [
      { title: PRESETS, rows: LIST_PRESETS_CATALOG },
      { title: CENSUS, rows: LIST_CENSUS_CATALOG },
      { title: API, rows: LIST_API_CHEATSHEET },
    ],
  },
  {
    id: 'swipes',
    title: '스와이프',
    selector: 'lwSwipeTrack',
    desc: '스와이프 제스처의 스타일 패밀리, 프리셋, 사용처.',
    metrics: SWIPE_AUDIT_METRICS,
    groups: [
      { title: STYLE, rows: SWIPE_STYLE_FAMILIES },
      { title: PRESETS, rows: SWIPE_PRESETS_CATALOG },
      { title: CENSUS, rows: SWIPE_CENSUS_CATALOG },
      { title: API, rows: SWIPE_API_CHEATSHEET },
    ],
  },
  {
    id: 'side-menus',
    title: '사이드 메뉴',
    selector: 'lw-side-menu-item',
    desc: '사이드 메뉴의 스타일 패밀리, 프리셋, 사용처.',
    metrics: SIDE_MENU_AUDIT_METRICS,
    groups: [
      { title: STYLE, rows: SIDE_MENU_STYLE_FAMILIES },
      { title: PRESETS, rows: SIDE_MENU_PRESETS_CATALOG },
      { title: CENSUS, rows: SIDE_MENU_CENSUS_CATALOG },
    ],
    snippet: SIDE_MENU_API_CHEATSHEET,
  },
  {
    id: 'directives',
    title: '공통 지시자',
    selector: 'lwTooltip 외',
    desc: '툴팁·제스처·높이 계산 등 공통 지시자의 분류와 사용처.',
    metrics: DIRECTIVES_AUDIT_METRICS,
    groups: [
      { title: '지시자 분류', rows: DIRECTIVE_FAMILIES },
      { title: API, rows: DIRECTIVES_API_CHEATSHEET },
      { title: CENSUS, rows: DIRECTIVES_CENSUS_CATALOG },
    ],
  },
];

export const findCatalogFamily = (id: string): CatalogFamilySpec | undefined => CATALOG_FAMILIES.find((f) => f.id === id);
