package it.novalux.cruscottocasa

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : Activity() {

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true   // ricorda il tab selezionato (localStorage)
            webViewClient = WebViewClient()     // resta tutto dentro la WebView
        }
        setContentView(webView)
        webView.loadUrl("file:///android_asset/index.html")
    }
}
