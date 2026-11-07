#!/bin/sh
# 팩토리의 묶음을 이 셸에 넣는다.
#   scripts/apply-package.sh <묶음 폴더>
# 묶음 폴더에는 www.zip과 app.native.json이 있다(loworld-apps의 `npm run package`가 만든다).
# 이 스크립트는 두 파일을 assets 아래에 놓기만 한다. 둘 다 저장소에 넣지 않는다.
set -eu

src="${1:?묶음 폴더를 준다. 예: scripts/apply-package.sh ../loworld-workspace/loworld-apps/dist/package/showcase}"
root="$(cd "$(dirname "$0")/.." && pwd)"
assets="$root/app/src/main/assets"

[ -f "$src/www.zip" ] || { echo "www.zip이 없다: $src" >&2; exit 1; }
[ -f "$src/app.native.json" ] || { echo "app.native.json이 없다: $src" >&2; exit 1; }

rm -rf "$assets/www"
mkdir -p "$assets/www"
unzip -q "$src/www.zip" -d "$assets/www"
# 묶음의 파일에는 날짜가 없다(같은 내용이면 같은 zip이 나오게 하려고). 풀면 모두 1980년이 된다.
# 빌드 도구는 날짜와 크기로 바뀐 파일을 가려내서, 크기가 같은 새 파일을 옛것으로 본다. 지금 시각을 찍어 준다.
find "$assets/www" -type f -exec touch {} +
cp "$src/app.native.json" "$assets/app.native.json"
echo "넣었다: $(grep -o '"appId": *"[^"]*"' "$assets/app.native.json")"
