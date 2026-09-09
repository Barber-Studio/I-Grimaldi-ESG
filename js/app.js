// ============================================================
// I GRIMALDI E.S.G. - APP.JS COMPLETO
// ============================================================


// ============================================================
// CONFIGURAZIONE SUPABASE
// ============================================================

const SUPABASE_URL = "https://wxcdmtajcasnlohqkgmk.supabase.co/rest/v1/";

const SUPABASE_ANON_KEY =
  "sb_publishable_bwjP-ihASijevvu7d6r5Ew_6JaWKSDP";


const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ============================================================
// STATO APP
// ============================================================

let currentUser = null;

let selectedService = null;

let selectedDate = null;

let selectedTime = null;

let bookingViewDate = new Date();

let services = [
  {
    name: "Shampoo + Taglio",
    price: 20
  },
  {
    name: "Taglio Bambino",
    price: 12
  },
  {
    name: "Barba 5€",
    price: 5
  },
  {
    name: "Barba 10€",
    price: 10
  },
  {
    name: "Colore",
    price: 20
  },
  {
    name: "Colore Barba",
    price: 10
  },
  {
    name: "Fiala",
    price: 5
  }
];


const TIMES = [

  "09:00",
  "09:30",

  "10:00",
  "10:30",

  "11:00",
  "11:30",

  "12:00",

  "15:00",
  "15:30",

  "16:00",
  "16:30",

  "17:00",
  "17:30",

  "18:00",
  "18:30",

  "19:00",
  "19:30",

  "20:00",
  "20:30",

  "21:00"

];


// ============================================================
// UTILITY
// ============================================================


function $(id) {
  return document.getElementById(id);
}


function normalizePhone(phone) {

  if (!phone) return "";

  return phone
    .replace(/\s+/g, "")
    .replace(/[^\d+]/g, "");

}


function createEmailFromPhone(phone) {

  const cleanPhone = phone.replace(/\D/g, "");

  return `${cleanPhone}@igrimaldi.app`;

}


function formatDateItalian(dateString) {

  if (!dateString) return "-";

  const date = new Date(dateString + "T12:00:00");

  return date.toLocaleDateString(
    "it-IT",
    {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );

}


function formatDateShort(dateString) {

  if (!dateString) return "-";

  const date = new Date(dateString + "T12:00:00");

  return date.toLocaleDateString(
    "it-IT",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );

}


function localDateString(date) {

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;

}


function showToast(message, type = "success") {

  const toast = $("toast");

  if (!toast) return;

  toast.textContent = message;

  toast.className = "";

  toast.classList.add("show");

  if (type === "error") {
    toast.classList.add("error");
  }

  setTimeout(() => {

    toast.classList.remove("show");

  }, 3500);

}


// ============================================================
// PAGINE
// ============================================================


window.showPage = function(pageId) {

  document
    .querySelectorAll(".page")
    .forEach(page => {

      page.classList.remove("active");

    });


  const page = $(pageId);

  if (page) {

    page.classList.add("active");

  }


  document
    .querySelectorAll(".bottom-nav button")
    .forEach(button => {

      button.classList.remove("active");

      if (
        button.dataset.page === pageId
      ) {
        button.classList.add("active");
      }

    });


  if (pageId === "appointmentsPage") {

    loadUserBookings();

  }


  if (pageId === "profilePage") {

    updateProfileUI();

  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

};


// ============================================================
// LOADING SCREEN
// ============================================================


window.addEventListener(
  "load",
  () => {

    setTimeout(() => {

      const loading = $("loadingScreen");

      if (loading) {

        loading.classList.add("hide");

        setTimeout(() => {

          loading.remove();

        }, 600);

      }

    }, 800);

  }
);


// ============================================================
// SERVIZI
// ============================================================


function renderServices() {

  const container = $("services");

  if (!container) return;


  container.innerHTML = "";


  services.forEach((service) => {

    const button =
      document.createElement("button");


    button.className =
      "service-card";


    if (
      selectedService &&
      selectedService.name === service.name
    ) {

      button.classList.add("selected");

    }


    button.innerHTML = `

      <span class="service-name">
        ${service.name}
      </span>

      <strong class="service-price">
        €${service.price}
      </strong>

    `;


    button.addEventListener(
      "click",
      () => {

        selectedService = service;

        renderServices();

        updateBookingSummary();

      }
    );


    container.appendChild(button);

  });

}


// ============================================================
// CALENDARIO
// ============================================================


function renderCalendar() {

  const calendar =
    $("bookingCalendar");


  const title =
    $("bookingMonthTitle");


  if (!calendar || !title) return;


  const year =
    bookingViewDate.getFullYear();


  const month =
    bookingViewDate.getMonth();


  const monthName =
    bookingViewDate.toLocaleDateString(
      "it-IT",
      {
        month: "long",
        year: "numeric"
      }
    );


  title.textContent =
    monthName.charAt(0).toUpperCase() +
    monthName.slice(1);


  calendar.innerHTML = "";


  const firstDay =
    new Date(
      year,
      month,
      1
    );


  let startDay =
    firstDay.getDay() - 1;


  if (startDay < 0) {

    startDay = 6;

  }


  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  const today =
    new Date();


  today.setHours(
    0,
    0,
    0,
    0
  );


  for (
    let i = 0;
    i < startDay;
    i++
  ) {

    const empty =
      document.createElement("div");

    empty.className =
      "calendar-empty";

    calendar.appendChild(empty);

  }


  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const date =
      new Date(
        year,
        month,
        day
      );


    date.setHours(
      0,
      0,
      0,
      0
    );


    const button =
      document.createElement("button");


    button.textContent = day;


    button.className =
      "calendar-day";


    const dateString =
      localDateString(date);


    const isSunday =
      date.getDay() === 0;


    if (
      date < today ||
      isSunday
    ) {

      button.disabled = true;

      button.classList.add("disabled");

    }


    if (
      dateString === selectedDate
    ) {

      button.classList.add("selected");

    }


    button.addEventListener(
      "click",
      async () => {

        if (
          button.disabled
        ) return;


        selectedDate =
          dateString;


        selectedTime =
          null;


        renderCalendar();


        await loadBusyTimes();


        updateBookingSummary();

      }
    );


    calendar.appendChild(button);

  }

}


// ============================================================
// NAVIGAZIONE MESI
// ============================================================


$("prevBookingMonth")?.addEventListener(
  "click",
  () => {

    const now = new Date();

    const previous =
      new Date(
        bookingViewDate.getFullYear(),
        bookingViewDate.getMonth() - 1,
        1
      );


    const currentMonth =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );


    if (
      previous >= currentMonth
    ) {

      bookingViewDate = previous;

      renderCalendar();

    }

  }
);


$("nextBookingMonth")?.addEventListener(
  "click",
  () => {

    bookingViewDate =
      new Date(
        bookingViewDate.getFullYear(),
        bookingViewDate.getMonth() + 1,
        1
      );


    renderCalendar();

  }
);


// ============================================================
// ORARI OCCUPATI
// ============================================================


async function loadBusyTimes() {

  const container =
    $("timeSlots");


  if (!container) return;


  container.innerHTML =
    "<div class='loading-times'>Caricamento orari...</div>";


  if (!selectedDate) {

    container.innerHTML = "";

    return;

  }


  const label =
    $("selectedBookingDateLabel");


  if (label) {

    label.textContent =
      formatDateItalian(selectedDate);

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("appointments")
        .select("start_time,status")
        .eq(
          "appointment_date",
          selectedDate
        )
        .neq(
          "status",
          "cancelled"
        );


    if (error) throw error;


    const busyTimes =
      (data || []).map(
        booking =>
          booking.start_time
            .substring(0, 5)
      );


    renderTimeSlots(busyTimes);

  }

  catch (error) {

    console.error(
      "Errore caricamento orari:",
      error
    );


    container.innerHTML =
      "<p>Errore nel caricamento degli orari.</p>";

  }

}


function renderTimeSlots(busyTimes = []) {

  const container =
    $("timeSlots");


  if (!container) return;


  container.innerHTML = "";


  TIMES.forEach(time => {

    const button =
      document.createElement("button");


    button.textContent = time;

    button.className =
      "time-slot";


    if (
      busyTimes.includes(time)
    ) {

      button.disabled = true;

      button.classList.add("busy");

      button.textContent =
        `${time} • Occupato`;

    }


    if (
      selectedTime === time
    ) {

      button.classList.add("selected");

    }


    button.addEventListener(
      "click",
      () => {

        if (
          button.disabled
        ) return;


        selectedTime = time;

        renderTimeSlots(busyTimes);

        updateBookingSummary();

      }
    );


    container.appendChild(button);

  });

}


// ============================================================
// RIEPILOGO PRENOTAZIONE
// ============================================================


function updateBookingSummary() {

  $("summaryService").textContent =
    selectedService
      ? selectedService.name
      : "Non selezionato";


  $("summaryDate").textContent =
    selectedDate
      ? formatDateShort(selectedDate)
      : "-";


  $("summaryTime").textContent =
    selectedTime || "-";


  $("summaryPrice").textContent =
    selectedService
      ? `€${selectedService.price}`
      : "€0";

}


// ============================================================
// CALCOLO ORA FINE
// ============================================================


function calculateEndTime(startTime) {

  const [hours, minutes] =
    startTime
      .split(":")
      .map(Number);


  const date =
    new Date();


  date.setHours(
    hours,
    minutes + 30,
    0,
    0
  );


  return (
    String(date.getHours())
      .padStart(2, "0")
    +
    ":"
    +
    String(date.getMinutes())
      .padStart(2, "0")
    +
    ":00"
  );

}


// ============================================================
// ONESIGNAL - COLLEGA UTENTE
// ============================================================


async function connectOneSignalUser(phone) {

  if (!phone) return;


  const cleanPhone =
    normalizePhone(phone);


  try {

    if (
      window.OneSignalDeferred
    ) {

      window.OneSignalDeferred.push(
        async function(OneSignal) {

          try {

            await OneSignal.login(
              cleanPhone
            );


            console.log(
              "OneSignal utente collegato:",
              cleanPhone
            );

          }

          catch (error) {

            console.error(
              "Errore login OneSignal:",
              error
            );

          }

        }
      );

    }

  }

  catch (error) {

    console.error(
      "Errore collegamento OneSignal:",
      error
    );

  }

}


// ============================================================
// ATTIVA NOTIFICHE PUSH
// ============================================================


window.enableGrimaldiPush =
  async function() {

    try {

      if (
        !currentUser
      ) {

        showToast(
          "Accedi prima di attivare le notifiche",
          "error"
        );

        openAuth();

        return;

      }


      window.OneSignalDeferred.push(
        async function(OneSignal) {

          try {

            await OneSignal.Notifications.requestPermission();


            const phone =
              currentUser.user_metadata?.phone;


            if (phone) {

              await OneSignal.login(
                normalizePhone(phone)
              );

            }


            showToast(
              "Notifiche attivate!"
            );

          }

          catch (error) {

            console.error(error);


            showToast(
              "Impossibile attivare le notifiche",
              "error"
            );

          }

        }
      );

    }

    catch (error) {

      console.error(error);

    }

  };


// ============================================================
// INVIA NOTIFICA TRAMITE EDGE FUNCTION
// ============================================================


async function sendPushNotification(
  phone,
  title,
  message,
  type = "general"
) {

  if (!phone) {

    console.warn(
      "Numero telefono mancante"
    );

    return;

  }


  try {

    const cleanPhone =
      normalizePhone(phone);


    // 1. SALVA NOTIFICA NEL DATABASE

    const {
      error: notificationError
    } =
      await supabaseClient
        .from("notifications")
        .insert({

          customer_phone:
            cleanPhone,

          title:
            title,

          message:
            message,

          type:
            type,

          read:
            false

        });


    if (notificationError) {

      console.error(
        "Errore salvataggio notifica:",
        notificationError
      );

    }


    // 2. INVIA PUSH CON EDGE FUNCTION

    const {
      data,
      error
    } =
      await supabaseClient.functions.invoke(
        "send-notification",
        {

          body: {

            user_ids: [
              cleanPhone
            ],

            title: title,

            message: message

          }

        }
      );


    if (error) {

      console.error(
        "Errore Edge Function:",
        error
      );

      return;

    }


    console.log(
      "Notifica inviata:",
      data
    );

  }

  catch (error) {

    console.error(
      "Errore invio notifica:",
      error
    );

  }

}


// ============================================================
// CONFERMA PRENOTAZIONE
// ============================================================


$("confirmBooking")?.addEventListener(
  "click",
  async () => {

    // CONTROLLO LOGIN

    if (!currentUser) {

      showToast(
        "Devi accedere prima di prenotare",
        "error"
      );


      openAuth();

      return;

    }


    // CONTROLLO SERVIZIO

    if (!selectedService) {

      showToast(
        "Seleziona un servizio",
        "error"
      );

      return;

    }


    // CONTROLLO DATA

    if (!selectedDate) {

      showToast(
        "Seleziona una data",
        "error"
      );

      return;

    }


    // CONTROLLO ORARIO

    if (!selectedTime) {

      showToast(
        "Seleziona un orario",
        "error"
      );

      return;

    }


    const button =
      $("confirmBooking");


    button.disabled = true;

    button.textContent =
      "PRENOTAZIONE IN CORSO...";


    try {

      // RICONTROLLO ORARIO
      // IMPORTANTE PER EVITARE
      // DOPPIE PRENOTAZIONI

      const {
        data: existing,
        error: checkError
      } =
        await supabaseClient
          .from("appointments")
          .select("id")
          .eq(
            "appointment_date",
            selectedDate
          )
          .eq(
            "start_time",
            selectedTime
          )
          .neq(
            "status",
            "cancelled"
          );


      if (checkError) {

        throw checkError;

      }


      if (
        existing &&
        existing.length > 0
      ) {

        showToast(
          "Questo orario è stato appena prenotato",
          "error"
        );


        await loadBusyTimes();

        return;

      }


      const metadata =
        currentUser.user_metadata || {};


      const fullName =
        `${metadata.name || ""} ${metadata.surname || ""}`
          .trim();


      const phone =
        normalizePhone(
          metadata.phone || ""
        );


      const endTime =
        calculateEndTime(
          selectedTime
        );


      // INSERIMENTO PRENOTAZIONE

      const {
        data: bookingData,
        error: bookingError
      } =
        await supabaseClient
          .from("appointments")
          .insert({

            customer_id:
              currentUser.id,

            customer_name:
              fullName,

            customer_phone:
              phone,

            appointment_date:
              selectedDate,

            start_time:
              selectedTime,

            end_time:
              endTime,

            service_name:
              selectedService.name,

            service_price:
              selectedService.price,

            status:
              "confirmed",

            notes:
              null

          })
          .select()
          .single();


      if (bookingError) {

        throw bookingError;

      }


      console.log(
        "Prenotazione creata:",
        bookingData
      );


      // ====================================================
      // NOTIFICA CONFERMA PRENOTAZIONE
      // ====================================================

      await sendPushNotification(

        phone,

        "Prenotazione confermata ✂️",

        `Il tuo appuntamento per ${selectedService.name} è confermato il ${formatDateItalian(selectedDate)} alle ${selectedTime}.`,

        "booking_confirmed"

      );


      showToast(
        "Prenotazione confermata!"
      );


      // RESET

      selectedService = null;

      selectedDate = null;

      selectedTime = null;


      renderServices();

      renderCalendar();

      renderTimeSlots([]);

      updateBookingSummary();


      // APRE APPUNTAMENTI

      setTimeout(() => {

        showPage(
          "appointmentsPage"
        );

      }, 800);

    }


    catch (error) {

      console.error(
        "Errore prenotazione:",
        error
      );


      let message =
        "Errore durante la prenotazione";


      if (
        error.message
      ) {

        message =
          error.message;

      }


      showToast(
        message,
        "error"
      );

    }


    finally {

      button.disabled = false;

      button.textContent =
        "CONFERMA PRENOTAZIONE";

    }

  }
);


// ============================================================
// CARICA APPUNTAMENTI UTENTE
// ============================================================


async function loadUserBookings() {

  const container =
    $("bookingsList");


  if (!container) return;


  if (!currentUser) {

    container.innerHTML = `

      <div class="empty-bookings">

        <h3>Accedi al tuo account</h3>

        <p>
          Accedi per vedere e gestire
          i tuoi appuntamenti.
        </p>

        <button
          class="gold-button"
          onclick="openAuth()"
        >

          ACCEDI

        </button>

      </div>

    `;

    return;

  }


  container.innerHTML =
    "<div class='loading-bookings'>Caricamento appuntamenti...</div>";


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("appointments")
        .select("*")
        .eq(
          "customer_id",
          currentUser.id
        )
        .order(
          "appointment_date",
          {
            ascending: false
          }
        )
        .order(
          "start_time",
          {
            ascending: false
          }
        );


    if (error) throw error;


    if (
      !data ||
      data.length === 0
    ) {

      container.innerHTML = `

        <div class="empty-bookings">

          <div class="empty-icon">✂</div>

          <h3>Nessun appuntamento</h3>

          <p>
            Non hai ancora prenotazioni.
          </p>

          <button
            class="gold-button"
            onclick="showPage('bookingPage')"
          >

            PRENOTA ORA

          </button>

        </div>

      `;

      return;

    }


    container.innerHTML = "";


    data.forEach(booking => {

      const card =
        document.createElement("div");


      card.className =
        "appointment-card";


      const isCancelled =
        booking.status === "cancelled";


      card.innerHTML = `

        <div class="appointment-top">

          <div>

            <span class="appointment-date">

              ${formatDateItalian(
                booking.appointment_date
              )}

            </span>

            <h3>

              ${booking.service_name || "Servizio"}

            </h3>

          </div>

          <span class="appointment-status ${isCancelled ? "cancelled" : ""}">

            ${isCancelled
              ? "ANNULLATO"
              : "CONFERMATO"}

          </span>

        </div>


        <div class="appointment-info">

          <span>◷ ${booking.start_time?.substring(0, 5)}</span>

          <span>€${booking.service_price || 0}</span>

        </div>


        ${
          !isCancelled
            ? `

              <button
                class="cancel-booking"
                data-booking-id="${booking.id}"
              >

                ANNULLA PRENOTAZIONE

              </button>

            `
            : ""
        }

      `;


      const cancelButton =
        card.querySelector(
          ".cancel-booking"
        );


      if (cancelButton) {

        cancelButton.addEventListener(
          "click",
          () => {

            cancelBooking(
              booking
            );

          }
        );

      }


      container.appendChild(card);

    });

  }


  catch (error) {

    console.error(
      "Errore caricamento appuntamenti:",
      error
    );


    container.innerHTML = `

      <div class="empty-bookings">

        <h3>Errore</h3>

        <p>
          Non è stato possibile caricare
          gli appuntamenti.
        </p>

      </div>

    `;

  }

}


// ============================================================
// ANNULLA PRENOTAZIONE
// ============================================================


async function cancelBooking(booking) {

  const confirmation =
    confirm(
      "Vuoi davvero annullare questa prenotazione?"
    );


  if (!confirmation) return;


  try {

    const {
      error
    } =
      await supabaseClient
        .from("appointments")
        .update({

          status:
            "cancelled"

        })
        .eq(
          "id",
          booking.id
        );


    if (error) throw error;


    // NOTIFICA ANNULLAMENTO

    await sendPushNotification(

      booking.customer_phone,

      "Prenotazione annullata",

      `Il tuo appuntamento del ${formatDateItalian(booking.appointment_date)} alle ${booking.start_time.substring(0, 5)} è stato annullato.`,

      "booking_cancelled"

    );


    showToast(
      "Prenotazione annullata"
    );


    await loadUserBookings();

  }


  catch (error) {

    console.error(
      "Errore annullamento:",
      error
    );


    showToast(
      "Errore durante l'annullamento",
      "error"
    );

  }

}


// ============================================================
// MODAL LOGIN
// ============================================================


window.openAuth = function() {

  $("authModal")
    ?.classList.add("show");

};


window.closeAuth = function() {

  $("authModal")
    ?.classList.remove("show");

};


// ============================================================
// MODAL REGISTRAZIONE
// ============================================================


window.openRegister = function() {

  closeAuth();

  $("registerModal")
    ?.classList.remove("hidden");


  $("registerModal")
    ?.classList.add("show");

};


window.closeRegister = function() {

  $("registerModal")
    ?.classList.remove("show");


  $("registerModal")
    ?.classList.add("hidden");

};


// ============================================================
// REGISTRAZIONE
// ============================================================


$("registerButton")?.addEventListener(
  "click",
  async () => {

    const name =
      $("registerName").value.trim();


    const surname =
      $("registerSurname").value.trim();


    const phone =
      normalizePhone(
        $("registerPhone").value
      );


    const pin =
      $("registerPin").value.trim();


    const pin2 =
      $("registerPin2").value.trim();


    if (
      !name ||
      !surname ||
      !phone ||
      !pin ||
      !pin2
    ) {

      showToast(
        "Compila tutti i campi",
        "error"
      );

      return;

    }


    if (
      pin.length < 4
    ) {

      showToast(
        "Il PIN deve avere almeno 4 cifre",
        "error"
      );

      return;

    }


    if (
      !/^\d+$/.test(pin)
    ) {

      showToast(
        "Il PIN deve contenere solo numeri",
        "error"
      );

      return;

    }


    if (
      pin !== pin2
    ) {

      showToast(
        "I PIN non coincidono",
        "error"
      );

      return;

    }


    const button =
      $("registerButton");


    button.disabled = true;

    button.textContent =
      "CREAZIONE ACCOUNT...";


    try {

      const email =
        createEmailFromPhone(phone);


      const {
        data,
        error
      } =
        await supabaseClient.auth.signUp({

          email: email,

          password: pin,

          options: {

            data: {

              name: name,

              surname: surname,

              phone: phone

            }

          }

        });


      if (error) throw error;


      if (!data.user) {

        throw new Error(
          "Impossibile creare l'account"
        );

      }


      currentUser =
        data.user;


      await connectOneSignalUser(phone);


      updateProfileUI();


      closeRegister();


      showToast(
        "Account creato con successo!"
      );


      // PULISCE CAMPI

      $("registerName").value = "";

      $("registerSurname").value = "";

      $("registerPhone").value = "";

      $("registerPin").value = "";

      $("registerPin2").value = "";

    }


    catch (error) {

      console.error(
        "Errore registrazione:",
        error
      );


      showToast(
        error.message ||
        "Errore durante la registrazione",
        "error"
      );

    }


    finally {

      button.disabled = false;

      button.textContent =
        "CREA ACCOUNT";

    }

  }
);


// ============================================================
// LOGIN
// ============================================================


$("loginButton")?.addEventListener(
  "click",
  async () => {

    const phone =
      normalizePhone(
        $("phoneInput").value
      );


    const pin =
      $("pinInput").value.trim();


    if (
      !phone ||
      !pin
    ) {

      showToast(
        "Inserisci numero e PIN",
        "error"
      );

      return;

    }


    const button =
      $("loginButton");


    button.disabled = true;

    button.textContent =
      "ACCESSO...";


    try {

      const email =
        createEmailFromPhone(phone);


      const {
        data,
        error
      } =
        await supabaseClient.auth.signInWithPassword({

          email: email,

          password: pin

        });


      if (error) throw error;


      currentUser =
        data.user;


      await connectOneSignalUser(phone);


      updateProfileUI();


      closeAuth();


      showToast(
        "Bentornato!"
      );


      $("phoneInput").value = "";

      $("pinInput").value = "";

    }


    catch (error) {

      console.error(
        "Errore login:",
        error
      );


      showToast(
        "Numero o PIN non corretti",
        "error"
      );

    }


    finally {

      button.disabled = false;

      button.textContent =
        "ACCEDI";

    }

  }
);


// ============================================================
// PROFILO
// ============================================================


function updateProfileUI() {

  const loginButton =
    $("loginProfileButton");


  const logoutButton =
    $("logoutButton");


  if (!currentUser) {

    $("profileName").textContent =
      "Ospite";


    $("profilePhone").textContent =
      "Accedi per gestire il tuo profilo";


    $("profileInitial").textContent =
      "G";


    loginButton?.classList.remove("hidden");

    logoutButton?.classList.add("hidden");

    return;

  }


  const metadata =
    currentUser.user_metadata || {};


  const fullName =
    `${metadata.name || ""} ${metadata.surname || ""}`
      .trim();


  $("profileName").textContent =
    fullName || "Cliente";


  $("profilePhone").textContent =
    metadata.phone || "";


  $("profileInitial").textContent =
    fullName
      ? fullName.charAt(0).toUpperCase()
      : "C";


  loginButton?.classList.add("hidden");

  logoutButton?.classList.remove("hidden");

}


// ============================================================
// LOGOUT
// ============================================================


window.logoutUser =
  async function() {

    try {

      // LOGOUT ONESIGNAL

      if (
        window.OneSignalDeferred
      ) {

        window.OneSignalDeferred.push(
          async function(OneSignal) {

            try {

              await OneSignal.logout();

            }

            catch (error) {

              console.warn(
                error
              );

            }

          }
        );

      }


      await supabaseClient.auth.signOut();


      currentUser = null;


      updateProfileUI();


      showToast(
        "Hai effettuato il logout"
      );


      showPage(
        "homePage"
      );

    }


    catch (error) {

      console.error(
        "Errore logout:",
        error
      );

    }

  };


// ============================================================
// INSTALLAZIONE APP
// ============================================================


window.showInstall = function() {

  $("installModal")
    ?.classList.remove("hidden");


  $("installModal")
    ?.classList.add("show");

};


window.closeInstall = function() {

  $("installModal")
    ?.classList.remove("show");


  $("installModal")
    ?.classList.add("hidden");

};


// ============================================================
// CONTROLLO SESSIONE
// ============================================================


async function checkSession() {

  try {

    const {
      data:
      {
        session
      }
    } =
      await supabaseClient.auth.getSession();


    if (
      session &&
      session.user
    ) {

      currentUser =
        session.user;


      const phone =
        currentUser.user_metadata?.phone;


      if (phone) {

        await connectOneSignalUser(
          phone
        );

      }

    }


    updateProfileUI();

  }


  catch (error) {

    console.error(
      "Errore controllo sessione:",
      error
    );

  }

}


// ============================================================
// CHIUSURA MODAL CLICCANDO FUORI
// ============================================================


document
  .querySelectorAll(".modal")
  .forEach(modal => {

    modal.addEventListener(
      "click",
      event => {

        if (
          event.target === modal
        ) {

          modal.classList.remove("show");

        }

      }
    );

  });


// ============================================================
// AVVIO APP
// ============================================================


document.addEventListener(
  "DOMContentLoaded",
  async () => {

    renderServices();

    renderCalendar();

    renderTimeSlots([]);

    updateBookingSummary();

    await checkSession();

  }
);
