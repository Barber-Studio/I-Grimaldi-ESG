COLLABORATORE - STESSA FASCIA ORARIA

1. Supabase > SQL Editor: esegui SQL_COLLABORATORE.sql (una volta sola).
2. Carica su GitHub js/app.js, js/admin.js e version.json.

Come funziona:
- Ogni fascia oraria ha 2 posti: titolare e collaboratore.
- Il cliente non vede nessuna differenza: l'orario resta prenotabile finche' c'e' almeno un posto libero.
  La prima prenotazione va al titolare, la seconda al collaboratore.
- Agenda admin: ogni fascia mostra due blocchi (prenotato, libero o bloccato), senza etichette.
- BLOCCA / blocco giornata continuano a chiudere la fascia per entrambi.
- Riepilogo: l'occupazione tiene conto dei 2 posti.
