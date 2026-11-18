# 릴리스 빌드의 코드 축소(R8) 규칙. 축소하면 classes.dex가 줄고 쓰지 않는 리소스가 빠진다(2026-11-14 점검).
# 이름으로 찾아 부르는 것은 축소가 이름을 바꾸거나 지우면 실행 중에 깨진다. 그런 것만 여기서 지킨다.

# 웹이 부르는 통로(loworldNative). 웹뷰는 @JavascriptInterface가 붙은 메서드를 이름으로 찾는다
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface

# Sherpa-ONNX. 네이티브 라이브러리(JNI)가 자바 클래스와 필드를 이름으로 찾는다
-keep class com.k2fsa.sherpa.onnx.** { *; }

# Pleos(차량) 음성. 안을 모르는 라이브러리라 통째로 둔다
-keep class ai.pleos.** { *; }
-dontwarn ai.pleos.**

# 소스 줄 번호는 남겨 충돌 보고를 읽을 수 있게 한다
-keepattributes SourceFile,LineNumberTable

# commons-compress(음성 모델 묶음 풀기). 쓰지 않는 압축 형식(xz, zstd, brotli, Pack200)의 선택 의존은 없어도 된다
-dontwarn org.tukaani.xz.**
-dontwarn com.github.luben.zstd.**
-dontwarn org.brotli.dec.**
-dontwarn org.objectweb.asm.**
-dontwarn org.osgi.**

# Pleos 빌드에만 들어오는 tink(암호)가 컴파일 때만 쓰는 주석(javax.annotation)을 가리킨다. 실행에는 없어도 된다.
# 이것이 없으면 pleos 릴리스의 R8이 멈춘다(스토리매스 1.3.1, 2026-11-18)
-dontwarn javax.annotation.Nullable
-dontwarn javax.annotation.concurrent.GuardedBy
