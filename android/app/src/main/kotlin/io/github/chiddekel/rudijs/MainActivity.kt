package io.github.chiddekel.rudijs

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.net.Uri
import android.os.Bundle
import java.io.File
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.core.net.toUri
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import org.mozilla.geckoview.AllowOrDeny
import org.mozilla.geckoview.GeckoResult
import org.mozilla.geckoview.GeckoRuntime
import org.mozilla.geckoview.GeckoRuntimeSettings
import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoView

/**
 * Rudi.js for Android with a bundled engine: GeckoView renders the offline course straight from
 * a private copy of the APK assets, so the app works on every Android 8+ device — with or
 * without a system WebView — and needs no network access. Links to the web open in the browser.
 */
class MainActivity : ComponentActivity() {

    private val session = GeckoSession()
    private lateinit var webRoot: File
    private var currentUri: String? = null

    /** Back walks the session history (lesson → path → …); enabled only while there is history. */
    private val backInSession = object : OnBackPressedCallback(false) {
        override fun handleOnBackPressed() = session.goBack()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()   // transparent system bars, light/dark icons on Android 8–17
        super.onCreate(savedInstanceState)
        webRoot = File(filesDir, "web")
        copyAssets("web", webRoot)

        val geckoView = GeckoView(this)
        val root = FrameLayout(this).apply {
            setBackgroundColor(getColor(R.color.rudi_bg))
            addView(geckoView, FrameLayout.LayoutParams(MATCH, MATCH))
        }
        setContentView(root)
        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            view.updatePadding(bars.left, bars.top, bars.right, bars.bottom)
            WindowInsetsCompat.CONSUMED
        }

        session.navigationDelegate = object : GeckoSession.NavigationDelegate {
            override fun onLocationChange(session: GeckoSession, url: String?, perms: MutableList<GeckoSession.PermissionDelegate.ContentPermission>, hasUserGesture: Boolean) {
                currentUri = url
            }
            override fun onCanGoBack(session: GeckoSession, canGoBack: Boolean) {
                backInSession.isEnabled = canGoBack
            }

            override fun onLoadRequest(
                session: GeckoSession,
                request: GeckoSession.NavigationDelegate.LoadRequest,
            ): GeckoResult<AllowOrDeny> {
                val uri = request.uri.toUri()
                if (uri.scheme == "file" && uri.path?.let {
                        File(it).canonicalPath.startsWith(webRoot.canonicalPath + File.separator)
                    } == true) return GeckoResult.allow()
                if (uri.scheme == "about" && uri.toString() == "about:blank") return GeckoResult.allow()
                if (uri.scheme !in setOf("https", "http", "mailto")) return GeckoResult.deny()
                openInBrowser(uri)                   // GitHub, docs… leave the app
                return GeckoResult.deny()
            }
        }
        session.open(runtime(this))
        geckoView.setSession(session)
        onBackPressedDispatcher.addCallback(this, backInSession)

        session.loadUri(savedInstanceState?.getString("pageUri") ?: Uri.fromFile(File(webRoot, "app.html")).toString())
    }

    private fun copyAssets(path: String, destination: File) {
        val children = assets.list(path).orEmpty()
        if (children.isEmpty()) {
            assets.open(path).use { input -> destination.outputStream().use { input.copyTo(it) } }
        } else {
            check(destination.isDirectory || destination.mkdirs())
            children.forEach { copyAssets("$path/$it", File(destination, it)) }
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        currentUri?.let { outState.putString("pageUri", it) }
        super.onSaveInstanceState(outState)
    }

    private fun openInBrowser(uri: Uri) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
        } catch (_: ActivityNotFoundException) {
            // No app can open the link: stay on the current page.
        }
    }

    override fun onDestroy() {
        session.close()
        super.onDestroy()
    }

    private companion object {
        const val MATCH = FrameLayout.LayoutParams.MATCH_PARENT

        /** One Gecko runtime per process (GeckoView allows only a single instance). */
        @Volatile
        private var geckoRuntime: GeckoRuntime? = null

        fun runtime(context: Context): GeckoRuntime =
            geckoRuntime ?: synchronized(this) {
                geckoRuntime ?: run {
                    val debug = context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0
                    val settings = GeckoRuntimeSettings.Builder()
                        .consoleOutput(debug)                  // JS console → logcat in debug builds
                        .remoteDebuggingEnabled(debug)
                        .automaticFontSizeAdjustment(true)     // follow the system font scale (UI is in rem)
                        .build()
                    GeckoRuntime.create(context.applicationContext, settings).also { geckoRuntime = it }
                }
            }
    }
}
