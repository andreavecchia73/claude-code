# Magazzino personale

Web app Google Apps Script con Google Sheets come database. Accessibile da PC e telefono, anche fuori casa, con il tuo account Google.

## File

- `Code.gs`: logica server (lettura/scrittura fogli, codici, foto su Drive, impostazioni).
- `Index.html`: interfaccia (cerca, scansione QR da foto, nuovo/modifica, etichette, impostazioni).
- `appsscript.json`: manifest con accesso limitato al tuo account.

## Installazione

1. Crea un nuovo Google Sheet, ad esempio "Magazzino".
2. Dal foglio: **Estensioni > Apps Script**.
3. Elimina il contenuto di `Code.gs` e incolla quello del file `Code.gs`.
4. Crea un file HTML chiamato `Index` (**+ > HTML**), elimina il contenuto e incolla quello di `Index.html`.
5. Nelle impostazioni del progetto (icona ingranaggio), attiva "Mostra il file manifest" e sostituisci `appsscript.json` con quello del repository.
6. Seleziona la funzione `inizializza` nella barra in alto e premi **Esegui**. Al primo avvio Google chiede le autorizzazioni: accettale. Crea i fogli Articoli, Categorie, Ubicazioni, Impostazioni e la cartella Drive "Magazzino - foto".
7. **Implementa > Nuova implementazione > App web**:
   - Esegui come: **Me**
   - Chi ha accesso: **Solo io**
8. Apri l'URL dell'app dal telefono e aggiungila alla schermata home dal menu del browser. Si apre come un'app.

## Uso

- **Categorie**: in Impostazioni, prefisso di 3 lettere (es. `ALM`) e nome. Il prefisso non si cambia dopo l'uso, solo il nome.
- **Ubicazioni**: in Impostazioni, con "Dentro a" per creare la gerarchia (garage > scaffale > ripiano).
- **Nuovo articolo**: il codice `CAT-000123` viene assegnato automaticamente con il prossimo numero della categoria.
- **Etichette**: scegli la categoria, il primo numero (di default il prossimo libero) e stampa. Il foglio contiene tante etichette quante ne entrano con le impostazioni correnti (40 x 30 mm, 5 x 9 = 45 per A4).
- **Foto**: fino a 3 per articolo, scattate con la fotocamera del telefono e compresse prima del caricamento.
- **Scansiona**: fotografa l'etichetta, il QR viene letto e si apre l'articolo. Se la lettura fallisce, digita il codice.

## Note e limiti

- Le etichette si stampano dal browser: la finestra di stampa richiede di consentire i pop-up per l'app.
- La scansione usa la fotocamera nativa del telefono (scatto e lettura), non uno stream in tempo reale: più affidabile dentro l'app Google.
- Non c'è ancora l'OCR del testo stampato: se un'etichetta non ha il QR leggibile, si digita il codice.
- Non è prevista l'eliminazione di articoli, categorie o ubicazioni: si azzera la quantità o si rinomina.
- Le librerie QR (`qrcode-generator` 1.4.4 e `jsQR` 1.4.0) vengono caricate da cdnjs: serve connessione.
- Il codice è stato verificato con test sulla logica server con un Sheets simulato. Non è ancora stato eseguito dentro Apps Script: il primo test reale va fatto dopo l'installazione.
