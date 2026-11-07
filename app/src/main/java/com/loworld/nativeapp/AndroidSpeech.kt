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
import android.speech.tts.Voice
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
/** 고르는 화면의 묶음 제목. 웹은 이 글을 그대로 보인다 */
const val SECTION_AI = "AI 목소리"
const val SECTION_PHONE = "폰 목소리"
const val SECTION_ENGINE = "다른 음성 엔진"
const val SECTION_LISTEN_ONDEVICE = "온디바이스 음성 인식"
const val SECTION_LISTEN_SYSTEM = "시스템 음성 인식"

class AndroidSpeechCatalog(
    private val context: Context,
    private val mic: MicPermission,
) : SpeechEngineCatalog {
    private val voices = KoreanVoiceDirectory(context)

    override fun speakOptions(): List<EngineOption<SpeakEngine>> = buildList<EngineOption<SpeakEngine>> {
        // 기기 안 신경망 음성(Supertonic 3). 목소리마다 한 칸이다. 모델이 하나라 한 목소리가 안 되면 나머지도 안 된다(group).
        SUPERTONIC_VOICES.forEach { (sid, label) ->
            add(EngineOption("supertonic:$sid", label, SUPERTONIC_PREPARE_TIMEOUT_MS, group = "supertonic", section = SECTION_AI) { SherpaSpeakEngine(context, sid) })
        }
        // 기본 엔진의 한국어 목소리를 하나씩 칸으로 낸다("여성 1", "남성 1" …). 엔진을 먼저 고르고 목소리를 고르는 두 단계로 두었더니
        // 자동(신경망 AI)일 때 목소리 칸이 보이지 않아 고를 수 있는 줄을 몰랐다(2026-11-03). 그래서 한 목록에 둔다.
        voices.list().forEach { (name, label) ->
            add(EngineOption("android-voice:$name", label, section = SECTION_PHONE) { AndroidSpeakEngine(context, null, name) })
        }
        add(EngineOption("android", "기본 시스템 음성", section = SECTION_ENGINE) { AndroidSpeakEngine(context, null) })
        services(TextToSpeech.Engine.INTENT_ACTION_TTS_SERVICE).forEach { info ->
            add(EngineOption("android:${info.packageName}", label(info), section = SECTION_ENGINE) { AndroidSpeakEngine(context, info.packageName) })
        }
    }

    override fun listenOptions(): List<EngineOption<ListenEngine>> = buildList<EngineOption<ListenEngine>> {
        // 1순위: 기기 내 온디바이스 음성인식 (인터넷 없이 기기 내 신경망 처리, Android 12+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && SpeechRecognizer.isOnDeviceRecognitionAvailable(context)) {
            add(EngineOption("android-ondevice", context.getString(R.string.speech_android_stt_ondevice), section = SECTION_LISTEN_ONDEVICE) { AndroidListenEngine(context, mic, onDevice = true, component = null) })
        }
        // 2순위: 시스템 기본 음성인식 (온디바이스 미지원 기기 폴백)
        if (SpeechRecognizer.isRecognitionAvailable(context)) {
            add(EngineOption("android", context.getString(R.string.speech_android_stt), section = SECTION_LISTEN_SYSTEM) { AndroidListenEngine(context, mic, onDevice = false, component = null) })
        }
        services(RecognitionService.SERVICE_INTERFACE).forEach { info ->
            val component = ComponentName(info.packageName, info.name)
            add(EngineOption("android:${component.flattenToShortString()}", label(info), section = SECTION_LISTEN_SYSTEM) { AndroidListenEngine(context, mic, onDevice = false, component = component) })
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
    /** 이 목소리로 읽는다. null이면 엔진의 기본 목소리. 목소리가 없어졌으면 준비에 실패해 다음 엔진으로 넘어간다 */
    private val voiceName: String? = null,
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
                val voiced = korean && (voiceName == null || useVoice(engine!!, voiceName))
                if (voiced) engine?.setOnUtteranceProgressListener(progress)
                ready = voiced
                onReady(voiced)
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

    private fun useVoice(engine: TextToSpeech, name: String): Boolean {
        val voice = runCatching { engine.voices }.getOrNull()?.firstOrNull { it.name == name } ?: return false
        return runCatching { engine.setVoice(voice) == TextToSpeech.SUCCESS }.getOrDefault(false)
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
 * 기본 TTS 엔진의 한국어 목소리 목록. 목록을 얻으려면 엔진을 한 번 띄워야 해서, 만들 때 뒤에서 띄워 묻고 바로 놓는다.
 * 답이 오기 전에 목록을 물으면 빈 목록이다. 웹은 고르는 칸을 열 때마다 다시 묻기 때문에 그때는 차 있다.
 */
private class KoreanVoiceDirectory(context: Context) {
    @Volatile
    private var cached: List<Pair<String, String>> = emptyList()
    private var probe: TextToSpeech? = null

    init {
        val main = Handler(Looper.getMainLooper())
        main.post {
            probe = runCatching {
                TextToSpeech(context.applicationContext) { status ->
                    main.post {
                        val engine = probe
                        if (status == TextToSpeech.SUCCESS && engine != null) {
                            cached = koreanVoices(engine).map { (voice, label) -> voice.name to label }
                        }
                        runCatching { engine?.shutdown() }
                        probe = null
                    }
                }
            }.getOrNull()
        }
    }

    /** (목소리 이름, "여성 1" 같은 칸 이름). 하나뿐이면 고를 것이 없으므로 빈 목록 */
    fun list(): List<Pair<String, String>> = if (cached.size < 2) emptyList() else cached
}

private enum class VoiceGender(val label: String) { FEMALE("여성"), MALE("남성"), UNKNOWN("목소리") }

/**
 * 엔진 안의 한국어 목소리를 "여성 1", "남성 1"처럼 이름 붙여 준다. 여성, 남성, 모르는 것의 차례로 놓는다.
 * 인터넷이 있어야 하는 목소리와 아직 받지 않은 목소리는 뺀다(앱은 오프라인으로 돈다).
 */
private fun koreanVoices(engine: TextToSpeech): List<Pair<Voice, String>> {
    val all = runCatching { engine.voices }.getOrNull().orEmpty()
    val usable = all.filter { voice ->
        voice.locale.language == "ko" &&
            !voice.isNetworkConnectionRequired &&
            // Google은 기본 목소리를 `ko-KR-language`라는 이름으로 한 번 더 내놓는다. 같은 소리가 두 칸이 되지 않게 뺀다.
            !voice.name.endsWith("-language") &&
            voice.features?.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED) != true
    }.sortedBy { it.name }
    val counts = mutableMapOf<VoiceGender, Int>()
    return usable
        .map { it to voiceGender(it) }
        .sortedBy { (_, gender) -> gender.ordinal }
        .map { (voice, gender) ->
            val n = (counts[gender] ?: 0) + 1
            counts[gender] = n
            voice to "${gender.label} $n"
        }
}

/**
 * 안드로이드는 목소리의 성별을 알려 주지 않는다. 그래서 엔진마다의 이름 규칙으로 짐작한다.
 *  - 특징(features)에 female·male을 적는 엔진이 있다.
 *  - 삼성: `ko-KR-SMTf00`(여성), `ko-KR-SMTm00`(남성).
 *  - Google: `ko-kr-x-ism`, `kob`는 여성, `koc`, `kod`는 남성(Google 한국어 목소리 A·B 여성, C·D 남성에 맞춘 것).
 * 맞지 않는 엔진은 "목소리 N"으로 둔다. 틀린 성별을 붙이는 것보다 낫다.
 */
private fun voiceGender(voice: Voice): VoiceGender {
    val features = voice.features.orEmpty().map { it.lowercase(Locale.ROOT) }
    if (features.any { "female" in it }) return VoiceGender.FEMALE
    if (features.any { "male" in it }) return VoiceGender.MALE
    val name = voice.name.lowercase(Locale.ROOT)
    Regex("smt([fm])\\d").find(name)?.let { return if (it.groupValues[1] == "f") VoiceGender.FEMALE else VoiceGender.MALE }
    Regex("-x-(ism|kob|koc|kod)").find(name)?.let {
        return if (it.groupValues[1] == "ism" || it.groupValues[1] == "kob") VoiceGender.FEMALE else VoiceGender.MALE
    }
    return VoiceGender.UNKNOWN
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
        if (onDevice) {
            putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
        }
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
