package com.loworld.nativeapp

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream
import org.apache.commons.compress.compressors.bzip2.BZip2CompressorInputStream
import java.io.BufferedInputStream
import java.io.File
import java.io.FileInputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

private const val TAG = "TtsModelStore"

/**
 * 음성 모델(Supertonic 3, 134MB)을 처음 쓸 때 받는다(2026-11-14 점검: 모델이 APK의 절반이었다).
 *
 * 디버그 빌드는 모델을 APK에 싣는다(src/ttsModel). 출시 빌드는 싣지 않고, 여기서 받아 앱 저장 공간(filesDir/models/tts)에 둔다.
 * 저절로 받지 않는다. 목소리 목록의 AI 목소리를 누르면 받는다(사용자의 결정, 2026-11-15). 목록에는 받기 전·받는 중·실패를 적는다.
 * 전에는 Wi-Fi일 때 저절로 받게 했는데, 망을 보는 권한(ACCESS_NETWORK_STATE)이 없어 예외가 났고 한 번도 받지 못했다(0.4.7).
 * 받는 동안과 받기 전에는 라우터가 안드로이드 기본 목소리로 읽고, 다 받으면 onChange로 알려 AI 목소리로 다시 고른다.
 *
 * 받는 곳은 모델의 원래 배포처(sherpa-onnx 공개 릴리스)다. 직접 관리하는 공개 주소가 생기면 app.native.json의 ttsModelUrl에 적는다.
 */
object TtsModelStore {
    const val DEFAULT_URL =
        "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/sherpa-onnx-supertonic-3-tts-int8-2026-05-11.tar.bz2"

    /** 셸(SherpaSpeech.kt)이 이 이름으로 읽는다. scripts/ensure-tts-model.mjs의 MODEL_FILES와 같다 */
    val FILES = listOf(
        "duration_predictor.int8.onnx",
        "text_encoder.int8.onnx",
        "vector_estimator.int8.onnx",
        "vocoder.int8.onnx",
        "tts.json",
        "unicode_indexer.bin",
        "voice.bin",
        "LICENSE",
        "README.md",
    )

    /** 다 풀었다는 표시. 받다가 끊긴 폴더를 쓰지 않게 마지막에 쓴다 */
    private const val DONE_MARK = ".complete"

    private val executor = Executors.newSingleThreadExecutor()
    private val main = Handler(Looper.getMainLooper())
    private var app: Context? = null
    private var url: String = DEFAULT_URL

    /** 받는 중이면 0~100, 아니면 null */
    @Volatile
    var progress: Int? = null
        private set

    /** 마지막 받기가 실패했다. 목록에 "다시 누르면 받는다"를 적는다 */
    @Volatile
    var lastFailed = false
        private set

    /** 진행이 바뀌거나 받기가 끝나면 메인 스레드에서 부른다 */
    var onChange: (() -> Unit)? = null

    fun init(context: Context, modelUrl: String?) {
        app = context.applicationContext
        url = modelUrl?.takeIf { it.startsWith("https://") } ?: DEFAULT_URL
    }

    fun dir(context: Context): File = File(context.filesDir, "models/tts")

    /** APK에 실려 있다(디버그 빌드, 또는 -Ploworld.bundleTts=true) */
    fun bundled(context: Context): Boolean =
        runCatching { context.assets.open("models/tts/tts.json").close(); true }.getOrDefault(false)

    fun installed(context: Context): Boolean = File(dir(context), DONE_MARK).exists()

    fun available(): Boolean = app?.let { bundled(it) || installed(it) } ?: false

    /** 목소리 목록의 AI 목소리 묶음 제목 옆에 붙일 상태. 쓸 수 있으면 null */
    fun statusLabel(): String? {
        val context = app ?: return null
        if (available()) return null
        val p = progress
        return when {
            p != null -> context.getString(R.string.tts_downloading, p)
            lastFailed -> context.getString(R.string.tts_download_failed)
            else -> context.getString(R.string.tts_not_downloaded)
        }
    }

    /** 받기 시작한다(사용자가 AI 목소리를 눌렀다). 이미 있거나 받는 중이면 아무것도 하지 않는다 */
    fun start() {
        val context = app ?: return
        if (available() || progress != null) return
        progress = 0
        lastFailed = false
        notifyChange()
        executor.execute {
            val ok = runCatching { download(context) }.onFailure { Log.w(TAG, "음성 모델 받기 실패: ${it.message}", it) }.isSuccess
            progress = null
            lastFailed = !ok
            if (ok) SupertonicModel.reset()
            notifyChange()
        }
    }

    private fun notifyChange() = main.post { onChange?.invoke() }

    /** 받기 80%, 풀기 20%로 진행을 나눈다 */
    private fun download(context: Context) {
        val archive = File(context.cacheDir, "tts-model.tar.bz2")
        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
            // GitHub 릴리스는 다른 https 호스트로 넘긴다. 같은 규약끼리는 따라간다
            instanceFollowRedirects = true
            connectTimeout = 15_000
            readTimeout = 30_000
        }
        try {
            check(connection.responseCode in 200..299) { "응답 ${connection.responseCode}" }
            val total = connection.contentLengthLong
            connection.inputStream.use { input ->
                archive.outputStream().use { output ->
                    val buffer = ByteArray(64 * 1024)
                    var read = 0L
                    var shown = -1
                    while (true) {
                        val n = input.read(buffer)
                        if (n < 0) break
                        output.write(buffer, 0, n)
                        read += n
                        if (total > 0) {
                            val p = (read * 80 / total).toInt()
                            if (p >= shown + 5) {
                                shown = p
                                progress = p
                                notifyChange()
                            }
                        }
                    }
                }
            }
        } finally {
            connection.disconnect()
        }

        val staging = File(context.filesDir, "models/tts.partial").apply { deleteRecursively(); mkdirs() }
        TarArchiveInputStream(BZip2CompressorInputStream(BufferedInputStream(FileInputStream(archive)))).use { tar ->
            while (true) {
                val entry = tar.nextEntry ?: break
                val name = entry.name.substringAfterLast('/')
                if (!entry.isDirectory && name in FILES) File(staging, name).outputStream().use { tar.copyTo(it) }
            }
        }
        val missing = FILES.filterNot { File(staging, it).exists() }
        check(missing.isEmpty()) { "묶음에 없는 파일: $missing" }
        File(staging, DONE_MARK).writeText("ok")
        val target = dir(context)
        target.deleteRecursively()
        check(staging.renameTo(target)) { "옮기지 못했다: $staging" }
        archive.delete()
        progress = 100
        Log.i(TAG, "음성 모델을 받았다: $target")
    }
}
