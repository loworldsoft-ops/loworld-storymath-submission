package com.loworld.nativeapp

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader

/**
 * 웹 앱 하나를 띄우는 셸. 화면은 웹뷰 하나다.
 *
 * 로그인, 권한, 메뉴는 모두 웹 앱이 한다. 셸은 묶음을 열고, 실행 방식을 바꾸고, 통로를 잇는 일만 한다.
 * 셸은 소리 엔진을 준비한 뒤에 웹을 연다. 웹은 처음 뜰 때 셸이 읽을 수 있는지 묻고 소리 포트를 고르기 때문이다.
 * 어떤 엔진을 쓰는지는 SpeechRouter가 정한다. 화면은 마이크 권한을 묻는 일만 거든다.
 */
class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var bridge: LoworldNativeBridge
    private lateinit var appPackage: AppPackage
    private lateinit var speech: NativeSpeech
    private var loaded = false
    private val prefs by lazy { getSharedPreferences(PREFS, MODE_PRIVATE) }

    /** 마이크 권한을 묻는 동안 답을 기다리는 곳. 한 번에 하나만 묻는다 */
    private var micAnswer: ((Boolean) -> Unit)? = null
    private val micRequest = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        val answer = micAnswer
        micAnswer = null
        answer?.invoke(granted)
    }

    /** 안드로이드 듣기가 처음 들을 때 부른다. 이미 있으면 바로 답한다. 앞서 묻던 것이 있으면 그것은 거절로 끝낸다 */
    private val mic = MicPermission { granted ->
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
            granted(true)
        } else {
            micAnswer?.invoke(false)
            micAnswer = granted
            micRequest.launch(Manifest.permission.RECORD_AUDIO)
        }
    }

    /**
     * 넣어 둔 묶음(assets의 `www/`)을 `https://appassets.androidplatform.net/`의 맨 위에 내준다. 파일 주소로 열면 모듈 스크립트가 막힌다.
     * 맨 위에 두는 까닭: 웹 빌드는 `<base href="/">`이고 CSS의 글꼴도 `/assets/...`처럼 맨 위 기준이다. `/www/` 아래에 두면 JS·CSS·글꼴을 못 찾아 흰 화면이 된다(2026-10-26).
     */
    private val assetLoader by lazy {
        val assets = WebViewAssetLoader.AssetsPathHandler(this)
        WebViewAssetLoader.Builder()
            .addPathHandler("/") { path -> assets.handle("www/" + path.ifEmpty { appPackage.entry }) }
            .build()
    }

    private var mode: ExecutionMode
        get() {
            val saved = runCatching { ExecutionMode.valueOf(prefs.getString(KEY_MODE, "") ?: "") }.getOrNull()
            // 원격 주소가 없는 앱은 넣어 둔 묶음으로만 연다.
            return if (saved == ExecutionMode.REMOTE_WEB && appPackage.remoteUrl != null) saved else ExecutionMode.LOCAL_ASSET
        }
        set(value) = prefs.edit().putString(KEY_MODE, value.name).apply()

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        appPackage = AppPackage.load(this)

        webView = WebView(this)
        // 최신 Android는 화면 끝까지 그린다. 상태 줄과 아래 막대, 키보드에 웹 앱이 가려지지 않게 그만큼 안으로 들인다.
        // 웹뷰는 자기 안쪽 여백을 무시한다. 그래서 웹뷰를 담은 틀에 여백을 준다.
        val frame = FrameLayout(this)
        frame.addView(webView, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        setContentView(frame)
        ViewCompat.setOnApplyWindowInsetsListener(frame) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.ime())
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            WindowInsetsCompat.CONSUMED
        }
        // 디버그 빌드에서만 크롬의 개발자 도구로 웹뷰를 들여다볼 수 있게 한다.
        WebView.setWebContentsDebuggingEnabled(applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0)
        webView.settings.javaScriptEnabled = true
        // 로그인 세션과 블록의 저장 공간이 여기에 들어간다.
        webView.settings.domStorageEnabled = true
        webView.settings.allowFileAccess = false
        webView.settings.allowContentAccess = false
        webView.webViewClient = ShellWebViewClient()

        speech = SpeechRouter(createSpeechCatalog(this, mic), prefs)
        bridge = LoworldNativeBridge(webView, speech, currentMode = { mode }, openModeSelector = ::showModeSelector)
        webView.addJavascriptInterface(bridge, LoworldNativeBridge.NAME)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })

        if (savedInstanceState != null) webView.restoreState(savedInstanceState)
        // 소리 엔진을 준비한 뒤에 연다. 준비가 늦어도 앱은 뜨도록 PREPARE_TIMEOUT_MS 뒤에는 그냥 연다.
        val loadOnce = {
            if (!loaded && savedInstanceState == null) {
                loaded = true
                loadApp()
            }
        }
        speech.prepare(loadOnce)
        Handler(Looper.getMainLooper()).postDelayed(loadOnce, PREPARE_TIMEOUT_MS)
    }

    override fun onDestroy() {
        speech.release()
        super.onDestroy()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    private fun loadApp() {
        val url = when (mode) {
            ExecutionMode.REMOTE_WEB -> appPackage.remoteUrl ?: localUrl()
            ExecutionMode.LOCAL_ASSET -> localUrl()
        }
        webView.loadUrl(url)
    }

    private fun localUrl() = "https://$ASSET_HOST/${appPackage.entry}"

    private fun showModeSelector() {
        val remote = appPackage.remoteUrl
        val labels = mutableListOf(getString(R.string.mode_local_title))
        if (remote != null) labels.add(getString(R.string.mode_remote_title))
        AlertDialog.Builder(this)
            .setTitle(R.string.mode_select_title)
            .setSingleChoiceItems(labels.toTypedArray(), if (mode == ExecutionMode.REMOTE_WEB) 1 else 0) { dialog, which ->
                val chosen = if (which == 1) ExecutionMode.REMOTE_WEB else ExecutionMode.LOCAL_ASSET
                dialog.dismiss()
                if (chosen != mode) {
                    mode = chosen
                    loadApp()
                }
            }
            .setNegativeButton(android.R.string.cancel, null)
            .show()
    }

    /** 앱의 주소(넣어 둔 묶음, 원격 주소)인가. 그 밖의 주소는 웹뷰에서 열지 않는다. */
    private fun isAppUrl(uri: Uri): Boolean {
        if (uri.host == ASSET_HOST) return true
        val remote = appPackage.remoteUrl?.let(Uri::parse) ?: return false
        return uri.scheme == "https" && uri.host == remote.host
    }

    private inner class ShellWebViewClient : WebViewClient() {
        override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
            if (request.url.host == ASSET_HOST) assetLoader.shouldInterceptRequest(request.url) else null

        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            if (isAppUrl(request.url)) return false
            // 바깥 링크는 브라우저에 맡긴다. 통로(`loworldNative`)가 붙은 웹뷰에서 남의 페이지를 열지 않는다.
            runCatching { startActivity(Intent(Intent.ACTION_VIEW, request.url)) }
            return true
        }

        override fun onPageStarted(view: WebView, url: String?, favicon: Bitmap?) {
            // 실행 방식을 바꿔 다시 열었을 때 웹이 새 값을 받게 한다. 웹이 아직 준비되지 않았으면 버려지고, 웹이 물을 때 다시 답한다.
            bridge.sendExecutionMode()
        }
    }

    companion object {
        private const val PREFS = "loworld-shell"
        private const val KEY_MODE = "execution-mode"
        private const val ASSET_HOST = WebViewAssetLoader.DEFAULT_DOMAIN
        /** 자동은 Pleos(최대 3초, SpeechRouter의 ENGINE_TIMEOUT_MS)가 안 되면 안드로이드를 준비한다. 둘을 기다릴 만큼 */
        private const val PREPARE_TIMEOUT_MS = 6_000L
    }
}
