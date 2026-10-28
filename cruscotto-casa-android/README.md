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

## Aggiornare i dati dal foglio (Apps Script)

Il foglio *GESTIONE CASA 2026* viene letto da uno script Apps Script (`apps-script/Code.gs`) che restituisce le tab in JSON. L'app non richiede login Google né credenziali OAuth: scarica il JSON dall'indirizzo che le hai dato.

Configurazione, una tantum:

1. Apri https://script.google.com → **Nuovo progetto** e incolla il contenuto di `apps-script/Code.gs`.
2. **Impostazioni progetto → Proprietà dello script → Aggiungi**: nome `TOKEN`, valore una stringa lunga e casuale (per esempio 40 caratteri generati da un gestore password).
3. **Esegui → Distribuisci → Nuova distribuzione → Tipo: App web**
   - Esegui come: **Me**
   - Chi ha accesso: **Chiunque**
   - Autorizza l'accesso al foglio quando richiesto.
4. Copia l'URL dell'app web e aggiungi in fondo `?token=` seguito dal TOKEN. L'indirizzo finale ha questa forma:
   `https://script.google.com/macros/s/XXXX/exec?token=TOKEN`
5. Nell'app premi **Aggiorna dal foglio**: alla prima volta compare la richiesta dell'indirizzo, che viene salvato sul dispositivo. Per cambiarlo usa il pulsante **Indirizzo**.

Sicurezza: chiunque conosca l'indirizzo completo (con il token) può leggere le tab del foglio, che il token protegge dagli accessi casuali. Non pubblicare l'indirizzo. Lo script legge soltanto, non modifica il foglio. Se il token viene esposto, cambia la proprietà `TOKEN` e aggiorna l'indirizzo nell'app.

Dopo modifiche allo script serve una **nuova versione** della distribuzione, altrimenti resta attiva quella vecchia.

## Struttura

```
cruscotto-casa-android/
├── app/src/main/
│   ├── AndroidManifest.xml
│   ├── assets/index.html          # cruscotto (HTML/CSS/JS)
│   ├── assets/xlsx.full.min.js    # SheetJS 0.18.5 per leggere le tab (in JSON)
│   ├── java/it/novalux/cruscottocasa/MainActivity.kt
│   └── res/                       # nome app, icona
├── apps-script/Code.gs            # script Apps Script che espone il foglio in JSON
├── build.gradle.kts / settings.gradle.kts
└── gradlew / gradle/wrapper/      # Gradle 8.10.2
```

## Note

- Permesso `INTERNET`: serve a leggere il foglio dallo script e a caricare i font IBM Plex da Google Fonts. Senza rete il cruscotto usa la copia salvata e i font di sistema.
- Il tab selezionato viene ricordato in `localStorage`.
