# Loworld 앱 저장소

이 파일은 모든 앱 저장소에서 같다. 고치려면 `loworld-common/conventions/app-template/CLAUDE.md`를 고친다.

이 저장소는 앱 하나다. **공통 컴포넌트를 조합한 화면과 로직만** 있다. 모양은 전부 `loworld-common`에 있다.

## 지켜야 할 것

`npm run verify`가 검사한다. 어기면 실패한다.

1. **스타일을 쓰지 않는다.** `.scss`·`.css` 파일, 컴포넌트의 `styles`, 템플릿의 `class`·`style` 속성이 없다.
2. **HTML 요소를 쓰지 않는다.** 화면의 템플릿에는 `lw-*` 컴포넌트와 `ng-container`, `ng-template`, 제어 흐름(`@if`, `@for`, `@switch`)만 있다. 배치는 `lw-stack`, 글자는 `lw-text`, 표는 `lw-data-table`, 큰 틀은 `lw-workbench`나 `lw-app-stage`로 한다.
3. **컴포넌트를 만들지 않는다.** 컴포넌트는 `src/screens/<화면>/<화면>.screen.ts`의 화면뿐이다. 지시자와 파이프도 만들지 않는다.
4. **공통만 가져온다.** `@loworld/common/*`, `@angular/*`, `rxjs`. 다른 앱과 `firebase`를 가져오지 않는다. `window`, `document`, `localStorage`, `navigator`를 직접 쓰지 않는다.
5. **틀의 파일을 고치지 않는다.** `standalone/`, `scripts/`, `tsconfig.json`, `angular.json`, `.github/`, `package.json`의 명령과 의존.

## 필요한 모양이 공통에 없을 때

이 저장소에 만들지 않는다. `loworld-common`에 범용 부품으로 넣고(이름과 입력에 이 앱의 낱말이 없어야 한다), 도감(`common-catalog.ts`)에 올린 뒤 여기서 가져다 쓴다. 그러면 다른 모든 앱도 쓸 수 있다.

## 구조

| 경로 | 내용 |
|---|---|
| `src/manifest.ts` | 선언서. 이름, 아이콘, 접근 조건, 창 등록, 틀의 기본값 |
| `src/screens/` | 화면. 로직을 불러 공통 부품에 잇는다 |
| `src/logic/` | 상태와 규칙. 화면이 어떻게 생겼는지 모른다 |
| `src/data/` | 자료 |

## 명령

공통 저장소가 옆 폴더(`../loworld-common`)에 있어야 한다.

```bash
npm install
npm run verify       # 규칙 검사
npm run typecheck
npm run serve        # 단독 실행. 로그인 뒤에 이 앱이 전체 화면으로 뜬다
```
