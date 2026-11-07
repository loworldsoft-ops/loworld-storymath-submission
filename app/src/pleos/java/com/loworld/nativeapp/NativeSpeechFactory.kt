package com.loworld.nativeapp

import android.content.Context

/**
 * Pleos 빌드: Pleos를 맨 앞에, 그 뒤에 안드로이드 엔진을 둔다.
 * 차에서는 Pleos가 준비되어 그것을 쓰고, 폰이나 Pleos가 안 되는 곳에서는 안드로이드 엔진으로 넘어간다.
 */
fun createSpeechCatalog(context: Context, mic: MicPermission): SpeechEngineCatalog {
    val android = AndroidSpeechCatalog(context, mic)
    return object : SpeechEngineCatalog {
        override fun speakOptions(): List<EngineOption<SpeakEngine>> =
            listOf(EngineOption<SpeakEngine>("pleos", context.getString(R.string.speech_pleos_tts), section = "차량 음성") { PleosSpeakEngine(context) }) +
                android.speakOptions()

        override fun listenOptions(): List<EngineOption<ListenEngine>> =
            listOf(EngineOption<ListenEngine>("pleos", context.getString(R.string.speech_pleos_stt), section = "차량 음성") { PleosListenEngine(context) }) +
                android.listenOptions()
    }
}
