I GRIMALDI - GESTIONALE ADMIN + ORARI

PRENOTAZIONI (js/app.js, in cima: OPEN_DAYS / OPEN_FROM / OPEN_TO / SLOT_MINUTES)
- Prenotabile solo da lunedi a venerdi, ogni 30 minuti da 09:00 a 21:00 (senza pausa pranzo).
- Sabato e domenica disabilitati nel calendario cliente.
- Oggi non si possono piu prenotare orari gia passati.
- Uno slot annullato torna prenotabile (prima poteva dare "orario gia prenotato").

GESTIONALE (solo admin, js/admin.js) - voce di menu "Gestionale"
- AGENDA: incasso previsto del giorno, gia maturato, orari liberi, badge con n. appuntamenti
  sul calendario, totale del mese, pulsanti Chiama / WhatsApp su ogni cliente.
- RIEPILOGO: incasso previsto/maturato del mese, scontrino medio, occupazione, clienti,
  giorno migliore, annullati, grafico per giorno, servizi piu richiesti.
- CLIENTI: anagrafica con ricerca, visite, spesa totale, ultima/prossima visita, Prenota.

Supabase, OneSignal e grafica non sono stati modificati. Nessuna nuova tabella o colonna.
Dopo il caricamento su GitHub: svuota la cache / riapri la web app.
