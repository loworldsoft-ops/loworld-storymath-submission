package com.loworld.nativeapp

/**
 * 셸이 웹 대신 읽고 듣는 길. 웹의 소리 포트(`NativeSpeechAdapter`)와 엔진 고르기(`NativeSpeechEngineAdapter`)가 통로로 부른다.
 *
 * 구현은 `SpeechRouter` 하나다. 라우터는 엔진(`SpeakEngine`, `ListenEngine`)을 모르고 목록(`SpeechEngineCatalog`)만 안다.
 * 어떤 엔진이 있는지는 빌드 변형의 `createSpeechCatalog`가 정한다(`standard`: 안드로이드, `pleos`: Pleos와 안드로이드).
 * 모든 콜백은 주 스레드에서, 요청마다 꼭 한 번 부른다. 실패해도 부른다(웹이 기다리다 멈추지 않게).
 */
interface NativeSpeech {
    /** 읽을 수 있나. 엔진을 바꾸면 바뀐다 */
    val canSpeak: Boolean

    /** 들을 수 있나. 엔진을 바꾸면 바뀐다 */
    val canListen: Boolean

    /** 고른 엔진을 준비한다. 성공하든 실패하든 끝나면 onReady를 한 번 부른다 */
    fun prepare(onReady: () -> Unit)

    /** 다 읽으면, 또는 멈추거나 실패하면 done을 부른다. 앞의 읽기가 남아 있으면 그것을 먼저 끝낸다. rate는 1이 보통이다. 읽는 동안 range(start, end)를 부른다 */
    fun speak(text: String, rate: Float, range: (Int, Int) -> Unit, done: () -> Unit)

    /** 한 번 듣고 들은 글을 준다. 못 들었으면 빈 글이다 */
    fun listen(heard: (String) -> Unit)

    /** 읽기와 듣기를 멈춘다. 기다리던 콜백은 바로 부른다 */
    fun stop()

    fun release()

    /** 고를 수 있는 엔진과 고른 것, 지금 쓰는 것 */
    fun engines(kind: SpeechKind): SpeechEngineState

    /** 엔진을 고르고 기억한다. 바꾼 엔진의 준비가 끝나면(실패해도) done을 부른다 */
    fun choose(kind: SpeechKind, id: String, done: () -> Unit)
}

/** 읽기와 듣기는 엔진을 따로 고른다. key는 웹과 주고받는 이름이다. */
enum class SpeechKind(val key: String) {
    SPEAK("speak"),
    LISTEN("listen");

    companion object {
        fun of(key: String): SpeechKind? = entries.firstOrNull { it.key == key }
    }
}

/**
 * 웹에 보여 줄 엔진의 상태.
 * @param selected 고른 것. [AUTO]이거나 options의 id
 * @param active 지금 쓰는 엔진의 id. 쓸 수 있는 것이 없으면 null
 * @param options 좋은 것부터. 자동은 이 순서로 준비해 본다
 */
data class SpeechEngineState(
    val selected: String,
    val active: String?,
    val options: List<Pair<String, String>>,
) {
    companion object {
        /** 셸이 알아서 고른다 */
        const val AUTO = "auto"
    }
}
