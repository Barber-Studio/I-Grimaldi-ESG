ONESIGNAL — INTEGRAZIONE COMPLETA

App ID OneSignal configurato:
864d0967-8a2d-4fe1-8a19-e95fe866b28b

Configurazione inclusa:
- OneSignal Web SDK v16 caricato in index.html.
- OneSignal.init() con App ID corretto.
- OneSignalSDKWorker.js presente nella root del sito.
- Service worker configurato con scope /.
- autoResubscribe attivo.
- Al login/registrazione l'utente viene collegato a OneSignal tramite il suo ID Supabase.
- Alla riapertura dell'app la sessione viene ripristinata e OneSignal viene ricollegato.
- Al logout l'utente viene scollegato da OneSignal.
- Il pulsante “Attiva notifiche” richiede il permesso nativo del browser.
- Controllo corretto del permesso OneSignal (booleano).
- Controllo compatibilità push e requisito “Aggiungi alla schermata Home” su iPhone/iPad.

IMPORTANTE:
- Non inserire mai la REST API Key di OneSignal nel codice frontend.
- Su iPhone/iPad il sito deve essere installato nella schermata Home prima di poter usare le web push.
- Il file OneSignalSDKWorker.js deve rimanere nella root del sito e deve essere raggiungibile in HTTPS.
- L'App ID sopra riportato è un identificativo pubblico; la REST API Key invece va tenuta segreta nella dashboard/server.
