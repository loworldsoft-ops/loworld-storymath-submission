package com.loworld.nativeapp

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.k2fsa.sherpa.onnx.GenerationConfig
import com.k2fsa.sherpa.onnx.OfflineTts
import com.k2fsa.sherpa.onnx.OfflineTtsConfig
import com.k2fsa.sherpa.onnx.OfflineTtsModelConfig
import com.k2fsa.sherpa.onnx.OfflineTtsSupertonicModelConfig
import java.util.concurrent.Executors
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

private const val TAG = "SherpaSpeakEngine"
private const val MODEL_DIR = "models/tts"

/**
 * Supertonic 3의 한국어 검증 목소리. sid는 voice.bin 안의 화자 번호다.
 * 전체 10개 화자(0~9) 중 영어 억양이 강해 한국어 모음·받침을 부정확하게 읽는 화자(3, 4, 7, 8, 9)는 제외하고,
 * 한국어 발음이 정확하고 자연스러운 5인(여성 3인: 0·1·2, 남성 2인: 5·6)만 골라 네이버 클로바 스타일의 가상 성우 이름을 붙인다.
 */
val SUPERTONIC_VOICES: List<Pair<Int, String>> = listOf(
    0 to "아라 (차분한 여성)",
    1 to "하늘 (밝은 여성)",
    2 to "다인 (부드러운 여성)",
    5 to "민준 (차분한 남성)",
    6 to "태오 (중후한 남성)",
)

/** 줄 끝 표시. 만드는 쪽이 끝났거나 실패했을 때 넣는다 */
private val END_OF_SPEECH = FloatArray(0)

/** 한 번에 합성하는 글의 최대 길이. sherpa가 한국어를 나누는 길이(120자)에 맞춘다 */
private const val PIECE_MAX = 120

/**
 * 읽을 글을 문장으로 나눈다. 첫 소리를 빨리 내려고 문장마다 합성한다.
 * 너무 긴 문장은 쉼표나 띄어쓰기에서 자르고, 아주 짧은 조각은 다음 것과 붙인다(합성 한 번의 고정 비용을 줄인다).
 */
internal fun splitForSpeech(text: String): List<String> {
    val sentences = text.split(Regex("(?<=[.!?…。])\\s+|\\n+")).map { it.trim() }.filter { it.isNotEmpty() }
    val pieces = mutableListOf<String>()
    for (sentence in sentences) {
        var rest = sentence
        while (rest.length > PIECE_MAX) {
            val window = rest.substring(0, PIECE_MAX)
            val cut = maxOf(window.lastIndexOf(','), window.lastIndexOf(' ')).takeIf { it > PIECE_MAX / 3 } ?: PIECE_MAX
            pieces += rest.substring(0, cut + if (cut < PIECE_MAX) 1 else 0).trim()
            rest = rest.substring(cut + if (cut < PIECE_MAX) 1 else 0).trim()
        }
        if (rest.isNotEmpty()) pieces += rest
    }
    val merged = mutableListOf<String>()
    for (piece in pieces) {
        val last = merged.lastOrNull()
        if (last != null && last.length < 10 && last.length + piece.length < PIECE_MAX) merged[merged.size - 1] = "$last $piece" else merged += piece
    }
    return merged
}

/** 모델이 크다(146MB). 처음 띄울 때 읽고 시험 합성까지 하는 데 폰에서 몇 초가 걸려 엔진 준비 시간을 길게 준다 */
const val SUPERTONIC_PREPARE_TIMEOUT_MS = 30_000L

/**
 * Supertonic 3(sherpa-onnx)으로 기기 안에서 읽는다. 인터넷이 없어도 된다.
 * 모델은 APK의 assets/models/tts에 있고 AssetManager로 바로 읽는다(풀어 복사하지 않는다).
 * 모델이 없거나 소리가 나지 않으면 준비에 실패해, 라우터가 안드로이드 기본 TTS로 넘어간다.
 *
 * 긴 문단은 문장으로 나눠 하나씩 만들고, 만든 것은 다른 스레드가 바로 낸다. 앞 문장을 내는 동안 다음 문장을 만든다.
 * 읽기마다 번호(turn)를 붙여, 멈춘 읽기가 뒤에서 마저 돌아도 다음 읽기의 소리나 콜백을 건드리지 않게 한다.
 */
class SherpaSpeakEngine(
    private val context: Context,
    private val sid: Int,
) : SpeakEngine {
    private val main = Handler(Looper.getMainLooper())
    private val executor = Executors.newSingleThreadExecutor()
    private val turn = AtomicInteger(0)
    private var tts: OfflineTts? = null
    private var ready = false
    private var currentTrack: AudioTrack? = null
    private var pendingDone: (() -> Unit)? = null

    override fun prepare(onReady: (Boolean) -> Unit) {
        executor.execute {
            val instance = SupertonicModel.obtain(context)
            val ok = instance != null && sid < instance.numSpeakers()
            if (instance != null && !ok) Log.w(TAG, "목소리 $sid 가 없다(모델의 목소리 ${instance.numSpeakers()}개).")
            tts = if (ok) instance else null
            ready = ok
            main.post { onReady(ok) }
        }
    }

    private fun generation(speed: Float) = GenerationConfig(sid = sid, speed = speed, numSteps = 8, extra = mapOf("lang" to "ko"))

    override fun speak(text: String, rate: Float, range: (Int, Int) -> Unit, done: () -> Unit) {
        stop()
        val engine = tts
        if (!ready || engine == null || text.isBlank()) return done()

        val myTurn = turn.incrementAndGet()
        pendingDone = done
        val alive = { turn.get() == myTurn }
        val pieces = splitForSpeech(text)
        val queue = LinkedBlockingQueue<FloatArray>()
        val config = generation(rate.coerceIn(0.5f, 2.0f))

        // 만드는 쪽: 문장마다 합성해 줄에 넣는다. sherpa의 덩어리 콜백(generateWithConfigAndCallback)은 쓰지 않는다.
        // 1.13.8의 JNI는 콜백에서 invoke([F)Ljava/lang/Integer;를 찾는데, Kotlin 2.x의 람다(invokedynamic)에는
        // invoke(Object)Object뿐이라 찾지 못하고, 그 오류(NoSuchMethodError)를 지우지 않은 채 돌아와 앱이 죽었다(0.6.0, 2026-11-03).
        executor.execute {
            try {
                for (piece in pieces) {
                    if (!alive()) break
                    val samples = SupertonicModel.generate(engine, piece, config)
                    if (samples.isNotEmpty()) queue.put(samples)
                }
            } catch (t: Throwable) {
                Log.w(TAG, "Supertonic 합성 중 오류: ${t.message}", t)
            } finally {
                queue.put(END_OF_SPEECH)
            }
        }

        // 내는 쪽: 따로 돌아 앞 문장을 내는 동안 다음 문장을 만든다.
        Thread({ play(engine.sampleRate(), queue, alive, onStart = { main.post { if (alive()) range(0, text.length) } }) }, "supertonic-play").start()
    }

    private fun play(sampleRate: Int, queue: LinkedBlockingQueue<FloatArray>, alive: () -> Boolean, onStart: () -> Unit) {
        var track: AudioTrack? = null
        try {
            val minBuffer = AudioTrack.getMinBufferSize(sampleRate, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_FLOAT)
            track = AudioTrack.Builder()
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build(),
                )
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_FLOAT)
                        .setSampleRate(sampleRate)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build(),
                )
                .setBufferSizeInBytes(minBuffer * 4)
                .setTransferMode(AudioTrack.MODE_STREAM)
                .build()
            synchronized(this) {
                if (!alive()) return
                currentTrack = track
            }
            track.play()

            // 문장 사이에 짧게 쉰다.
            val gap = FloatArray((sampleRate * 0.25f).toInt())
            var written = 0L
            while (alive()) {
                val samples = queue.poll(100, TimeUnit.MILLISECONDS) ?: continue
                if (samples === END_OF_SPEECH) break
                if (written == 0L) onStart() else written += writeAll(track, gap, alive)
                written += writeAll(track, samples, alive)
            }
            // 다 쓴 뒤 남은 소리가 다 나올 때까지 기다린다. 멈추면 바로 나온다.
            while (alive() && track.playbackHeadPosition.toLong() < written) Thread.sleep(30)
        } catch (t: Throwable) {
            Log.w(TAG, "Supertonic 재생 중 오류: ${t.message}", t)
        } finally {
            synchronized(this) {
                if (currentTrack === track) currentTrack = null
            }
            runCatching { track?.stop() }
            runCatching { track?.release() }
            main.post { if (alive()) finish() }
        }
    }

    /**
     * 막히지 않게 나눠 쓴다. 막히는 쓰기(WRITE_BLOCKING)는 멈춘 트랙에서 끝나지 않을 수 있어,
     * 멈추면(alive가 false) 바로 빠져나온다. 쓴 샘플 수를 준다.
     */
    private fun writeAll(track: AudioTrack, data: FloatArray, alive: () -> Boolean): Long {
        var offset = 0
        while (offset < data.size && alive()) {
            val n = track.write(data, offset, data.size - offset, AudioTrack.WRITE_NON_BLOCKING)
            if (n < 0) break
            if (n == 0) Thread.sleep(10) else offset += n
        }
        return offset.toLong()
    }

    override fun stop() {
        turn.incrementAndGet()
        synchronized(this) {
            // 놓는 것(release)은 읽던 스레드가 한다. 여기서 놓으면 그 스레드가 놓은 트랙에 쓴다.
            runCatching {
                currentTrack?.pause()
                currentTrack?.flush()
            }
        }
        finish()
    }

    override fun release() {
        stop()
        // 모델은 놓지 않는다(SupertonicModel이 앱이 살아 있는 동안 갖고 있다). 다른 AI 목소리로 바꿀 때 다시 읽지 않게.
        executor.execute {
            tts = null
            ready = false
        }
        executor.shutdown()
    }

    private fun finish() {
        val done = pendingDone
        pendingDone = null
        done?.invoke()
    }
}

/**
 * Supertonic 모델 하나를 앱 전체가 나눠 쓴다. 목소리(sid)마다 엔진 칸이 따로라, 칸마다 모델을 읽으면
 * 목소리를 바꿀 때마다 146MB를 다시 읽어 몇 초씩 걸렸다. 한 번 읽으면 앱이 살아 있는 동안 갖고 있다(메모리 약 300MB).
 * 합성은 한 번에 하나씩 한다(목소리를 바꾸는 사이에 앞 엔진의 합성이 남아 있을 수 있다).
 */
private object SupertonicModel {
    private val lock = Any()
    private var tts: OfflineTts? = null
    private var failed = false

    /** 읽고 시험 합성까지 한다. 모델이 없거나 소리가 안 나면 null이고, 다시 시도하지 않는다 */
    fun obtain(context: Context): OfflineTts? = synchronized(lock) {
        tts?.let { return it }
        if (failed) return null
        tts = runCatching { load(context) }.getOrElse { e ->
            Log.w(TAG, "Supertonic 초기화 실패, 기본 TTS로 넘어간다: ${e.message}", e)
            null
        }
        if (tts == null) failed = true
        tts
    }

    fun generate(engine: OfflineTts, text: String, config: GenerationConfig): FloatArray =
        synchronized(lock) { engine.generateWithConfig(text, config).samples }

    private fun load(context: Context): OfflineTts? {
        val assets = context.assets
        val hasModel = runCatching { assets.open("$MODEL_DIR/tts.json").use { true } }.getOrDefault(false)
        if (!hasModel) {
            Log.d(TAG, "$MODEL_DIR/tts.json이 없어 기본 TTS로 넘어간다.")
            return null
        }
        val supertonic = OfflineTtsSupertonicModelConfig(
            durationPredictor = "$MODEL_DIR/duration_predictor.int8.onnx",
            textEncoder = "$MODEL_DIR/text_encoder.int8.onnx",
            vectorEstimator = "$MODEL_DIR/vector_estimator.int8.onnx",
            vocoder = "$MODEL_DIR/vocoder.int8.onnx",
            ttsJson = "$MODEL_DIR/tts.json",
            unicodeIndexer = "$MODEL_DIR/unicode_indexer.bin",
            voiceStyle = "$MODEL_DIR/voice.bin",
        )
        val instance = OfflineTts(
            assets,
            OfflineTtsConfig(model = OfflineTtsModelConfig(supertonic = supertonic, numThreads = 2, debug = false)),
        )
        // 한 글자를 시험 삼아 합성한다. 초기화는 되는데 빈 소리를 내는 경우가 있었다(Piper 시절 sherpa 2.0의 espeak 제거).
        // 준비를 "됨"으로 답하면 라우터가 기본 TTS로 넘어가지 않으므로, 실제로 소리가 나는지 여기서 본다.
        val probe = instance.generateWithConfig("가", GenerationConfig(sid = 0, speed = 1.0f, extra = mapOf("lang" to "ko")))
        if (probe.samples.isEmpty()) {
            Log.w(TAG, "시험 합성이 빈 소리를 냈다. 기본 TTS로 넘어간다.")
            instance.release()
            return null
        }
        Log.i(TAG, "Supertonic 준비 완료 (목소리 ${instance.numSpeakers()}개, ${instance.sampleRate()}Hz)")
        return instance
    }
}
