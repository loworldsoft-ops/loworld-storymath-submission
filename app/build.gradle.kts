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
        resValue("string", "app_name", appName)
    }

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
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
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
    // Pleos 빌드에만 들어간다. 저장소는 settings.gradle.kts에 있다.
    "pleosImplementation"("ai.pleos.playground:TextToSpeech:3.3.1")
    "pleosImplementation"("ai.pleos.playground:SpeechToText:3.3.1")
}
