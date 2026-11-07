package io.github.chiddekel.rudijs

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.net.Uri
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import java.io.ByteArrayInputStream
import java.io.IOException
import java.util.Locale

/**
 * Rudi.js for Android: the offline web app (bundled in assets/web) running in a WebView.
 *
 * Pages are served from https://appassets.androidplatform.net/ by [serve], so the app behaves like a
 * normal HTTPS site (localStorage, fonts, same origin) without file:// quirks and without network
 * access. Links to any other host open in the user's browser.
 */
class MainActivity : ComponentActivity() {

    private lateinit var web: WebView

    /** Back walks the WebView history (lesson → path → …); enabled only while there is history. */
    private val backInWebView = object : OnBackPressedCallback(false) {
        override fun handleOnBackPressed() {
            if (web.canGoBack()) web.goBack()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()   // transparent system bars, light/dark icons on Android 8–16
        super.onCreate(savedInstanceState)
        val background = getColor(R.color.rudi_bg)

        web = WebView(this).apply { setBackgroundColor(background) }
        val root = FrameLayout(this).apply {
            setBackgroundColor(background)
            addView(web, FrameLayout.LayoutParams(MATCH, MATCH))
        }
        setContentView(root)

        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            view.updatePadding(bars.left, bars.top, bars.right, bars.bottom)
            WindowInsetsCompat.CONSUMED
        }

        configureWebView()
        onBackPressedDispatcher.addCallback(this, backInWebView)

        if (savedInstanceState == null || web.restoreState(savedInstanceState) == null) {
            web.loadUrl(START_URL)
        }
    }

    // JavaScript is required (the app is a JS course). Only bundled assets on our own host load;
    // every other host is blocked in serve() and external links open in the browser.
    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        with(web.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true          // course progress lives in localStorage
            allowFileAccess = false
            allowContentAccess = false
            // Text zoom follows the system font scale: the UI is built in rem and scales with it.
        }
        if (applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0) {
            WebView.setWebContentsDebuggingEnabled(true)
        }

        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse =
                serve(request.url)

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                if (request.url.host == HOST) return false
                openInBrowser(request.url)
                return true
            }

            override fun doUpdateVisitedHistory(view: WebView, url: String?, isReload: Boolean) {
                backInWebView.isEnabled = view.canGoBack()
            }
        }
    }

    private fun openInBrowser(uri: Uri) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
        } catch (_: ActivityNotFoundException) {
            // No app can open the link: stay on the current page.
        }
    }

    /** Serves https://appassets.androidplatform.net/<path> from assets/web/<path>; blocks everything else. */
    private fun serve(uri: Uri): WebResourceResponse {
        if (uri.host != HOST) return empty(403, "Offline")
        val path = uri.path?.takeUnless { it.isEmpty() || it == "/" } ?: "/app.html"
        if (".." in path) return empty(404, "Not Found")
        return try {
            WebResourceResponse(mimeTypeOf(path), "utf-8", assets.open(ASSET_ROOT + path)).apply {
                responseHeaders = mapOf("Cache-Control" to "no-cache")
            }
        } catch (_: IOException) {
            empty(404, "Not Found")
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    override fun onPause() {
        super.onPause()
        web.onPause()
    }

    override fun onResume() {
        super.onResume()
        web.onResume()
    }

    override fun onDestroy() {
        web.destroy()
        super.onDestroy()
    }

    private companion object {
        const val HOST = "appassets.androidplatform.net"
        const val START_URL = "https://$HOST/app.html"
        const val ASSET_ROOT = "web"
        const val MATCH = FrameLayout.LayoutParams.MATCH_PARENT

        val MIME_TYPES = mapOf(
            "html" to "text/html",
            "css" to "text/css",
            "js" to "text/javascript",
            "svg" to "image/svg+xml",
            "png" to "image/png",
            "woff2" to "font/woff2",
            "json" to "application/json",
            "webmanifest" to "application/json",
        )

        fun mimeTypeOf(path: String): String =
            MIME_TYPES[path.substringAfterLast('.').lowercase(Locale.ROOT)] ?: "application/octet-stream"

        fun empty(status: Int, reason: String) = WebResourceResponse(
            "text/plain", "utf-8", status, reason, emptyMap(), ByteArrayInputStream(ByteArray(0)),
        )
    }
}
