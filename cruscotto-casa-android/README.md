# Cruscotto Casa – app Android

App Android nativa (WebView) che mostra il cruscotto gestione casa: energia, bollette, gas e costi, con confronto cumulato tra l'anno in corso e i due precedenti.

Il cruscotto è incluso in `app/src/main/assets/index.html` e funziona **offline**. I dati sono la copia salvata al **06/10/2026** dal foglio *GESTIONE CASA 2026*.

## Compilare ed eseguire

Requisiti: Android Studio (Hedgehog o successivo), JDK 17, Android SDK 34.

1. In Android Studio: **File → Open** e selezionare la cartella `cruscotto-casa-android`.
2. Lasciare che Gradle sincronizzi il progetto.
3. Collegare un telefono Android con debug USB attivo (oppure avviare un emulatore) e premere **Run ▶**.

Da terminale, per generare l'APK di debug:

```bash
./gradlew assembleDebug
# output: app/build/outputs/apk/debug/app-debug.apk
```

Requisiti minimi del dispositivo: Android 7.0 (API 24).

## Aggiornare i dati

I dati sono nelle costanti `SNAP_E`, `SNAP_B`, `SNAP_G`, `SNAP_C` dentro `app/src/main/assets/index.html`, nella sezione *Copie di riserva*. Per aggiornarli:

- ricopiare le righe dalle tab CONSUMI ELETTRICI, BOLLETTE, Letture gas e dalla tab di costi nello stesso formato;
- ricompilare l'app.

Il collegamento diretto a Google Drive presente nella versione web (artefatto) non è incluso: richiede l'accesso al connettore del proprio account e non è disponibile in un'app installata.

## Struttura

```
cruscotto-casa-android/
├── app/src/main/
│   ├── AndroidManifest.xml
│   ├── assets/index.html          # cruscotto (HTML/CSS/JS, nessuna dipendenza esterna obbligatoria)
│   ├── java/it/novalux/cruscottocasa/MainActivity.kt
│   └── res/                       # nome app, icona
├── build.gradle.kts / settings.gradle.kts
└── gradlew / gradle/wrapper/      # Gradle 8.10.2
```

## Note

- Permesso `INTERNET`: serve solo a caricare i font IBM Plex da Google Fonts. Senza rete il cruscotto usa i font di sistema.
- Il tab selezionato viene ricordato in `localStorage`.
