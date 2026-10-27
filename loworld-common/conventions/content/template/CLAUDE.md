# loworld-content-wuxia

무협 작품의 콘텐츠 저장소다. 이야기 팩, 게임 도감, 그림 목록이 있다. 리더(`loworld-app-story-reader`)는 이것을 실행할 때 내려받는다.

## 지켜야 할 것

1. **코드를 넣지 않는다.** `scripts/content.mjs` 말고는 `.ts`, `.js`, `.mjs` 파일이 없다. 도구는 `loworld-common/conventions/content/`에 있다. `npm run check`가 막는다.
2. **그림을 git에 넣지 않는다.** 그림은 `npm run assets:pull`로 받거나 구글 드라이브의 압축을 푼다. 주소와 지문은 `assets.lock.json`에 있다.
3. **지금의 그림은 임시다.** 나중에 모두 바뀐다. 그림이 있어서 이해가 쉬워지는 곳(도감 항목, 초상)에만 둔다. 도감 항목마다 그림이 하나 보여야 하고, 없으면 `assets/_placeholder.svg`가 보인다. 빈 곳의 목록은 `assets/_missing.txt`다.
4. **올리는 일(GitHub, Cloudflare, 구글 드라이브)은 사용자가 한다.**
5. **판을 바꾸면 `content.json`의 `version`을 올린다.** 리더가 판을 콕 집어 쓰기 때문이다.
6. 주석과 문서는 한국어로 쓴다. 무엇을 하는지보다 왜 그런지를 적는다.

## 명령

npm run check         # 검사. 팩 오류, 도감 JSON, 그림 지문, 코드 파일 여부
npm run build         # dist/<version>/ 을 만든다. CDN에 올라가는 그대로다
npm run watch         # 팩을 고치면 다시 묶는다 (작가용)
npm run assets:pull   # CDN에서 실행용 그림을 받아 assets/에 채운다
npm run assets:pack   # 그림을 압축하고 assets.lock.json을 고친다. 압축은 사용자가 드라이브에 올린다
npm run deploy        # 사용자가 한다. build 뒤 Cloudflare Pages에 올린다
