PATCH ONESIGNAL - SOLO NOTIFICHE

Base usata: I-GRIMALDI-COMPLETO-ONESIGNAL-09-21.zip fornito dall'utente.

Modifiche:
- OneSignal SDK v16 inizializzato in modo sicuro.
- Service worker OneSignal aggiunto nella root del sito.
- Il pulsante attiva notifiche ora aspetta fino a 10 secondi la creazione della vera Push Subscription.
- Il controllo usa PushSubscription.optedIn + PushSubscription.id, non solo il permesso del browser.
- L'utente viene collegato a OneSignal solo dopo una subscription valida.
- Nessuna modifica intenzionale a grafica, agenda, login, prenotazioni o Supabase.

App ID:
864d0967-8a2d-4fe1-8a19-e95fe866b28b
