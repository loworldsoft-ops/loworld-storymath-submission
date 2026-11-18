package com.loworld.nativeapp

import android.content.SharedPreferences
import android.os.Handler
import android.os.Looper

/**
 * 엔진을 골라 읽기와 듣기를 맡긴다. 셸의 소리는 이것 하나다.
 *
 * 고르는 법: 고른 것이 있으면 그것을 먼저, 그다음 목록의 순서대로 준비해 보고 처음 된 것을 쓴다.
 * 그래서 Pleos 빌드를 폰에 깔아도 Pleos가 안 되면 안드로이드 엔진으로 돈다. 고른 것은 셸의 저장소에 남는다.
 * 엔진 하나의 준비가 [ENGINE_TIMEOUT_MS] 안에 끝나지 않으면 놓고 다음으로 간다(서비스가 없는 기기에서 답이 오지 않는 엔진).
 */
class SpeechRouter(
    private val catalog: SpeechEngineCatalog,
    private val prefs: SharedPreferences,
) : NativeSpeech {
    private val main = Handler(Looper.getMainLooper())

    private var speakEngine: SpeakEngine? = null
    private var listenEngine: ListenEngine? = null
    private var speakActive: String? = null
    private var listenActive: String? = null

    /** 고르기를 새로 시작하면 1씩 는다. 앞의 고르기에서 늦게 끝난 준비를 버리려고 */
    private var speakTurn = 0
    private var listenTurn = 0

    /**
     * 읽기 요청 하나. 웹은 요청마다 "다 읽었다"를 꼭 한 번 받아야 다음 토막을 보낸다.
     * 엔진을 바꾸는 사이에 이 답이 잘못 가면 웹이 토막을 건너뛴다. 그래서 답은 라우터가 쥐고 한 번만 보낸다.
     */
    private class SpeakRequest(
        val text: String,
        val rate: Float,
        val range: (Int, Int) -> Unit,
        val done: () -> Unit,
    ) {
        var settled = false
    }

    /** 지금 읽는(또는 엔진이 준비되기를 기다리는) 요청 */
    private var current: SpeakRequest? = null

    /** 읽기 엔진을 바꾸는 중. 이 사이에 온 요청은 버리지 않고 새 엔진이 준비되면 읽는다 */
    private var speakSwitching = false

    /** 엔진에 요청을 넘길 때마다 1씩 는다. 바꾸기 전 엔진이 늦게 부르는 done·range를 버린다 */
    private var speakRun = 0

    // 웹뷰의 다른 스레드(hasAction)가 읽는다.
    @Volatile
    override var canSpeak = false
        private set

    @Volatile
    override var canListen = false
        private set

    override fun prepare(onReady: () -> Unit) {
        var left = 2
        val oneDone = { if (--left == 0) onReady() }
        pickSpeak(oneDone)
        pickListen(oneDone)
    }

    /**
     * 엔진을 바꾸는 중이면 요청을 쥐고 기다린다. 전에는 엔진이 없으면 바로 "다 읽었다"를 보내,
     * 목소리를 바꾸는 몇 초 동안 웹이 남은 토막을 소리 없이 모두 넘겨 버렸다(사용자의 지적, 2026-11-12).
     */
    override fun speak(text: String, rate: Float, range: (Int, Int) -> Unit, done: () -> Unit) {
        current?.let { settle(it) }
        val request = SpeakRequest(text, rate, range, done)
        current = request
        if (speakSwitching) return
        val engine = speakEngine ?: return settle(request)
        run(engine, request)
    }

    override fun prefetch(text: String, rate: Float) {
        if (!speakSwitching) speakEngine?.prefetch(text, rate)
    }

    private fun run(engine: SpeakEngine, request: SpeakRequest) {
        val myRun = ++speakRun
        engine.speak(
            request.text,
            request.rate,
            { s, e -> if (myRun == speakRun && current === request) request.range(s, e) },
            { if (myRun == speakRun) settle(request) },
        )
    }

    /** 요청의 답을 한 번만 보낸다 */
    private fun settle(request: SpeakRequest) {
        if (request.settled) return
        request.settled = true
        if (current === request) current = null
        request.done()
    }

    override fun listen(heard: (String) -> Unit) {
        val engine = listenEngine ?: return heard("")
        engine.listen(heard)
    }

    override fun stop() {
        current?.let { settle(it) }
        speakEngine?.stop()
        listenEngine?.stop()
    }

    override fun release() {
        current?.let { settle(it) }
        speakSwitching = false
        speakTurn++
        listenTurn++
        speakEngine?.release()
        listenEngine?.release()
        speakEngine = null
        listenEngine = null
        canSpeak = false
        canListen = false
    }

    override fun engines(kind: SpeechKind): SpeechEngineState = when (kind) {
        SpeechKind.SPEAK -> SpeechEngineState(selected(kind), speakActive, catalog.speakOptions().map { SpeechOptionView(it.id, it.label, speakSection(it)) })
        SpeechKind.LISTEN -> SpeechEngineState(selected(kind), listenActive, catalog.listenOptions().map { SpeechOptionView(it.id, it.label, it.section) })
    }

    override fun choose(kind: SpeechKind, id: String, done: () -> Unit) {
        prefs.edit().putString(prefKey(kind), id).apply()
        // AI 목소리를 눌렀는데 모델이 없으면 받기 시작한다. 받는 동안은 아래의 고르기가 기본 목소리로 넘어가 읽고, 다 받으면 modelInstalled가 다시 고른다
        if (kind == SpeechKind.SPEAK && id.startsWith("$SUPERTONIC_GROUP:") && !TtsModelStore.available()) TtsModelStore.start()
        when (kind) {
            SpeechKind.SPEAK -> {
                // 읽던 것은 끝내지 않고 쥐고 있다가 새 목소리로 처음부터 다시 읽는다. 옛 엔진이 놓이며 부르는 done은 버린다.
                // canSpeak도 내리지 않는다. 내리면 웹이 "읽을 수 없다"로 보고 남은 토막을 바로 끝내 버린다.
                speakRun++
                speakSwitching = true
                speakEngine?.release()
                speakEngine = null
                speakActive = null
                pickSpeak(done)
            }
            SpeechKind.LISTEN -> {
                listenEngine?.release()
                listenEngine = null
                listenActive = null
                canListen = false
                pickListen(done)
            }
        }
    }

    private fun pickSpeak(done: () -> Unit) {
        speakTurn++
        speakSwitching = true
        pick(catalog.speakOptions(), selected(SpeechKind.SPEAK), { speakTurn }) { option, engine ->
            speakEngine = engine
            speakActive = option?.id
            canSpeak = engine != null
            speakSwitching = false
            // 바꾸는 사이에 쥐고 있던 요청을 새 엔진으로 읽는다. 엔진이 없으면 끝낸다(웹이 기다리다 멈추지 않게)
            current?.let { waiting -> if (engine != null) run(engine, waiting) else settle(waiting) }
            done()
        }
    }

    private fun pickListen(done: () -> Unit) {
        listenTurn++
        pick(catalog.listenOptions(), selected(SpeechKind.LISTEN), { listenTurn }) { option, engine ->
            listenEngine = engine
            listenActive = option?.id
            canListen = engine != null
            done()
        }
    }

    /**
     * 고른 것을 먼저, 그다음 나머지를 목록 순서로 준비해 본다. 처음 된 것으로 found를 부른다. 하나도 안 되면 (null, null).
     * turn이 그사이 바뀌었으면(엔진을 다시 골랐거나 놓았으면) 준비된 엔진을 놓고 found를 부르지 않는다.
     */
    private fun <E : SpeechEngine> pick(
        options: List<EngineOption<E>>,
        selected: String,
        turn: () -> Int,
        found: (EngineOption<E>?, E?) -> Unit,
    ) {
        val myTurn = turn()
        // sortedBy는 같은 값끼리 순서를 지킨다. 고른 것만 앞으로 온다.
        val order = options.sortedBy { if (it.id == selected) 0 else 1 }

        val failedGroups = mutableSetOf<String>()

        fun attempt(index: Int) {
            if (turn() != myTurn) return
            val option = order.getOrNull(index) ?: return found(null, null)
            if (option.group != null && option.group in failedGroups) return attempt(index + 1)
            val failed = {
                option.group?.let { failedGroups += it }
                attempt(index + 1)
            }
            val engine = runCatching { option.create() }.getOrNull() ?: return failed()
            var settled = false
            val timeout = Runnable {
                if (settled) return@Runnable
                settled = true
                runCatching { engine.release() }
                failed()
            }
            main.postDelayed(timeout, option.prepareTimeoutMs ?: ENGINE_TIMEOUT_MS)
            // 준비하다 바로 던지는 엔진이 있다(Pleos SDK는 차가 아닌 기기에서 권한 오류를 던진다). 던지면 실패로 보고 다음 엔진으로 간다.
            val thrown = runCatching { engine.prepare { ok ->
                main.post {
                    if (settled) return@post
                    settled = true
                    main.removeCallbacks(timeout)
                    when {
                        turn() != myTurn -> engine.release()
                        ok -> found(option, engine)
                        else -> {
                            engine.release()
                            failed()
                        }
                    }
                }
            } }.exceptionOrNull()
            if (thrown != null && !settled) {
                settled = true
                main.removeCallbacks(timeout)
                runCatching { engine.release() }
                failed()
            }
        }

        attempt(0)
    }

    /**
     * AI 목소리(눌러서 받는 것)는 아직 쓸 수 없으면 받는 상태(받기 전, 받는 중 N%, 실패)를 묶음 제목에 붙인다.
     * 목소리 칸마다 붙이면 열 칸이 모두 길어진다. 웹은 묶음 제목을 그대로 보인다
     */
    private fun speakSection(option: EngineOption<SpeakEngine>): String? {
        val status = if (option.group == SUPERTONIC_GROUP) TtsModelStore.statusLabel() else null
        return if (status != null && option.section != null) "${option.section} · $status" else option.section
    }

    /** 음성 모델을 막 받았다. 지금 AI 목소리가 아니고, 고른 것이 AI 목소리거나 자동이면 다시 골라 AI 목소리로 읽는다 */
    fun modelInstalled(done: () -> Unit) {
        val chosen = selected(SpeechKind.SPEAK)
        val active = speakActive
        val wantsAi = chosen == SpeechEngineState.AUTO || chosen.startsWith("$SUPERTONIC_GROUP:")
        if (wantsAi && (active == null || !active.startsWith("$SUPERTONIC_GROUP:"))) choose(SpeechKind.SPEAK, chosen, done) else done()
    }

    private fun selected(kind: SpeechKind): String = prefs.getString(prefKey(kind), null) ?: SpeechEngineState.AUTO

    private fun prefKey(kind: SpeechKind) = "speech-engine-${kind.key}"

    companion object {
        /** 엔진 하나의 준비를 기다리는 시간. 셸은 웹을 열기 전에 최대 PREPARE_TIMEOUT_MS(MainActivity)를 기다린다 */
        private const val ENGINE_TIMEOUT_MS = 3_000L

        /** AndroidSpeech.kt가 Supertonic 칸에 다는 group·id 앞머리 */
        private const val SUPERTONIC_GROUP = "supertonic"
    }
}
