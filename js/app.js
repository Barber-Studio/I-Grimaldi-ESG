/* =========================================================
   I GRIMALDI
   APP.JS
   VERSIONE DIRETTA SUPABASE

   - Nessuna Edge Function
   - Login telefono + PIN
   - Prenotazioni
   - OneSignal
   - Agenda Admin
   - Orari fino alle 21:00
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  "https://wxcdmtajcasnlohqkgmk.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_bwjP-ihASijevvu7d6r5Ew_6JaWKSDP";

let supabaseClient = null;

try {
  if (
    window.supabase &&
    typeof window.supabase.createClient === "function"
  ) {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );
  } else {
    console.error("Libreria Supabase non trovata.");
  }
} catch (error) {
  console.error("Errore inizializzazione Supabase:", error);
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
   STATO
========================================================= */

let currentUser = null;

let selectedService = null;
let selectedDate = null;
let selectedTime = null;

let bookingViewDate = new Date();

let adminAgendaDate = new Date();
let adminSelectedDate = null;

let toastTimer = null;

let oneSignalInitialized = false;


/* =========================================================
   AVVIO
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  injectAgendaStyles();

  renderServices();

  setupBookingCalendar();

  setupEvents();

  await restoreSession();

  updateAdminAgendaAccess();

  setTimeout(() => {

    const loading = q("loadingScreen");

    if (loading) {

      loading.style.opacity = "0";

      setTimeout(() => {
        loading.remove();
      }, 350);

    }

  }, 800);

});


/* =========================================================
   DOM
========================================================= */

function q(id) {
  return document.getElementById(id);
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

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
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
   ORARIO
========================================================= */

function normalizeTime(time) {

  if (!time) return "";

  return String(time).slice(0, 5);

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

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);

}


/* =========================================================
   PAGINE
========================================================= */

function showPage(pageId) {

  if (
    pageId === "adminAgendaPage" &&
    !isAdmin()
  ) {

    showToast(
      "Accesso non autorizzato",
      "error"
    );

    pageId = "homePage";

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


  if (pageId === "adminAgendaPage") {

    renderAdminAgenda();

  }

}


/* =========================================================
   SERVIZI
========================================================= */

function renderServices() {

  const container = q("services");

  if (!container) return;

  container.innerHTML = services.map(service => {

    const selected =
      selectedService &&
      selectedService.id === service.id;

    return `
      <button
        type="button"
        class="service-card ${selected ? "selected" : ""}"
        data-service="${escapeHtml(service.id)}"
      >
        <span class="service-name">
          ${escapeHtml(service.name)}
        </span>

        <strong class="service-price">
          €${service.price}
        </strong>
      </button>
    `;

  }).join("");


  container
    .querySelectorAll(".service-card")
    .forEach(button => {

      button.addEventListener("click", () => {

        selectedService =
          services.find(
            service =>
              service.id === button.dataset.service
          ) || null;

        renderServices();

        updateSummary();

      });

    });

}


/* =========================================================
   EVENTI
========================================================= */

function setupEvents() {

  q("confirmBooking")?.addEventListener(
    "click",
    createBooking
  );

  q("loginButton")?.addEventListener(
    "click",
    loginUser
  );

  q("registerButton")?.addEventListener(
    "click",
    handleRegistration
  );


  q("prevBookingMonth")?.addEventListener(
    "click",
    () => {

      const today = new Date();

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


  q("nextBookingMonth")?.addEventListener(
    "click",
    () => {

      bookingViewDate.setMonth(
        bookingViewDate.getMonth() + 1
      );

      renderBookingCalendar();

    }
  );


  q("adminPrevMonth")?.addEventListener(
    "click",
    () => {

      if (!isAdmin()) return;

      adminAgendaDate.setMonth(
        adminAgendaDate.getMonth() - 1
      );

      renderAdminAgenda();

    }
  );


  q("adminNextMonth")?.addEventListener(
    "click",
    () => {

      if (!isAdmin()) return;

      adminAgendaDate.setMonth(
        adminAgendaDate.getMonth() + 1
      );

      renderAdminAgenda();

    }
  );


  q("adminAddClientButton")?.addEventListener(
    "click",
    openAdminAddClient
  );

}


/* =========================================================
   CALENDARIO CLIENTE
========================================================= */

function setupBookingCalendar() {

  const today = new Date();

  today.setHours(0, 0, 0, 0);

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

  const calendar = q("bookingCalendar");
  const title = q("bookingMonthTitle");

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
    new Date(year, month, 1);

  const startOffset =
    (firstDay.getDay() + 6) % 7;

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();

  const todayString =
    localDateString(new Date());


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
   DISPONIBILITÀ ORARI
========================================================= */

async function loadAvailableTimes() {

  const container = q("timeSlots");

  if (!container) return;


  container.innerHTML =
    TIMES.map(time => `
      <button
        type="button"
        class="time-slot"
        data-time="${time}"
      >
        ${time}
      </button>
    `).join("");


  const dateLabel =
    q("selectedBookingDateLabel");


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
        );


    if (error) throw error;


    const occupied =
      (data || [])
        .filter(
          appointment =>
            appointment.status !== "cancelled" &&
            appointment.status !== "cancelled_by_admin"
        )
        .map(
          appointment =>
            normalizeTime(
              appointment.start_time
            )
        );


    const {
      data: blocks,
      error: blocksError
    } =
      await supabaseClient
        .from("availability_blocks")
        .select("block_time")
        .eq(
          "block_date",
          selectedDate
        );


    if (blocksError) throw blocksError;


    const blocked =
      (blocks || [])
        .map(block => {

          const value =
            String(
              block.block_time || ""
            ).toUpperCase();

          return value === "ALL"
            ? "ALL"
            : normalizeTime(
                block.block_time
              );

        });


    const busyTimes =
      blocked.includes("ALL")
        ? TIMES
        : [
            ...new Set([
              ...occupied,
              ...blocked
            ])
          ];


    setupTimeButtons(busyTimes);

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
   PULSANTI ORARI
========================================================= */

function setupTimeButtons(busyTimes) {

  const container = q("timeSlots");

  if (!container) return;


  const busy = new Set(busyTimes);


  container
    .querySelectorAll(".time-slot")
    .forEach(button => {

      const time =
        button.dataset.time;


      if (busy.has(time)) {

        button.disabled = true;

        button.classList.add("busy");

        return;

      }


      if (selectedTime === time) {

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
   ONESIGNAL
========================================================= */

/* =========================================================
   ONESIGNAL
========================================================= */

async function withOneSignal(callback) {
  return new Promise(resolve => {
    window.OneSignalDeferred =
      window.OneSignalDeferred || [];

    window.OneSignalDeferred.push(
      async function(OneSignal) {
        try {
          resolve(await callback(OneSignal));
        } catch (error) {
          console.error("OneSignal:", error);
          resolve(false);
        }
      }
    );
  });
}


async function setupOneSignalUser() {

  if (!currentUser || !currentUser.id) {
    return false;
  }

  return withOneSignal(async OneSignal => {

    await OneSignal.login(
      String(currentUser.id)
    );

    console.log(
      "OneSignal: utente associato:",
      currentUser.id
    );

    return true;
  });
}


async function requestOneSignalNotifications() {

  return withOneSignal(async OneSignal => {

    if (currentUser && currentUser.id) {
      try {
        await OneSignal.login(
          String(currentUser.id)
        );
      } catch (error) {
        console.warn("OneSignal login:", error);
      }
    }

    await OneSignal.Notifications.requestPermission();

    await new Promise(resolve =>
      setTimeout(resolve, 1500)
    );

    const push =
      OneSignal.User &&
      OneSignal.User.PushSubscription
        ? OneSignal.User.PushSubscription
        : null;

    console.log(
      "OneSignal PushSubscription:",
      push
    );

    if (push && push.optedIn === true) {

      console.log("✅ ONESIGNAL PUSH ATTIVA");

      showToast(
        "Notifiche attivate con successo",
        "success"
      );

      return true;
    }

    console.warn(
      "❌ OneSignal: subscription non attiva",
      push
    );

    showToast(
      "Notifiche non attive. Controlla i permessi.",
      "error"
    );

    return false;
  });
}


function requestNotifications() {
  requestOneSignalNotifications();
}


async function logoutOneSignalUser() {

  return withOneSignal(async OneSignal => {

    try {
      await OneSignal.logout();

      console.log(
        "OneSignal: logout effettuato"
      );

    } catch (error) {
      console.warn(
        "OneSignal logout:",
        error
      );
    }

    return true;
  });
}


/* =========================================================
   PRENOTAZIONE
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

      button.disabled = true;

      button.textContent =
        "PRENOTAZIONE IN CORSO...";

    }


    const {
      data: existing,
      error: checkError
    } =
      await supabaseClient
        .from("appointments")
        .select("id,status")
        .eq(
          "appointment_date",
          selectedDate
        )
        .eq(
          "start_time",
          selectedTime + ":00"
        );


    if (checkError) {
      throw checkError;
    }


    const alreadyBooked =
      (existing || [])
        .some(
          appointment =>
            appointment.status !==
              "cancelled" &&
            appointment.status !==
              "cancelled_by_admin"
        );


    if (alreadyBooked) {

      showToast(
        "Questo orario è appena stato prenotato",
        "error"
      );

      await loadAvailableTimes();

      return;

    }


    const endTime =
      addMinutesToTime(
        selectedTime,
        30
      );


    const {
      data,
      error
    } =
      await supabaseClient
        .from("appointments")
        .insert({
          customer_id:
            currentUser.id,

          customer_name:
            currentUser.customer_name,

          customer_phone:
            currentUser.customer_phone,

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
            "confirmed"
        })
        .select()
        .single();


    if (error) {

      if (
        error.code ===
        "23505"
      ) {

        throw new Error(
          "Questo orario è già stato prenotato."
        );

      }

      throw error;

    }


    console.log(
      "Prenotazione creata:",
      data
    );


    /*
      Manteniamo l'associazione OneSignal
      con l'utente corrente.
    */

    setupOneSignalUser();


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
        isAdmin()
          ? "adminAgendaPage"
          : "appointmentsPage"
      );

    }, 700);


    return data;


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

    const {
      data,
      error
    } =
      await supabaseClient
        .from("appointments")
        .select("*")
        .eq(
          "customer_phone",
          currentUser.customer_phone
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


    if (
      !data ||
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
        appointment =>
          appointment.appointment_date >= today &&
          appointment.status !== "cancelled" &&
          appointment.status !== "cancelled_by_admin"
      );


    const past =
      data.filter(
        appointment =>
          appointment.appointment_date < today ||
          appointment.status === "cancelled" ||
          appointment.status === "cancelled_by_admin"
      );


    const ordered = [
      ...upcoming,
      ...past
    ];


    container.innerHTML =
      ordered
        .map(appointment => {

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
            appointment.status === "cancelled" ||
            appointment.status === "cancelled_by_admin";


          return `
            <div class="appointment-card">

              <div class="appointment-date">

                <span>
                  ${escapeHtml(dateText)}
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
                  €${escapeHtml(
                    appointment.service_price
                  )}
                </p>

                <span
                  class="appointment-status ${
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
   CANCELLAZIONE CLIENTE
========================================================= */

async function cancelBooking(bookingId) {

  if (!currentUser) return;


  if (
    !confirm(
      "Vuoi davvero annullare questo appuntamento?"
    )
  ) {
    return;
  }


  try {

    const {
      error
    } =
      await supabaseClient
        .from("appointments")
        .update({
          status: "cancelled"
        })
        .eq(
          "id",
          Number(bookingId)
        )
        .eq(
          "customer_phone",
          currentUser.customer_phone
        );


    if (error) throw error;


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
   AUTH
========================================================= */

function openAuth() {

  const modal =
    q("authModal");

  if (modal) {
    modal.classList.remove("hidden");
  }

}


function closeAuth() {

  const modal =
    q("authModal");

  if (modal) {
    modal.classList.add("hidden");
  }

}


/* =========================================================
   LOGIN
========================================================= */

async function loginUser() {

  const phone =
    normalizePhone(
      q("phoneInput")?.value || ""
    );


  const pin =
    String(
      q("pinInput")?.value || ""
    ).trim();


  if (!phone || !pin) {

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

      button.disabled = true;

      button.textContent =
        "ACCESSO IN CORSO...";

    }


    const {
      data,
      error
    } =
      await supabaseClient
        .from("profiles")
        .select("*")
        .eq(
          "customer_phone",
          phone
        )
        .eq(
          "customer_pin",
          pin
        )
        .limit(1);


    if (error) throw error;


    if (
      !data ||
      data.length === 0
    ) {

      throw new Error(
        "Numero di telefono o PIN non corretti."
      );

    }


    currentUser =
      data[0];


    saveUserSession(
      currentUser
    );


    closeAuth();

    updateUserInterface();

    updateAdminAgendaAccess();

    /*
      OneSignal viene associato all'utente
      senza bloccare il login.
    */

    setupOneSignalUser();


    showToast(
      `Bentornato ${
        currentUser.customer_name || ""
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

      button.disabled = false;

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
    modal.classList.remove("hidden");
  }

}


function closeRegister() {

  const modal =
    q("registerModal");

  if (modal) {
    modal.classList.add("hidden");
  }

}


async function handleRegistration() {

  const name =
    String(
      q("registerName")?.value || ""
    ).trim();


  const surname =
    String(
      q("registerSurname")?.value || ""
    ).trim();


  const phone =
    normalizePhone(
      q("registerPhone")?.value || ""
    );


  const pin =
    String(
      q("registerPin")?.value || ""
    ).trim();


  const pin2 =
    String(
      q("registerPin2")?.value || ""
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


  const button =
    q("registerButton");


  const originalText =
    button
      ? button.textContent
      : "";


  try {

    if (button) {

      button.disabled = true;

      button.textContent =
        "CREAZIONE ACCOUNT...";

    }


    const {
      data: existing,
      error: existingError
    } =
      await supabaseClient
        .from("profiles")
        .select("id")
        .eq(
          "customer_phone",
          phone
        )
        .limit(1);


    if (existingError) {
      throw existingError;
    }


    if (
      existing &&
      existing.length > 0
    ) {

      throw new Error(
        "Questo numero di telefono è già registrato."
      );

    }


    const {
      data,
      error
    } =
      await supabaseClient
        .from("profiles")
        .insert({
          customer_name:
            `${name} ${surname}`,

          customer_phone:
            phone,

          customer_pin:
            pin,

          role:
            "customer",

          is_admin:
            false
        })
        .select()
        .single();


    if (error) throw error;


    currentUser = data;


    saveUserSession(
      currentUser
    );


    closeRegister();

    updateUserInterface();

    updateAdminAgendaAccess();

    setupOneSignalUser();


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

      button.disabled = false;

      button.textContent =
        originalText ||
        "CREA ACCOUNT";

    }

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
      JSON.parse(savedUser);


    if (
      user &&
      user.id &&
      user.customer_phone &&
      user.customer_pin
    ) {

      currentUser = user;

      updateUserInterface();

      updateAdminAgendaAccess();

      setupOneSignalUser();

    } else {

      clearSession();

    }


  } catch (error) {

    console.warn(
      "Errore ripristino sessione:",
      error
    );

    clearSession();

  }

}


/* =========================================================
   PULISCI SESSIONE
========================================================= */

function clearSession() {

  localStorage.removeItem(
    "grimaldiUser"
  );

  localStorage.removeItem(
    "igrimaldi_session"
  );

  sessionStorage.removeItem(
    "grimaldiUser"
  );

  currentUser = null;

}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutUser() {

  await logoutOneSignalUser();

  clearSession();

  updateUserInterface();

  updateAdminAgendaAccess();

  showPage("homePage");

  showToast(
    "Hai effettuato il logout",
    "success"
  );

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

}


/* =========================================================
   INSTALLAZIONE
========================================================= */

function showInstall() {

  const modal =
    q("installModal");

  if (modal) {
    modal.classList.remove("hidden");
  }

}


function closeInstall() {

  const modal =
    q("installModal");

  if (modal) {
    modal.classList.add("hidden");
  }

}


/* =========================================================
   ADMIN
========================================================= */

function isAdmin() {

  if (!currentUser) {
    return false;
  }


  return (
    String(
      currentUser.role || ""
    ).toLowerCase() === "admin" ||
    currentUser.is_admin === true
  );

}


/* =========================================================
   ACCESSO AGENDA ADMIN
========================================================= */

function updateAdminAgendaAccess() {

  const navButton =
    q("appointmentsNavButton");

  const navLabel =
    q("appointmentsNavLabel");

  const navIcon =
    q("appointmentsNavIcon");


  if (!navButton) return;


  if (isAdmin()) {

    /*
      ADMIN:
      Appuntamenti -> Agenda
    */

    navButton.dataset.page =
      "adminAgendaPage";

    navButton.onclick = () =>
      showPage("adminAgendaPage");


    if (navLabel) {
      navLabel.textContent = "Agenda";
    }


    if (navIcon) {
      navIcon.textContent = "▣";
    }


    /*
      Se per errore era aperta la pagina
      Appuntamenti del cliente, portiamo
      l'admin sulla sua Agenda.
    */

    if (
      q("appointmentsPage")?.classList.contains(
        "active"
      )
    ) {

      showPage(
        "adminAgendaPage"
      );

    }


    return;

  }


  /*
    CLIENTE:
    Appuntamenti normale
  */

  navButton.dataset.page =
    "appointmentsPage";

  navButton.onclick = () =>
    showPage("appointmentsPage");


  if (navLabel) {
    navLabel.textContent =
      "Appuntamenti";
  }


  if (navIcon) {
    navIcon.textContent = "◷";
  }

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


  if (!calendar || !title) return;


  const year =
    adminAgendaDate.getFullYear();

  const month =
    adminAgendaDate.getMonth();


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
    (firstDay.getDay() + 6) % 7;


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
      <div class="admin-calendar-weekday">
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
      <div class="admin-calendar-empty"></div>
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
      date === adminSelectedDate;


    const isToday =
      date === today;


    html += `
      <button
        type="button"
        class="admin-calendar-day
          ${selected ? "selected" : ""}
          ${isToday ? "today" : ""}
        "
        data-admin-date="${date}"
      >
        <span>${day}</span>
      </button>
    `;

  }


  calendar.innerHTML = html;


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

          await renderAdminAgenda();

        }
      );

    });


  renderAdminAgendaDay();

}


/* =========================================================
   AGENDA GIORNO
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


  const title =
    q("adminSelectedDateTitle");


  if (title) {

    title.textContent =
      formatDate(
        adminSelectedDate
      );

  }


  container.innerHTML = `
    <div class="admin-loading">
      <div class="admin-spinner"></div>
      <span>Caricamento agenda...</span>
    </div>
  `;


  try {

    const {
      data: appointments,
      error
    } =
      await supabaseClient
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


    if (error) throw error;


    const {
      data: blocks,
      error: blocksError
    } =
      await supabaseClient
        .from("availability_blocks")
        .select("*")
        .eq(
          "block_date",
          adminSelectedDate
        );


    if (blocksError) throw blocksError;


    const appointmentList =
      appointments || [];

    const blockList =
      blocks || [];


    const blockedAll =
      blockList.some(
        block =>
          String(
            block.block_time
          ).toUpperCase() === "ALL"
      );


    const blockedTimes =
      new Set(
        blockList
          .filter(
            block =>
              String(
                block.block_time
              ).toUpperCase() !== "ALL"
          )
          .map(
            block =>
              normalizeTime(
                block.block_time
              )
          )
      );


    const activeAppointments =
      appointmentList.filter(
        appointment =>
          appointment.status !== "cancelled" &&
          appointment.status !== "cancelled_by_admin"
      );


    const countElement =
      activeAppointments.length;


    let html = `

      <div class="admin-agenda-summary">

        <div>
          <span>APPUNTAMENTI</span>
          <strong>${countElement}</strong>
        </div>

        <div>
          <span>DATA</span>
          <strong>
            ${new Date(
              adminSelectedDate +
              "T12:00:00"
            ).toLocaleDateString(
              "it-IT",
              {
                day: "2-digit",
                month: "2-digit"
              }
            )}
          </strong>
        </div>

      </div>

    `;


    for (
      const time of TIMES
    ) {

      const appointment =
        appointmentList.find(
          item =>
            normalizeTime(
              item.start_time
            ) === time &&
            item.status !== "cancelled" &&
            item.status !== "cancelled_by_admin"
        );


      const blocked =
        blockedAll ||
        blockedTimes.has(time);


      if (appointment) {

        html += `

          <div class="admin-slot booked">

            <div class="admin-slot-top">

              <div class="admin-slot-time">
                ${time}
              </div>

              <span class="admin-slot-status booked">
                PRENOTATO
              </span>

            </div>


            <div class="admin-client">

              <div class="admin-client-avatar">
                ${escapeHtml(
                  String(
                    appointment.customer_name ||
                    "C"
                  )
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>


              <div class="admin-client-data">

                <strong>
                  ${escapeHtml(
                    appointment.customer_name ||
                    "Cliente"
                  )}
                </strong>

                <span>
                  ${escapeHtml(
                    appointment.customer_phone ||
                    ""
                  )}
                </span>

                <span class="admin-service">
                  ${escapeHtml(
                    appointment.service_name ||
                    "Servizio"
                  )}
                  ·
                  €${escapeHtml(
                    appointment.service_price
                  )}
                </span>

              </div>

            </div>


            <button
              type="button"
              class="admin-action-danger"
              onclick="adminCancelBooking('${appointment.id}')"
            >
              ANNULLA PRENOTAZIONE
            </button>

          </div>

        `;

        continue;

      }


      if (blocked) {

        const block =
          blockList.find(
            item => {

              const blockTime =
                String(
                  item.block_time || ""
                ).toUpperCase();

              return (
                blockTime === "ALL" ||
                normalizeTime(
                  item.block_time
                ) === time
              );

            }
          );


        html += `

          <div class="admin-slot blocked">

            <div class="admin-slot-top">

              <div class="admin-slot-time">
                ${time}
              </div>

              <span class="admin-slot-status blocked">
                BLOCCATO
              </span>

            </div>


            <button
              type="button"
              class="admin-action-light"
              onclick="${
                block
                  ? `adminUnblockTime('${block.id}')`
                  : ""
              }"
            >
              SBLOCCA ORARIO
            </button>

          </div>

        `;

        continue;

      }


      html += `

        <div class="admin-slot free">

          <div class="admin-slot-top">

            <div class="admin-slot-time">
              ${time}
            </div>

            <span class="admin-slot-status free">
              LIBERO
            </span>

          </div>


          <button
            type="button"
            class="admin-action-block"
            onclick="adminBlockTime('${adminSelectedDate}', '${time}')"
          >
            BLOCCA
          </button>

        </div>

      `;

    }


    container.innerHTML =
      html;


  } catch (error) {

    console.error(
      "Errore agenda:",
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
   MODALE AGGIUNTA CLIENTE ADMIN
========================================================= */

function createAdminClientModal() {

  if (q("adminClientModal")) {
    return;
  }


  const modal =
    document.createElement("div");


  modal.id =
    "adminClientModal";


  modal.className =
    "modal hidden";


  modal.innerHTML = `

    <div class="admin-client-modal-box">

      <button
        type="button"
        class="close admin-modal-close"
        id="adminClientModalClose"
      >
        ×
      </button>


      <div class="admin-modal-kicker">
        AREA ADMIN
      </div>


      <h2>
        Nuovo appuntamento
      </h2>


      <p class="admin-modal-description">
        Inserisci i dati del cliente e assegna
        una fascia oraria libera.
      </p>


      <div class="admin-form-grid">

        <div class="admin-field">

          <label for="adminClientName">
            Nome
          </label>

          <input
            id="adminClientName"
            type="text"
            placeholder="Nome"
            autocomplete="given-name"
          >

        </div>


        <div class="admin-field">

          <label for="adminClientSurname">
            Cognome
          </label>

          <input
            id="adminClientSurname"
            type="text"
            placeholder="Cognome"
            autocomplete="family-name"
          >

        </div>

      </div>


      <div class="admin-field">

        <label for="adminClientPhone">
          Numero di telefono
        </label>

        <input
          id="adminClientPhone"
          type="tel"
          placeholder="Numero di telefono"
          autocomplete="tel"
        >

      </div>


      <div class="admin-field">

        <label for="adminClientService">
          Servizio
        </label>

        <select id="adminClientService">

          <option value="">
            Seleziona servizio
          </option>

          ${services.map(service => `
            <option
              value="${escapeHtml(service.id)}"
            >
              ${escapeHtml(service.name)}
              — €${service.price}
            </option>
          `).join("")}

        </select>

      </div>


      <div class="admin-form-grid">

        <div class="admin-field">

          <label for="adminClientDate">
            Data
          </label>

          <input
            id="adminClientDate"
            type="date"
          >

        </div>


        <div class="admin-field">

          <label for="adminClientTime">
            Orario
          </label>

          <select id="adminClientTime">

            <option value="">
              Seleziona orario
            </option>

            ${TIMES.map(time => `
              <option value="${time}">
                ${time}
              </option>
            `).join("")}

          </select>

        </div>

      </div>


      <div
        id="adminSelectedServicePreview"
        class="admin-service-preview"
      >
        Seleziona un servizio
      </div>


      <div class="admin-modal-actions">

        <button
          type="button"
          class="admin-cancel-button"
          id="adminClientCancel"
        >
          ANNULLA
        </button>

        <button
          type="button"
          class="gold-button admin-confirm-client"
          id="adminClientConfirm"
        >
          AGGIUNGI CLIENTE
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(modal);


  q("adminClientModalClose")
    ?.addEventListener(
      "click",
      closeAdminAddClient
    );


  q("adminClientCancel")
    ?.addEventListener(
      "click",
      closeAdminAddClient
    );


  modal.addEventListener(
    "click",
    event => {

      if (
        event.target === modal
      ) {

        closeAdminAddClient();

      }

    }
  );


  q("adminClientService")
    ?.addEventListener(
      "change",
      updateAdminServicePreview
    );


  q("adminClientDate")
    ?.addEventListener(
      "change",
      updateAdminClientTimes
    );


  q("adminClientConfirm")
    ?.addEventListener(
      "click",
      createAdminClient
    );

}


function openAdminAddClient() {

  if (!isAdmin()) {

    showToast(
      "Accesso non autorizzato",
      "error"
    );

    return;

  }


  createAdminClientModal();


  const modal =
    q("adminClientModal");


  const dateInput =
    q("adminClientDate");


  if (dateInput) {

    dateInput.value =
      adminSelectedDate ||
      localDateString(
        new Date()
      );

  }


  if (q("adminClientName")) {
    q("adminClientName").value = "";
  }

  if (q("adminClientSurname")) {
    q("adminClientSurname").value = "";
  }

  if (q("adminClientPhone")) {
    q("adminClientPhone").value = "";
  }

  if (q("adminClientService")) {
    q("adminClientService").value = "";
  }

  if (q("adminClientTime")) {
    q("adminClientTime").value = "";
  }


  updateAdminServicePreview();

  updateAdminClientTimes();


  modal.classList.remove("hidden");

}


function closeAdminAddClient() {

  const modal =
    q("adminClientModal");

  if (modal) {

    modal.classList.add(
      "hidden"
    );

  }

}


function updateAdminServicePreview() {

  const select =
    q("adminClientService");

  const preview =
    q("adminSelectedServicePreview");


  if (!select || !preview) return;


  const service =
    services.find(
      item =>
        item.id === select.value
    );


  if (!service) {

    preview.textContent =
      "Seleziona un servizio";

    return;

  }


  preview.innerHTML = `
    <span>
      ${escapeHtml(service.name)}
    </span>

    <strong>
      €${service.price}
    </strong>
  `;

}


async function updateAdminClientTimes() {

  const dateInput =
    q("adminClientDate");

  const timeSelect =
    q("adminClientTime");


  if (!dateInput || !timeSelect) return;


  const date =
    dateInput.value;


  timeSelect.innerHTML = `
    <option value="">
      Caricamento...
    </option>
  `;


  if (!date) {

    timeSelect.innerHTML = `
      <option value="">
        Seleziona orario
      </option>
    `;

    return;

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("appointments")
        .select(
          "start_time,status"
        )
        .eq(
          "appointment_date",
          date
        );


    if (error) throw error;


    const occupied =
      new Set(
        (data || [])
          .filter(
            item =>
              item.status !== "cancelled" &&
              item.status !== "cancelled_by_admin"
          )
          .map(
            item =>
              normalizeTime(
                item.start_time
              )
          )
      );


    const {
      data: blocks,
      error: blocksError
    } =
      await supabaseClient
        .from("availability_blocks")
        .select(
          "block_time"
        )
        .eq(
          "block_date",
          date
        );


    if (blocksError) {
      throw blocksError;
    }


    const blockList =
      blocks || [];


    const blockedAll =
      blockList.some(
        item =>
          String(
            item.block_time
          ).toUpperCase() === "ALL"
      );


    const blocked =
      new Set(
        blockList
          .map(
            item =>
              normalizeTime(
                item.block_time
              )
          )
      );


    timeSelect.innerHTML = `
      <option value="">
        Seleziona orario
      </option>

      ${TIMES.map(time => {

        const busy =
          occupied.has(time) ||
          blockedAll ||
          blocked.has(time);

        return `
          <option
            value="${time}"
            ${busy ? "disabled" : ""}
          >
            ${time}${busy ? " — non disponibile" : ""}
          </option>
        `;

      }).join("")}
    `;


  } catch (error) {

    console.error(
      "Errore orari admin:",
      error
    );


    timeSelect.innerHTML = `
      <option value="">
        Errore caricamento
      </option>
    `;

  }

}


async function createAdminClient() {

  if (!isAdmin()) {

    showToast(
      "Accesso non autorizzato",
      "error"
    );

    return;

  }


  const name =
    String(
      q("adminClientName")?.value || ""
    ).trim();


  const surname =
    String(
      q("adminClientSurname")?.value || ""
    ).trim();


  const phone =
    normalizePhone(
      q("adminClientPhone")?.value || ""
    );


  const serviceId =
    q("adminClientService")?.value ||
    "";


  const date =
    q("adminClientDate")?.value ||
    "";


  const time =
    q("adminClientTime")?.value ||
    "";


  if (
    !name ||
    !surname ||
    !phone ||
    !serviceId ||
    !date ||
    !time
  ) {

    showToast(
      "Compila tutti i campi",
      "error"
    );

    return;

  }


  if (phone.length < 8) {

    showToast(
      "Numero di telefono non valido",
      "error"
    );

    return;

  }


  if (!TIMES.includes(time)) {

    showToast(
      "Orario non valido",
      "error"
    );

    return;

  }


  const service =
    services.find(
      item =>
        item.id === serviceId
    );


  if (!service) {

    showToast(
      "Servizio non valido",
      "error"
    );

    return;

  }


  const button =
    q("adminClientConfirm");


  const originalText =
    button
      ? button.textContent
      : "";


  try {

    if (button) {

      button.disabled = true;

      button.textContent =
        "SALVATAGGIO...";

    }


    const {
      data: existing,
      error: checkError
    } =
      await supabaseClient
        .from("appointments")
        .select(
          "id,status"
        )
        .eq(
          "appointment_date",
          date
        )
        .eq(
          "start_time",
          time + ":00"
        );


    if (checkError) {
      throw checkError;
    }


    const occupied =
      (existing || [])
        .some(
          appointment =>
            appointment.status !== "cancelled" &&
            appointment.status !== "cancelled_by_admin"
        );


    if (occupied) {

      showToast(
        "Questo orario è già occupato",
        "error"
      );

      await updateAdminClientTimes();

      return;

    }


    const fullName =
      `${name} ${surname}`.trim();


    const {
      error
    } =
      await supabaseClient
        .from("appointments")
        .insert({
          customer_id: null,

          customer_name:
            fullName,

          customer_phone:
            phone,

          appointment_date:
            date,

          start_time:
            time,

          end_time:
            addMinutesToTime(
              time,
              30
            ),

          service_name:
            service.name,

          service_price:
            service.price,

          status:
            "confirmed"
        });


    if (error) {

      if (
        error.code ===
        "23505"
      ) {

        throw new Error(
          "Questo orario è già stato prenotato."
        );

      }

      throw error;

    }


    closeAdminAddClient();


    adminSelectedDate =
      date;


    adminAgendaDate =
      new Date(
        date +
        "T12:00:00"
      );


    showToast(
      "Cliente aggiunto all'agenda",
      "success"
    );


    renderAdminAgenda();


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


  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        originalText ||
        "AGGIUNGI CLIENTE";

    }

  }

}


/* =========================================================
   ANNULLA DA ADMIN
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

    const {
      error
    } =
      await supabaseClient
        .from("appointments")
        .update({
          status:
            "cancelled_by_admin"
        })
        .eq(
          "id",
          Number(bookingId)
        );


    if (error) throw error;


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
   BLOCCO ORARIO ADMIN
========================================================= */

async function adminBlockTime(
  date,
  time = "ALL"
) {

  if (!isAdmin()) return;


  try {

    /*
      Evita di bloccare una fascia già occupata.
    */

    if (time !== "ALL") {

      const {
        data: existing,
        error: checkError
      } =
        await supabaseClient
          .from("appointments")
          .select(
            "id,status"
          )
          .eq(
            "appointment_date",
            date
          )
          .eq(
            "start_time",
            time + ":00"
          );


      if (checkError) {
        throw checkError;
      }


      const occupied =
        (existing || [])
          .some(
            item =>
              item.status !== "cancelled" &&
              item.status !== "cancelled_by_admin"
          );


      if (occupied) {

        showToast(
          "Non puoi bloccare un orario già prenotato",
          "error"
        );

        return;

      }

    }


    const {
      error
    } =
      await supabaseClient
        .from("availability_blocks")
        .insert({
          block_date:
            date,

          block_time:
            time
        });


    if (error) throw error;


    showToast(
      "Orario bloccato",
      "success"
    );


    await renderAdminAgendaDay();


  } catch (error) {

    console.error(
      "Errore blocco:",
      error
    );


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

    const {
      error
    } =
      await supabaseClient
        .from("availability_blocks")
        .delete()
        .eq(
          "id",
          blockId
        );


    if (error) throw error;


    showToast(
      "Orario sbloccato",
      "success"
    );


    await renderAdminAgendaDay();


  } catch (error) {

    console.error(
      "Errore sblocco:",
      error
    );


    showToast(
      error.message ||
      "Errore sblocco orario",
      "error"
    );

  }

}


/* =========================================================
   AGGIUNTA MINUTI
========================================================= */

function addMinutesToTime(
  time,
  minutes
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
   CSS AGENDA
========================================================= */

function injectAgendaStyles() {

  if (q("igrimaldiAgendaStyles")) {
    return;
  }


  const style =
    document.createElement("style");


  style.id =
    "igrimaldiAgendaStyles";


  style.textContent = `

    /* =========================================
       AGENDA
    ========================================= */

    #adminAgendaPage {
      padding-bottom: 110px;
    }


    .admin-agenda-toolbar {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      margin:18px 0 20px;
      padding:12px;
      border:1px solid rgba(212,175,55,.20);
      border-radius:18px;
      background:
        linear-gradient(
          145deg,
          rgba(255,255,255,.055),
          rgba(255,255,255,.018)
        );
      box-shadow:
        0 12px 35px rgba(0,0,0,.20);
    }


    .admin-agenda-toolbar button {
      width:42px;
      height:42px;
      border-radius:13px;
      border:1px solid rgba(212,175,55,.35);
      background:rgba(212,175,55,.10);
      color:#d4af37;
      font-size:27px;
      line-height:1;
      cursor:pointer;
    }


    .admin-agenda-toolbar h3 {
      margin:0;
      text-align:center;
      text-transform:capitalize;
      font-family:"Playfair Display",serif;
      font-size:20px;
      color:#f3ead1;
    }


    .admin-calendar {
  display:grid;
  grid-template-columns:repeat(7, minmax(0, 1fr));
  gap:6px;
  width:100%;
}
      .admin-calendar-weekday {
  display:flex;
  align-items:center;
  justify-content:center;
  min-width:0;
  width:100%;
  height:30px;
  padding:0;
  white-space:nowrap;
  text-align:center;
  font-size:10px;
  letter-spacing:1px;
  color:rgba(255,255,255,.45);
  font-weight:700;

    }


    .admin-calendar-empty {
      min-height:48px;
    }


    .admin-calendar-day {
      min-height:48px;
      border-radius:14px;
      border:1px solid rgba(255,255,255,.08);
      background:rgba(255,255,255,.035);
      color:#fff;
      cursor:pointer;
      font-size:14px;
      transition:.18s ease;
    }


    .admin-calendar-day span {
      display:flex;
      align-items:center;
      justify-content:center;
      width:100%;
      height:100%;
    }


    .admin-calendar-day:active {
      transform:scale(.95);
    }


    .admin-calendar-day.today {
      border-color:rgba(212,175,55,.55);
    }


    .admin-calendar-day.selected {
      background:
        linear-gradient(
          145deg,
          rgba(212,175,55,.35),
          rgba(212,175,55,.12)
        );
      border-color:#d4af37;
      color:#f8e7a8;
      box-shadow:
        0 0 18px rgba(212,175,55,.14);
    }


    .admin-day-header {
      display:flex;
      align-items:flex-end;
      justify-content:space-between;
      gap:14px;
      margin:26px 0 16px;
    }


    .admin-day-header > div span {
      display:block;
      color:#d4af37;
      font-size:10px;
      letter-spacing:1.5px;
      font-weight:700;
    }


    .admin-day-header h3 {
      margin:5px 0 0;
      text-transform:capitalize;
      font-family:"Playfair Display",serif;
      font-size:20px;
    }


    .admin-day-header .gold-button {
      white-space:nowrap;
      padding:12px 15px;
      font-size:11px;
    }


    .admin-agenda-summary {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
      margin-bottom:14px;
    }


    .admin-agenda-summary > div {
      padding:14px;
      border-radius:16px;
      border:1px solid rgba(212,175,55,.18);
      background:rgba(255,255,255,.035);
    }


    .admin-agenda-summary span {
      display:block;
      font-size:9px;
      letter-spacing:1.3px;
      color:rgba(255,255,255,.45);
    }


    .admin-agenda-summary strong {
      display:block;
      margin-top:4px;
      font-size:18px;
      color:#e6c96b;
    }


    .admin-slot {
      margin-bottom:9px;
      padding:14px;
      border-radius:17px;
      border:1px solid rgba(255,255,255,.08);
      background:rgba(255,255,255,.035);
      transition:.18s ease;
    }


    .admin-slot.booked {
      border-color:rgba(212,175,55,.38);
      background:
        linear-gradient(
          145deg,
          rgba(212,175,55,.13),
          rgba(255,255,255,.035)
        );
    }


    .admin-slot.blocked {
      opacity:.72;
      background:rgba(255,255,255,.022);
    }


    .admin-slot.free {
      background:rgba(255,255,255,.025);
    }


    .admin-slot-top {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      margin-bottom:11px;
    }


    .admin-slot-time {
      font-family:"Cinzel",serif;
      font-size:20px;
      color:#f4e8c3;
      font-weight:700;
    }


    .admin-slot-status {
      font-size:9px;
      letter-spacing:1.1px;
      font-weight:800;
      padding:6px 9px;
      border-radius:999px;
    }


    .admin-slot-status.booked {
      color:#e6c96b;
      background:rgba(212,175,55,.13);
      border:1px solid rgba(212,175,55,.28);
    }


    .admin-slot-status.blocked {
      color:rgba(255,255,255,.50);
      background:rgba(255,255,255,.05);
    }


    .admin-slot-status.free {
      color:rgba(255,255,255,.45);
      background:rgba(255,255,255,.035);
    }


    .admin-client {
      display:flex;
      align-items:center;
      gap:11px;
      margin-bottom:12px;
    }


    .admin-client-avatar {
      width:44px;
      height:44px;
      flex:0 0 44px;
      display:flex;
      align-items:center;
      justify-content:center;
      border-radius:14px;
      color:#0a0a0c;
      background:
        linear-gradient(
          145deg,
          #ead17a,
          #b78b21
        );
      font-family:"Cinzel",serif;
      font-weight:800;
    }


    .admin-client-data {
      min-width:0;
      display:flex;
      flex-direction:column;
      gap:2px;
    }


    .admin-client-data strong {
      font-size:15px;
      color:#fff;
    }


    .admin-client-data span {
      font-size:12px;
      color:rgba(255,255,255,.58);
      overflow:hidden;
      text-overflow:ellipsis;
    }


    .admin-client-data .admin-service {
      color:#e6c96b;
      font-size:12px;
    }


    .admin-action-danger,
    .admin-action-block,
    .admin-action-light {
      width:100%;
      border-radius:12px;
      padding:11px 12px;
      font-size:10px;
      font-weight:800;
      letter-spacing:.8px;
      cursor:pointer;
    }


    .admin-action-danger {
      border:1px solid rgba(190,65,65,.35);
      background:rgba(190,65,65,.10);
      color:#e99a9a;
    }


    .admin-action-block {
      border:1px solid rgba(212,175,55,.20);
      background:rgba(212,175,55,.07);
      color:#d9bd63;
    }


    .admin-action-light {
      border:1px solid rgba(255,255,255,.10);
      background:rgba(255,255,255,.04);
      color:rgba(255,255,255,.62);
    }


    .admin-loading {
      display:flex;
      align-items:center;
      justify-content:center;
      gap:10px;
      padding:35px 10px;
      color:rgba(255,255,255,.55);
      font-size:12px;
    }


    .admin-spinner {
      width:16px;
      height:16px;
      border-radius:50%;
      border:2px solid rgba(255,255,255,.15);
      border-top-color:#d4af37;
      animation:igrimaldiSpin .8s linear infinite;
    }


    @keyframes igrimaldiSpin {
      to {
        transform:rotate(360deg);
      }
    }


    /* =========================================
       MODALE ADMIN
    ========================================= */

    #adminClientModal {
      z-index:9999;
      padding:18px;
      align-items:center;
      justify-content:center;
    }


    #adminClientModal:not(.hidden) {
      display:flex;
    }


    .admin-client-modal-box {
      width:min(100%, 520px);
      max-height:90vh;
      overflow:auto;
      position:relative;
      padding:25px 20px 20px;
      border-radius:24px;
      border:1px solid rgba(212,175,55,.25);
      background:
        radial-gradient(
          circle at top right,
          rgba(93,47,125,.22),
          transparent 38%
        ),
        linear-gradient(
          145deg,
          #111116,
          #08080b
        );
      box-shadow:
        0 30px 80px rgba(0,0,0,.65);
    }


    .admin-modal-close {
      position:absolute;
      top:10px;
      right:12px;
    }


    .admin-modal-kicker {
      color:#d4af37;
      font-size:9px;
      letter-spacing:1.8px;
      font-weight:800;
      margin-bottom:5px;
    }


    .admin-client-modal-box h2 {
      margin:0;
      font-family:"Playfair Display",serif;
      font-size:27px;
    }


    .admin-modal-description {
      margin:6px 0 20px;
      color:rgba(255,255,255,.55);
      font-size:12px;
      line-height:1.5;
    }


    .admin-form-grid {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
    }


    .admin-field {
      margin-bottom:12px;
    }


    .admin-field label {
      display:block;
      margin-bottom:6px;
      font-size:10px;
      letter-spacing:.8px;
      color:rgba(255,255,255,.52);
      text-transform:uppercase;
      font-weight:700;
    }


    .admin-field input,
    .admin-field select {
      width:100%;
      box-sizing:border-box;
      min-height:48px;
      padding:12px 13px;
      border-radius:13px;
      border:1px solid rgba(255,255,255,.10);
      outline:none;
      background:rgba(255,255,255,.045);
      color:#fff;
      font:inherit;
    }


    .admin-field input:focus,
    .admin-field select:focus {
      border-color:rgba(212,175,55,.55);
      box-shadow:
        0 0 0 3px rgba(212,175,55,.08);
    }


    .admin-field select option {
      background:#111116;
      color:#fff;
    }


    .admin-service-preview {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      padding:13px 14px;
      margin:2px 0 15px;
      border-radius:14px;
      border:1px solid rgba(212,175,55,.18);
      background:rgba(212,175,55,.06);
      color:rgba(255,255,255,.55);
      font-size:12px;
    }


    .admin-service-preview span {
      color:#e8dfc8;
    }


    .admin-service-preview strong {
      color:#e6c96b;
      font-size:16px;
    }


    .admin-modal-actions {
      display:grid;
      grid-template-columns:1fr 1.4fr;
      gap:9px;
    }


    .admin-cancel-button {
      min-height:48px;
      border-radius:13px;
      border:1px solid rgba(255,255,255,.10);
      background:rgba(255,255,255,.04);
      color:rgba(255,255,255,.65);
      font-size:10px;
      font-weight:800;
      cursor:pointer;
    }


    .admin-confirm-client {
      min-height:48px;
      padding:12px;
      font-size:10px;
    }


    @media (max-width:420px) {

      .admin-form-grid {
        grid-template-columns:1fr;
        gap:0;
      }

      .admin-client-modal-box {
        padding:23px 16px 16px;
      }

      .admin-day-header {
        align-items:stretch;
        flex-direction:column;
      }

      .admin-day-header .gold-button {
        width:100%;
      }

    }

  `;


  document.head.appendChild(
    style
  );

}


/* =========================================================
   ESPORTA FUNZIONI
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


/* =========================================================
   ADMIN
========================================================= */

window.adminCancelBooking =
  adminCancelBooking;

window.openAdminAddClient =
  openAdminAddClient;

window.closeAdminAddClient =
  closeAdminAddClient;

window.renderAdminAgenda =
  renderAdminAgenda;

window.adminBlockTime =
  adminBlockTime;

window.adminUnblockTime =
  adminUnblockTime;
