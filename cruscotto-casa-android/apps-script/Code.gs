/**
 * Espone i dati del foglio GESTIONE CASA 2026 all'app Android, in sola lettura.
 *
 * Installazione (una tantum):
 *  1. Apri https://script.google.com → Nuovo progetto, incolla questo file (sostituisce il codice vuoto).
 *  2. Impostazioni progetto → Proprietà dello script → Aggiungi: TOKEN = una stringa lunga e casuale.
 *  3. Esegui → Distribuisci → Nuova distribuzione → tipo "App web":
 *       Esegui come: Me
 *       Chi ha accesso: Chiunque
 *  4. Copia l'URL dell'app web e aggiungi "?token=TOKEN" in fondo.
 *     Quell'URL completo è l'indirizzo da incollare nell'app Android.
 */

const SHEET_ID = '1dkVhjXs9Vs6jicZNINdsuMqHixoDat_cbIhdY2CqlnE';
const TABS = ['CONSUMI ELETTRICI', 'BOLLETTE', 'Letture gas'];

function doGet(e) {
  const expected = PropertiesService.getScriptProperties().getProperty('TOKEN');
  const given = e && e.parameter ? e.parameter.token : null;
  if (!expected || given !== expected) {
    return json({ error: 'unauthorized' });
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const tz = ss.getSpreadsheetTimeZone();
  const out = {};
  TABS.forEach(function (name) {
    const sheet = ss.getSheetByName(name);
    out[name] = sheet
      ? sheet.getDataRange().getValues().map(function (row) {
          return row.map(function (v) {
            return v instanceof Date ? Utilities.formatDate(v, tz, 'dd/MM/yyyy') : v;
          });
        })
      : null;
  });
  return json(out);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
