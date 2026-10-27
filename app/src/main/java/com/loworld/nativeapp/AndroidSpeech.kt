package com.loworld.nativeapp

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognitionService
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import java.util.Locale

/**
 * 안드로이드에 깔린 엔진들. 어느 폰에나 있는 길이라 모든 빌드에 들어간다.
 *
 * 읽기: 기본 목소리(설정의 "기본 엔진"), 그다음 깔린 TTS 엔진마다 하나(Google, 삼성 …).
 * 듣기: 기본 인식, 기기 안 인식(안드로이드 12 이상, 인터넷 없이), 그다음 깔린 인식 서비스마다 하나.
 * 기본이 앞에 오는 까닭: 사용자가 폰에서 고른 엔진이고, 거의 모든 폰에서 한국어가 된다.
 * 기기 안 인식은 한국어 언어 팩이 없으면 듣기에서 실패한다(빈 글). 그래서 자동에서는 기본 인식 뒤에 둔다.
 *
 * 엔진 목록은 서비스 질의로 얻는다. 안드로이드 11부터는 매니페스트의 `<queries>`가 있어야 보인다.
 */
class AndroidSpeechCatalog(
    private val context: Context,
    private val mic: MicPermission,
) : SpeechEngineCatalog {
    override fun speakOptions(): List<EngineOption<SpeakEngine>> = buildList<EngineOption<SpeakEngine>> {
        add(EngineOption("android", context.getString(R.string.speech_android_tts)) { AndroidSpeakEngine(context, null) })
        services(TextToSpeech.Engine.INTENT_ACTION_TTS_SERVICE).forEach { info ->
            add(EngineOption("android:${info.packageName}", label(info)) { AndroidSpeakEngine(context, info.packageName) })
        }
    }

    override fun listenOptions(): List<EngineOption<ListenEngine>> = buildList<EngineOption<ListenEngine>> {
        if (SpeechRecognizer.isRecognitionAvailable(context)) {
            add(EngineOption("android", context.getString(R.string.speech_android_stt)) { AndroidListenEngine(context, mic, onDevice = false, component = null) })
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && SpeechRecognizer.isOnDeviceRecognitionAvailable(context)) {
            add(EngineOption("android-ondevice", context.getString(R.string.speech_android_stt_ondevice)) { AndroidListenEngine(context, mic, onDevice = true, component = null) })
        }
        services(RecognitionService.SERVICE_INTERFACE).forEach { info ->
            val component = ComponentName(info.packageName, info.name)
            add(EngineOption("android:${component.flattenToShortString()}", label(info)) { AndroidListenEngine(context, mic, onDevice = false, component = component) })
        }
    }

    @Suppress("DEPRECATION") // ResolveInfoFlags는 API 33부터다. minSdk가 26이라 옛 것을 쓴다.
    private fun services(action: String): List<ServiceInfo> =
        context.packageManager.queryIntentServices(Intent(action), 0).mapNotNull { it.serviceInfo }

    private fun label(info: ServiceInfo): String = info.loadLabel(context.packageManager).toString()
}

/**
 * 안드로이드 TextToSpeech로 읽는다. enginePackage가 null이면 기기의 기본 엔진이다.
 * 읽기마다 번호(utteranceId)를 붙여, 멈춘 읽기의 늦은 onStop·onDone이 다음 읽기를 끝내지 않게 한다.
 */
class AndroidSpeakEngine(
    private val context: Context,
    private val enginePackage: String?,
) : SpeakEngine {
    private val main = Handler(Looper.getMainLooper())
    private var tts: TextToSpeech? = null
    private var ready = false
    private var nextId = 0
    private var pendingId: String? = null
    private var pendingDone: (() -> Unit)? = null
    private var pendingRange: ((Int, Int) -> Unit)? = null

    override fun prepare(onReady: (Boolean) -> Unit) {
        val listener = TextToSpeech.OnInitListener { status ->
            main.post {
                val engine = tts
                // 한국어가 없거나 데이터가 받아져 있지 않으면 쓰지 않는다(다른 엔진으로 넘어가게).
                val korean = engine != null && status == TextToSpeech.SUCCESS && engine.setLanguage(Locale.KOREA) >= TextToSpeech.LANG_AVAILABLE
                if (korean) engine?.setOnUtteranceProgressListener(progress)
                ready = korean
                onReady(korean)
            }
        }
        tts = runCatching {
            if (enginePackage == null) TextToSpeech(context.applicationContext, listener)
            else TextToSpeech(context.applicationContext, listener, enginePackage)
        }.getOrNull()
        if (tts == null) onReady(false)
    }

    override fun speak(text: String, rate: Float, range: (Int, Int) -> Unit, done: () -> Unit) {
        finish()
        val engine = tts
        if (!ready || engine == null || text.isBlank()) return done()
        val id = "lw-${++nextId}"
        pendingId = id
        pendingDone = done
        pendingRange = range
        engine.setSpeechRate(rate.coerceIn(0.5f, 2f))
        if (engine.speak(text, TextToSpeech.QUEUE_FLUSH, null, id) != TextToSpeech.SUCCESS) finish()
    }

    override fun stop() {
        finish()
        if (ready) tts?.stop()
    }

    override fun release() {
        stop()
        ready = false
        tts?.shutdown()
        tts = null
    }

    private fun finish() {
        val done = pendingDone ?: return
        pendingDone = null
        pendingRange = null
        pendingId = null
        done()
    }

    /** 다른 스레드에서 온다. 주 스레드로 넘기고, 지금 읽기의 번호일 때만 끝낸다. */
    private val progress = object : UtteranceProgressListener() {
        override fun onStart(utteranceId: String?) = Unit

        override fun onRangeStart(utteranceId: String?, start: Int, end: Int, frame: Int) {
            main.post {
                if (utteranceId == pendingId) {
                    pendingRange?.invoke(start, end)
                }
            }
        }

        override fun onDone(utteranceId: String?) {
            main.post { if (utteranceId == pendingId) finish() }
        }

        @Deprecated("API 21부터 onError(String, Int)를 쓴다. 옛 엔진을 위해 둔다")
        override fun onError(utteranceId: String?) {
            main.post { if (utteranceId == pendingId) finish() }
        }

        override fun onError(utteranceId: String?, errorCode: Int) {
            main.post { if (utteranceId == pendingId) finish() }
        }

        override fun onStop(utteranceId: String?, interrupted: Boolean) {
            main.post { if (utteranceId == pendingId) finish() }
        }
    }
}

/**
 * 안드로이드 SpeechRecognizer로 듣는다. 주 스레드에서 만들고 부르며, 콜백도 주 스레드로 온다.
 * @param onDevice 기기 안에서만 인식한다(안드로이드 12 이상). 인터넷이 없어도 된다
 * @param component 이 인식 서비스를 쓴다. null이면 기기의 기본 인식
 *
 * 듣기마다 번호(session)를 붙인다. 마이크 권한을 묻는 사이에 멈추면, 권한의 답이 와도 듣지 않는다.
 */
class AndroidListenEngine(
    private val context: Context,
    private val mic: MicPermission,
    private val onDevice: Boolean,
    private val component: ComponentName?,
) : ListenEngine {
    private var recognizer: SpeechRecognizer? = null
    private var session = 0
    private var heardCallback: ((String) -> Unit)? = null

    override fun prepare(onReady: (Boolean) -> Unit) {
        recognizer = runCatching { create() }.getOrNull()
        recognizer?.setRecognitionListener(listener)
        onReady(recognizer != null)
    }

    override fun listen(heard: (String) -> Unit) {
        finish("")
        val r = recognizer ?: return heard("")
        val my = ++session
        heardCallback = heard
        mic.request { granted ->
            if (my != session) return@request
            if (!granted) return@request finish("")
            runCatching { r.startListening(intent()) }.onFailure { finish("") }
        }
    }

    override fun stop() {
        session++
        recognizer?.cancel()
        finish("")
    }

    override fun release() {
        stop()
        recognizer?.destroy()
        recognizer = null
    }

    private fun create(): SpeechRecognizer = when {
        onDevice && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> SpeechRecognizer.createOnDeviceSpeechRecognizer(context.applicationContext)
        component != null -> SpeechRecognizer.createSpeechRecognizer(context.applicationContext, component)
        else -> SpeechRecognizer.createSpeechRecognizer(context.applicationContext)
    }

    private fun intent() = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ko-KR")
        // 후보를 셋까지 받는다. 웹이 후보 중 하나라도 맞으면 알아듣는다(브라우저의 maxAlternatives와 같다).
        putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
        putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
        putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.packageName)
    }

    private fun finish(text: String) {
        val heard = heardCallback ?: return
        heardCallback = null
        heard(text)
    }

    private val listener = object : RecognitionListener {
        override fun onResults(results: Bundle?) {
            val texts = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION).orEmpty()
            finish(texts.joinToString(" "))
        }

        // 못 알아들음, 말이 없음, 네트워크, 언어 팩 없음 … 모두 빈 글이다. 웹이 다시 묻거나 버튼을 기다린다.
        override fun onError(error: Int) = finish("")

        override fun onReadyForSpeech(params: Bundle?) = Unit
        override fun onBeginningOfSpeech() = Unit
        override fun onRmsChanged(rmsdB: Float) = Unit
        override fun onBufferReceived(buffer: ByteArray?) = Unit
        override fun onEndOfSpeech() = Unit
        override fun onPartialResults(partialResults: Bundle?) = Unit
        override fun onEvent(eventType: Int, params: Bundle?) = Unit
    }
}
