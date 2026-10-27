# Loworld Android 셸

웹 앱 하나를 넣어 Android 앱으로 내는 셸이다. 어느 앱이든 같은 코드로 띄운다. 셸의 코드에는 앱 이름, 주소, 로그인이 없다.

넣는 것은 워크스페이스의 묶기 명령(`scripts/package-native.mjs`)이 만든 두 파일이다.

| 파일 | 내용 |
|---|---|
| `www.zip` | 빌드한 웹 앱 |
| `app.native.json` | 앱 이름, 패키지 id, 버전, `versionCode`, 화면 방향(`orientation`: `landscape`·`portrait`·없음), 원격 주소 |

## 빌드 변형

| 변형 | 소리 | 쓰는 곳 |
|---|---|---|
| `standard` | 안드로이드의 TextToSpeech·SpeechRecognizer | 일반 안드로이드 |
| `pleos` | Pleos Connect의 TextToSpeech·SpeechToText(ON_DEVICE)가 먼저, 안 되면 안드로이드 | 차량, Pleos Connect 에뮬레이터 |

읽기와 듣기는 엔진을 따로 고른다. 기본은 자동이다: 목록의 앞부터 준비해 보고 처음 된 것을 쓴다. 웹 앱의 설정 화면에서 바꿀 수 있고, 고른 것은 셸이 기억한다(`SpeechRouter.kt`).

## 빌드

워크스페이스에서 `npm run apk -- <앱 id>` 하나로 한다. 아래는 그 안에서 하는 일이다.

```bash
# 1. 워크스페이스에서 묶는다
node scripts/package-native.mjs story-math --name 스토리매스 --assets wallpapers,shared-icons,images,ics

# 2. 묶음을 이 셸에 넣는다
scripts/apply-package.sh ../dist/package/story-math

# 3. APK를 만든다. 묶음을 바꿨으면 clean을 먼저 한다(지운 파일이 빌드 캐시에 남는다)
./gradlew clean assembleStandardDebug  # 일반 폰: app/build/outputs/apk/standard/debug/app-standard-debug.apk
./gradlew clean assemblePleosDebug     # app/build/outputs/apk/pleos/debug/app-pleos-debug.apk
./gradlew assemblePleosRelease         # app/build/outputs/apk/pleos/release/
```

앱 이름과 `applicationId`는 `app.native.json`에서 온다(`app/build.gradle.kts`). 묶음을 넣지 않으면 `Loworld Shell`, `com.loworld.shell`로 빌드된다.

`local.properties`에 Android SDK 자리(`sdk.dir=...`)가 있어야 한다. Android Studio로 열면 저절로 생긴다.

### release 서명

키는 저장소에 넣지 않는다. 이 폴더에 `keystore.properties`를 두면 release APK에 서명한다(없으면 서명하지 않은 APK가 나온다). 두 파일 모두 `.gitignore`에 있다.

```properties
storeFile=loworld-release.jks
storePassword=...
keyAlias=loworld
keyPassword=...
```

키 만들기: `keytool -genkeypair -keystore loworld-release.jks -alias loworld -keyalg RSA -keysize 2048 -validity 10000`

## 구조

| 파일 | 하는 일 |
|---|---|
| `MainActivity.kt` | 웹뷰 하나. 소리 엔진을 준비한 뒤(최대 3초) 넣어 둔 묶음을 `https://appassets.androidplatform.net/www/index.html`로 연다 |
| `LoworldNativeBridge.kt` | 웹과의 통로. 하나뿐이다 |
| `NativeSpeech.kt` | 셸이 웹 대신 읽고 듣는 길(인터페이스). 엔진 고르기도 여기에 있다 |
| `SpeechEngines.kt` | 엔진의 모양(`SpeakEngine`, `ListenEngine`)과 목록(`SpeechEngineCatalog`). 엔진을 더하려면 이 모양을 구현하고 목록에 한 줄을 더한다 |
| `SpeechRouter.kt` | 고른 엔진을 준비하고, 안 되면 다음 것으로 넘어간다. 셸의 소리는 이것 하나다 |
| `AndroidSpeech.kt` | 안드로이드의 엔진들. 기본 목소리, 깔린 TTS 엔진, 기본 인식, 기기 안 인식, 깔린 인식 서비스 |
| `src/pleos/.../PleosSpeech.kt` | Pleos TextToSpeech·SpeechToText |
| `src/*/.../NativeSpeechFactory.kt` | 변형마다 엔진의 목록을 만든다(`createSpeechCatalog`) |
| `AppPackage.kt` | `app.native.json` 읽기 |
| `scripts/apply-package.sh` | 묶음을 `assets` 아래에 놓는다 |

## 통로

- 웹 → 셸: `loworldNative.postMessage(JSON 글자)`. JSON은 `{ "action": ... }`.
- 셸 → 웹: `window.onLoworldNativeMessage({ type, data })`.
- 웹 → 셸(바로 답함): `loworldNative.hasAction(동작)`. 웹의 소리 포트가 처음 만들어질 때 셸이 읽을 수 있는지 묻는다.

| 동작 | 답 |
|---|---|
| `capabilities` | `{ type: "capabilities", data: { platform, actions } }` |
| `getExecutionMode` | `{ type: "executionMode", data: { mode } }` |
| `openModeSelector` | 없음(셸이 고르기 창을 띄운다) |
| `speech.speak` `{ id, text, rate }` | 다 읽으면 `{ type: "speech.spoken", data: { id } }`, 읽는 동안 `{ type: "speech.range", data: { id, start, end } }`(안드로이드 엔진만). Pleos에는 빠르기 API와 읽는 자리 알림이 없어 `rate`와 `range`는 안드로이드 엔진에서만 쓴다 |
| `speech.listen` `{ id }` | 다 들으면 `{ type: "speech.heard", data: { id, text } }` |
| `speech.stop` | 없음 |
| `speech.engines` | `{ type: "speech.engines", data: { speak, listen } }`. 각각 `{ selected, active, options: [{ id, label }] }` |
| `speech.chooseEngine` `{ kind, id }` | 엔진을 바꾸고 준비를 마친 뒤 `speech.engines`와 같은 답. `id`가 `auto`면 자동 |

`speech.speak`·`speech.listen`·`speech.stop`은 엔진이 준비되었을 때만 `capabilities`와 `hasAction`에 나온다. `speech.engines`·`speech.chooseEngine`은 늘 있다. 웹은 `speech.engines`가 있으면 셸의 소리를 쓴다.

## 실행 방식

`app.native.json`에 `remoteUrl`(https)이 있으면 "온라인"과 "내장" 가운데 고를 수 있다. 없으면 넣어 둔 묶음으로만 연다. 앱의 주소가 아닌 링크는 브라우저로 넘긴다.
