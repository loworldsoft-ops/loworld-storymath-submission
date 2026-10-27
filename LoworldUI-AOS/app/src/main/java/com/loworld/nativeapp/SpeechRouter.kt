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

    override fun speak(text: String, rate: Float, range: (Int, Int) -> Unit, done: () -> Unit) {
        val engine = speakEngine ?: return done()
        engine.speak(text, rate, range, done)
    }

    override fun listen(heard: (String) -> Unit) {
        val engine = listenEngine ?: return heard("")
        engine.listen(heard)
    }

    override fun stop() {
        speakEngine?.stop()
        listenEngine?.stop()
    }

    override fun release() {
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
        SpeechKind.SPEAK -> SpeechEngineState(selected(kind), speakActive, catalog.speakOptions().map { it.id to it.label })
        SpeechKind.LISTEN -> SpeechEngineState(selected(kind), listenActive, catalog.listenOptions().map { it.id to it.label })
    }

    override fun choose(kind: SpeechKind, id: String, done: () -> Unit) {
        prefs.edit().putString(prefKey(kind), id).apply()
        when (kind) {
            SpeechKind.SPEAK -> {
                speakEngine?.release()
                speakEngine = null
                speakActive = null
                canSpeak = false
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
        pick(catalog.speakOptions(), selected(SpeechKind.SPEAK), { speakTurn }) { option, engine ->
            speakEngine = engine
            speakActive = option?.id
            canSpeak = engine != null
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

        fun attempt(index: Int) {
            if (turn() != myTurn) return
            val option = order.getOrNull(index) ?: return found(null, null)
            val engine = runCatching { option.create() }.getOrNull() ?: return attempt(index + 1)
            var settled = false
            val timeout = Runnable {
                if (settled) return@Runnable
                settled = true
                runCatching { engine.release() }
                attempt(index + 1)
            }
            main.postDelayed(timeout, ENGINE_TIMEOUT_MS)
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
                            attempt(index + 1)
                        }
                    }
                }
            } }.exceptionOrNull()
            if (thrown != null && !settled) {
                settled = true
                main.removeCallbacks(timeout)
                runCatching { engine.release() }
                attempt(index + 1)
            }
        }

        attempt(0)
    }

    private fun selected(kind: SpeechKind): String = prefs.getString(prefKey(kind), null) ?: SpeechEngineState.AUTO

    private fun prefKey(kind: SpeechKind) = "speech-engine-${kind.key}"

    companion object {
        /** 엔진 하나의 준비를 기다리는 시간. 셸은 웹을 열기 전에 최대 PREPARE_TIMEOUT_MS(MainActivity)를 기다린다 */
        private const val ENGINE_TIMEOUT_MS = 3_000L
    }
}
