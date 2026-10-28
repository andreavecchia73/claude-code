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

## Aggiornare i dati da Drive

Il pulsante **Aggiorna dal foglio** scarica il foglio *GESTIONE CASA 2026* da Google Drive (sola lettura) e ricalcola il cruscotto. Senza rete o senza accesso resta visibile la copia salvata nell'app.

Prima del primo utilizzo va configurato l'accesso Google (una tantum):

1. Google Cloud Console → crea un progetto (o usane uno esistente).
2. **API e servizi → Libreria**: abilita **Google Drive API**.
3. **Schermata di consenso OAuth**: tipo *Esterno*, aggiungi il tuo account Google tra gli *utenti di test*.
4. **Credenziali → Crea credenziali → ID client OAuth → Android**:
   - nome pacchetto: `it.novalux.cruscottocasa`
   - impronta SHA-1 del keystore di debug incluso nel progetto:
     `21:0A:22:0E:F7:5A:8E:0C:B2:9C:B3:1A:32:E4:24:93:69:D8:45:30`
5. Installa l'APK, premi **Aggiorna dal foglio** e accedi con lo stesso account Google.

Il foglio resta privato: l'app lo legge con il token del tuo account e non crea link pubblici.

Il keystore `app/cruscotto-debug.keystore` (password `android`) è un keystore di debug per questo progetto personale: non usarlo per pubblicare su Google Play.

Per una versione da pubblicare su Play Store serve una chiave di firma dedicata e un nuovo client OAuth con la sua impronta SHA-1.

## Struttura

```
cruscotto-casa-android/
├── app/src/main/
│   ├── AndroidManifest.xml
│   ├── assets/index.html          # cruscotto (HTML/CSS/JS)
│   ├── assets/xlsx.full.min.js    # SheetJS 0.18.5 per leggere il foglio xlsx
│   ├── java/it/novalux/cruscottocasa/MainActivity.kt
│   └── res/                       # nome app, icona
├── build.gradle.kts / settings.gradle.kts
└── gradlew / gradle/wrapper/      # Gradle 8.10.2
```

## Note

- Permesso `INTERNET`: serve a leggere il foglio da Drive e a caricare i font IBM Plex da Google Fonts. Senza rete il cruscotto usa la copia salvata e i font di sistema.
- Il tab selezionato viene ricordato in `localStorage`.
