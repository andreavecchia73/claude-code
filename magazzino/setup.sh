#!/usr/bin/env bash
# Crea un Google Sheet con lo script legato e carica i file dell'app.
#
# Prerequisiti (una volta sola):
#   1. Node.js installato
#   2. npm install -g @google/clasp
#   3. clasp login
#   4. API Apps Script attiva: https://script.google.com/home/usersettings
#
# Uso: ./setup.sh [titolo-del-foglio]

set -euo pipefail

cd "$(dirname "$0")"
TITOLO="${1:-Magazzino}"

if ! command -v clasp >/dev/null 2>&1; then
  echo "clasp non trovato. Installa con: npm install -g @google/clasp" >&2
  exit 1
fi

if ! clasp login --status >/dev/null 2>&1; then
  echo "Non sei autenticato. Esegui: clasp login" >&2
  exit 1
fi

if [ -f .clasp.json ]; then
  echo "Progetto già collegato (.clasp.json presente): carico solo i file aggiornati."
else
  clasp create --type sheets --title "$TITOLO" --rootDir .
fi

clasp push --force
clasp deploy --description "Magazzino"

echo
echo "Fatto. Passi manuali rimasti:"
echo "  1. Apri il progetto con: clasp open"
echo "  2. Nel progetto seleziona la funzione 'inizializza' e premi Esegui (autorizza le richieste)."
echo "  3. Recupera l'URL dell'app con: clasp deployments"
echo "     Se la web app non è ancora pubblica come 'Solo io', imposta Chi ha accesso su 'Solo io' in Implementa > Gestisci implementazioni."
