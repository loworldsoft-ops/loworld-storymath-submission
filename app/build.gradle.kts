import groovy.json.JsonSlurper
import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// 이 셸에 넣을 앱. 팩토리의 묶기 명령이 만든 app.native.json을 scripts/apply-package.sh가 여기에 놓는다.
// 앱 이름과 패키지 id는 이 파일에서만 온다. 셸의 코드와 리소스에는 없다.
val packageFile = file("src/main/assets/app.native.json")
@Suppress("UNCHECKED_CAST")
val appPackage: Map<String, Any?> =
    if (packageFile.exists()) JsonSlurper().parse(packageFile) as Map<String, Any?> else emptyMap()
val appName = appPackage["appName"] as? String ?: "Loworld Shell"
val packageId = appPackage["androidPackageId"] as? String ?: "com.loworld.shell"
val appVersion = (appPackage["version"] as? String)?.takeIf { it != "0.0.0" } ?: "0.1.0"
val orientation = when (appPackage["orientation"] as? String) {
    "landscape" -> "sensorLandscape"
    "portrait" -> "sensorPortrait"
    else -> "unspecified"
}
val appVersionCode = (appPackage["versionCode"] as? Number)?.toInt() ?: 1

// 언어별 앱 이름(설계 10의 3.5). 런처의 이름은 기기 언어를 따른다(앱 안의 언어 설정과는 별개다. 안드로이드의 규칙).
// appNames가 있으면 기본(values)은 영어, values-ko·values-ja는 그 언어다. 없으면 지금처럼 appName 하나다.
@Suppress("UNCHECKED_CAST")
val appNames = (appPackage["appNames"] as? Map<String, String>).orEmpty()
val defaultAppName = appNames["en"] ?: appName
val localeResDir = layout.buildDirectory.dir("generated/appNameRes").get().asFile
localeResDir.deleteRecursively()
// 기본(values)도 같은 폴더에 파일로 둔다. resValue로만 두면 린트가 언어별 이름을 "기본에 없는 번역"으로 보고 출시 빌드를 막는다
for ((locale, name) in appNames + if (appNames.isEmpty()) emptyMap() else mapOf("" to defaultAppName)) {
    if (locale == "en") continue
    val dir = File(localeResDir, if (locale.isEmpty()) "values" else "values-$locale").apply { mkdirs() }
    val escaped = name.replace("&", "&amp;").replace("<", "&lt;").replace("'", "\\'")
    File(dir, "strings.xml").writeText("<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<resources>\n    <string name=\"app_name\">$escaped</string>\n</resources>\n")
}

// release 서명. 키와 비밀번호는 저장소에 넣지 않는다. keystore.properties(.gitignore에 있다)가 있을 때만 서명한다.
// 없으면 release APK는 서명되지 않은 채로 나온다(app-<변형>-release-unsigned.apk).
// 셸 하나로 여러 앱을 묶으므로 앱마다 키를 나눌 수 있게, -Ploworld.keystore=<파일>로 다른 설정 파일을 줄 수 있다.
val keystoreFile = (findProperty("loworld.keystore") as String?)?.let { file(it) } ?: rootProject.file("keystore.properties")
val keystore = Properties().apply { if (keystoreFile.exists()) keystoreFile.inputStream().use { load(it) } }

android {
    namespace = "com.loworld.nativeapp"
    compileSdk = 35

    defaultConfig {
        applicationId = packageId
        minSdk = 26
        targetSdk = 35
        versionCode = appVersionCode
        versionName = appVersion
        manifestPlaceholders["screenOrientation"] = orientation
        if (appNames.isEmpty()) resValue("string", "app_name", appName)
    }

    androidResources {
        noCompress += "onnx"
    }

    sourceSets["main"].res.srcDir(localeResDir)

    // 음성 모델(Supertonic, 134MB)은 디버그 빌드에만 싣는다. 출시 빌드는 앱이 처음 쓸 때 받는다(TtsModelStore.kt).
    // 모델을 실은 출시 빌드가 필요하면 -Ploworld.bundleTts=true (인터넷 없이 쓰는 차량 등)
    sourceSets["debug"].assets.srcDir("src/ttsModel/assets")
    // 옛 자리(src/main/assets/models)에 모델이 남아 있으면 출시 APK에도 실린다(2026-11-16, 64MB → 239MB). 빌드를 막는다
    if (file("src/main/assets/models").exists()) {
        throw GradleException("src/main/assets/models에 음성 모델이 남아 있다. src/ttsModel/assets/models로 옮기거나 지운다(ensure-tts-model).")
    }
    if ((findProperty("loworld.bundleTts") as String?) == "true") sourceSets["release"].assets.srcDir("src/ttsModel/assets")

    // 빌드 변형. standard는 어느 안드로이드에서나 돈다. pleos는 Pleos Connect(차량)의 TextToSpeech·SpeechToText를 쓴다.
    //   ./gradlew assembleStandardDebug   ./gradlew assemblePleosDebug
    flavorDimensions += "platform"
    productFlavors {
        create("standard") { dimension = "platform" }
        create("pleos") { dimension = "platform" }
    }

    signingConfigs {
        if (keystoreFile.exists()) {
            create("release") {
                storeFile = rootProject.file(keystore.getProperty("storeFile"))
                storePassword = keystore.getProperty("storePassword")
                keyAlias = keystore.getProperty("keyAlias")
                keyPassword = keystore.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            if (keystoreFile.exists()) signingConfig = signingConfigs.getByName("release")
            // 코드와 쓰지 않는 리소스를 줄인다. 이름으로 찾는 것(웹 통로, Sherpa JNI)은 proguard-rules.pro가 지킨다
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            // 출시 기기는 ARM뿐이다. 에뮬레이터용 x86·x86_64의 음성 엔진 라이브러리(약 50MB)를 싣지 않는다.
            // 디버그 빌드는 에뮬레이터에서 돌려야 하므로 그대로 둔다
            ndk { abiFilters += listOf("arm64-v8a", "armeabi-v7a") }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("com.google.android.material:material:1.12.0")
    // 기기 안 신경망 음성 (Sherpa-ONNX AAR). 모델은 Supertonic 3(assets/models/tts, scripts/ensure-tts-model.mjs).
    // 1.13.8은 Supertonic 한국어를 맥에서 시험한 판이다. 앞의 Piper는 2.0.0부터 espeak-ng가 빠져 소리가 나지 않았는데,
    // Supertonic은 espeak을 쓰지 않으므로 올려도 되지만 올리면 다시 시험한다.
    implementation(files("libs/sherpa-onnx-1.13.8.aar"))
    // 처음 쓸 때 받는 음성 모델 묶음(.tar.bz2)을 푼다(TtsModelStore.kt)
    implementation("org.apache.commons:commons-compress:1.27.1")
    // Pleos 빌드에만 들어간다. 저장소는 settings.gradle.kts에 있다.
    // 셸의 순수 함수(글 나누기 등)를 JVM에서 시험한다. ./gradlew testStandardDebugUnitTest
    testImplementation("junit:junit:4.13.2")
    "pleosImplementation"("ai.pleos.playground:TextToSpeech:3.3.1")
    "pleosImplementation"("ai.pleos.playground:SpeechToText:3.3.1")
}
