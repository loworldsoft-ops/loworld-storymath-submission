package com.loworld.nativeapp

import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONArray
import org.json.JSONObject

/**
 * 웹과 주고받는 통로. 하나뿐이다.
 *
 *  - 웹 → 셸: `loworldNative.postMessage(JSON 글자)`. JSON은 `{ "action": ... }`.
 *  - 셸 → 웹: `window.onLoworldNativeMessage({ type, data })`.
 *  - 웹 → 셸(바로 답함): `loworldNative.hasAction(동작)`. 웹이 처음 뜰 때 소리 포트를 고르려고 묻는다.
 *
 * 여기에 없는 동작은 조용히 버린다. 웹은 먼저 `capabilities`나 `hasAction`으로 이 셸이 무엇을 하는지 알아낸다.
 *
 * 소리(`speech.*`): 웹이 요청마다 번호(id)를 붙여 보내고, 셸은 끝나면 같은 번호로 답한다.
 *  - `{ action: "speech.speak", id, text, rate }` → 다 읽으면 `{ type: "speech.spoken", data: { id } }`, 읽는 동안 `{ type: "speech.range", data: { id, start, end } }`(안드로이드 엔진만)
 *  - `{ action: "speech.listen", id }` → 다 들으면 `{ type: "speech.heard", data: { id, text } }`
 *  - `{ action: "speech.stop" }` → 답하지 않는다(웹이 기다리던 것을 스스로 끝낸다)
 *
 * 엔진 고르기: 묻거나 고르면 둘 다의 상태를 보낸다.
 *  - `{ action: "speech.engines" }`, `{ action: "speech.chooseEngine", kind: "speak"|"listen", id }`
 *  - → `{ type: "speech.engines", data: { speak: { selected, active, options: [{ id, label }] }, listen: { ... } } }`
 */
class LoworldNativeBridge(
    private val webView: WebView,
    private val speech: NativeSpeech,
    private val currentMode: () -> ExecutionMode,
    private val openModeSelector: () -> Unit,
    /** 처음 읽기를 시작했을 때. 화면이 알림 권한을 묻는다(뒤에서 읽는 동안의 알림) */
    private val onReadingStarted: () -> Unit = {},
) {
    /** 지금 할 수 있는 동작. 읽기·듣기는 엔진이 준비되었을 때만 들어간다 */
    private fun actions(): List<String> = buildList {
        addAll(BASE_ACTIONS)
        if (speech.canSpeak) add("speech.speak")
        if (speech.canListen) add("speech.listen")
        if (speech.canSpeak || speech.canListen) add("speech.stop")
        if (speech.canSpeak) add("speech.wait")
    }

    /** 웹뷰의 다른 스레드에서 바로 답한다. canSpeak·canListen은 엔진을 바꿀 때만 바뀐다. */
    @JavascriptInterface
    fun hasAction(action: String): Boolean = action in actions()

    @JavascriptInterface
    fun postMessage(json: String) {
        val message = runCatching { JSONObject(json) }.getOrDefault(JSONObject())
        val action = message.optString("action")
        // 웹뷰의 다른 스레드에서 불린다. 화면과 소리를 만지는 일은 주 스레드로 넘긴다.
        webView.post {
            when (action) {
                "capabilities" -> reply(
                    "capabilities",
                    JSONObject().put("platform", "android").put("actions", JSONArray(actions())),
                )
                "getExecutionMode" -> sendExecutionMode()
                "openModeSelector" -> openModeSelector()
                "speech.speak" -> {
                    val id = message.optInt("id")
                    val rate = message.optDouble("rate", 1.0).toFloat()
                    holdScreen()
                    speech.speak(
                        message.optString("text"),
                        rate,
                        range = { s, e -> reply("speech.range", JSONObject().put("id", id).put("start", s).put("end", e)) },
                        done = {
                            reply("speech.spoken", JSONObject().put("id", id))
                            releaseScreenLater()
                        },
                    )
                    // 웹이 다음에 읽을 글을 함께 보내면 엔진이 미리 합성한다(글 사이의 끊김을 줄인다)
                    message.optString("next", "").takeIf { it.isNotBlank() }?.let { speech.prefetch(it, rate) }
                }
                "speech.wait" -> {
                    // 문단 사이의 쉼. 웹의 setTimeout은 앱이 뒤에 있으면 늦춰진다(숨은 페이지의 타이머 묶기, 길면 1분 단위).
                    // 셸이 재고 "다 읽었다"와 같은 답을 보내면 웹은 그 답에 깨어나 바로 다음 문단을 보낸다
                    val id = message.optInt("id")
                    val ms = message.optLong("ms", 0L).coerceIn(0L, MAX_WAIT_MS)
                    holdScreen()
                    val answer = Runnable {
                        waits.remove(id)
                        reply("speech.spoken", JSONObject().put("id", id))
                    }
                    waits[id] = answer
                    webView.postDelayed(answer, ms)
                }
                "speech.listen" -> {
                    val id = message.optInt("id")
                    speech.listen { text -> reply("speech.heard", JSONObject().put("id", id).put("text", text)) }
                }
                "speech.stop" -> {
                    speech.stop()
                    cancelWaits()
                    releaseScreenNow()
                }
                "speech.engines" -> sendEngines()
                "speech.chooseEngine" -> {
                    val kind = SpeechKind.of(message.optString("kind"))
                    val id = message.optString("id")
                    if (kind == null || id.isEmpty()) sendEngines() else speech.choose(kind, id, ::sendEngines)
                }
            }
        }
    }

    /**
     * 읽는 동안에는 화면을 켜 둔다. 차에서 듣다가 화면이 꺼지면 웹뷰가 멈춰 다음 문단을 보내지 못하고 낭독이 끊긴다.
     * 문단 사이(쉼, 다음 화를 여는 동안)에 꺼지지 않게, 읽기가 끝나도 잠시 더 켜 두었다가 다음 읽기가 없으면 끈다.
     */
    private val releaseScreen = Runnable {
        webView.keepScreenOn = false
        stopReading()
    }

    /** 기다리는 쉼(speech.wait). 멈추면 지운다 */
    private val waits = mutableMapOf<Int, Runnable>()

    private fun cancelWaits() {
        waits.values.forEach(webView::removeCallbacks)
        waits.clear()
    }

    /** 뒤에서도 읽게 앱을 살려 두는 서비스(ReadingService)가 떠 있나 */
    private var reading = false

    private fun holdScreen() {
        webView.removeCallbacks(releaseScreen)
        webView.keepScreenOn = true
        if (!reading) {
            reading = true
            ReadingService.start(webView.context.applicationContext)
            onReadingStarted()
        }
    }

    private fun stopReading() {
        if (!reading) return
        reading = false
        ReadingService.stop(webView.context.applicationContext)
    }

    private fun releaseScreenLater() {
        webView.removeCallbacks(releaseScreen)
        webView.postDelayed(releaseScreen, SCREEN_GRACE_MS)
    }

    private fun releaseScreenNow() {
        webView.removeCallbacks(releaseScreen)
        webView.keepScreenOn = false
        stopReading()
    }

    /** 앱이 닫힌다. 서비스와 쉼을 놓는다 */
    fun release() {
        cancelWaits()
        releaseScreenNow()
    }

    fun sendExecutionMode() {
        reply("executionMode", JSONObject().put("mode", currentMode().name))
    }

    fun sendEngines() {
        val data = JSONObject()
        SpeechKind.entries.forEach { kind ->
            val state = speech.engines(kind)
            val options = JSONArray()
            state.options.forEach { option ->
                options.put(JSONObject().put("id", option.id).put("label", option.label).put("group", option.section ?: JSONObject.NULL))
            }
            data.put(
                kind.key,
                JSONObject()
                    .put("selected", state.selected)
                    .put("active", state.active ?: JSONObject.NULL)
                    .put("options", options),
            )
        }
        reply("speech.engines", data)
    }

    private fun reply(type: String, data: JSONObject) {
        val message = JSONObject().put("type", type).put("data", data)
        webView.evaluateJavascript(
            "if (typeof window.$HANDLER === 'function') window.$HANDLER($message);",
            null,
        )
    }

    companion object {
        const val NAME = "loworldNative"
        private const val HANDLER = "onLoworldNativeMessage"
        /** 읽기가 끝난 뒤에도 화면을 켜 두는 시간. 다음 화를 여는 시간과 안내 사이의 쉼보다 넉넉하게 둔다 */
        private const val SCREEN_GRACE_MS = 90_000L
        /** 쉼의 상한. 웹이 잘못 보내도 셸이 오래 붙잡지 않게 */
        private const val MAX_WAIT_MS = 60_000L
        private val BASE_ACTIONS = listOf("capabilities", "getExecutionMode", "openModeSelector", "speech.engines", "speech.chooseEngine")
    }
}
