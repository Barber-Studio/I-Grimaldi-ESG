/* =========================================================
   I GRIMALDI
   APP.JS DEFINITIVO

   Compatibile con:
   - profiles
   - appointments
   - availability_blocks
   - notifications
   - Edge Function: igrimaldi-api

   Login: telefono + PIN
   ========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  "https://wxcdmtajcasnlohqkgmk.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_bwjP-ihASijevvu7d6r5Ew_6JaWKSDP";

const IGRIMALDI_API =
  `${SUPABASE_URL}/functions/v1/igrimaldi-api`;

let supabaseClient = null;

try {

  if (window.supabase) {

    supabaseClient =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );

  }

} catch (error) {

  console.error(
    "Errore inizializzazione Supabase:",
    error
  );

}


/* =========================================================
   SERVIZI
========================================================= */

const services = [

  {
    id: "shampoo_taglio",
    name: "Shampoo + Taglio",
    price: 20,
    duration: 30
  },

  {
    id: "shampoo",
    name: "Shampoo",
    price: 10,
    duration: 30
  },

  {
    id: "barba_5",
    name: "Barba 5€",
    price: 5,
    duration: 30
  },

  {
    id: "barba_10",
    name: "Barba 10€",
    price: 10,
    duration: 30
  },

  {
    id: "colore",
    name: "Colore",
    price: 20,
    duration: 30
  },

  {
    id: "colore_barba",
    name: "Colore Barba",
    price: 10,
    duration: 30
  },

  {
    id: "fiala",
    name: "Fiala",
    price: 5,
    duration: 30
  }

];


/* =========================================================
   ORARI
========================================================= */

const TIMES = [

  "09:00",
  "09:30",

  "10:00",
  "10:30",

  "11:00",
  "11:30",

  "12:00",
  "12:30",

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


/* =========================================================
   STATO APP
========================================================= */

let currentUser = null;

let selectedService = null;

let selectedDate = null;

let selectedTime = null;

let bookingViewDate = new Date();

let adminAgendaDate = new Date();

let adminSelectedDate = null;

let toastTimer = null;


/* =========================================================
   AVVIO
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    renderServices();

    setupBookingCalendar();

    setupEvents();

    await restoreSession();

    setTimeout(() => {

      const loading =
        q("loadingScreen");

      if (loading) {

        loading.style.opacity = "0";

        setTimeout(() => {

          loading.remove();

        }, 350);

      }

    }, 1000);

  }
);


/* =========================================================
   UTILITÀ DOM
========================================================= */

function q(id) {

  return document.getElementById(id);

}


/* =========================================================
   API EDGE FUNCTION
========================================================= */

async function igrimaldiAPI(
  action,
  payload = {}
) {

  try {

    const response =
      await fetch(
        IGRIMALDI_API,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_KEY
          },

          body: JSON.stringify({
            action,
            ...payload
          })
        }
      );


    let result = null;


    try {

      result =
        await response.json();

    } catch {

      throw new Error(
        "Risposta non valida dal server."
      );

    }


    if (
      !response.ok ||
      result?.ok === false
    ) {

      throw new Error(
        result?.error ||
        `Errore server (${response.status})`
      );

    }


    return result;


  } catch (error) {

    console.error(
      "I GRIMALDI API:",
      action,
      error
    );

    throw error;

  }

}


/* =========================================================
   TELEFONO
========================================================= */

function normalizePhone(phone) {

  return String(phone || "")
    .replace(/[^0-9]/g, "");

}


/* =========================================================
   DATA
========================================================= */

function localDateString(date) {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;

}


/* =========================================================
   FORMATTA DATA
========================================================= */

function formatDate(date) {

  if (!date) return "-";

  return new Date(
    date + "T12:00:00"
  ).toLocaleDateString(
    "it-IT",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );

}


/* =========================================================
   AGGIUNGI MINUTI
========================================================= */

function addMinutesToTime(
  time,
  minutes = 30
) {

  const parts =
    String(time).split(":");

  const hours =
    Number(parts[0]);

  const mins =
    Number(parts[1]);

  const total =
    hours * 60 +
    mins +
    minutes;

  const newHours =
    Math.floor(total / 60) % 24;

  const newMinutes =
    total % 60;

  return (
    String(newHours).padStart(2, "0") +
    ":" +
    String(newMinutes).padStart(2, "0")
  );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
  message,
  type = "default"
) {

  const toast =
    q("toast");

  if (!toast) {

    alert(message);

    return;

  }


  toast.textContent =
    message;

  toast.className = "";


  if (type) {

    toast.classList.add(type);

  }


  requestAnimationFrame(() => {

    toast.classList.add("show");

  });


  clearTimeout(toastTimer);


  toastTimer =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 3500);

}


/* =========================================================
   PAGINE
========================================================= */

function showPage(pageId) {

  document
    .querySelectorAll(".page")
    .forEach(page => {

      page.classList.toggle(
        "active",
        page.id === pageId
      );

    });


  document
    .querySelectorAll(
      ".bottom-nav button"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === pageId
      );

    });


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  if (
    pageId ===
    "appointmentsPage"
  ) {

    loadUserBookings();

  }


  if (
    pageId ===
    "profilePage"
  ) {

    updateUserInterface();

  }


  if (
    pageId ===
    "bookingPage"
  ) {

    renderBookingCalendar();

    loadAvailableTimes();

  }


  if (
    pageId ===
    "adminAgendaPage"
  ) {

    if (!isAdmin()) {

      showToast(
        "Accesso non autorizzato",
        "error"
      );

      showPage(
        "homePage"
      );

      return;

    }


    renderAdminAgenda();

  }

}


/* =========================================================
   SERVIZI
========================================================= */

function renderServices() {

  const container =
    q("services");

  if (!container) return;


  container.innerHTML =
    services
      .map(service => {

        const selected =
          selectedService &&
          selectedService.id ===
            service.id;


        return `

          <button
            type="button"
            class="service-card ${
              selected
                ? "selected"
                : ""
            }"
            data-service="${service.id}"
          >

            <span class="service-name">
              ${escapeHtml(
                service.name
              )}
            </span>

            <strong class="service-price">
              €${service.price}
            </strong>

          </button>

        `;

      })
      .join("");


  container
    .querySelectorAll(
      ".service-card"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          selectedService =
            services.find(
              service =>
                service.id ===
                button.dataset.service
            ) || null;


          renderServices();

          updateSummary();

        }
      );

    });

}


/* =========================================================
   EVENTI
========================================================= */

function setupEvents() {

  const confirmButton =
    q("confirmBooking");

  if (confirmButton) {

    confirmButton.addEventListener(
      "click",
      createBooking
    );

  }


  const loginButton =
    q("loginButton");

  if (loginButton) {

    loginButton.addEventListener(
      "click",
      loginUser
    );

  }


  const registerButton =
    q("registerButton");

  if (registerButton) {

    registerButton.addEventListener(
      "click",
      handleRegistration
    );

  }


  const prevMonth =
    q("prevBookingMonth");

  if (prevMonth) {

    prevMonth.addEventListener(
      "click",
      () => {

        const today =
          new Date();

        const currentMonth =
          new Date(
            today.getFullYear(),
            today.getMonth(),
            1
          );

        const previousMonth =
          new Date(
            bookingViewDate.getFullYear(),
            bookingViewDate.getMonth() - 1,
            1
          );


        if (
          previousMonth >=
          currentMonth
        ) {

          bookingViewDate.setMonth(
            bookingViewDate.getMonth() - 1
          );

          renderBookingCalendar();

        }

      }
    );

  }


  const nextMonth =
    q("nextBookingMonth");

  if (nextMonth) {

    nextMonth.addEventListener(
      "click",
      () => {

        bookingViewDate.setMonth(
          bookingViewDate.getMonth() + 1
        );

        renderBookingCalendar();

      }
    );

  }

}


/* =========================================================
   CALENDARIO CLIENTE
========================================================= */

function setupBookingCalendar() {

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );


  selectedDate =
    localDateString(today);


  bookingViewDate =
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );


  renderBookingCalendar();

  updateSummary();

}


/* =========================================================
   RENDER CALENDARIO CLIENTE
========================================================= */

function renderBookingCalendar() {

  const calendar =
    q("bookingCalendar");

  const title =
    q("bookingMonthTitle");


  if (
    !calendar ||
    !title
  ) return;


  const year =
    bookingViewDate.getFullYear();

  const month =
    bookingViewDate.getMonth();


  title.textContent =
    new Intl.DateTimeFormat(
      "it-IT",
      {
        month: "long",
        year: "numeric"
      }
    ).format(
      bookingViewDate
    );


  const firstDay =
    new Date(
      year,
      month,
      1
    );


  const startOffset =
    (
      firstDay.getDay() +
      6
    ) % 7;


  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  const todayString =
    localDateString(
      new Date()
    );


  let html = "";


  for (
    let i = 0;
    i < startOffset;
    i++
  ) {

    html += `
      <span class="calendar-empty"></span>
    `;

  }


  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const date =
      localDateString(
        new Date(
          year,
          month,
          day
        )
      );


    const isPast =
      date < todayString;

    const isSelected =
      date === selectedDate;

    const isToday =
      date === todayString;


    html += `

      <button
        type="button"
        class="calendar-day
          ${isPast ? "past" : ""}
          ${isSelected ? "selected" : ""}
          ${isToday ? "today" : ""}
        "
        data-date="${date}"
        ${isPast ? "disabled" : ""}
      >
        ${day}
      </button>

    `;

  }


  calendar.innerHTML =
    html;


  calendar
    .querySelectorAll(
      ".calendar-day:not(.past)"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          selectedDate =
            button.dataset.date;

          selectedTime =
            null;


          renderBookingCalendar();

          await loadAvailableTimes();

          updateSummary();

        }
      );

    });

}


/* =========================================================
   DISPONIBILITÀ ORARI
========================================================= */

async function loadAvailableTimes() {

  const container =
    q("timeSlots");

  if (!container) return;


  container.innerHTML =
    TIMES
      .map(time => {

        return `

          <button
            type="button"
            class="time-slot"
            data-time="${time}"
          >
            ${time}
          </button>

        `;

      })
      .join("");


  const dateLabel =
    q(
      "selectedBookingDateLabel"
    );


  if (dateLabel) {

    dateLabel.textContent =
      selectedDate
        ? formatDate(selectedDate)
        : "Seleziona un giorno";

  }


  if (!selectedDate) {

    setupTimeButtons([]);

    return;

  }


  try {

    const result =
      await igrimaldiAPI(
        "availability",
        {
          date:
            selectedDate
        }
      );


    const occupied =
      Array.isArray(
        result.occupied
      )
        ? result.occupied.map(
            normalizeTime
          )
        : [];


    const blocked =
      Array.isArray(
        result.blocked
      )
        ? result.blocked.map(
            normalizeTime
          )
        : [];


    const busyTimes = [
      ...new Set([
        ...occupied,
        ...blocked
      ])
    ];


    setupTimeButtons(
      busyTimes
    );


  } catch (error) {

    console.error(
      "Errore disponibilità:",
      error
    );


    setupTimeButtons([]);


    showToast(
      "Impossibile caricare gli orari",
      "error"
    );

  }

}


/* =========================================================
   NORMALIZZA ORARIO
========================================================= */

function normalizeTime(time) {

  const value =
    String(time || "");


  if (!value) return "";


  return value
    .slice(0, 5);

}


/* =========================================================
   PULSANTI ORARI
========================================================= */

function setupTimeButtons(
  busyTimes
) {

  const container =
    q("timeSlots");

  if (!container) return;


  const busy =
    new Set(
      busyTimes
    );


  container
    .querySelectorAll(
      ".time-slot"
    )
    .forEach(button => {

      const time =
        button.dataset.time;


      if (
        busy.has(time)
      ) {

        button.disabled =
          true;

        button.classList.add(
          "busy"
        );

        return;

      }


      if (
        selectedTime === time
      ) {

        button.classList.add(
          "selected"
        );

      }


      button.addEventListener(
        "click",
        () => {

          selectedTime =
            time;


          container
            .querySelectorAll(
              ".time-slot"
            )
            .forEach(slot => {

              slot.classList.remove(
                "selected"
              );

            });


          button.classList.add(
            "selected"
          );


          updateSummary();

        }
      );

    });

}


/* =========================================================
   RIEPILOGO
========================================================= */

function updateSummary() {

  const serviceElement =
    q("summaryService");

  const dateElement =
    q("summaryDate");

  const timeElement =
    q("summaryTime");

  const priceElement =
    q("summaryPrice");


  if (serviceElement) {

    serviceElement.textContent =
      selectedService
        ? selectedService.name
        : "Non selezionato";

  }


  if (dateElement) {

    dateElement.textContent =
      selectedDate
        ? new Date(
            selectedDate +
            "T12:00:00"
          ).toLocaleDateString(
            "it-IT",
            {
              day: "numeric",
              month: "short"
            }
          )
        : "-";

  }


  if (timeElement) {

    timeElement.textContent =
      selectedTime ||
      "-";

  }


  if (priceElement) {

    priceElement.textContent =
      selectedService
        ? `€${selectedService.price}`
        : "€0";

  }

}


/* =========================================================
   ONESIGNAL
========================================================= */

async function setupOneSignalUser() {

  if (
    !currentUser ||
    !currentUser.id
  ) {

    return;

  }


  window.OneSignalDeferred =
    window.OneSignalDeferred ||
    [];


  window.OneSignalDeferred.push(
    async function (
      OneSignal
    ) {

      try {

        await OneSignal.login(
          String(
            currentUser.id
          )
        );


        console.log(
          "OneSignal collegato:",
          currentUser.id
        );


      } catch (error) {

        console.error(
          "Errore OneSignal:",
          error
        );

      }

    }
  );

}


async function logoutOneSignalUser() {

  window.OneSignalDeferred =
    window.OneSignalDeferred ||
    [];


  window.OneSignalDeferred.push(
    async function (
      OneSignal
    ) {

      try {

        await OneSignal.logout();

      } catch (error) {

        console.warn(
          "Errore logout OneSignal:",
          error
        );

      }

    }
  );

}


/* =========================================================
   RICHIESTA NOTIFICHE
========================================================= */

async function requestOneSignalNotifications() {

  window.OneSignalDeferred =
    window.OneSignalDeferred ||
    [];


  window.OneSignalDeferred.push(
    async function (
      OneSignal
    ) {

      try {

        await OneSignal.Notifications
          .requestPermission();


        const active =
          Boolean(
            OneSignal.User &&
            OneSignal.User.PushSubscription &&
            OneSignal.User.PushSubscription.optedIn
          );


        if (active) {

          if (
            currentUser &&
            currentUser.id
          ) {

            await OneSignal.login(
              String(
                currentUser.id
              )
            );

          }


          showToast(
            "Notifiche attivate con successo",
            "success"
          );

        } else {

          showToast(
            "Notifiche non attive",
            "error"
          );

        }


      } catch (error) {

        console.error(
          "Errore notifiche:",
          error
        );


        showToast(
          "Impossibile attivare le notifiche",
          "error"
        );

      }

    }
  );

}


/* =========================================================
   COMPATIBILITÀ
========================================================= */

function requestNotifications() {

  requestOneSignalNotifications();

}


/* =========================================================
   CREA PRENOTAZIONE
========================================================= */

async function createBooking() {

  if (!currentUser) {

    showToast(
      "Devi accedere prima di prenotare",
      "error"
    );

    openAuth();

    return;

  }


  if (!selectedService) {

    showToast(
      "Seleziona un servizio",
      "error"
    );

    return;

  }


  if (!selectedDate) {

    showToast(
      "Seleziona una data",
      "error"
    );

    return;

  }


  if (!selectedTime) {

    showToast(
      "Seleziona un orario",
      "error"
    );

    return;

  }


  const button =
    q("confirmBooking");


  const originalText =
    button
      ? button.textContent
      : "";


  try {

    if (button) {

      button.disabled =
        true;

      button.textContent =
        "PRENOTAZIONE IN CORSO...";

    }


    const result =
      await igrimaldiAPI(
        "create_booking",
        {

          phone:
            currentUser.customer_phone,

          pin:
            currentUser.customer_pin,

          date:
            selectedDate,

          start_time:
            selectedTime,

          service_name:
            selectedService.name

        }
      );


    const booking =
      result.appointment;


    showToast(
      "Prenotazione confermata!",
      "success"
    );


    /*
      La Edge Function ha già scritto
      l'appuntamento nel database.
    */

    selectedService =
      null;

    selectedTime =
      null;


    renderServices();

    updateSummary();

    await loadAvailableTimes();


    setTimeout(() => {

      showPage(
        "appointmentsPage"
      );

    }, 700);


    return booking;


  } catch (error) {

    console.error(
      "Errore prenotazione:",
      error
    );


    showToast(
      error.message ||
      "Errore durante la prenotazione",
      "error"
    );


    await loadAvailableTimes();


  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        originalText ||
        "CONFERMA PRENOTAZIONE";

    }

  }

}


/* =========================================================
   MIE PRENOTAZIONI
========================================================= */

async function loadUserBookings() {

  const container =
    q("bookingsList");


  if (!container) return;


  if (!currentUser) {

    container.innerHTML = `

      <div class="empty-state">

        <h3>
          Non hai effettuato l'accesso
        </h3>

        <p>
          Accedi per vedere e gestire i tuoi appuntamenti.
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


  container.innerHTML = `

    <div class="empty-state">
      Caricamento appuntamenti...
    </div>

  `;


  try {

    const result =
      await igrimaldiAPI(
        "my_appointments",
        {

          phone:
            currentUser.customer_phone,

          pin:
            currentUser.customer_pin

        }
      );


    const data =
      Array.isArray(
        result.appointments
      )
        ? result.appointments
        : [];


    if (
      data.length === 0
    ) {

      container.innerHTML = `

        <div class="empty-state">

          <h3>
            Nessuna prenotazione
          </h3>

          <p>
            Non hai ancora prenotato un appuntamento.
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


    const today =
      localDateString(
        new Date()
      );


    const upcoming =
      data.filter(
        appointment => {

          return (
            appointment.appointment_date >=
              today &&
            appointment.status !==
              "cancelled" &&
            appointment.status !==
              "cancelled_by_admin"
          );

        }
      );


    const past =
      data.filter(
        appointment => {

          return (
            appointment.appointment_date <
              today ||
            appointment.status ===
              "cancelled" ||
            appointment.status ===
              "cancelled_by_admin"
          );

        }
      );


    const ordered = [
      ...upcoming,
      ...past
    ];


    container.innerHTML =
      ordered
        .map(
          appointment => {

            const dateText =
              new Date(
                appointment.appointment_date +
                "T12:00:00"
              ).toLocaleDateString(
                "it-IT",
                {
                  weekday: "long",
                  day: "numeric",
                  month: "long"
                }
              );


            const time =
              normalizeTime(
                appointment.start_time
              );


            const cancelled =
              appointment.status ===
                "cancelled" ||
              appointment.status ===
                "cancelled_by_admin";


            return `

              <div class="appointment-card">

                <div class="appointment-date">

                  <span>
                    ${escapeHtml(
                      dateText
                    )}
                  </span>

                  <strong>
                    ${time}
                  </strong>

                </div>


                <div class="appointment-info">

                  <h3>
                    ${escapeHtml(
                      appointment.service_name
                    )}
                  </h3>

                  <p>
                    €${appointment.service_price}
                  </p>

                  <span
                    class="appointment-status
                    ${
                      cancelled
                        ? "cancelled"
                        : "confirmed"
                    }"
                  >
                    ${
                      cancelled
                        ? "Annullato"
                        : "Confermato"
                    }
                  </span>

                </div>


                ${
                  !cancelled &&
                  appointment.appointment_date >=
                    today
                    ? `

                      <button
                        class="danger-button"
                        onclick="cancelBooking('${appointment.id}')"
                      >
                        ANNULLA
                      </button>

                    `
                    : ""
                }

              </div>

            `;

          }
        )
        .join("");


  } catch (error) {

    console.error(
      "Errore caricamento appuntamenti:",
      error
    );


    container.innerHTML = `

      <div class="empty-state">

        <h3>
          Errore caricamento
        </h3>

        <p>
          ${escapeHtml(
            error.message ||
            "Non è stato possibile caricare gli appuntamenti."
          )}
        </p>

      </div>

    `;

  }

}


/* =========================================================
   ANNULLA PRENOTAZIONE CLIENTE
========================================================= */

async function cancelBooking(
  bookingId
) {

  if (!currentUser) return;


  if (
    !confirm(
      "Vuoi davvero annullare questo appuntamento?"
    )
  ) {

    return;

  }


  try {

    await igrimaldiAPI(
      "cancel_my_appointment",
      {

        phone:
          currentUser.customer_phone,

        pin:
          currentUser.customer_pin,

        id:
          Number(bookingId)

      }
    );


    showToast(
      "Appuntamento annullato",
      "success"
    );


    await loadUserBookings();


  } catch (error) {

    console.error(
      "Errore annullamento:",
      error
    );


    showToast(
      error.message ||
      "Errore durante l'annullamento",
      "error"
    );

  }

}


/* =========================================================
   LOGIN
========================================================= */

function openAuth() {

  const modal =
    q("authModal");

  if (modal) {

    modal.classList.remove(
      "hidden"
    );

  }

}


function closeAuth() {

  const modal =
    q("authModal");

  if (modal) {

    modal.classList.add(
      "hidden"
    );

  }

}


async function loginUser() {

  const phoneInput =
    q("phoneInput");

  const pinInput =
    q("pinInput");


  const phone =
    normalizePhone(
      phoneInput
        ? phoneInput.value
        : ""
    );


  const pin =
    String(
      pinInput
        ? pinInput.value
        : ""
    ).trim();


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
    q("loginButton");


  const originalText =
    button
      ? button.textContent
      : "";


  try {

    if (button) {

      button.disabled =
        true;

      button.textContent =
        "ACCESSO IN CORSO...";

    }


    console.log(
      "I GRIMALDI: login..."
    );


    const result =
      await igrimaldiAPI(
        "login",
        {
          phone,
          pin
        }
      );


    if (
      !result ||
      !result.user
    ) {

      throw new Error(
        "Risposta login non valida."
      );

    }


    /*
      Il PIN viene mantenuto nella sessione
      perché il sistema attuale usa autenticazione
      personalizzata telefono + PIN.
    */

    currentUser = {
      ...result.user,
      customer_pin: pin
    };


    saveUserSession(
      currentUser
    );


    closeAuth();

    updateUserInterface();


    await setupOneSignalUser();


    showToast(
      `Bentornato ${
        result.user.customer_name ||
        ""
      }`,
      "success"
    );


  } catch (error) {

    console.error(
      "Errore login:",
      error
    );


    showToast(
      error.message ||
      "Errore durante il login",
      "error"
    );


  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        originalText ||
        "ACCEDI";

    }

  }

}


/* =========================================================
   REGISTRAZIONE
========================================================= */

function openRegister() {

  closeAuth();


  const modal =
    q("registerModal");


  if (modal) {

    modal.classList.remove(
      "hidden"
    );

  }

}


function closeRegister() {

  const modal =
    q("registerModal");


  if (modal) {

    modal.classList.add(
      "hidden"
    );

  }

}


async function handleRegistration() {

  const name =
    String(
      q("registerName")?.value ||
      ""
    ).trim();


  const surname =
    String(
      q("registerSurname")?.value ||
      ""
    ).trim();


  const phone =
    normalizePhone(
      q("registerPhone")?.value ||
      ""
    );


  const pin =
    String(
      q("registerPin")?.value ||
      ""
    ).trim();


  const pin2 =
    String(
      q("registerPin2")?.value ||
      ""
    ).trim();


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
    phone.length < 8
  ) {

    showToast(
      "Inserisci un numero valido",
      "error"
    );

    return;

  }


  if (
    !/^[0-9]+$/.test(pin) ||
    pin.length < 4
  ) {

    showToast(
      "Il PIN deve contenere almeno 4 cifre",
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
    q("registerButton");


  const originalText =
    button
      ? button.textContent
      : "";


  try {

    if (button) {

      button.disabled =
        true;

      button.textContent =
        "CREAZIONE ACCOUNT...";

    }


    const result =
      await igrimaldiAPI(
        "register",
        {

          customer_name:
            `${name} ${surname}`,

          customer_phone:
            phone,

          customer_pin:
            pin

        }
      );


    if (
      !result ||
      !result.user
    ) {

      throw new Error(
        "Registrazione non completata."
      );

    }


    currentUser = {
      ...result.user,
      customer_pin: pin
    };


    saveUserSession(
      currentUser
    );


    closeRegister();

    updateUserInterface();


    await setupOneSignalUser();


    showToast(
      "Registrazione completata!",
      "success"
    );


  } catch (error) {

    console.error(
      "Errore registrazione:",
      error
    );


    showToast(
      error.message ||
      "Errore durante la registrazione",
      "error"
    );


  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        originalText ||
        "CREA ACCOUNT";

    }

  }

}


/* =========================================================
   SESSIONE
========================================================= */

function saveUserSession(
  user
) {

  try {

    const userData =
      JSON.stringify(user);


    localStorage.setItem(
      "grimaldiUser",
      userData
    );


    localStorage.setItem(
      "igrimaldi_session",
      userData
    );


    sessionStorage.setItem(
      "grimaldiUser",
      userData
    );


  } catch (error) {

    console.warn(
      "Errore salvataggio sessione:",
      error
    );

  }

}


async function restoreSession() {

  try {

    const savedUser =
      localStorage.getItem(
        "grimaldiUser"
      ) ||
      localStorage.getItem(
        "igrimaldi_session"
      ) ||
      sessionStorage.getItem(
        "grimaldiUser"
      );


    if (!savedUser) {

      updateUserInterface();

      return;

    }


    const user =
      JSON.parse(
        savedUser
      );


    if (
      user &&
      user.id &&
      user.customer_pin
    ) {

      currentUser =
        user;


      updateUserInterface();


      await setupOneSignalUser();


    } else {

      /*
        Vecchia sessione senza PIN.
        La cancelliamo perché non può essere
        utilizzata dalla nuova Edge Function.
      */

      localStorage.removeItem(
        "grimaldiUser"
      );

      localStorage.removeItem(
        "igrimaldi_session"
      );

      sessionStorage.removeItem(
        "grimaldiUser"
      );


      currentUser =
        null;


      updateUserInterface();

    }


  } catch (error) {

    console.warn(
      "Errore ripristino sessione:",
      error
    );


    localStorage.removeItem(
      "grimaldiUser"
    );

    localStorage.removeItem(
      "igrimaldi_session"
    );

    sessionStorage.removeItem(
      "grimaldiUser"
    );


    currentUser =
      null;


    updateUserInterface();

  }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutUser() {

  try {

    await logoutOneSignalUser();


    currentUser =
      null;


    localStorage.removeItem(
      "grimaldiUser"
    );

    localStorage.removeItem(
      "igrimaldi_session"
    );

    sessionStorage.removeItem(
      "grimaldiUser"
    );


    updateUserInterface();


    showPage(
      "homePage"
    );


    showToast(
      "Hai effettuato il logout",
      "success"
    );


  } catch (error) {

    console.error(
      "Errore logout:",
      error
    );

  }

}


/* =========================================================
   PROFILO
========================================================= */

function updateUserInterface() {

  const nameElement =
    q("profileName");

  const phoneElement =
    q("profilePhone");

  const initialElement =
    q("profileInitial");

  const loginButton =
    q("loginProfileButton");

  const logoutButton =
    q("logoutButton");


  if (!currentUser) {

    if (nameElement) {

      nameElement.textContent =
        "Ospite";

    }


    if (phoneElement) {

      phoneElement.textContent =
        "Accedi per gestire il tuo profilo";

    }


    if (initialElement) {

      initialElement.textContent =
        "G";

    }


    if (loginButton) {

      loginButton.classList.remove(
        "hidden"
      );

    }


    if (logoutButton) {

      logoutButton.classList.add(
        "hidden"
      );

    }


    updateAdminAgendaAccess();


    return;

  }


  const name =
    currentUser.customer_name ||
    "Cliente";


  const phone =
    currentUser.customer_phone ||
    "";


  if (nameElement) {

    nameElement.textContent =
      name;

  }


  if (phoneElement) {

    phoneElement.textContent =
      phone;

  }


  if (initialElement) {

    initialElement.textContent =
      name
        .charAt(0)
        .toUpperCase();

  }


  if (loginButton) {

    loginButton.classList.add(
      "hidden"
    );

  }


  if (logoutButton) {

    logoutButton.classList.remove(
      "hidden"
    );

  }


  updateAdminAgendaAccess();

}


/* =========================================================
   INSTALLAZIONE
========================================================= */

function showInstall() {

  const modal =
    q("installModal");


  if (modal) {

    modal.classList.remove(
      "hidden"
    );

  }

}


function closeInstall() {

  const modal =
    q("installModal");


  if (modal) {

    modal.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   ADMIN
========================================================= */

function isAdmin() {

  return Boolean(
    currentUser &&
    (
      String(
        currentUser.role ||
        ""
      ).toLowerCase() ===
      "admin" ||

      currentUser.is_admin ===
        true
    )
  );

}


/* =========================================================
   CREA PAGINA AGENDA
========================================================= */

function createAdminAgendaUI() {

  if (!isAdmin()) return;


  if (
    q("adminAgendaPage")
  ) {

    return;

  }


  const page =
    document.createElement(
      "section"
    );


  page.id =
    "adminAgendaPage";


  page.className =
    "page";


  page.innerHTML = `

    <div
      style="
        padding:20px;
        padding-bottom:120px;
      "
    >

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:10px;
          margin-bottom:20px;
        "
      >

        <div>

          <h1
            style="
              margin:0;
              font-size:28px;
            "
          >
            Agenda
          </h1>

          <p
            style="
              margin:5px 0 0;
              opacity:.7;
            "
          >
            Gestione appuntamenti
          </p>

        </div>

        <button
          type="button"
          id="adminAddClientButton"
          class="gold-button"
        >
          + AGGIUNGI CLIENTE
        </button>

      </div>


      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:10px;
          margin-bottom:15px;
        "
      >

        <button
          type="button"
          id="adminPrevMonth"
          class="gold-button"
        >
          ‹
        </button>


        <strong
          id="adminMonthTitle"
          style="
            text-transform:capitalize;
            font-size:20px;
            text-align:center;
          "
        ></strong>


        <button
          type="button"
          id="adminNextMonth"
          class="gold-button"
        >
          ›
        </button>

      </div>


      <div
        id="adminCalendar"
        style="
          display:grid;
          grid-template-columns:repeat(7,1fr);
          gap:6px;
          margin-bottom:25px;
        "
      ></div>


      <div
        id="adminAgendaDay"
      ></div>

    </div>

  `;


  document.body.appendChild(
    page
  );


  const prev =
    q("adminPrevMonth");


  if (prev) {

    prev.addEventListener(
      "click",
      () => {

        adminAgendaDate.setMonth(
          adminAgendaDate.getMonth() - 1
        );

        renderAdminAgenda();

      }
    );

  }


  const next =
    q("adminNextMonth");


  if (next) {

    next.addEventListener(
      "click",
      () => {

        adminAgendaDate.setMonth(
          adminAgendaDate.getMonth() + 1
        );

        renderAdminAgenda();

      }
    );

  }


  const add =
    q("adminAddClientButton");


  if (add) {

    add.addEventListener(
      "click",
      openAdminAddClient
    );

  }


  adminSelectedDate =
    adminSelectedDate ||
    localDateString(
      new Date()
    );


  renderAdminAgenda();

}


/* =========================================================
   ACCESSO AGENDA
========================================================= */

function updateAdminAgendaAccess() {

  const existing =
    q("adminAgendaPage");


  if (!isAdmin()) {

    if (existing) {

      existing.remove();

    }


    return;

  }


  createAdminAgendaUI();

  addAdminAgendaButton();

}


/* =========================================================
   PULSANTE AGENDA
========================================================= */

function addAdminAgendaButton() {

  if (!isAdmin()) return;


  if (
    q("adminAgendaButton")
  ) {

    return;

  }


  const profilePage =
    q("profilePage");


  if (!profilePage) return;


  const button =
    document.createElement(
      "button"
    );


  button.id =
    "adminAgendaButton";


  button.type =
    "button";


  button.className =
    "gold-button";


  button.textContent =
    "AGENDA ADMIN";


  button.style.marginTop =
    "15px";


  button.style.width =
    "100%";


  button.addEventListener(
    "click",
    () => {

      if (!isAdmin()) {

        showToast(
          "Accesso non autorizzato",
          "error"
        );

        return;

      }


      showPage(
        "adminAgendaPage"
      );

    }
  );


  profilePage.appendChild(
    button
  );

}


/* =========================================================
   CALENDARIO ADMIN
========================================================= */

function renderAdminAgenda() {

  if (!isAdmin()) return;


  const calendar =
    q("adminCalendar");

  const title =
    q("adminMonthTitle");


  if (
    !calendar ||
    !title
  ) {

    return;

  }


  const year =
    adminAgendaDate
      .getFullYear();

  const month =
    adminAgendaDate
      .getMonth();


  title.textContent =
    new Intl.DateTimeFormat(
      "it-IT",
      {
        month: "long",
        year: "numeric"
      }
    ).format(
      adminAgendaDate
    );


  const firstDay =
    new Date(
      year,
      month,
      1
    );


  const offset =
    (
      firstDay.getDay() +
      6
    ) % 7;


  const days =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  const today =
    localDateString(
      new Date()
    );


  let html = "";


  [
    "L",
    "M",
    "M",
    "G",
    "V",
    "S",
    "D"
  ].forEach(day => {

    html += `

      <div
        style="
          text-align:center;
          font-size:11px;
          opacity:.6;
          padding:5px;
        "
      >
        ${day}
      </div>

    `;

  });


  for (
    let i = 0;
    i < offset;
    i++
  ) {

    html += `
      <div></div>
    `;

  }


  for (
    let day = 1;
    day <= days;
    day++
  ) {

    const date =
      localDateString(
        new Date(
          year,
          month,
          day
        )
      );


    const selected =
      date ===
      adminSelectedDate;


    const isToday =
      date === today;


    html += `

      <button
        type="button"
        class="admin-calendar-day"
        data-admin-date="${date}"
        style="
          min-height:42px;
          border-radius:10px;
          border:1px solid rgba(255,255,255,.12);
          background:${
            selected
              ? "rgba(212,175,55,.25)"
              : "rgba(255,255,255,.05)"
          };
          color:inherit;
          cursor:pointer;
          ${
            isToday
              ? "font-weight:bold;"
              : ""
          }
        "
      >
        ${day}
      </button>

    `;

  }


  calendar.innerHTML =
    html;


  calendar
    .querySelectorAll(
      "[data-admin-date]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          adminSelectedDate =
            button.dataset.adminDate;


          renderAdminAgenda();

          await renderAdminAgendaDay();

        }
      );

    });


  renderAdminAgendaDay();

}


/* =========================================================
   AGENDA DEL GIORNO
========================================================= */

async function renderAdminAgendaDay() {

  if (!isAdmin()) return;


  const container =
    q("adminAgendaDay");


  if (!container) return;


  if (!adminSelectedDate) {

    adminSelectedDate =
      localDateString(
        new Date()
      );

  }


  container.innerHTML = `

    <div
      style="
        text-align:center;
        padding:20px;
      "
    >
      Caricamento agenda...
    </div>

  `;


  try {

    const result =
      await igrimaldiAPI(
        "admin_agenda",
        {

          phone:
            currentUser.customer_phone,

          pin:
            currentUser.customer_pin,

          date:
            adminSelectedDate

        }
      );


    const appointments =
      Array.isArray(
        result.appointments
      )
        ? result.appointments
        : [];


    const blocks =
      Array.isArray(
        result.blocks
      )
        ? result.blocks
        : [];


    const blockedAll =
      blocks.some(
        block =>
          String(
            block.block_time
          ).toUpperCase() ===
          "ALL"
      );


    const blockedTimes =
      new Set(
        blocks
          .filter(
            block =>
              String(
                block.block_time
              ).toUpperCase() !==
              "ALL"
          )
          .map(
            block =>
              normalizeTime(
                block.block_time
              )
          )
      );


    let html = `

      <div
        style="
          margin-bottom:15px;
        "
      >

        <h2
          style="
            margin:0;
            text-transform:capitalize;
          "
        >
          ${escapeHtml(
            formatDate(
              adminSelectedDate
            )
          )}
        </h2>

      </div>

    `;


    for (
      const time of TIMES
    ) {

      const appointment =
        appointments.find(
          item => {

            const itemTime =
              normalizeTime(
                item.start_time
              );


            const active =
              item.status !==
                "cancelled" &&
              item.status !==
                "cancelled_by_admin";


            return (
              itemTime === time &&
              active
            );

          }
        );


      const blocked =
        blockedAll ||
        blockedTimes.has(
          time
        );


      if (appointment) {

        html += `

          <div
            style="
              padding:15px;
              margin-bottom:8px;
              border-radius:12px;
              background:rgba(212,175,55,.12);
              border:1px solid rgba(212,175,55,.4);
            "
          >

            <div
              style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:8px;
              "
            >

              <strong>
                ${time}
              </strong>

              <span>
                CONFERMATO
              </span>

            </div>


            <div>

              <strong>
                ${escapeHtml(
                  appointment.customer_name ||
                  "Cliente"
                )}
              </strong>

              <br>

              <span>
                ${escapeHtml(
                  appointment.customer_phone ||
                  ""
                )}
              </span>

              <br>

              <span>
                ${escapeHtml(
                  appointment.service_name ||
                  "Servizio"
                )}
              </span>

              <br>

              <span>
                €${appointment.service_price}
              </span>

            </div>


            <button
              type="button"
              class="danger-button"
              style="
                margin-top:12px;
                width:100%;
              "
              onclick="
                adminCancelBooking(
                  '${appointment.id}'
                )
              "
            >
              ANNULLA
            </button>

          </div>

        `;


        continue;

      }


      if (blocked) {

        html += `

          <div
            style="
              padding:15px;
              margin-bottom:8px;
              border-radius:12px;
              background:rgba(255,255,255,.025);
              border:1px solid rgba(255,255,255,.06);
              display:flex;
              justify-content:space-between;
              align-items:center;
            "
          >

            <strong>
              ${time}
            </strong>

            <span
              style="
                opacity:.5;
              "
            >
              BLOCCATO
            </span>

          </div>

        `;


        continue;

      }


      html += `

        <div
          style="
            padding:15px;
            margin-bottom:8px;
            border-radius:12px;
            background:rgba(255,255,255,.04);
            border:1px solid rgba(255,255,255,.08);
            display:flex;
            justify-content:space-between;
            align-items:center;
          "
        >

          <strong>
            ${time}
          </strong>

          <span
            style="
              opacity:.55;
            "
          >
            LIBERO
          </span>

        </div>

      `;

    }


    container.innerHTML =
      html;


  } catch (error) {

    console.error(
      "Errore agenda admin:",
      error
    );


    container.innerHTML = `

      <div class="empty-state">

        <h3>
          Errore caricamento agenda
        </h3>

        <p>
          ${escapeHtml(
            error.message ||
            "Errore"
          )}
        </p>

      </div>

    `;

  }

}


/* =========================================================
   ANNULLAMENTO ADMIN
========================================================= */

async function adminCancelBooking(
  bookingId
) {

  if (!isAdmin()) {

    showToast(
      "Accesso non autorizzato",
      "error"
    );

    return;

  }


  if (
    !confirm(
      "Vuoi davvero annullare questa prenotazione?"
    )
  ) {

    return;

  }


  try {

    await igrimaldiAPI(
      "admin_cancel",
      {

        phone:
          currentUser.customer_phone,

        pin:
          currentUser.customer_pin,

        id:
          Number(bookingId)

      }
    );


    showToast(
      "Prenotazione annullata",
      "success"
    );


    await renderAdminAgendaDay();


  } catch (error) {

    console.error(
      "Errore annullamento admin:",
      error
    );


    showToast(
      error.message ||
      "Errore durante l'annullamento",
      "error"
    );

  }

}


/* =========================================================
   AGGIUNGI CLIENTE MANUALMENTE
========================================================= */

async function openAdminAddClient() {

  if (!isAdmin()) {

    showToast(
      "Accesso non autorizzato",
      "error"
    );

    return;

  }


  const name =
    prompt(
      "Nome e cognome del cliente:"
    );


  if (
    !name ||
    !name.trim()
  ) {

    return;

  }


  const phone =
    prompt(
      "Numero di telefono:"
    );


  if (
    !phone ||
    !phone.trim()
  ) {

    return;

  }


  const phoneClean =
    normalizePhone(
      phone
    );


  if (
    phoneClean.length < 8
  ) {

    showToast(
      "Numero di telefono non valido",
      "error"
    );

    return;

  }


  const serviceNames =
    services
      .map(
        (service, index) =>
          `${index + 1}. ${service.name} - €${service.price}`
      )
      .join("\n");


  const serviceChoice =
    prompt(
      `Scegli il servizio:\n\n${serviceNames}`
    );


  const serviceIndex =
    Number(
      serviceChoice
    ) - 1;


  if (
    !Number.isInteger(
      serviceIndex
    ) ||
    !services[
      serviceIndex
    ]
  ) {

    showToast(
      "Servizio non valido",
      "error"
    );

    return;

  }


  const service =
    services[
      serviceIndex
    ];


  const date =
    prompt(
      "Data appuntamento (AAAA-MM-GG):",
      adminSelectedDate ||
      localDateString(
        new Date()
      )
    );


  if (
    !date ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      date
    )
  ) {

    showToast(
      "Data non valida",
      "error"
    );

    return;

  }


  const time =
    prompt(
      `Inserisci l'orario:\n\n${TIMES.join("  ")}`
    );


  if (
    !TIMES.includes(
      time
    )
  ) {

    showToast(
      "Orario non valido",
      "error"
    );

    return;

  }


  try {

    await igrimaldiAPI(
      "admin_create",
      {

        phone:
          currentUser.customer_phone,

        pin:
          currentUser.customer_pin,

        customer_name:
          name.trim(),

        customer_phone:
          phoneClean,

        date:
          date,

        start_time:
          time,

        service_name:
          service.name

      }
    );


    showToast(
      "Cliente aggiunto all'agenda",
      "success"
    );


    adminSelectedDate =
      date;


    adminAgendaDate =
      new Date(
        date +
        "T12:00:00"
      );


    renderAdminAgenda();

    await renderAdminAgendaDay();


  } catch (error) {

    console.error(
      "Errore aggiunta cliente:",
      error
    );


    showToast(
      error.message ||
      "Errore durante l'aggiunta",
      "error"
    );

  }

}


/* =========================================================
   BLOCCO ORARIO ADMIN
========================================================= */

async function adminBlockTime(
  date,
  time = "ALL"
) {

  if (!isAdmin()) return;


  try {

    await igrimaldiAPI(
      "admin_block",
      {

        phone:
          currentUser.customer_phone,

        pin:
          currentUser.customer_pin,

        date,

        block_time:
          time

      }
    );


    showToast(
      "Orario bloccato",
      "success"
    );


    await renderAdminAgendaDay();


  } catch (error) {

    showToast(
      error.message ||
      "Errore blocco orario",
      "error"
    );

  }

}


/* =========================================================
   SBLOCCO ORARIO ADMIN
========================================================= */

async function adminUnblockTime(
  blockId
) {

  if (!isAdmin()) return;


  try {

    await igrimaldiAPI(
      "admin_unblock",
      {

        phone:
          currentUser.customer_phone,

        pin:
          currentUser.customer_pin,

        id:
          blockId

      }
    );


    showToast(
      "Orario sbloccato",
      "success"
    );


    await renderAdminAgendaDay();


  } catch (error) {

    showToast(
      error.message ||
      "Errore sblocco orario",
      "error"
    );

  }

}


/* =========================================================
   ESPOSIZIONE FUNZIONI HTML
========================================================= */

window.showPage =
  showPage;

window.openAuth =
  openAuth;

window.closeAuth =
  closeAuth;

window.openRegister =
  openRegister;

window.closeRegister =
  closeRegister;

window.loginUser =
  loginUser;

window.handleRegistration =
  handleRegistration;

window.createBooking =
  createBooking;

window.loadUserBookings =
  loadUserBookings;

window.cancelBooking =
  cancelBooking;

window.logoutUser =
  logoutUser;

window.showInstall =
  showInstall;

window.closeInstall =
  closeInstall;

window.requestNotifications =
  requestNotifications;

window.enableGrimaldiPush =
  requestOneSignalNotifications;


/* ADMIN */

window.adminCancelBooking =
  adminCancelBooking;

window.openAdminAddClient =
  openAdminAddClient;

window.renderAdminAgenda =
  renderAdminAgenda;

window.adminBlockTime =
  adminBlockTime;

window.adminUnblockTime =
  adminUnblockTime;
