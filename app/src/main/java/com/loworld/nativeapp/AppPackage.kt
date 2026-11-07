package com.loworld.nativeapp

import android.content.Context
import org.json.JSONObject

/**
 * 이 셸에 넣은 앱의 정보. 팩토리의 묶기 명령이 만든 `app.native.json`을 그대로 읽는다.
 * 셸의 코드에는 앱 이름이나 주소가 없다. 어느 앱이든 같은 코드로 띄운다.
 */
data class AppPackage(
    val appId: String,
    val entry: String,
    /** 웹에 배포한 주소. 없으면 원격 실행을 고를 수 없다. */
    val remoteUrl: String?,
) {
    companion object {
        private const val FILE = "app.native.json"

        fun load(context: Context): AppPackage {
            val json = runCatching {
                context.assets.open(FILE).bufferedReader().use { JSONObject(it.readText()) }
            }.getOrElse { JSONObject() }
            return AppPackage(
                appId = json.optString("appId", "unknown"),
                entry = json.optString("entry", "index.html"),
                remoteUrl = json.optString("remoteUrl", "").takeIf { it.startsWith("https://") },
            )
        }
    }
}
