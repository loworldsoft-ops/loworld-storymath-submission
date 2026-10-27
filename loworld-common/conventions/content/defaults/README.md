# 기본 표

팩 폴더에 `voice.csv`(말투)나 `moods.csv`(감정)가 없으면 팩 도구(`pack-compiler.mjs`)가 이 표를 넣는다.

**이 표는 W9 전의 엔진 코드(`resolveSpeech`, `resolveEmotion`, `alignmentSpeech`)와 똑같이 고른다.** 그래서 표를 갖지 않은 팩(PoC 1 `wuxia-1`, 고정 팩)의 결과가 W9 전과 같다. `narrative-voice.spec.ts`가 옛 코드와 모든 조합에서 같은지 본다. 고치면 그 팩들의 말투가 바뀐다.

칸의 뜻은 콘텐츠 저장소의 `bible/voice.md` 3장.
