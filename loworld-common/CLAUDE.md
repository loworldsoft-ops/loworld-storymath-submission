# loworld-common

공통 저장소다. 먼저 `README.md`를 읽는다. 전체 설계는 `loworld-workspace/docs/design/07-common-first-app-factory-redesign.md`에 있다.

## 지켜야 할 것

1. **앱을 모른다.** 앱의 id나 낱말을 코드, 선택자, 파일 이름에 새로 넣지 않는다. 앱의 목록은 띄우는 쪽이 `LwAppManifest`로 넣는다.
2. **빚을 늘리지 않는다.** `node conventions/verify-common.mjs`가 기준선과 비교한다. 줄였으면 `--update`.
3. **이 저장소 안에서는 파일을 상대 경로로 바로 가져온다.** `@loworld/common/<묶음>`은 밖에서만 쓴다.
4. **밖으로 내보낼 것은 묶음의 `public.ts`에 손으로 적는다.** `index.ts`는 옮기는 도구가 만든 것이다.
5. **컴포넌트는 `.ts`, `.html`, `.scss` 세 파일이다.** 선택자는 `lw-`로 시작한다.
6. **고치면 화면 비교를 돌린다.** 이 저장소의 변경은 모든 앱의 화면을 바꾼다.
7. **앱의 틀(`conventions/app-template`)을 고치면 `sync-template.mjs`로 모든 앱에 다시 복사한다.**

## 명령

```bash
npm run typecheck
node conventions/verify-common.mjs [--list C2 | --update | --self-test]
node conventions/verify-app.mjs <앱 폴더> | --self-test
node conventions/generate-catalog.mjs          # 공통에 컴포넌트를 더했으면 돌린다. 도감에 자동으로 올린다
node conventions/component-cycles.mjs
node conventions/sync-template.mjs ../loworld-app-*
```
