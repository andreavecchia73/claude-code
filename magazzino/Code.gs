/**
 * Magazzino personale: web app Apps Script con Google Sheets come database.
 * Il foglio collegato a questo script contiene le tabelle Articoli, Categorie,
 * Ubicazioni e Impostazioni. Eseguire inizializza() una sola volta dall'editor.
 */

const TABELLE = {
  Articoli: ['codice', 'categoria', 'descrizione', 'quantita', 'ubicazione_id', 'specifiche', 'stato', 'scorta_minima', 'note', 'foto', 'creato', 'modificato'],
  Categorie: ['prefisso', 'nome', 'ultimo_numero'],
  Ubicazioni: ['id', 'nome', 'parent_id'],
  Impostazioni: ['chiave', 'valore'],
};

const IMPOSTAZIONI_PREDEFINITE = [
  ['etichetta_larghezza_mm', 40],
  ['etichetta_altezza_mm', 30],
  ['margine_sinistra_mm', 5],
  ['margine_destra_mm', 5],
  ['margine_alto_mm', 13.5],
  ['margine_basso_mm', 13.5],
  ['spazio_colonne_mm', 0],
  ['spazio_righe_mm', 0],
  ['qr_lato_mm', 20],
  ['cartella_foto_id', ''],
];

const CAMPI_MODIFICABILI = ['categoria', 'descrizione', 'quantita', 'ubicazione_id', 'specifiche', 'stato', 'scorta_minima', 'note'];
const STATI = ['nuovo', 'usato', 'testato', 'guasto'];
const MAX_FOTO = 3;
const SEP_FOTO = ' | ';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Magazzino')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function inizializza() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Esegui inizializza() dallo script aperto dal foglio (Estensioni > Apps Script).');
  PropertiesService.getScriptProperties().setProperty('SS_ID', ss.getId());
  Object.keys(TABELLE).forEach(nome => {
    let foglio = ss.getSheetByName(nome);
    if (!foglio) foglio = ss.insertSheet(nome);
    if (foglio.getLastRow() === 0) {
      foglio.getRange(1, 1, 1, TABELLE[nome].length).setValues([TABELLE[nome]]).setFontWeight('bold');
      foglio.setFrozenRows(1);
    }
  });
  const imp = ss.getSheetByName('Impostazioni');
  if (imp.getLastRow() === 1) {
    imp.getRange(2, 1, IMPOSTAZIONI_PREDEFINITE.length, 2).setValues(IMPOSTAZIONI_PREDEFINITE);
  }
  if (!leggiImpostazioni_().cartella_foto_id) {
    const cartella = DriveApp.createFolder('Magazzino - foto');
    scriviImpostazione_('cartella_foto_id', cartella.getId());
  }
}

function getDati() {
  return {
    articoli: leggiTabella_('Articoli'),
    categorie: leggiTabella_('Categorie'),
    ubicazioni: leggiTabella_('Ubicazioni'),
    impostazioni: leggiImpostazioni_(),
  };
}

function salvaArticolo(dati) {
  return conBlocco_(() => {
    const pulito = pulisciArticolo_(dati, leggiTabella_('Categorie'), leggiTabella_('Ubicazioni'));
    const adesso = new Date().toISOString();
    if (!dati.codice) {
      const articolo = Object.assign({ codice: assegnaCodice_(pulito.categoria), foto: '', creato: adesso, modificato: adesso }, pulito);
      appendi_('Articoli', articolo);
      return articolo;
    }
    const riga = trovaRiga_('Articoli', 'codice', dati.codice);
    if (!riga) throw new Error('Articolo non trovato: ' + dati.codice);
    const attuale = leggiRiga_('Articoli', riga);
    Object.assign(attuale, pulito, { modificato: adesso });
    scriviRiga_('Articoli', riga, attuale);
    return attuale;
  });
}

function aggiornaQuantita(codice, delta) {
  return conBlocco_(() => {
    const riga = trovaRiga_('Articoli', 'codice', codice);
    if (!riga) throw new Error('Articolo non trovato: ' + codice);
    const foglio = foglioTabella_('Articoli');
    const cella = foglio.getRange(riga, colonna_('Articoli', 'quantita'));
    const nuova = Math.max(0, Number(cella.getValue()) + Number(delta));
    cella.setValue(nuova);
    foglio.getRange(riga, colonna_('Articoli', 'modificato')).setValue(new Date().toISOString());
    return nuova;
  });
}

function salvaCategoria(dati) {
  return conBlocco_(() => {
    const nome = String(dati.nome || '').trim();
    const prefisso = String(dati.prefisso || '').trim().toUpperCase();
    if (!nome) throw new Error('Nome categoria obbligatorio');
    if (!prefisso) throw new Error('Prefisso obbligatorio');
    if (trovaRiga_('Categorie', 'prefisso', prefisso)) {
      // Prefisso esistente: si rinomina solo la categoria, il prefisso resta fisso
      const riga = trovaRiga_('Categorie', 'prefisso', prefisso);
      foglioTabella_('Categorie').getRange(riga, colonna_('Categorie', 'nome')).setValue(nome);
    } else {
      if (!/^[A-Z]{3}$/.test(prefisso)) throw new Error('Il prefisso deve essere di 3 lettere');
      appendi_('Categorie', { prefisso, nome, ultimo_numero: 0 });
    }
    return { prefisso, nome };
  });
}

function salvaUbicazione(dati) {
  return conBlocco_(() => {
    const nome = String(dati.nome || '').trim();
    const parentId = String(dati.parent_id || '');
    if (!nome) throw new Error('Nome ubicazione obbligatorio');
    if (parentId && !leggiTabella_('Ubicazioni').some(u => u.id === parentId)) throw new Error('Ubicazione padre non valida');
    const ubicazione = { id: 'U' + Utilities.getUuid().slice(0, 8).toUpperCase(), nome, parent_id: parentId };
    appendi_('Ubicazioni', ubicazione);
    return ubicazione;
  });
}

function salvaImpostazioni(valori) {
  return conBlocco_(() => {
    IMPOSTAZIONI_PREDEFINITE.forEach(([chiave]) => {
      if (chiave === 'cartella_foto_id' || valori[chiave] === undefined) return;
      const n = Number(String(valori[chiave]).replace(',', '.'));
      if (!(n >= 0) || (chiave.indexOf('etichetta_') === 0 && n <= 0)) throw new Error('Valore non valido: ' + chiave);
      scriviImpostazione_(chiave, n);
    });
    return leggiImpostazioni_();
  });
}

function caricaFoto(codice, dataUrl) {
  return conBlocco_(() => {
    const riga = trovaRiga_('Articoli', 'codice', codice);
    if (!riga) throw new Error('Articolo non trovato: ' + codice);
    const cella = foglioTabella_('Articoli').getRange(riga, colonna_('Articoli', 'foto'));
    const foto = String(cella.getValue()).split(SEP_FOTO).filter(Boolean);
    if (foto.length >= MAX_FOTO) throw new Error('Massimo ' + MAX_FOTO + ' foto per articolo');
    const cartellaId = leggiImpostazioni_().cartella_foto_id;
    if (!cartellaId) throw new Error('Cartella foto mancante: eseguire inizializza()');
    const bytes = Utilities.base64Decode(dataUrl.split(',')[1]);
    const file = DriveApp.getFolderById(cartellaId)
      .createFile(Utilities.newBlob(bytes, 'image/jpeg', codice + '_' + (foto.length + 1) + '.jpg'));
    foto.push(file.getId());
    cella.setValue(foto.join(SEP_FOTO));
    foglioTabella_('Articoli').getRange(riga, colonna_('Articoli', 'modificato')).setValue(new Date().toISOString());
    return foto;
  });
}

/* ---------- helper interni ---------- */

function conBlocco_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function pulisciArticolo_(d, categorie, ubicazioni) {
  const quantita = d.quantita === '' || d.quantita == null ? NaN : Number(d.quantita);
  const pulito = {
    categoria: String(d.categoria || '').toUpperCase(),
    descrizione: String(d.descrizione || '').trim(),
    quantita: quantita,
    ubicazione_id: String(d.ubicazione_id || ''),
    specifiche: String(d.specifiche || '').trim(),
    stato: String(d.stato || '').trim(),
    scorta_minima: d.scorta_minima === '' || d.scorta_minima == null ? '' : Number(d.scorta_minima),
    note: String(d.note || '').trim(),
  };
  if (!categorie.some(c => c.prefisso === pulito.categoria)) throw new Error('Categoria obbligatoria');
  if (!pulito.descrizione) throw new Error('Descrizione obbligatoria');
  if (!Number.isInteger(pulito.quantita) || pulito.quantita < 0) throw new Error('Quantità non valida');
  if (!ubicazioni.some(u => u.id === pulito.ubicazione_id)) throw new Error('Ubicazione obbligatoria');
  if (pulito.stato && STATI.indexOf(pulito.stato) === -1) throw new Error('Stato non valido');
  if (pulito.scorta_minima !== '' && !(pulito.scorta_minima >= 0)) throw new Error('Scorta minima non valida');
  return pulito;
}

function assegnaCodice_(prefisso) {
  const riga = trovaRiga_('Categorie', 'prefisso', prefisso);
  if (!riga) throw new Error('Categoria non trovata: ' + prefisso);
  const cella = foglioTabella_('Categorie').getRange(riga, colonna_('Categorie', 'ultimo_numero'));
  const n = Number(cella.getValue()) + 1;
  cella.setValue(n);
  return prefisso + '-' + String(n).padStart(6, '0');
}

/** Dalla web app il foglio attivo non esiste: si riapre per ID salvato da inizializza(). */
function foglioTabella_(nome) {
  const id = PropertiesService.getScriptProperties().getProperty('SS_ID');
  if (!id) throw new Error('Foglio non collegato: eseguire inizializza() dall\'editor.');
  const foglio = SpreadsheetApp.openById(id).getSheetByName(nome);
  if (!foglio) throw new Error('Foglio mancante: ' + nome + '. Eseguire inizializza().');
  return foglio;
}

function colonna_(nome, campo) {
  return TABELLE[nome].indexOf(campo) + 1;
}

function valoreCella_(v) {
  return v instanceof Date ? v.toISOString() : v;
}

function leggiTabella_(nome) {
  const valori = foglioTabella_(nome).getDataRange().getValues();
  return valori.slice(1)
    .filter(r => r.some(c => c !== ''))
    .map(r => leggiRigaValori_(nome, r));
}

function leggiRigaValori_(nome, r) {
  const o = {};
  TABELLE[nome].forEach((h, j) => (o[h] = valoreCella_(r[j])));
  return o;
}

function leggiRiga_(nome, riga) {
  const valori = foglioTabella_(nome).getRange(riga, 1, 1, TABELLE[nome].length).getValues()[0];
  return leggiRigaValori_(nome, valori);
}

function scriviRiga_(nome, riga, oggetto) {
  foglioTabella_(nome).getRange(riga, 1, 1, TABELLE[nome].length)
    .setValues([TABELLE[nome].map(h => (oggetto[h] === undefined ? '' : oggetto[h]))]);
}

function appendi_(nome, oggetto) {
  foglioTabella_(nome).appendRow(TABELLE[nome].map(h => (oggetto[h] === undefined ? '' : oggetto[h])));
}

/** Restituisce il numero di riga (1-based) oppure 0 se il valore non esiste. */
function trovaRiga_(nome, campo, valore) {
  const foglio = foglioTabella_(nome);
  const colonne = foglio.getRange(1, colonna_(nome, campo), foglio.getLastRow(), 1).getValues().flat();
  const i = colonne.findIndex((v, k) => k > 0 && v !== '' && String(v) === String(valore));
  return i === -1 ? 0 : i + 1;
}

function leggiImpostazioni_() {
  const imp = {};
  leggiTabella_('Impostazioni').forEach(r => (imp[r.chiave] = r.valore));
  return imp;
}

function scriviImpostazione_(chiave, valore) {
  const riga = trovaRiga_('Impostazioni', 'chiave', chiave);
  if (riga) {
    foglioTabella_('Impostazioni').getRange(riga, colonna_('Impostazioni', 'valore')).setValue(valore);
  } else {
    appendi_('Impostazioni', { chiave, valore });
  }
}
