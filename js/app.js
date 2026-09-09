/* ============================================================
   I GRIMALDI - BOOKING PUSH NOTIFICATIONS PATCH
   NON modifica login, registrazione o sessione
============================================================ */


/* ============================================================
   INVIA NOTIFICA
============================================================ */

async function sendBookingNotification(
  externalId,
  phone,
  title,
  message,
  type = "booking"
) {

  if (!supabaseClient) {
    console.error("Supabase non disponibile");
    return false;
  }

  try {

    // 1. Salva lo storico nella tabella notifications
    const { error: dbError } = await supabaseClient
      .from("notifications")
      .insert([{
        customer_phone: normalizePhone(phone),
        title: title,
        message: message,
        type: type,
        read: false
      }]);

    if (dbError) {
      console.error(
        "Errore salvataggio notifications:",
        dbError
      );
    }


    // 2. Chiama la Edge Function
    const { data, error } =
      await supabaseClient.functions.invoke(
        "send-notification",
        {
          body: {
            external_id: String(externalId),
            customer_phone: normalizePhone(phone),
            title: title,
            message: message,
            type: type
          }
        }
      );


    if (error) {

      console.error(
        "Errore Edge Function:",
        error
      );

      return false;

    }


    console.log(
      "Notifica Edge Function inviata:",
      data
    );


    return true;

  } catch (error) {

    console.error(
      "Errore invio notifica:",
      error
    );

    return false;

  }

}


/* ============================================================
   NUOVA PRENOTAZIONE + NOTIFICA
============================================================ */

createBooking = async function () {

  if (!currentUser) {

    showToast(
      "Accedi prima di prenotare",
      "error"
    );

    openAuth();

    return;

  }


  if (
    !selectedService ||
    !selectedDate ||
    !selectedTime
  ) {

    showToast(
      "Completa servizio, data e orario",
      "error"
    );

    return;

  }


  if (!supabaseClient) {

    showToast(
      "Supabase non disponibile",
      "error"
    );

    return;

  }


  const payload = {

    client_id: currentUser.id,

    client_name:
      currentUser.customer_name,

    client_phone:
      currentUser.customer_phone,

    appointment_date:
      selectedDate,

    appointment_time:
      selectedTime,

    service:
      selectedService.name,

    price:
      selectedService.price,

    status:
      "confirmed"

  };


  try {

    const { error } =
      await supabaseClient
        .from("appointments")
        .insert([payload]);


    if (error) throw error;


    /* ============================================
       INVIO NOTIFICA CONFERMA
    ============================================ */

    const dataFormattata =
      new Date(
        selectedDate + "T12:00:00"
      ).toLocaleDateString(
        "it-IT",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric"
        }
      );


    await sendBookingNotification(

      currentUser.id,

      currentUser.customer_phone,

      "Prenotazione confermata ✂️",

      `Il tuo appuntamento per ${selectedService.name} è confermato per ${dataFormattata} alle ${selectedTime}.`,

      "booking_confirmed"

    );


    /* ============================================ */


    showToast(
      "Prenotazione confermata!",
      "success"
    );


    selectedService = null;

    selectedTime = null;


    renderServices();

    updateSummary();


    await loadAvailableTimes();


    setTimeout(
      () => showPage("appointmentsPage"),
      450
    );


  } catch (e) {

    console.error(e);


    showToast(

      e.code === "23505"

        ? "Questo orario è già occupato"

        : "Errore prenotazione: " +
          (e.message || "controlla Supabase"),

      "error"

    );

  }

};


/* ============================================================
   ANNULLAMENTO + NOTIFICA
============================================================ */

cancelBooking = async function (id) {

  if (
    !confirm(
      "Vuoi davvero annullare questa prenotazione?"
    )
  ) return;


  try {

    // Recuperiamo prima i dati dell'appuntamento
    const {
      data: booking,
      error: bookingError
    } =
      await supabaseClient
        .from("appointments")
        .select("*")
        .eq("id", id)
        .single();


    if (bookingError) {

      throw bookingError;

    }


    // Eliminiamo l'appuntamento
    const { error } =
      await supabaseClient
        .from("appointments")
        .delete()
        .eq("id", id);


    if (error) {

      throw error;

    }


    /* ============================================
       INVIO NOTIFICA ANNULLAMENTO
    ============================================ */

    if (booking) {

      const dataFormattata =
        new Date(
          booking.appointment_date +
          "T12:00:00"
        ).toLocaleDateString(
          "it-IT",
          {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
          }
        );


      await sendBookingNotification(

        booking.client_id,

        booking.client_phone,

        "Prenotazione annullata",

        `Il tuo appuntamento del ${dataFormattata} alle ${String(
          booking.appointment_time || ""
        ).slice(0, 5)} è stato annullato.`,

        "booking_cancelled"

      );

    }


    /* ============================================ */


    showToast(
      "Prenotazione annullata",
      "success"
    );


    loadUserBookings();


  } catch (e) {

    console.error(e);

    showToast(
      "Errore durante l'annullamento",
      "error"
    );

  }

};


/* ============================================================
   AGGIORNA EVENT LISTENER DEL PULSANTE PRENOTA
============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    const button =
      document.getElementById(
        "confirmBooking"
      );

    if (button) {

      button.onclick =
        function (event) {

          event.preventDefault();

          createBooking();

        };

    }

  }
);
