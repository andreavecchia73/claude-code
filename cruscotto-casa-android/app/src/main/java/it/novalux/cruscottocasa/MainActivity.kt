package it.novalux.cruscottocasa

import android.annotation.SuppressLint
import android.app.Activity
import android.app.AlertDialog
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

class MainActivity : Activity() {

    private lateinit var webView: WebView
    private val worker = Executors.newSingleThreadExecutor()
    private val prefs by lazy { getSharedPreferences("cruscotto", MODE_PRIVATE) }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true   // ricorda il tab selezionato (localStorage)
            webViewClient = WebViewClient()
            addJavascriptInterface(SheetBridge(), "AndroidBridge")
        }
        setContentView(webView)
        webView.loadUrl("file:///android_asset/index.html")
    }

    /** Oggetto esposto alla pagina come window.AndroidBridge. */
    inner class SheetBridge {
        @JavascriptInterface
        fun refreshSheet() {
            runOnUiThread { startRefresh() }
        }

        @JavascriptInterface
        fun changeAddress() {
            runOnUiThread { askForAddress() }
        }
    }

    private fun startRefresh() {
        val address = prefs.getString(KEY_ADDRESS, null)
        if (address.isNullOrBlank()) {
            askForAddress()
        } else {
            fetchSheet(address)
        }
    }

    /** Chiede l'URL dell'app web di Apps Script (con il token) e lo salva sul dispositivo. */
    private fun askForAddress() {
        val input = EditText(this).apply {
            hint = "https://script.google.com/macros/s/…/exec?token=…"
            setSingleLine()
            setText(prefs.getString(KEY_ADDRESS, ""))
        }
        AlertDialog.Builder(this)
            .setTitle("Indirizzo del foglio")
            .setMessage("Incolla l'URL dell'app web di Apps Script, con ?token= in fondo.")
            .setView(input)
            .setPositiveButton("Salva e aggiorna") { _, _ ->
                val address = input.text.toString().trim()
                if (address.startsWith("https://")) {
                    prefs.edit().putString(KEY_ADDRESS, address).apply()
                    fetchSheet(address)
                } else {
                    reportError("L'indirizzo deve iniziare con https://")
                }
            }
            .setNegativeButton("Annulla") { _, _ -> reportError("Nessun indirizzo configurato.") }
            .show()
    }

    /** Scarica il JSON con le tab del foglio e lo passa alla pagina. */
    private fun fetchSheet(address: String) {
        worker.execute {
            try {
                val connection = URL(address).openConnection() as HttpURLConnection
                connection.connectTimeout = 15_000
                connection.readTimeout = 30_000
                connection.instanceFollowRedirects = true
                if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                    throw IOException("il server ha risposto ${connection.responseCode}")
                }
                val body = connection.inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() }
                runOnUiThread {
                    webView.evaluateJavascript("window.onSheetJson(${JSONObject.quote(body)});", null)
                }
            } catch (e: IOException) {
                reportError("Il foglio non è raggiungibile: ${e.message ?: "errore di rete"}.")
            }
        }
    }

    private fun reportError(message: String) {
        runOnUiThread {
            webView.evaluateJavascript("window.onWorkbookError(${JSONObject.quote(message)});", null)
        }
    }

    companion object {
        private const val KEY_ADDRESS = "sheet_address"
    }
}
