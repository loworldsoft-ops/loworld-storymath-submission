package com.loworld.nativeapp

import android.content.Context

/** 일반 빌드: 안드로이드에 깔린 엔진만 쓴다. Pleos SDK는 들어가지 않는다. */
fun createSpeechCatalog(context: Context, mic: MicPermission): SpeechEngineCatalog = AndroidSpeechCatalog(context, mic)
