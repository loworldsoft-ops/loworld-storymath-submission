# 스토리매스 (Story Math)

> **현대자동차그룹 차량용 앱 개발 공모전 제출본** | 앱 버전: **1.2.0**

---

## 1. 앱 소개

**스토리매스**는 수학 공식 암기가 아닌, **"왜 그 개념이 태어났을까?"**에 답하는 탄생 이야기와 원리를 차 안에서 가족이 함께 듣고, 둘 중 하나를 말로 골라 푸는 차량용 인터랙티브 음성 수학 교육 앱입니다.

- 🚗 **차량 특화 설계**: 운전 중인 부모도 화면을 보지 않고 귀로 듣고, 아이는 창밖을 보며 말로 대답할 수 있습니다.
- 🎙️ **자연스러운 음성 대화**: Pleos 음성 엔진(또는 온디바이스 음성 엔진)을 통해 이야기 듣기(TTS)와 음성 응답(STT)이 막힘없이 이어집니다.
- 📱 **완전한 오프라인 구동**: 차량이 터널이나 지하주차장 등 음영지역에 들어가도 네트워크 끊김 없이 모든 콘텐츠가 그대로 재생됩니다.

### 관련 링크
- 🎬 **시연 영상**: https://youtu.be/DEMO_VIDEO_LINK (시연 영상 업로드 후 기재)
- 📱 **숏폼 영상**: https://youtube.com/shorts/... (숏폼 업로드 후 기재)
- 📦 **GitHub Releases**: https://github.com/loworldsoft-ops/loworld-storymath-submission/releases/tag/v1.2.0

---

## 2. APK 위치

- 제출본 저장소 내 위치: `apk/안상현_스토리매스_release.apk`
- 다운로드 릴리스 링크: [GitHub Releases](https://github.com/loworldsoft-ops/loworld-storymath-submission/releases/tag/v1.2.0)

---

## 3. 실행 방법

### A. APK 직접 설치 및 실행 (심사위원 권장)
1. Android 8.0(API 26) 이상의 기기 또는 에뮬레이터를 연결합니다.
2. 아래 명령어로 APK를 설치합니다:
   ```bash
   adb install -r apk/안상현_스토리매스_release.apk
   ```
3. 앱을 실행하고 첫 화면에서 큰 **"이어 듣기"** 버튼을 누릅니다.
4. 마이크 권한 요청 팝업이 뜨면 **"앱 사용 중에만 허용"**을 선택합니다.
5. 흘러나오는 이야기를 듣고, 문제가 나오면 **"첫째"** 또는 **"둘째"**(혹은 화면에 표시된 보기 단어)를 말로 답변합니다.

### B. 소스코드(Android Studio)에서 직접 빌드하기
필수 환경:
- Android Studio 및 JDK 17 이상 (Android SDK Platform 35)

빌드 및 APK 생성:
1. Android Studio에서 이 저장소를 직접 엽니다 (`File > Open...`).
2. 빌드 변형(Build Variants)에서 원하는 환경을 선택합니다:
   - `pleosDebug`: 차량 환경 (Pleos Connect SDK 연동)
   - `standardDebug`: 일반 안드로이드 기기 및 에뮬레이터 환경
3. 터미널 명령어로 빌드할 경우:
   ```bash
   # Pleos 차량용 디버그 APK 빌드
   ./gradlew assemblePleosDebug

   # 일반 안드로이드 기기용 디버그 APK 빌드
   ./gradlew assembleStandardDebug
   ```
생성된 APK는 `app/build/outputs/apk/<flavor>/debug/` 디렉토리에 생성됩니다.

---

## 4. 테스트 환경과 설정

- **권장 해상도**: 가로 고정 (1280×720 또는 1920×1080 차량 디스플레이 비율)
- **지원 OS**: Android 8.0 (API 레벨 26) 이상, targetSdk 35
- **네트워크 설정**: **인터넷 연결 불필요 (비행기 모드에서도 100% 동일하게 동작)**
- **계정 및 로그인**: 별도 로그인 절차 없음 (차량 탑승 즉시 사용 가능)
- **데이터 저장**: 학습 진행 상태(마친 단원, 정답률, 설정값)는 기기 내부 로컬 저장소에만 안전하게 보관됩니다.

---

## 5. 아키텍처 및 기술 구조

스토리매스는 **"Android Native Shell + 오프라인 웹뷰 런타임"** 구조로 구축되어 있습니다.

```
+-----------------------------------------------------------+
|                   Android Native Shell                    |
|                      (Kotlin, Jetpack)                    |
|                                                           |
|  +---------------------+        +----------------------+  |
|  |   SpeechRouter      |        |     WebView Shell    |  |
|  | (Pleos / Android)   | <====> |   (Local Web Bundle) |  |
|  +---------------------+        +----------------------+  |
|       |              |                     |              |
|  [Pleos SDK]   [Built-in TTS/STT]   [Story Math Web App]  |
|  (차량 전용)     (일반 안드로이드)   (assets/www 정적 번들) |
+-----------------------------------------------------------+
```

1. **`app/src/main/java`**: Kotlin 네이티브 셸.
   - `SpeechRouter`: Pleos Connect SDK(차량)와 Android 내장 TTS/STT를 자동 감지하여 전환.
   - `PleosSpeech`: 차량 내 최적화된 온디바이스 TextToSpeech 및 SpeechToText 처리.
   - `MainActivity`: 오프라인 로컬 자산을 안전하게 서빙(`WebViewAssetLoader`)하고 네이티브 브리지 연결.
2. **`app/src/main/assets/www`**: 오프라인 구동을 위해 사전 패키징된 스토리매스 인터랙티브 UI 및 12막 146단원 수학 교육 데이터셋.

---

## 6. Pleos Connect SDK 활용 내역

1. **TextToSpeech (차량 최적화 음성 출력)**:
   - 차량 내 스피커 환경에 최적화된 Pleos TTS 엔진을 우선 라우팅하여 이야기를 생생하게 전달합니다.
   - 셸의 `SpeechRouter`가 Pleos 서비스 유무를 감지하여 차량에서는 Pleos TTS를, 일반 폰/에뮬레이터에서는 Android 내장 TTS로 무중단 자동 전환합니다.
2. **SpeechToText (ON_DEVICE 음성 인식)**:
   - 탑승자의 주행 소음 환경 속에서도 빠르고 정확하게 단답형 답변("첫째", "둘째", 숫자)을 인식할 수 있도록 `ON_DEVICE` 모드로 설정된 STT를 호출합니다.
3. **낱말 동기화 하이라이트 (Word Highlighting)**:
   - 낱말 단위 재생 위치가 지원되는 환경에서는 음성과 글자가 실시간 동기화되어 시각적 집중도를 높입니다.

---

## 7. 수록 콘텐츠 범위

- **교육과정 설계**: 초등학교 1학년 ~ 고등학교 3학년 (12막 146단원. 고등학교는 과목별: 공통수학1·2, 대수, 미적분Ⅰ, 확률과 통계, 미적분Ⅱ, 기하)
- **제출본 수록 현황**: 초1~고3, 12막 146단원 중 146편 수록
