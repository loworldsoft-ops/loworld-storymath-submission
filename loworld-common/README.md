# loworld-common

공통 저장소다. 스타일을 가진 것은 전부 여기 있다. 앱 저장소(`loworld-app-*`)와 쇼케이스(`loworld-overview`)는 이것만 가져다 쓴다.

설계는 `loworld-workspace/docs/design/07-common-first-app-factory-redesign.md`에 있다.

## 묶음

| 묶음 | 내용 | 원본(`LoworldUI`)에서 온 곳 |
|---|---|---|
| `src/tokens` | 토큰과 테마의 SCSS | `loworld-ui/src/styles` |
| `src/services` | 서비스, 모델, 포트, 테마 저장소, 화면 크기 | `loworld-ui/core` |
| `src/ui` | 기본 부품 | `loworld-ui/primitives` |
| `src/patterns` | 화면 패턴과 앱별 컴포넌트 | `loworld-ui/surface`, `collection`, `time-grid`, `src/lib`, 쇼케이스의 `domains` |
| `src/game` | 게임 요소. 전투, 캐릭터, 스킬, 도감, 퀘스트, 인벤토리, 상점, 여정, 플레이 셸. 소설에서 나왔지만 모든 앱이 쓴다. `patterns`보다 위층이라 일반 부품은 게임을 가져오지 못한다(C4) | 원본의 소설 컴포넌트 |
| `src/os` | 로그인 뒤의 OS 화면 | 쇼케이스의 `shell`, `platform`, `app.*` |
| `src/catalog` | All Components | 쇼케이스의 `library` |
| `src/firebase` | Firebase 인증과 Firestore | 쇼케이스의 `platform/firebase` |

밖에서는 `@loworld/common/<묶음>`으로 가져온다. 이 저장소 안에서는 진입점을 거치지 않고 파일을 상대 경로로 바로 가져온다. 진입점을 거치면 묶음끼리 서로를 통째로 불러 실행 때 순환이 생긴다.

## 새 앱 만들기

```bash
node conventions/create-app.mjs <id> "<이름>"     # 옆 폴더에 loworld-app-<id>를 만든다
cd ../loworld-app-<id> && npm install && npm run verify && npm run typecheck && npm run serve
```

만들자마자 규칙 검사와 타입 검사를 통과하고 단독으로 뜬다. 화면 하나(`lw-workbench` + `lw-data-table`)와 로직 하나가 들어 있다. 공통은 고치지 않아도 된다. 쇼케이스에 보이려면 `loworld-overview/src/registry/apps.ts`에 선언서를 한 줄 넣는다.

OS 화면이 앱에 대해 아는 것은 전부 선언서(`src/manifest.ts`)에서 온다. OS의 코드에 앱의 이름을 적지 않는다(`verify-common`의 C10이 센다).

| 선언서의 자리 | 쓰이는 곳 |
|---|---|
| `windowTabs[].window` (`title`, `icon`, `size`, `pinLabel`) | 창의 제목과 크기, 작업표시줄, 주소의 제목 |
| `windowTabs[].routes`, `routeAliases` | 탭 아래의 주소(`mode/:modeId`), 옛 주소 |
| `domain.look`, `launchItems[].look` (`shortLabel`, `iconImage`, `codex`, `desktopOnly`) | 바탕화면·작업표시줄·모바일 홈·폴더 시트의 아이콘과 짧은 이름 |
| `domain.launchGroup.folder` (`title`, `icon`, `description`) | 탐색기와 바탕화면의 폴더 |
| `launchItems[].subtitle` | 탐색기에서 이름 아래의 설명 |
| `domain.mobile` (`dock`, `controlAppId`, `characterSession`) | 모바일 하단 바의 기본 단추 |
| `frame` | 틀(헤더, 사이드 메뉴)의 기본값. 단독 실행과 쇼케이스의 창 모두에서 쓰인다 |

홈(바탕화면, 모바일 홈)의 쪽 구성은 앱이 아니라 띄우는 쪽이 `bootstrapLwOs`의 `homePages`로 넣는다.

앱 저장소는 공통을 `.common` 링크로만 본다(`scripts/prepare.mjs`가 만든다). 그래서 공통과 앱 저장소 둘만 나란히 받아도 빌드된다.

## 앱의 화면을 짜는 부품

| 부품 | 쓰임 |
|---|---|
| `lw-app-frame` | 앱의 틀. 헤더, 사이드 메뉴, 목록, 본문, 상세. 틀의 설정을 따른다 |
| `lw-workbench` | 틀에 내용을 넣는 쉬운 겉. 관리 화면에 쓴다 |
| `lw-app-stage` | 셸 하나를 담는 무대 |
| `lw-stack`, `lw-text` | 배치와 글자. 앱의 화면은 HTML 요소를 쓰지 못한다 |
| `lw-data-table`, `lw-tree` | 표와 나무 |
| `lw-card`, `lw-badge`, `lw-button`, `lw-input`, `lw-select`, `lw-tabs`, `lw-modal` … | `src/ui`의 기본 부품 |

전체 목록은 도감(`src/catalog/common-catalog.ts`)에 있다. 도감에 없는 컴포넌트는 검사가 막는다.

## 남은 빚

`node conventions/verify-common.mjs`가 센다. 늘면 실패한다.

- `src/patterns/lib/chrome/shells`, `collection`, `surface`와 `src/game`에 한 앱만 쓰는 셸과 패널이 남아 있다. 범용 부품으로 다시 짜야 한다. `game`의 파일과 선택자에는 아직 소설의 낱말(`novel-`, `d2r-`, `narrative-`)이 있다.
- `src/services`에 소설(게임)의 모델·엔진·자료가 섞여 있다. `game` 묶음으로 갈라야 한다.
- 색을 직접 적은 곳, 상속으로 기능을 받는 컴포넌트.

## 명령

```bash
npm run typecheck                      # 이 저장소만
node conventions/verify-common.mjs     # 빚 검사 (--list C2, --update)
node conventions/component-cycles.mjs  # 컴포넌트 순환 검사
node conventions/sync-template.mjs ../loworld-app-*   # 틀을 고친 뒤 모든 앱에 다시 복사
```
