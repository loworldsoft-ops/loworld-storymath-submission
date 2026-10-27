package com.loworld.nativeapp

/**
 * 소리 엔진의 모양. 라우터(`SpeechRouter`)는 이 모양만 안다. 엔진을 더하려면 이 모양을 구현하고 목록에 한 줄을 더한다.
 * 콜백은 모두 주 스레드에서 부른다.
 */
interface SpeechEngine {
    /** 쓸 수 있게 준비한다. 되면 true, 안 되면 false로 한 번 부른다 */
    fun prepare(onReady: (Boolean) -> Unit)

    /** 하던 것을 멈춘다. 기다리던 콜백은 바로 부른다 */
    fun stop()

    /** 엔진을 놓는다. stop을 먼저 한다. 놓은 엔진은 다시 쓰지 않는다 */
    fun release()
}

interface SpeakEngine : SpeechEngine {
    /** 다 읽으면, 또는 멈추거나 실패하면 done. 앞의 읽기가 남아 있으면 그것을 먼저 끝낸다. 빠르기를 못 바꾸는 엔진은 rate를 무시한다. 읽는 자리를 아는 엔진은 range(start, end)를 부른다 */
    fun speak(text: String, rate: Float, range: (Int, Int) -> Unit, done: () -> Unit)
}

interface ListenEngine : SpeechEngine {
    /** 한 번 듣고 들은 글을 준다. 후보가 여럿이면 띄어 붙인다(웹이 후보 중 하나라도 맞으면 알아듣게). 못 들었으면 빈 글 */
    fun listen(heard: (String) -> Unit)
}

/**
 * 고를 수 있는 엔진 하나. 만들기 전에는 엔진을 띄우지 않는다(고르지 않은 엔진이 마이크나 서비스를 잡지 않게).
 * @param id 웹과 주고받는 이름. 셸이 기억하는 값이므로 바꾸지 않는다
 * @param label 설정 화면에 보이는 이름
 */
class EngineOption<out E : SpeechEngine>(val id: String, val label: String, val create: () -> E)

/** 이 기기에서 고를 수 있는 엔진들. 좋은 것부터 놓는다. 자동은 이 순서로 준비해 보고 처음 된 것을 쓴다. */
interface SpeechEngineCatalog {
    fun speakOptions(): List<EngineOption<SpeakEngine>>
    fun listenOptions(): List<EngineOption<ListenEngine>>
}

/** 마이크 권한을 묻는다. 셸의 화면(MainActivity)이 한다. 이미 있으면 바로 true */
fun interface MicPermission {
    fun request(granted: (Boolean) -> Unit)
}
