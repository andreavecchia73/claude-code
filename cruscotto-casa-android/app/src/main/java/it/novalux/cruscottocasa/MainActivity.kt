package it.novalux.cruscottocasa

import android.accounts.Account
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import com.google.android.gms.auth.GoogleAuthUtil
import com.google.android.gms.auth.UserRecoverableAuthException
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.common.api.Scope
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.util.concurrent.Executors

class MainActivity : Activity() {

    private lateinit var webView: WebView
    private lateinit var signInClient: GoogleSignInClient
    private val worker = Executors.newSingleThreadExecutor()

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        signInClient = GoogleSignIn.getClient(
            this,
            GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .requestScopes(Scope(DRIVE_READONLY))
                .build()
        )

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true   // ricorda il tab selezionato (localStorage)
            webViewClient = WebViewClient()
            addJavascriptInterface(DriveBridge(), "AndroidBridge")
        }
        setContentView(webView)
        webView.loadUrl("file:///android_asset/index.html")
    }

    /** Oggetto esposto alla pagina come window.AndroidBridge. */
    inner class DriveBridge {
        @JavascriptInterface
        fun refreshWorkbook() {
            runOnUiThread { startRefresh() }
        }
    }

    private fun startRefresh() {
        val signedIn = GoogleSignIn.getLastSignedInAccount(this)
        val googleAccount = signedIn?.account
        if (signedIn == null || googleAccount == null ||
            !GoogleSignIn.hasPermissions(signedIn, Scope(DRIVE_READONLY))
        ) {
            startActivityForResult(signInClient.signInIntent, RC_SIGN_IN)
            return
        }
        fetchWorkbook(googleAccount)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        when (requestCode) {
            RC_SIGN_IN -> {
                try {
                    val account = GoogleSignIn.getSignedInAccountFromIntent(data)
                        .getResult(ApiException::class.java)
                    val googleAccount = account.account
                    if (googleAccount == null) {
                        reportError("Account Google non disponibile.")
                    } else {
                        fetchWorkbook(googleAccount)
                    }
                } catch (e: ApiException) {
                    reportError("Accesso Google non riuscito (codice ${e.statusCode}).")
                }
            }
            RC_RECOVER -> startRefresh()
        }
    }

    /** Scarica il foglio come xlsx dalla Drive API (sola lettura) e lo passa alla pagina. */
    private fun fetchWorkbook(account: Account) {
        worker.execute {
            try {
                val token = GoogleAuthUtil.getToken(this, account, "oauth2:$DRIVE_READONLY")
                val url = URL(
                    "https://www.googleapis.com/drive/v3/files/$SHEET_ID/export" +
                        "?mimeType=" + URLEncoder.encode(XLSX_MIME, "UTF-8")
                )
                val connection = url.openConnection() as HttpURLConnection
                connection.setRequestProperty("Authorization", "Bearer $token")
                if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                    GoogleAuthUtil.clearToken(this, token)
                    throw IOException("Drive ha risposto ${connection.responseCode}")
                }
                val bytes = connection.inputStream.use { it.readBytes() }
                val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
                runOnUiThread {
                    webView.evaluateJavascript("window.onWorkbookBase64('$base64');", null)
                }
            } catch (e: UserRecoverableAuthException) {
                // Serve un nuovo consenso: l'intent va avviato dal thread principale.
                runOnUiThread { startActivityForResult(e.intent, RC_RECOVER) }
            } catch (e: Exception) {
                reportError("Drive non risponde: ${e.message ?: "errore sconosciuto"}.")
            }
        }
    }

    private fun reportError(message: String) {
        val escaped = message.replace("'", "\\'")
        runOnUiThread {
            webView.evaluateJavascript("window.onWorkbookError('$escaped');", null)
        }
    }

    companion object {
        /** ID del foglio GESTIONE CASA 2026 su Google Drive. */
        private const val SHEET_ID = "1dkVhjXs9Vs6jicZNINdsuMqHixoDat_cbIhdY2CqlnE"
        private const val DRIVE_READONLY = "https://www.googleapis.com/auth/drive.readonly"
        private const val XLSX_MIME =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        private const val RC_SIGN_IN = 1001
        private const val RC_RECOVER = 1002
    }
}
