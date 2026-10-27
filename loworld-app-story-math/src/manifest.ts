import type { LwAppManifest } from '@loworld/common/os';

/**
 * 이 앱의 선언서다. 앱은 자기가 어디서 뜨는지 모른다.
 * 쇼케이스는 이것을 받아 OS 화면에 띄우고, 단독 실행(standalone/)은 이것만으로 전체 화면에 띄운다.
 */
export const manifest: LwAppManifest = {
  id: 'story-math',
  homeTab: 'story-math',
  appearance: { scheme: 'dark', skin: 'night' },
  native: {
    name: '스토리매스',
    // 이 앱이 쓰는 공통 정적 자원만 넣는다. 글꼴 셋만 싣는다
    assets: ['fonts/pretendard', 'fonts/montserrat', 'fonts/gowun-batang'],
    // 방향을 정하지 않는다. 폰은 세로·가로 모두 쓰고, 화면은 폭에 맞춰 바뀐다(사용자, 2026-10-27). 차량 화면은 가로로 고정되어 있다.
    version: '1.2.0',
    versionCode: 13,
    offline: true,
  },
  domain: {
    id: 'story-math',
    label: '스토리매스',
    icon: 'book',
    look: { shortLabel: '스토리매스' },
    launchGroup: { id: 'story-math', title: '스토리매스' },
    launchItems: [{ appId: 'loworld-story-math.app', group: 'story-math', tab: 'story-math', label: '스토리매스', icon: 'book', audience: 'public' }],
    catalog: [],
  },
  windowTabs: [
    {
      tab: 'story-math',
      window: { title: '스토리매스', icon: 'book', size: 'mobile' },
      loadComponent: () => import('./screens/play/play.screen').then((m) => m.StoryMathPlayScreen),
      wrapInScrollPage: false,
      resolveInputs: () => ({}),
    },
  ],
};
