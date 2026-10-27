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
) {
    /** 지금 할 수 있는 동작. 읽기·듣기는 엔진이 준비되었을 때만 들어간다 */
    private fun actions(): List<String> = buildList {
        addAll(BASE_ACTIONS)
        if (speech.canSpeak) add("speech.speak")
        if (speech.canListen) add("speech.listen")
        if (speech.canSpeak || speech.canListen) add("speech.stop")
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
                    speech.speak(
                        message.optString("text"),
                        rate,
                        range = { s, e -> reply("speech.range", JSONObject().put("id", id).put("start", s).put("end", e)) },
                        done = { reply("speech.spoken", JSONObject().put("id", id)) },
                    )
                }
                "speech.listen" -> {
                    val id = message.optInt("id")
                    speech.listen { text -> reply("speech.heard", JSONObject().put("id", id).put("text", text)) }
                }
                "speech.stop" -> speech.stop()
                "speech.engines" -> sendEngines()
                "speech.chooseEngine" -> {
                    val kind = SpeechKind.of(message.optString("kind"))
                    val id = message.optString("id")
                    if (kind == null || id.isEmpty()) sendEngines() else speech.choose(kind, id, ::sendEngines)
                }
            }
        }
    }

    fun sendExecutionMode() {
        reply("executionMode", JSONObject().put("mode", currentMode().name))
    }

    private fun sendEngines() {
        val data = JSONObject()
        SpeechKind.entries.forEach { kind ->
            val state = speech.engines(kind)
            val options = JSONArray()
            state.options.forEach { (id, label) -> options.put(JSONObject().put("id", id).put("label", label)) }
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
        private val BASE_ACTIONS = listOf("capabilities", "getExecutionMode", "openModeSelector", "speech.engines", "speech.chooseEngine")
    }
}
