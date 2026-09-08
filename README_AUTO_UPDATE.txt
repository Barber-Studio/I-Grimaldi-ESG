AGGIORNAMENTO AUTOMATICO PWA

Questa versione controlla automaticamente version.json:
- all'apertura dell'app
- quando l'utente torna nell'app
- ogni 5 minuti mentre è aperta

Quando aggiorni il progetto su GitHub, cambia il numero in version.json
(es. 2026.09.09.1). Alla successiva apertura/controllo, i clienti ricevono
automaticamente la nuova versione.

Non cambia la grafica.

NOTA: i file statici di una PWA possono essere gestiti dalla cache del browser.
Per questo è presente anche un controllo dei service worker con registration.update().
