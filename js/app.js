const SUPABASE_URL = "https://wxcdmtajcasnlohqkgmk.supabase.co";
const SUPABASE_KEY = "sb_publishable_bwjP-ihASijevvu7d6r5Ew_6JaWKSDP";

let supabaseClient = null;

try {
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );
  }
} catch (error) {
  console.error("Errore Supabase:", error);
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
  "19:00"
];


/* =========================================================
   VARIABILI GLOBALI
========================================================= */

let currentUser = null;

let selectedService = null;
let selectedDate = null;
let selectedTime = null;

let bookingViewDate = new Date();

let adminSelectedDate = null;
let adminViewDate = new Date();

let adminAppointments = [];

let toastTimer = null;


/* =========================================================
   AVVIO APP
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
        document.getElementById("loadingScreen");

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
   UTILITA
========================================================= */

function q(id) {

  return document.getElementById(id);

}


function normalizePhone(phone) {

  return String(phone || "")
    .replace(/[^0-9]/g, "");

}


function localDateString(date) {

  const year = date.getFullYear();

  const month =
    String(date.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(date.getDate())
      .padStart(2, "0");

  return `${year}-${month}-${day}`;

}


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


function formatShortDate(date) {

  if (!date) return "-";

  return new Date(
    date + "T12:00:00"
  ).toLocaleDateString(
    "it-IT",
    {
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );

}


function addMinutesToTime(time, minutes = 30) {

  const parts =
    String(time).split(":");

  const hours =
    Number(parts[0]);

  const mins =
    Number(parts[1]);

  const total =
    hours * 60 + mins + minutes;

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


function escapeHtml(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function isAdmin() {

  return Boolean(
    currentUser &&
    currentUser.role === "admin"
  );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message, type = "default") {

  const toast = q("toast");

  if (!toast) {

    alert(message);

    return;

  }

  toast.textContent = message;

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

      toast.classList.remove("show");

    }, 3500);

}


/* =========================================================
   NAVIGAZIONE PAGINE
========================================================= */

function showPage(pageId) {

  if (
    pageId === "adminPage" &&
    !isAdmin()
  ) {

    showToast(
      "Accesso riservato all'amministratore",
      "error"
    );

    return;

  }


  document
    .querySelectorAll(".page")
    .forEach(page => {

      page.classList.toggle(
        "active",
        page.id === pageId
      );

    });


  document
    .querySelectorAll(".bottom-nav button")
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


  if (pageId === "appointmentsPage") {

    loadUserBookings();

  }


  if (pageId === "profilePage") {

    updateUserInterface();

  }


  if (pageId === "bookingPage") {

    renderBookingCalendar();

    loadAvailableTimes();

  }


  if (pageId === "adminPage") {

    openAdminAgenda();

  }

}


/* =========================================================
   SERVIZI
========================================================= */

function renderServices() {

  const container = q("services");

  if (!container) return;


  container.innerHTML =
    services
      .map(service => {

        return `
          <button
            type="button"
            class="service-card ${
              selectedService &&
              selectedService.id === service.id
                ? "selected"
                : ""
            }"
            data-service="${service.id}"
          >

            <span class="service-name">
              ${service.name}
            </span>

            <strong class="service-price">
              €${service.price}
            </strong>

          </button>
        `;

      })
      .join("");


  container
    .querySelectorAll(".service-card")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          selectedService =
            services.find(
              service =>
                service.id ===
                button.dataset.service
            );

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

        if (previousMonth >= currentMonth) {

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
   CALENDARIO PRENOTAZIONE CLIENTE
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

  loadAvailableTimes();

  updateSummary();

}


function renderBookingCalendar() {

  const calendar =
    q("bookingCalendar");

  const title =
    q("bookingMonthTitle");

  if (!calendar || !title) return;


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
    ).format(bookingViewDate);


  const firstDay =
    new Date(
      year,
      month,
      1
    );


  const startOffset =
    (firstDay.getDay() + 6) % 7;


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


  calendar.innerHTML = html;


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

          selectedTime = null;

          renderBookingCalendar();

          await loadAvailableTimes();

          updateSummary();

        }
      );

    });

}


/* =========================================================
   CARICA ORARI DISPONIBILI
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
    q("selectedBookingDateLabel");


  if (dateLabel) {

    dateLabel.textContent =
      selectedDate
        ? formatDate(selectedDate)
        : "Seleziona un giorno";

  }


  if (
    !selectedDate ||
    !supabaseClient
  ) {

    setupTimeButtons([]);

    return;

  }


  let busyTimes = [];


  try {

    const {
      data: appointments,
      error: appointmentsError
    } = await supabaseClient
      .from("appointments")
      .select("start_time,status")
      .eq(
        "appointment_date",
        selectedDate
      );


    if (appointmentsError) {

      console.error(
        "Errore appuntamenti:",
        appointmentsError
      );

    }


    if (appointments) {

      appointments
        .filter(appointment => {

          return (
            appointment.status !== "cancelled" &&
            appointment.status !==
              "cancelled_by_admin"
          );

        })
        .forEach(appointment => {

          const time =
            String(
              appointment.start_time || ""
            ).slice(0, 5);

          if (time) {

            busyTimes.push(time);

          }

        });

    }


    const {
      data: blocks,
      error: blocksError
    } = await supabaseClient
      .from("availability_blocks")
      .select("*")
      .eq(
        "block_date",
        selectedDate
      );


    if (
      !blocksError &&
      blocks
    ) {

      blocks.forEach(block => {

        const blockTime =
          String(
            block.block_time || ""
          ).slice(0, 5);


        if (
          block.block_time === "ALL" ||
          block.block_time === "all"
        ) {

          busyTimes = [...TIMES];

        } else if (blockTime) {

          busyTimes.push(blockTime);

        }

      });

    }


  } catch (error) {

    console.error(
      "Errore caricamento orari:",
      error
    );

  }


  busyTimes =
    [...new Set(busyTimes)];


  setupTimeButtons(busyTimes);

}


function setupTimeButtons(busyTimes) {

  const container =
    q("timeSlots");

  if (!container) return;


  container
    .querySelectorAll(".time-slot")
    .forEach(button => {

      const time =
        button.dataset.time;


      if (
        busyTimes.includes(time)
      ) {

        button.disabled = true;

        button.classList.add("busy");

        return;

      }


      if (
        selectedTime === time
      ) {

        button.classList.add("selected");

      }


      button.addEventListener(
        "click",
        () => {

          selectedTime = time;


          container
            .querySelectorAll(".time-slot")
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
   RIEPILOGO PRENOTAZIONE
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
            selectedDate + "T12:00:00"
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
      selectedTime || "-";

  }


  if (priceElement) {

    priceElement.textContent =
      selectedService
        ? `€${selectedService.price}`
        : "€0";

  }

}


/* =========================================================
   ONESIGNAL COLLEGAMENTO UTENTE
========================================================= */

async function setupOneSignalUser() {

  if (
    !currentUser ||
    !currentUser.id
  ) return;


  window.OneSignalDeferred =
    window.OneSignalDeferred || [];


  window.OneSignalDeferred.push(
    async function(OneSignal) {

      try {

        await OneSignal.login(
          String(currentUser.id)
        );

      } catch (error) {

        console.error(
          "Errore collegamento OneSignal:",
          error
        );

      }

    }
  );

}


async function logoutOneSignalUser() {

  window.OneSignalDeferred =
    window.OneSignalDeferred || [];


  window.OneSignalDeferred.push(
    async function(OneSignal) {

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
   CONTROLLO NOTIFICHE
========================================================= */

async function requestOneSignalNotifications() {

  window.OneSignalDeferred =
    window.OneSignalDeferred || [];


  window.OneSignalDeferred.push(
    async function(OneSignal) {

      try {

        const isActive =
          Boolean(
            OneSignal.User &&
            OneSignal.User.PushSubscription &&
            OneSignal.User.PushSubscription.optedIn
          );


        if (isActive) {

          if (
            currentUser &&
            currentUser.id
          ) {

            await OneSignal.login(
              String(currentUser.id)
            );

          }

          showToast(
            "Notifiche già attive",
            "success"
          );

          return;

        }


        await OneSignal.Notifications
          .requestPermission();


        const nowActive =
          Boolean(
            OneSignal.User &&
            OneSignal.User.PushSubscription &&
            OneSignal.User.PushSubscription.optedIn
          );


        if (nowActive) {

          if (
            currentUser &&
            currentUser.id
          ) {

            await OneSignal.login(
              String(currentUser.id)
            );

          }

          showToast(
            "Notifiche attivate con successo",
            "success"
          );

        } else {

          const permission =
            OneSignal.Notifications.permission;


          if (permission === "denied") {

            showToast(
              "Permesso notifiche non concesso. Puoi attivarle dalle impostazioni del dispositivo.",
              "error"
            );

          } else {

            showToast(
              "Notifiche non ancora attive",
              "default"
            );

          }

        }


      } catch (error) {

        console.error(
          "Errore notifiche:",
          error
        );

        showToast(
          "Impossibile verificare le notifiche",
          "error"
        );

      }

    }
  );

}


/* =========================================================
   INVIO NOTIFICA GENERICA
========================================================= */

async function sendBookingNotification(
  userId,
  phone,
  title,
  message,
  type
) {

  try {

    if (!supabaseClient) {

      return false;

    }


    const cleanPhone =
      normalizePhone(phone);


    try {

      await supabaseClient
        .from("notifications")
        .insert([
          {
            customer_phone: cleanPhone,
            title: String(title || ""),
            message: String(message || ""),
            type: String(type || "general"),
            read: false
          }
        ]);

    } catch (error) {

      console.warn(
        "Errore salvataggio notifica:",
        error
      );

    }


    if (!userId) {

      return false;

    }


    const {
      data,
      error
    } = await supabaseClient
      .functions
      .invoke(
        "send-notification",
        {
          body: {
            user_ids: [
              String(userId)
            ],
            external_id:
              String(userId),
            customer_phone:
              cleanPhone,
            title:
              String(title),
            message:
              String(message),
            type:
              String(type)
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
      "Notifica inviata:",
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


/* =========================================================
   NOTIFICA ADMIN
========================================================= */

async function sendAdminNotification(
  booking,
  title,
  message,
  type
) {

  try {

    if (!supabaseClient) return;


    const {
      data: admins,
      error
    } = await supabaseClient
      .from("profiles")
      .select("id,customer_phone,role")
      .eq("role", "admin");


    if (error) {

      console.error(
        "Errore ricerca admin:",
        error
      );

      return;

    }


    if (!admins || admins.length === 0) {

      return;

    }


    for (const admin of admins) {

      await sendBookingNotification(
        admin.id,
        admin.customer_phone || "",
        title,
        message,
        type
      );

    }


  } catch (error) {

    console.error(
      "Errore notifica admin:",
      error
    );

  }

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


  if (!supabaseClient) {

    showToast(
      "Connessione Supabase non disponibile",
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

      button.disabled = true;

      button.textContent =
        "CONTROLLO DISPONIBILITÀ...";

    }


    const {
      data: existingAppointments,
      error: checkError
    } = await supabaseClient
      .from("appointments")
      .select("id,status")
      .eq(
        "appointment_date",
        selectedDate
      )
      .eq(
        "start_time",
        selectedTime
      );


    if (checkError) {

      throw checkError;

    }


    const alreadyBooked =
      (existingAppointments || [])
        .some(appointment => {

          return (
            appointment.status !== "cancelled" &&
            appointment.status !==
              "cancelled_by_admin"
          );

        });


    if (alreadyBooked) {

      showToast(
        "Questo orario è stato appena prenotato",
        "error"
      );

      selectedTime = null;

      await loadAvailableTimes();

      updateSummary();

      return;

    }


    if (button) {

      button.textContent =
        "PRENOTAZIONE IN CORSO...";

    }


    const bookingPayload = {

      customer_id:
        currentUser.id,

      customer_name:
        currentUser.customer_name,

      customer_phone:
        normalizePhone(
          currentUser.customer_phone
        ),

      appointment_date:
        selectedDate,

      start_time:
        selectedTime,

      end_time:
        addMinutesToTime(
          selectedTime,
          selectedService.duration || 30
        ),

      service_name:
        selectedService.name,

      service_price:
        selectedService.price,

      status:
        "confirmed"

    };


    const {
      data: booking,
      error: bookingError
    } = await supabaseClient
      .from("appointments")
      .insert([
        bookingPayload
      ])
      .select()
      .single();


    if (bookingError) {

      throw bookingError;

    }


    await sendBookingNotification(

      currentUser.id,

      currentUser.customer_phone,

      "Prenotazione confermata ✂️",

      `Il tuo appuntamento per ${selectedService.name} è confermato per ${formatDate(selectedDate)} alle ${selectedTime}.`,

      "booking_confirmed"

    );


    await sendAdminNotification(

      booking,

      "Nuova prenotazione ✂️",

      `${booking.customer_name || "Un cliente"} ha prenotato ${booking.service_name || "un servizio"} per il ${formatShortDate(booking.appointment_date)} alle ${String(booking.start_time).slice(0, 5)}.`,

      "admin_new_booking"

    );


    showToast(
      "Prenotazione confermata!",
      "success"
    );


    selectedService = null;

    selectedTime = null;


    renderServices();

    updateSummary();

    await loadAvailableTimes();


    setTimeout(() => {

      showPage(
        "appointmentsPage"
      );

    }, 700);


  } catch (error) {

    console.error(
      "Errore prenotazione:",
      error
    );


    let message =
      "Errore durante la prenotazione";


    if (error.code === "23505") {

      message =
        "Questo orario è già occupato";

    } else if (error.message) {

      message =
        error.message;

    }


    showToast(
      message,
      "error"
    );


  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        originalText ||
        "CONFERMA PRENOTAZIONE";

    }

  }

}


/* =========================================================
   APPUNTAMENTI CLIENTE
========================================================= */

async function loadUserBookings() {

  const container =
    q("bookingsList");


  if (!container) return;


  if (!currentUser) {

    container.innerHTML = `
      <div class="empty-state">
        <h3>Non hai effettuato l'accesso</h3>
        <p>Accedi per vedere e gestire i tuoi appuntamenti.</p>
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

    let {
      data,
      error
    } = await supabaseClient
      .from("appointments")
      .select("*")
      .eq(
        "customer_id",
        currentUser.id
      )
      .order(
        "appointment_date",
        {
          ascending: true
        }
      )
      .order(
        "start_time",
        {
          ascending: true
        }
      );


    if (error) {

      throw error;

    }


    if (!data || data.length === 0) {

      container.innerHTML = `
        <div class="empty-state">
          <h3>Nessuna prenotazione</h3>
          <p>Non hai ancora prenotato un appuntamento.</p>
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


    container.innerHTML =
      data
        .map(appointment => {

          const time =
            String(
              appointment.start_time || ""
            ).slice(0, 5);


          const isCancelled =
            appointment.status === "cancelled" ||
            appointment.status ===
              "cancelled_by_admin";


          return `
            <div class="appointment-card">

              <div class="appointment-date">

                <span>
                  ${formatShortDate(
                    appointment.appointment_date
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

                <span class="appointment-status
                  ${isCancelled ? "cancelled" : "confirmed"}
                ">
                  ${isCancelled ? "Annullato" : "Confermato"}
                </span>

              </div>

              ${
                !isCancelled &&
                appointment.appointment_date >= today
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

        })
        .join("");


  } catch (error) {

    console.error(
      "Errore appuntamenti:",
      error
    );


    container.innerHTML = `
      <div class="empty-state">
        <h3>Errore caricamento</h3>
        <p>Non è stato possibile caricare gli appuntamenti.</p>
      </div>
    `;

  }

}


/* =========================================================
   ANNULLA PRENOTAZIONE CLIENTE
========================================================= */

async function cancelBooking(bookingId) {

  if (!currentUser) return;


  const confirmed =
    confirm(
      "Vuoi davvero annullare questo appuntamento?"
    );


  if (!confirmed) return;


  try {

    const {
      data: booking,
      error: bookingError
    } = await supabaseClient
      .from("appointments")
      .select("*")
      .eq("id", bookingId)
      .single();


    if (bookingError) {

      throw bookingError;

    }


    const {
      error
    } = await supabaseClient
      .from("appointments")
      .update({
        status: "cancelled"
      })
      .eq("id", bookingId);


    if (error) {

      throw error;

    }


    await sendBookingNotification(

      currentUser.id,

      currentUser.customer_phone,

      "Appuntamento annullato ❌",

      `Il tuo appuntamento del ${formatDate(booking.appointment_date)} alle ${String(booking.start_time).slice(0, 5)} è stato annullato.`,

      "booking_cancelled"

    );


    await sendAdminNotification(

      booking,

      "Appuntamento annullato ❌",

      `${booking.customer_name || "Un cliente"} ha annullato l'appuntamento del ${formatShortDate(booking.appointment_date)} alle ${String(booking.start_time).slice(0, 5)}.`,

      "admin_booking_cancelled"

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
      "Errore durante l'annullamento",
      "error"
    );

  }

}


/* =========================================================
   AGENDA ADMIN
========================================================= */

async function openAdminAgenda() {

  if (!isAdmin()) return;


  if (!adminSelectedDate) {

    adminSelectedDate =
      localDateString(
        new Date()
      );

  }


  adminViewDate =
    new Date(
      new Date(
        adminSelectedDate + "T12:00:00"
      ).getFullYear(),

      new Date(
        adminSelectedDate + "T12:00:00"
      ).getMonth(),

      1
    );


  renderAdminCalendar();

  await loadAdminAppointments();

}


/* =========================================================
   CARICA APPUNTAMENTI ADMIN
========================================================= */

async function loadAdminAppointments() {

  if (!isAdmin()) return;


  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("appointments")
      .select("*")
      .eq(
        "appointment_date",
        adminSelectedDate
      )
      .order(
        "start_time",
        {
          ascending: true
        }
      );


    if (error) {

      throw error;

    }


    adminAppointments =
      data || [];


    renderAdminDayAgenda();

    updateAdminStats();


  } catch (error) {

    console.error(
      "Errore agenda admin:",
      error
    );

  }

}
/* =========================================================
   CARICAMENTO ORARI DISPONIBILI
========================================================= */

async function loadAvailableTimes() {

  const container = q("timeSlots");

  if (!container) return;

  container.innerHTML = TIMES.map(time => `
    <button
      type="button"
      class="time-slot"
      data-time="${time}"
    >
      ${time}
    </button>
  `).join("");


  const dateLabel = q("selectedBookingDateLabel");

  if (dateLabel) {
    dateLabel.textContent = selectedDate
      ? formatDate(selectedDate)
      : "Seleziona un giorno";
  }


  if (!selectedDate || !supabaseClient) {
    setupTimeButtons([]);
    return;
  }


  let busyTimes = [];


  try {

    const {
      data: appointments,
      error
    } = await supabaseClient
      .from("appointments")
      .select("start_time,status")
      .eq("appointment_date", selectedDate);


    if (error) throw error;


    (appointments || []).forEach(appointment => {

      if (
        appointment.status !== "cancelled" &&
        appointment.status !== "cancelled_by_admin"
      ) {

        const time = String(
          appointment.start_time || ""
        ).slice(0, 5);

        if (time) {
          busyTimes.push(time);
        }

      }

    });

  } catch (error) {

    console.error(
      "Errore caricamento orari:",
      error
    );

  }


  busyTimes = [...new Set(busyTimes)];

  setupTimeButtons(busyTimes);

}


function setupTimeButtons(busyTimes) {

  const container = q("timeSlots");

  if (!container) return;


  container
    .querySelectorAll(".time-slot")
    .forEach(button => {

      const time = button.dataset.time;

      if (busyTimes.includes(time)) {

        button.disabled = true;
        button.classList.add("busy");

        return;

      }


      if (selectedTime === time) {
        button.classList.add("selected");
      }


      button.addEventListener("click", () => {

        selectedTime = time;

        container
          .querySelectorAll(".time-slot")
          .forEach(slot => {
            slot.classList.remove("selected");
          });

        button.classList.add("selected");

        updateSummary();

      });

    });

}


/* =========================================================
   RIEPILOGO PRENOTAZIONE
========================================================= */

function updateSummary() {

  const serviceElement = q("summaryService");
  const dateElement = q("summaryDate");
  const timeElement = q("summaryTime");
  const priceElement = q("summaryPrice");


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
            selectedDate + "T12:00:00"
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
    timeElement.textContent = selectedTime || "-";
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

  if (!currentUser || !currentUser.id) return;


  window.OneSignalDeferred =
    window.OneSignalDeferred || [];


  window.OneSignalDeferred.push(
    async function(OneSignal) {

      try {

        await OneSignal.login(
          String(currentUser.id)
        );

      } catch (error) {

        console.error(
          "Errore OneSignal login:",
          error
        );

      }

    }
  );

}


async function logoutOneSignalUser() {

  window.OneSignalDeferred =
    window.OneSignalDeferred || [];


  window.OneSignalDeferred.push(
    async function(OneSignal) {

      try {

        await OneSignal.logout();

      } catch (error) {

        console.warn(
          "Errore OneSignal logout:",
          error
        );

      }

    }
  );

}


async function requestOneSignalNotifications() {

  window.OneSignalDeferred =
    window.OneSignalDeferred || [];


  window.OneSignalDeferred.push(
    async function(OneSignal) {

      try {

        const optedIn =
          Boolean(
            OneSignal.User &&
            OneSignal.User.PushSubscription &&
            OneSignal.User.PushSubscription.optedIn
          );


        if (optedIn) {

          if (currentUser && currentUser.id) {

            await OneSignal.login(
              String(currentUser.id)
            );

          }

          showToast(
            "Notifiche già attive",
            "success"
          );

          return;

        }


        await OneSignal.Notifications
          .requestPermission();


        const nowActive =
          Boolean(
            OneSignal.User &&
            OneSignal.User.PushSubscription &&
            OneSignal.User.PushSubscription.optedIn
          );


        if (nowActive) {

          if (currentUser && currentUser.id) {

            await OneSignal.login(
              String(currentUser.id)
            );

          }

          showToast(
            "Notifiche attivate con successo",
            "success"
          );

        } else {

          const permission =
            OneSignal.Notifications.permission;


          if (permission === "denied") {

            showToast(
              "Le notifiche sono disattivate nelle impostazioni del dispositivo",
              "error"
            );

          } else {

            showToast(
              "Autorizzazione notifiche non completata",
              "default"
            );

          }

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
   INVIO NOTIFICHE
========================================================= */

async function sendBookingNotification(
  userId,
  phone,
  title,
  message,
  type
) {

  try {

    if (!supabaseClient) return false;


    const cleanPhone =
      normalizePhone(phone);


    try {

      await supabaseClient
        .from("notifications")
        .insert([
          {
            customer_phone: cleanPhone,
            title: String(title || ""),
            message: String(message || ""),
            type: String(type || "general"),
            read: false
          }
        ]);

    } catch (error) {

      console.warn(
        "Errore salvataggio notifica:",
        error
      );

    }


    if (!userId) return false;


    const {
      data,
      error
    } = await supabaseClient
      .functions
      .invoke(
        "send-notification",
        {
          body: {
            user_ids: [String(userId)],
            external_id: String(userId),
            customer_phone: cleanPhone,
            title: String(title || ""),
            message: String(message || ""),
            type: String(type || "general")
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


    return true;

  } catch (error) {

    console.error(
      "Errore invio notifica:",
      error
    );

    return false;

  }

}


/* =========================================================
   NOTIFICA ADMIN
========================================================= */

async function getAdmins() {

  if (!supabaseClient) return [];


  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("profiles")
      .select("id,customer_phone,role")
      .eq("role", "admin");


    if (error) throw error;

    return data || [];

  } catch (error) {

    console.error(
      "Errore ricerca admin:",
      error
    );

    return [];

  }

}


async function sendAdminBookingNotifications(booking) {

  const admins = await getAdmins();

  const dateText =
    new Date(
      booking.appointment_date + "T12:00:00"
    ).toLocaleDateString("it-IT");


  const timeText =
    String(booking.start_time || "")
      .slice(0, 5);


  for (const admin of admins) {

    await sendBookingNotification(

      admin.id,

      admin.customer_phone,

      "Nuova prenotazione ✂️",

      `${booking.customer_name || "Un cliente"} ha prenotato ${booking.service_name || "un servizio"} il ${dateText} alle ${timeText}.`,

      "admin_new_booking"

    );

  }

}


async function sendAdminCancellationNotifications(booking) {

  const admins = await getAdmins();

  const dateText =
    new Date(
      booking.appointment_date + "T12:00:00"
    ).toLocaleDateString("it-IT");


  const timeText =
    String(booking.start_time || "")
      .slice(0, 5);


  for (const admin of admins) {

    await sendBookingNotification(

      admin.id,

      admin.customer_phone,

      "Appuntamento annullato ❌",

      `${booking.customer_name || "Un cliente"} ha annullato l'appuntamento del ${dateText} alle ${timeText}.`,

      "admin_booking_cancelled"

    );

  }

}


async function sendAdminMoveNotifications(
  booking,
  oldDate,
  oldTime
) {

  const admins = await getAdmins();


  const oldDateText =
    new Date(
      oldDate + "T12:00:00"
    ).toLocaleDateString("it-IT");


  const newDateText =
    new Date(
      booking.appointment_date + "T12:00:00"
    ).toLocaleDateString("it-IT");


  const newTime =
    String(booking.start_time || "")
      .slice(0, 5);


  for (const admin of admins) {

    await sendBookingNotification(

      admin.id,

      admin.customer_phone,

      "Appuntamento spostato 🔄",

      `${booking.customer_name || "Un cliente"} ha spostato l'appuntamento dal ${oldDateText} alle ${oldTime} al ${newDateText} alle ${newTime}.`,

      "admin_booking_moved"

    );

  }

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


  if (!supabaseClient) {

    showToast(
      "Connessione non disponibile",
      "error"
    );

    return;

  }


  const button = q("confirmBooking");
  const originalText =
    button ? button.textContent : "";


  try {

    if (button) {

      button.disabled = true;
      button.textContent =
        "PRENOTAZIONE IN CORSO...";

    }


    const {
      data: existing,
      error: checkError
    } = await supabaseClient
      .from("appointments")
      .select("id,status")
      .eq(
        "appointment_date",
        selectedDate
      )
      .eq(
        "start_time",
        selectedTime
      );


    if (checkError) throw checkError;


    const alreadyBooked =
      (existing || []).some(item =>
        item.status !== "cancelled" &&
        item.status !== "cancelled_by_admin"
      );


    if (alreadyBooked) {

      showToast(
        "Questo orario è già occupato",
        "error"
      );

      selectedTime = null;

      await loadAvailableTimes();

      return;

    }


    const bookingPayload = {

      customer_id:
        currentUser.id,

      customer_name:
        currentUser.customer_name,

      customer_phone:
        normalizePhone(
          currentUser.customer_phone
        ),

      appointment_date:
        selectedDate,

      start_time:
        selectedTime,

      end_time:
        addMinutesToTime(
          selectedTime,
          selectedService.duration || 30
        ),

      service_name:
        selectedService.name,

      service_price:
        selectedService.price,

      status:
        "confirmed"

    };


    const {
      data: booking,
      error: bookingError
    } = await supabaseClient
      .from("appointments")
      .insert([bookingPayload])
      .select()
      .single();


    if (bookingError) throw bookingError;


    await sendBookingNotification(

      currentUser.id,

      currentUser.customer_phone,

      "Prenotazione confermata ✂️",

      `Il tuo appuntamento per ${selectedService.name} è confermato per ${formatDate(selectedDate)} alle ${selectedTime}.`,

      "booking_confirmed"

    );


    await sendAdminBookingNotifications(
      booking
    );


    showToast(
      "Prenotazione confermata!",
      "success"
    );


    selectedService = null;
    selectedTime = null;


    renderServices();
    updateSummary();


    setTimeout(() => {

      showPage(
        "appointmentsPage"
      );

    }, 700);


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

  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        originalText ||
        "CONFERMA PRENOTAZIONE";

    }

  }

}


/* =========================================================
   APPUNTAMENTI UTENTE
========================================================= */

async function loadUserBookings() {

  const container =
    q("bookingsList");

  if (!container) return;


  if (!currentUser) {

    container.innerHTML = `
      <div class="empty-state">
        <h3>Non hai effettuato l'accesso</h3>
        <p>Accedi per vedere i tuoi appuntamenti.</p>
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
    `<div class="empty-state">
      Caricamento appuntamenti...
    </div>`;


  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("appointments")
      .select("*")
      .eq(
        "customer_id",
        currentUser.id
      )
      .order(
        "appointment_date",
        {
          ascending: true
        }
      )
      .order(
        "start_time",
        {
          ascending: true
        }
      );


    if (error) throw error;


    if (!data || data.length === 0) {

      container.innerHTML = `
        <div class="empty-state">
          <h3>Nessuna prenotazione</h3>
          <p>Non hai ancora prenotato un appuntamento.</p>
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
      localDateString(new Date());


    container.innerHTML =
      data.map(appointment => {

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
          String(
            appointment.start_time || ""
          ).slice(0, 5);


        const isCancelled =
          appointment.status === "cancelled" ||
          appointment.status === "cancelled_by_admin";


        return `

          <div class="appointment-card">

            <div class="appointment-date">

              <span>${dateText}</span>

              <strong>${time}</strong>

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

              <span class="appointment-status ${
                isCancelled
                  ? "cancelled"
                  : "confirmed"
              }">

                ${
                  isCancelled
                    ? "Annullato"
                    : "Confermato"
                }

              </span>

            </div>

            ${
              !isCancelled &&
              appointment.appointment_date >= today
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

      }).join("");


  } catch (error) {

    console.error(error);

    container.innerHTML = `
      <div class="empty-state">
        <h3>Errore caricamento</h3>
        <p>Non è stato possibile caricare gli appuntamenti.</p>
      </div>
    `;

  }

}


/* =========================================================
   ANNULLA PRENOTAZIONE CLIENTE
========================================================= */

async function cancelBooking(bookingId) {

  if (!currentUser) return;


  if (
    !confirm(
      "Vuoi davvero annullare questo appuntamento?"
    )
  ) return;


  try {

    const {
      data: booking,
      error: bookingError
    } = await supabaseClient
      .from("appointments")
      .select("*")
      .eq("id", bookingId)
      .single();


    if (bookingError) throw bookingError;


    const {
      error
    } = await supabaseClient
      .from("appointments")
      .update({
        status: "cancelled"
      })
      .eq("id", bookingId);


    if (error) throw error;


    await sendBookingNotification(

      currentUser.id,

      currentUser.customer_phone,

      "Appuntamento annullato ❌",

      `Il tuo appuntamento del ${formatDate(booking.appointment_date)} alle ${String(booking.start_time).slice(0, 5)} è stato annullato.`,

      "booking_cancelled"

    );


    await sendAdminCancellationNotifications(
      booking
    );


    showToast(
      "Appuntamento annullato",
      "success"
    );


    await loadUserBookings();


  } catch (error) {

    console.error(error);

    showToast(
      "Errore durante l'annullamento",
      "error"
    );

  }

}


/* =========================================================
   AGENDA ADMIN
========================================================= */

async function loadAdminAgenda() {

  if (
    !currentUser ||
    currentUser.role !== "admin"
  ) return;


  const container =
    q("adminAgenda");

  if (!container) return;


  const dateInput =
    q("adminAgendaDate");


  const selectedAgendaDate =
    dateInput && dateInput.value
      ? dateInput.value
      : localDateString(new Date());


  if (dateInput && !dateInput.value) {
    dateInput.value = selectedAgendaDate;
  }


  container.innerHTML =
    `<div class="empty-state">
      Caricamento agenda...
    </div>`;


  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("appointments")
      .select("*")
      .eq(
        "appointment_date",
        selectedAgendaDate
      )
      .order(
        "start_time",
        {
          ascending: true
        }
      );


    if (error) throw error;


    const appointments =
      data || [];


    container.innerHTML =
      TIMES.map(time => {

        const appointment =
          appointments.find(item =>
            String(item.start_time)
              .slice(0, 5) === time &&
            item.status !== "cancelled" &&
            item.status !== "cancelled_by_admin"
          );


        if (appointment) {

          return `

            <div class="admin-slot booked">

              <div class="admin-slot-time">
                ${time}
              </div>

              <div class="admin-slot-info">

                <b>
                  ${escapeHtml(
                    appointment.customer_name ||
                    "Cliente"
                  )}
                </b>

                <small>
                  ${escapeHtml(
                    appointment.service_name ||
                    "Servizio"
                  )}
                </small>

                <small>
                  ${escapeHtml(
                    appointment.customer_phone ||
                    ""
                  )}
                </small>

              </div>

              <div class="admin-slot-actions">

                <button
                  onclick="adminMoveBooking('${appointment.id}')"
                >
                  SPOSTA
                </button>

                <button
                  class="admin-delete"
                  onclick="adminDeleteBooking('${appointment.id}')"
                >
                  ELIMINA
                </button>

              </div>

            </div>

          `;

        }


        return `

          <div class="admin-slot free">

            <div class="admin-slot-time">
              ${time}
            </div>

            <div class="admin-slot-info">
              <b>LIBERO</b>
              <small>Nessuna prenotazione</small>
            </div>

            <div class="admin-slot-actions">

              <button
                onclick="adminAddBooking('${selectedAgendaDate}','${time}')"
              >
                + CLIENTE
              </button>

            </div>

          </div>

        `;

      }).join("");


  } catch (error) {

    console.error(
      "Errore agenda admin:",
      error
    );

    container.innerHTML =
      `<div class="empty-state">
        Errore caricamento agenda
      </div>`;

  }

}


/* =========================================================
   ADMIN ELIMINA
========================================================= */

async function adminDeleteBooking(bookingId) {

  if (
    !confirm(
      "Vuoi eliminare questo appuntamento?"
    )
  ) return;


  try {

    const {
      data: booking,
      error: bookingError
    } = await supabaseClient
      .from("appointments")
      .select("*")
      .eq("id", bookingId)
      .single();


    if (bookingError) throw bookingError;


    const {
      error
    } = await supabaseClient
      .from("appointments")
      .update({
        status: "cancelled_by_admin"
      })
      .eq("id", bookingId);


    if (error) throw error;


    if (booking.customer_id) {

      await sendBookingNotification(

        booking.customer_id,

        booking.customer_phone,

        "Appuntamento annullato ❌",

        `Il tuo appuntamento del ${formatDate(booking.appointment_date)} alle ${String(booking.start_time).slice(0, 5)} è stato annullato dal salone.`,

        "booking_cancelled_by_admin"

      );

    }


    showToast(
      "Appuntamento eliminato",
      "success"
    );


    await loadAdminAgenda();


  } catch (error) {

    console.error(error);

    showToast(
      "Errore eliminazione",
      "error"
    );

  }

}


/* =========================================================
   ADMIN SPOSTA
========================================================= */

async function adminMoveBooking(bookingId) {

  try {

    const {
      data: booking,
      error
    } = await supabaseClient
      .from("appointments")
      .select("*")
      .eq("id", bookingId)
      .single();


    if (error) throw error;


    const newDate =
      prompt(
        "Nuova data (YYYY-MM-DD):",
        booking.appointment_date
      );


    if (!newDate) return;


    const newTime =
      prompt(
        "Nuovo orario (es. 15:30):",
        String(booking.start_time).slice(0, 5)
      );


    if (!newTime) return;


    if (!TIMES.includes(newTime)) {

      showToast(
        "Orario non valido",
        "error"
      );

      return;

    }


    const {
      data: occupied,
      error: occupiedError
    } = await supabaseClient
      .from("appointments")
      .select("id,status")
      .eq(
        "appointment_date",
        newDate
      )
      .eq(
        "start_time",
        newTime
      );


    if (occupiedError) throw occupiedError;


    const alreadyBusy =
      (occupied || []).some(item =>
        item.id !== booking.id &&
        item.status !== "cancelled" &&
        item.status !== "cancelled_by_admin"
      );


    if (alreadyBusy) {

      showToast(
        "Il nuovo orario è già occupato",
        "error"
      );

      return;

    }


    const oldDate =
      booking.appointment_date;

    const oldTime =
      String(booking.start_time).slice(0, 5);


    const {
      data: updatedBooking,
      error: updateError
    } = await supabaseClient
      .from("appointments")
      .update({
        appointment_date: newDate,
        start_time: newTime,
        end_time: addMinutesToTime(
          newTime,
          30
        )
      })
      .eq("id", bookingId)
      .select()
      .single();


    if (updateError) throw updateError;


    if (booking.customer_id) {

      await sendBookingNotification(

        booking.customer_id,

        booking.customer_phone,

        "Appuntamento spostato 🔄",

        `Il tuo appuntamento è stato spostato al ${formatDate(newDate)} alle ${newTime}.`,

        "booking_moved_by_admin"

      );

    }


    await sendAdminMoveNotifications(
      updatedBooking,
      oldDate,
      oldTime
    );


    showToast(
      "Appuntamento spostato",
      "success"
    );


    await loadAdminAgenda();


  } catch (error) {

    console.error(error);

    showToast(
      "Errore spostamento",
      "error"
    );

  }

}


/* =========================================================
   ADMIN AGGIUNGI CLIENTE A MANO
========================================================= */

async function adminAddBooking(date, time) {

  const name =
    prompt("Nome cliente:");

  if (!name) return;


  const phone =
    prompt("Numero telefono cliente:") || "";


  const service =
    prompt(
      "Servizio:",
      "Shampoo + Taglio"
    );


  if (!service) return;


  try {

    const {
      data: occupied,
      error: checkError
    } = await supabaseClient
      .from("appointments")
      .select("id,status")
      .eq(
        "appointment_date",
        date
      )
      .eq(
        "start_time",
        time
      );


    if (checkError) throw checkError;


    const busy =
      (occupied || []).some(item =>
        item.status !== "cancelled" &&
        item.status !== "cancelled_by_admin"
      );


    if (busy) {

      showToast(
        "Orario già occupato",
        "error"
      );

      return;

    }


    const serviceData =
      services.find(item =>
        item.name.toLowerCase() ===
        service.toLowerCase()
      );


    const {
      error
    } = await supabaseClient
      .from("appointments")
      .insert([{

        customer_id: null,

        customer_name: name,

        customer_phone:
          normalizePhone(phone),

        appointment_date: date,

        start_time: time,

        end_time:
          addMinutesToTime(time, 30),

        service_name: service,

        service_price:
          serviceData
            ? serviceData.price
            : 0,

        status: "confirmed"

      }]);


    if (error) throw error;


    showToast(
      "Cliente aggiunto all'agenda",
      "success"
    );


    await loadAdminAgenda();


  } catch (error) {

    console.error(error);

    showToast(
      "Errore aggiunta cliente",
      "error"
    );

  }

}


/* =========================================================
   LOGIN
========================================================= */

function openAuth() {

  const modal = q("authModal");

  if (modal) {
    modal.classList.remove("hidden");
  }

}


function closeAuth() {

  const modal = q("authModal");

  if (modal) {
    modal.classList.add("hidden");
  }

}


async function loginUser() {

  if (!supabaseClient) {

    showToast(
      "Supabase non disponibile",
      "error"
    );

    return;

  }


  const phone =
    normalizePhone(
      q("phoneInput").value
    );


  const pin =
    String(
      q("pinInput").value || ""
    ).trim();


  if (!phone || !pin) {

    showToast(
      "Inserisci numero e PIN",
      "error"
    );

    return;

  }


  const button = q("loginButton");


  try {

    if (button) {

      button.disabled = true;

      button.textContent =
        "ACCESSO IN CORSO...";

    }


    const {
      data,
      error
    } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("customer_phone", phone)
      .eq("customer_pin", pin)
      .maybeSingle();


    if (error) throw error;


    if (!data) {

      showToast(
        "Numero o PIN non corretto",
        "error"
      );

      return;

    }


    currentUser = data;

    saveUserSession(data);

    closeAuth();

    updateUserInterface();

    await setupOneSignalUser();


    showToast(
      `Bentornato ${data.customer_name || ""}`,
      "success"
    );


    if (data.role === "admin") {

      setTimeout(() => {
        loadAdminAgenda();
      }, 200);

    }


  } catch (error) {

    console.error(error);

    showToast(
      "Errore durante il login",
      "error"
    );

  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        "ACCEDI";

    }

  }

}


/* =========================================================
   REGISTRAZIONE
========================================================= */

function openRegister() {

  closeAuth();

  const modal = q("registerModal");

  if (modal) {
    modal.classList.remove("hidden");
  }

}


function closeRegister() {

  const modal = q("registerModal");

  if (modal) {
    modal.classList.add("hidden");
  }

}


async function handleRegistration() {

  if (!supabaseClient) return;


  const name =
    String(
      q("registerName").value || ""
    ).trim();


  const surname =
    String(
      q("registerSurname").value || ""
    ).trim();


  const phone =
    normalizePhone(
      q("registerPhone").value
    );


  const pin =
    String(
      q("registerPin").value || ""
    ).trim();


  const pin2 =
    String(
      q("registerPin2").value || ""
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


  if (phone.length < 8) {

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


  if (pin !== pin2) {

    showToast(
      "I PIN non coincidono",
      "error"
    );

    return;

  }


  try {

    const {
      data: existing
    } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq(
        "customer_phone",
        phone
      )
      .maybeSingle();


    if (existing) {

      showToast(
        "Questo numero è già registrato",
        "error"
      );

      return;

    }


    const fullName =
      `${name} ${surname}`;


    const {
      data,
      error
    } = await supabaseClient
      .from("profiles")
      .insert([{

        customer_name: fullName,

        customer_phone: phone,

        customer_pin: pin,

        role: "customer"

      }])
      .select()
      .single();


    if (error) throw error;


    currentUser = data;

    saveUserSession(data);

    closeRegister();

    updateUserInterface();

    await setupOneSignalUser();


    showToast(
      "Registrazione completata!",
      "success"
    );


  } catch (error) {

    console.error(error);

    showToast(
      error.message ||
      "Errore durante la registrazione",
      "error"
    );

  }

}


/* =========================================================
   SESSIONE
========================================================= */

function saveUserSession(user) {

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


  } catch (error) {

    console.warn(error);

  }

}


async function restoreSession() {

  try {

    const savedUser =
      localStorage.getItem("grimaldiUser") ||
      localStorage.getItem("igrimaldi_session");


    if (!savedUser) {

      updateUserInterface();

      return;

    }


    currentUser =
      JSON.parse(savedUser);


    updateUserInterface();


    await setupOneSignalUser();


    if (
      currentUser &&
      currentUser.role === "admin"
    ) {

      setTimeout(() => {
        loadAdminAgenda();
      }, 300);

    }


  } catch (error) {

    localStorage.removeItem(
      "grimaldiUser"
    );

    localStorage.removeItem(
      "igrimaldi_session"
    );

  }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutUser() {

  try {

    await logoutOneSignalUser();

    currentUser = null;


    localStorage.removeItem(
      "grimaldiUser"
    );


    localStorage.removeItem(
      "igrimaldi_session"
    );


    updateUserInterface();

    showPage("homePage");

    showToast(
      "Hai effettuato il logout",
      "success"
    );


  } catch (error) {

    console.error(error);

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
      nameElement.textContent = "Ospite";
    }

    if (phoneElement) {
      phoneElement.textContent =
        "Accedi per gestire il tuo profilo";
    }

    if (initialElement) {
      initialElement.textContent = "G";
    }

    if (loginButton) {
      loginButton.classList.remove("hidden");
    }

    if (logoutButton) {
      logoutButton.classList.add("hidden");
    }

    return;

  }


  const name =
    currentUser.customer_name ||
    "Cliente";


  if (nameElement) {
    nameElement.textContent = name;
  }


  if (phoneElement) {
    phoneElement.textContent =
      currentUser.customer_phone || "";
  }


  if (initialElement) {

    initialElement.textContent =
      name.charAt(0).toUpperCase();

  }


  if (loginButton) {
    loginButton.classList.add("hidden");
  }


  if (logoutButton) {
    logoutButton.classList.remove("hidden");
  }


  /* Mostra agenda solo agli admin */

  const adminSection =
    q("adminPage") ||
    q("adminAgendaSection");


  if (adminSection) {

    if (currentUser.role === "admin") {

      adminSection.classList.remove("hidden");

    } else {

      adminSection.classList.add("hidden");

    }

  }

}


/* =========================================================
   INSTALLAZIONE
========================================================= */

function showInstall() {

  const modal = q("installModal");

  if (modal) {
    modal.classList.remove("hidden");
  }

}


function closeInstall() {

  const modal = q("installModal");

  if (modal) {
    modal.classList.add("hidden");
  }

}


/* =========================================================
   COMPATIBILITÀ NOTIFICHE
========================================================= */

function requestNotifications() {

  requestOneSignalNotifications();

}


/* =========================================================
   ESPOSIZIONE FUNZIONI HTML
========================================================= */

window.showPage = showPage;

window.openAuth = openAuth;
window.closeAuth = closeAuth;

window.openRegister = openRegister;
window.closeRegister = closeRegister;

window.loginUser = loginUser;
window.handleRegistration = handleRegistration;

window.createBooking = createBooking;

window.loadUserBookings = loadUserBookings;

window.cancelBooking = cancelBooking;

window.logoutUser = logoutUser;

window.showInstall = showInstall;
window.closeInstall = closeInstall;

window.requestNotifications =
  requestNotifications;

window.enableGrimaldiPush =
  requestOneSignalNotifications;


/* AGENDA ADMIN */

window.loadAdminAgenda =
  loadAdminAgenda;

window.adminDeleteBooking =
  adminDeleteBooking;

window.adminMoveBooking =
  adminMoveBooking;

window.adminAddBooking =
  adminAddBooking;

/* =========================================================
   FINE PARTE 1
   LA PARTE 2 CONTINUA DA QUI
========================================================= */
