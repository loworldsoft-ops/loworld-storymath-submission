package com.loworld.nativeapp

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.media.PlaybackParams
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
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

/** 읽기 끝에 붙이는 무음(초). 기기의 소리 길에 남은 소리가 다 나오는 시간 */
private const val TAIL_SILENCE_S = 0.35f

/**
 * 모델에게 맡기는 빠르기의 상한. 이보다 빠르게 읽으라면 이 빠르기로 만들고 재생 쪽(AudioTrack의 PlaybackParams,
 * 음높이는 그대로)에서 나머지를 당긴다. Supertonic은 speed를 올리면 길이를 줄이려고 음절을 뭉개거나 빼먹어서
 * 1.5배·2배에서 문장 끝이 잘려 들렸다(사용자의 지적, 2026-11-16). 같은 문장을 데스크톱에서 재 보니 음절 같은
 * 소리 덩어리가 1배 25개, 1.25배 21개, 1.5배 15개, 2배 10개로 줄었고, 1배로 만든 것을 2배로 당긴 것은 그대로였다.
 * 느리게(1배 미만)는 모델에 맡긴다. 늘리는 쪽은 뭉개지지 않는다
 */
private const val MODEL_SPEED_MAX = 1.0f

/** 읽기를 시작할 때 모으는 소리(재생 시간, ms)와 그것을 기다리는 상한(첫 문장이 나온 뒤부터) */
private const val START_LEAD_MS = 2_000f
private const val START_WAIT_MAX_MS = 1_500L

/** 다음 글을 미리 만들어 둘 소리의 길이(재생 시간 기준, ms)와 문장 수의 상한 */
private const val PREFETCH_LEAD_MS = 4_000L
private const val PREFETCH_PIECES_MAX = 3

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

/**
 * 합성의 단계 수. 많을수록 소리가 매끄럽지만 느리다. 데스크톱은 8이다. 폰에서 8이면 문장 사이가 끊겨
 * (사용자의 지적, 2026-11-12: 버벅거린다) 5를 넘지 않는다. 빠르게 읽거나 폰이 뜨거워지면 3까지 내린다(chooseSteps).
 */
private const val STEPS_MAX = 5
private const val STEPS_MIN = 3

/**
 * 합성이 재생 시간의 몇 할 안에 끝나야 하는가. 나머지는 문장 길이가 들쭉날쭉한 것과 다른 앱의 몫이다.
 * 만드는 시간이 재생 시간을 넘으면 그만큼 문장 사이가 빈다
 */
private const val SYNTH_BUDGET = 0.75f

/**
 * 단계 하나가 소리 1초를 만드는 데 드는 시간(초)의 첫 짐작. 갤럭시 Z 폴드6(SM8650, 스레드 4)에서 실제 문단으로 쟀다
 * (2026-11-16): 단계 3·5·8에서 0.18·0.33·0.62, 3분을 쉬지 않고 만들면 단계 5가 0.28에서 0.46까지 올랐다(발열).
 * 읽는 동안 잰 값으로 바로 고쳐 쓰므로 느린 폰에서도 몇 문장 안에 맞춰진다
 */
private const val RTF_PER_STEP_GUESS = 0.085f

/**
 * 재생 빠르기와 지금 잰 합성 속도로 단계 수를 고른다. 2배로 읽으면 재생이 두 배 빨리 소리를 먹으므로
 * 합성에 쓸 수 있는 시간이 절반이다. 폴드6에서 1배는 5, 1.5배는 5, 2배는 4가 된다
 */
internal fun chooseSteps(rtfPerStep: Float, playbackSpeed: Float): Int {
    if (rtfPerStep <= 0f || playbackSpeed <= 0f) return STEPS_MAX
    return (SYNTH_BUDGET / (playbackSpeed * rtfPerStep)).toInt().coerceIn(STEPS_MIN, STEPS_MAX)
}

/** 모델이 크다(146MB). 처음 띄울 때 읽고 시험 합성까지 하는 데 폰에서 몇 초가 걸려 엔진 준비 시간을 길게 준다 */
const val SUPERTONIC_PREPARE_TIMEOUT_MS = 30_000L

/**
 * Supertonic 3(sherpa-onnx)으로 기기 안에서 읽는다. 인터넷이 없어도 된다.
 * 모델은 디버그 빌드면 APK의 assets/models/tts에서 AssetManager로 바로 읽고, 출시 빌드면 처음 쓸 때 받아 둔 파일(TtsModelStore)을 읽는다.
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

    /** 미리 합성해 둔 다음 글의 앞 문장들. 같은 글·빠르기로 읽기가 오면 합성하지 않고 바로 낸다 */
    private class Prefetched(val text: String, val speed: Float, val samples: FloatArray)

    @Volatile
    private var prefetched: List<Prefetched> = emptyList()

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

    /** 단계 수는 문장마다 고른다. 앞 문장에서 잰 속도가 바로 다음 문장에 반영된다 */
    private fun generation(speed: Float, playbackSpeed: Float) =
        GenerationConfig(sid = sid, speed = speed, numSteps = chooseSteps(SupertonicModel.rtfPerStep, playbackSpeed), extra = mapOf("lang" to "ko"))

    override fun speak(text: String, rate: Float, range: (Int, Int) -> Unit, done: () -> Unit) {
        stop()
        val engine = tts
        if (!ready || engine == null || text.isBlank()) return done()

        val myTurn = turn.incrementAndGet()
        pendingDone = done
        val alive = { turn.get() == myTurn }
        val pieces = splitForSpeech(text)
        val queue = LinkedBlockingQueue<FloatArray>()
        val target = rate.coerceIn(0.5f, 2.0f)
        val speed = modelSpeed(target)
        val playbackSpeed = target / speed

        // 만드는 쪽: 문장마다 합성해 줄에 넣는다. sherpa의 덩어리 콜백(generateWithConfigAndCallback)은 쓰지 않는다.
        // 1.13.8의 JNI는 콜백에서 invoke([F)Ljava/lang/Integer;를 찾는데, Kotlin 2.x의 람다(invokedynamic)에는
        // invoke(Object)Object뿐이라 찾지 못하고, 그 오류(NoSuchMethodError)를 지우지 않은 채 돌아와 앱이 죽었다(0.6.0, 2026-11-03).
        executor.execute {
            try {
                for ((index, piece) in pieces.withIndex()) {
                    if (!alive()) break
                    val ready = prefetched
                    val cached = ready.getOrNull(index)?.takeIf { it.text == piece && it.speed == speed }
                    if (cached == null || index == ready.lastIndex) prefetched = emptyList()
                    val samples = cached?.samples ?: SupertonicModel.generate(engine, piece, generation(speed, playbackSpeed))
                    if (samples.isNotEmpty()) queue.put(samples)
                }
            } catch (t: Throwable) {
                Log.w(TAG, "Supertonic 합성 중 오류: ${t.message}", t)
            } finally {
                queue.put(END_OF_SPEECH)
            }
        }

        // 내는 쪽: 따로 돌아 앞 문장을 내는 동안 다음 문장을 만든다.
        Thread({ play(engine.sampleRate(), playbackSpeed, queue, alive, onStart = { main.post { if (alive()) range(0, text.length) } }) }, "supertonic-play").start()
    }

    /**
     * 다음 글의 앞 문장들을 만들어 둔다. 합성은 한 줄로 돌므로 지금 글의 문장을 다 만든 뒤에 돈다(지금 읽기를 늦추지 않는다).
     * 멈춰도 버리지 않는다. 다음 읽기가 같은 글이면 쓴다.
     *
     * 첫 문장 하나만 만들어 두면, 짧은 문장 뒤에 긴 문장이 오는 문단에서 짧은 것을 내는 동안 긴 것을 다 만들지 못해
     * 문장 사이가 비었다(폴드6, 2배, 2026-11-16: "술이 깬 얼굴이었다." 1초 동안 다음 문장 1.2~1.5초). 그래서 소리가
     * PREFETCH_LEAD_MS만큼 쌓일 때까지 만든다. 둘째 문장부터는 다음 읽기가 이미 왔으면 그만둔다(그 읽기가 이어서 만든다)
     */
    override fun prefetch(text: String, rate: Float) {
        val engine = tts ?: return
        val pieces = splitForSpeech(text).take(PREFETCH_PIECES_MAX)
        val first = pieces.firstOrNull() ?: return
        val target = rate.coerceIn(0.5f, 2.0f)
        val speed = modelSpeed(target)
        val same = { prefetched.firstOrNull()?.let { it.text == first && it.speed == speed } == true }
        if (same()) return
        val requestedTurn = turn.get()
        runCatching {
            executor.execute {
                if (same()) return@execute
                val made = mutableListOf<Prefetched>()
                var leadMs = 0L
                for ((index, piece) in pieces.withIndex()) {
                    if (index > 0 && (leadMs >= PREFETCH_LEAD_MS || turn.get() != requestedTurn)) break
                    val samples = runCatching { SupertonicModel.generate(engine, piece, generation(speed, target / speed)) }.getOrNull()
                    if (samples == null || samples.isEmpty()) break
                    made += Prefetched(piece, speed, samples)
                    // 재생을 당기면 같은 소리가 그만큼 짧게 나온다
                    leadMs += (samples.size * 1000f / engine.sampleRate() / (target / speed)).toLong()
                }
                if (made.isNotEmpty()) prefetched = made
            }
        }
    }

    private fun modelSpeed(target: Float) = minOf(target, MODEL_SPEED_MAX)

    private fun play(sampleRate: Int, playbackSpeed: Float, queue: LinkedBlockingQueue<FloatArray>, alive: () -> Boolean, onStart: () -> Unit) {
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
            if (playbackSpeed != 1f) {
                // 음높이는 두고 빠르기만 바꾼다(안드로이드가 시간 늘이기로 처리한다). 못 하는 기기면 그냥 1배로 읽는다
                runCatching { track.playbackParams = PlaybackParams().setSpeed(playbackSpeed).setPitch(1f) }
                    .onFailure { Log.w(TAG, "재생 빠르기 ${playbackSpeed}배를 걸지 못했다: ${it.message}") }
            }
            track.play()

            // 문장 사이에 짧게 쉰다.
            val gap = FloatArray((sampleRate * 0.25f).toInt())
            var written = 0L
            var starved = false
            // 처음에는 소리를 START_LEAD_MS만큼 모은 뒤에 낸다. 미리 만든 것이 없을 때(읽기를 막 시작했을 때) 첫 문장이 짧고
            // 둘째가 길면, 첫 문장을 내는 동안 둘째를 다 만들지 못해 문장 사이가 비었다(폴드6, 2배, 2026-11-16: 12자 1초 뒤 38자).
            // 이어 읽을 때는 미리 만든 문장들이 바로 들어와 기다리지 않는다
            val head = ArrayDeque<FloatArray>()
            var headMs = 0f
            var headSince = 0L
            while (alive()) {
                val samples = queue.poll(50, TimeUnit.MILLISECONDS)
                if (samples == null) {
                    if (head.isNotEmpty() && SystemClock.elapsedRealtime() - headSince >= START_WAIT_MAX_MS) break
                    continue
                }
                head.addLast(samples)
                if (samples === END_OF_SPEECH) break
                if (head.size == 1) headSince = SystemClock.elapsedRealtime()
                headMs += samples.size * 1000f / sampleRate / playbackSpeed
                if (headMs >= START_LEAD_MS) break
            }
            while (alive()) {
                val samples = head.removeFirstOrNull() ?: queue.poll(100, TimeUnit.MILLISECONDS)
                if (samples == null) {
                    // 쓴 소리를 다 냈는데 다음 문장이 아직 없다: 문장 사이가 비었다. 합성이 느리다고 보고 단계를 내린다
                    if (!starved && written > 0L && track.playbackHeadPosition.toLong() >= written) {
                        starved = true
                        SupertonicModel.starved(playbackSpeed)
                    }
                    continue
                }
                starved = false
                if (samples === END_OF_SPEECH) break
                if (written == 0L) onStart() else written += writeAll(track, gap, alive)
                written += writeAll(track, samples, alive)
            }
            // 끝에 무음을 붙인다. 재생 위치가 쓴 만큼에 닿아도 기기의 소리 길(믹서, 스피커)에는 아직 나오지 않은 소리가 남아 있다.
            // 그때 끝내면 바로 다음 읽기가 와서 이 트랙을 놓으므로 문장의 끝이 잘렸다(사용자의 지적, 2026-11-12: 문장 뒷부분을 못 읽는다).
            // 모델은 끝까지 합성한다(데스크톱에서 재 보니 마지막 50ms가 무음이었다)
            // 재생을 당기면 무음도 짧게 들리므로 그만큼 늘린다
            if (written > 0L) written += writeAll(track, FloatArray((sampleRate * TAIL_SILENCE_S * playbackSpeed).toInt()), alive)
            // 다 쓴 뒤 남은 소리가 다 나올 때까지 기다린다. 멈추면 바로 나온다.
            // 재생 빠르기를 바꾼 트랙에서 위치가 어떻게 세어지는지 기기마다 다를 수 있어, 남은 길이에 1초를 더한 만큼만 기다린다
            val remainingMs = ((written - track.playbackHeadPosition.toLong()).coerceAtLeast(0L) * 1000L / sampleRate / minOf(playbackSpeed, 1f)).toLong()
            val deadline = System.currentTimeMillis() + remainingMs + 1_000L
            while (alive() && track.playbackHeadPosition.toLong() < written && System.currentTimeMillis() < deadline) Thread.sleep(30)
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
internal object SupertonicModel {
    private val lock = Any()
    private var tts: OfflineTts? = null
    private var failed = false

    /** 모델을 막 받았다. 앞에서 "모델이 없다"로 실패한 것을 지워 다음에 다시 읽게 한다 */
    fun reset() = synchronized(lock) { if (tts == null) failed = false }

    /** 읽고 시험 합성까지 한다. 모델이 없거나 소리가 안 나면 null이고, 다시 시도하지 않는다(받은 뒤 reset 전까지) */
    fun obtain(context: Context): OfflineTts? = synchronized(lock) {
        tts?.let { return it }
        if (failed) return null
        // 모델이 아직 없으면 실패로 남기지 않는다. 남기면 받은 뒤에도 이 실행 동안 다시 읽지 않는다
        if (!TtsModelStore.bundled(context) && !TtsModelStore.installed(context)) return null
        tts = runCatching { load(context) }.getOrElse { e ->
            Log.w(TAG, "Supertonic 초기화 실패, 기본 TTS로 넘어간다: ${e.message}", e)
            null
        }
        if (tts == null) failed = true
        tts
    }

    /** 단계 하나가 소리 1초를 만드는 데 드는 시간(초). 합성할 때마다 고친다. 폰이 뜨거워져 느려지면 따라 오른다 */
    @Volatile
    var rtfPerStep = RTF_PER_STEP_GUESS
        private set

    fun generate(engine: OfflineTts, text: String, config: GenerationConfig): FloatArray = synchronized(lock) {
        val started = SystemClock.elapsedRealtime()
        val samples = engine.generateWithConfig(text, config).samples
        val synthMs = SystemClock.elapsedRealtime() - started
        val audioMs = samples.size * 1000L / engine.sampleRate().coerceAtLeast(1)
        // 아주 짧은 조각은 고정 비용이 커서 속도를 부풀린다. 0.5초 넘는 것만 센다
        if (audioMs > 500 && config.numSteps > 0) {
            val measured = synthMs.toFloat() / audioMs / config.numSteps
            rtfPerStep = rtfPerStep * 0.7f + measured * 0.3f
        }
        Log.d(TAG, "합성 ${text.length}자 단계=${config.numSteps} ${synthMs}ms → 소리 ${audioMs}ms (단계당 ${"%.3f".format(rtfPerStep)})")
        samples
    }

    /** 문장 사이가 비었다. 잰 속도보다 실제가 느리다(다른 앱, 발열)는 뜻이라 짐작을 올려 다음 문장부터 단계를 내린다 */
    fun starved(playbackSpeed: Float) {
        rtfPerStep *= 1.2f
        Log.i(TAG, "문장 사이가 비었다(재생 ${playbackSpeed}배). 다음 단계 ${chooseSteps(rtfPerStep, playbackSpeed)}")
    }

    /** 코어의 절반, 2~4개. 둘로 고정하면 코어가 많은 폰에서 합성이 재생을 따라가지 못했다 */
    private fun synthesisThreads(): Int = (Runtime.getRuntime().availableProcessors() / 2).coerceIn(2, 4)

    private fun load(context: Context): OfflineTts? {
        // APK에 실린 모델(디버그 빌드)이 먼저, 없으면 처음 쓸 때 받아 둔 모델(출시 빌드, TtsModelStore)을 읽는다
        val bundled = TtsModelStore.bundled(context)
        val base = when {
            bundled -> MODEL_DIR
            TtsModelStore.installed(context) -> TtsModelStore.dir(context).absolutePath
            else -> return null
        }
        val supertonic = OfflineTtsSupertonicModelConfig(
            durationPredictor = "$base/duration_predictor.int8.onnx",
            textEncoder = "$base/text_encoder.int8.onnx",
            vectorEstimator = "$base/vector_estimator.int8.onnx",
            vocoder = "$base/vocoder.int8.onnx",
            ttsJson = "$base/tts.json",
            unicodeIndexer = "$base/unicode_indexer.bin",
            voiceStyle = "$base/voice.bin",
        )
        // AssetManager를 주면 APK 안에서, null이면 파일 경로로 읽는다
        val instance = OfflineTts(
            if (bundled) context.assets else null,
            OfflineTtsConfig(model = OfflineTtsModelConfig(supertonic = supertonic, numThreads = synthesisThreads(), debug = false)),
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
