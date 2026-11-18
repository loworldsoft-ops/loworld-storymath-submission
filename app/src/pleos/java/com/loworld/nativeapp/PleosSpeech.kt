package com.loworld.nativeapp

import ai.pleos.playground.stt.SpeechToText
import ai.pleos.playground.stt.listener.ResultListener
import ai.pleos.playground.tts.TextToSpeech
import ai.pleos.playground.tts.listener.EventListener
import android.content.Context
import android.os.Handler
import android.os.Looper
import java.util.Locale
import ai.pleos.playground.stt.constant.ErrorType as SttErrorType
import ai.pleos.playground.stt.constant.Mode as SttMode
import ai.pleos.playground.stt.listener.OnInitializeListener as SttInitializeListener
import ai.pleos.playground.tts.constant.ErrorType as TtsErrorType
import ai.pleos.playground.tts.constant.Mode as TtsMode
import ai.pleos.playground.tts.listener.OnInitializeListener as TtsInitializeListener

/*
 * Pleos의 TextToSpeech·SpeechToText. W4의 PleosNativeSpeech를 읽기와 듣기 둘로 나눈 것이다. 하는 일은 같다.
 *
 * 모드는 ON_DEVICE다. 차량의 엔진으로 돌아서 네트워크와 앱 등록(Client ID/Secret)이 필요 없다.
 * 공모전 Playground에서 TTS·STT의 사용 신청이 "준비 중"이라 서버 모드는 쓸 수 없다(2026-10-22).
 * 차가 아닌 폰에서는 initialize가 실패하거나 답하지 않는다. 그러면 라우터가 안드로이드 엔진으로 넘어간다.
 *
 * Pleos의 콜백은 요청 번호를 주지 않고 다른 스레드에서 온다. 그래서
 *  - 콜백은 모두 주 스레드로 넘겨 차례대로 처리한다.
 *  - 멈춘 읽기의 onStop·onDone이 다음 읽기를 끝내지 않도록, 지금 읽기의 onStart가 온 뒤의 onDone·onStop만 받는다.
 *    듣기도 같다(onStartedRecognition 뒤의 onEndedRecognition만 받는다).
 */

/** Pleos TextToSpeech로 읽는다. Pleos에는 빠르기를 바꾸는 API가 없어 rate는 쓰지 않는다(3.3.1). */
class PleosSpeakEngine(context: Context) : SpeakEngine {
    private val main = Handler(Looper.getMainLooper())
    private val tts = TextToSpeech(context.applicationContext, TtsMode.ON_DEVICE)
    private var ready = false
    private var speakDone: (() -> Unit)? = null
    private var speakStarted = false

    private val ttsListener = object : EventListener {
        override fun onReady() = Unit
        override fun onStart() {
            main.post { speakStarted = true }
        }
        override fun onUpdatedRms(rms: Double) = Unit
        override fun onDone() {
            main.post { if (speakStarted) finishSpeak() }
        }
        override fun onStop() {
            main.post { if (speakStarted) finishSpeak() }
        }
        override fun onError(errorType: TtsErrorType) {
            main.post { finishSpeak() }
        }
    }

    override fun prepare(onReady: (Boolean) -> Unit) {
        tts.initialize(object : TtsInitializeListener {
            override fun onSuccess() {
                main.post {
                    tts.setLocale(Locale.KOREA)
                    tts.addEventListener(ttsListener)
                    ready = true
                    onReady(true)
                }
            }
            override fun onFailure(errorType: TtsErrorType) {
                main.post { onReady(false) }
            }
        })
    }

    override fun speak(text: String, rate: Float, range: (Int, Int) -> Unit, done: () -> Unit) {
        // Pleos TTS에는 읽는 자리 알림이 없어 range는 부르지 않는다
        finishSpeak()
        if (!ready || text.isBlank()) return done()
        speakDone = done
        speakStarted = false
        tts.speak(text, true)
    }

    override fun stop() {
        finishSpeak()
        if (ready) tts.stop()
    }

    override fun release() {
        stop()
        if (ready) tts.removeEventListener(ttsListener)
        ready = false
        tts.release()
    }

    private fun finishSpeak() {
        val done = speakDone ?: return
        speakDone = null
        speakStarted = false
        done()
    }
}

/** Pleos SpeechToText로 듣는다. 마이크는 차량의 서비스가 잡는다. */
class PleosListenEngine(context: Context) : ListenEngine {
    private val main = Handler(Looper.getMainLooper())
    private val stt = SpeechToText(context.applicationContext, SttMode.ON_DEVICE)
    private var ready = false
    private var heardCallback: ((String) -> Unit)? = null
    private var listenStarted = false
    private var lastHeard = ""

    private val sttListener = object : ResultListener {
        override fun onReady() = Unit
        override fun onStartedRecognition() {
            main.post { listenStarted = true }
        }
        override fun onUpdated(stt: String, completed: Boolean) {
            main.post { if (heardCallback != null) lastHeard = stt }
        }
        override fun onUpdatedEpdData(on: Long, off: Long) = Unit
        override fun onUpdatedRms(rms: Double) = Unit
        override fun onEndedRecognition() {
            main.post { if (listenStarted) finishListen(lastHeard) }
        }
        override fun onError(errorType: SttErrorType) {
            main.post { finishListen(lastHeard) }
        }
    }

    override fun prepare(onReady: (Boolean) -> Unit) {
        stt.initialize(object : SttInitializeListener {
            override fun onSuccess() {
                main.post {
                    stt.setLocale(Locale.KOREA)
                    stt.addListener(sttListener)
                    ready = true
                    onReady(true)
                }
            }
            override fun onFailure(errorType: SttErrorType) {
                main.post { onReady(false) }
            }
        })
    }

    override fun listen(heard: (String) -> Unit) {
        finishListen("")
        if (!ready) return heard("")
        heardCallback = heard
        listenStarted = false
        lastHeard = ""
        stt.request()
    }

    override fun stop() {
        finishListen("")
        if (ready) stt.stop()
    }

    override fun release() {
        stop()
        if (ready) stt.removeListener(sttListener)
        ready = false
        stt.release()
    }

    private fun finishListen(text: String) {
        val heard = heardCallback ?: return
        heardCallback = null
        listenStarted = false
        heard(text)
    }
}
