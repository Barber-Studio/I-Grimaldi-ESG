/* =========================================================
   I GRIMALDI - APP
========================================================= */

const SUPABASE_URL = "https://wxcdmtajcasnlohqkgmk.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_bwjP-ihASijevvu7d6r5Ew_6JaWKSDP";


/* =========================================================
   SUPABASE
========================================================= */

let supabaseClient = null;

if (window.supabase) {
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
} else {
  alert("Errore: Supabase non è stato caricato.");
}


/* =========================================================
   CONFIG
========================================================= */

const ADMIN_PHONE = "3791415355";

const SERVICES = [
  { name: "Shampoo", price: 10 },
  { name: "Shampoo + Taglio", price: 20 },
  { name: "Barba 5€", price: 5 },
  { name: "Barba 10€", price: 10 },
  { name: "Colore", price: 20 },
  { name: "Colore Barba", price: 10 },
  { name: "Fiala", price: 5 }
];

const TIMES = [
  "09:00", "09:30",
  "10:00", "10:30",
  "11:00", "11:30",
  "12:00", "12:30",
  "13:00", "13:30",
  "14:00", "14:30",
  "15:00", "15:30",
  "16:00", "16:30",
  "17:00", "17:30",
  "18:00", "18:30",
  "19:00", "19:30",
  "20:00", "20:30",
  "21:00"
];


/* =========================================================
   STATO
========================================================= */

let currentUser = null;

let selectedService = null;
let selectedDate = null;
let selectedTime = null;
let busyTimes = [];

let bookingMonth = new Date();

let adminMonth = new Date();
let adminSelectedDate = null;

let currentMoveBooking = null;


/* =========================================================
   UTILITY
========================================================= */

function normalizePhone(phone) {
  let value = String(phone || "").replace(/\D/g, "");

  if (value.startsWith("0039")) {
    value = value.substring(4);
  }

  if (value.startsWith("39") && value.length === 12) {
    value = value.substring(2);
  }

  return value;
}


function getTodayString() {

  const d = new Date();

  const year = d.getFullYear();

  const month =
    String(d.getMonth() + 1).padStart(2, "0");

  const day =
    String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function formatDateItalian(dateString) {

  if (!dateString) return "-";

  const date =
    new Date(dateString + "T12:00:00");

  return date.toLocaleDateString(
    "it-IT",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );
}


function formatShortDate(dateString) {

  if (!dateString) return "-";

  const date =
    new Date(dateString + "T12:00:00");

  return date.toLocaleDateString(
    "it-IT",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );
}


function getEndTime(time) {

  const parts = time.split(":");

  let hours = Number(parts[0]);
  let minutes = Number(parts[1]);

  minutes += 30;

  if (minutes >= 60) {
    hours++;
    minutes -= 60;
  }

  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0")
  );
}


function isAdmin() {

  if (!currentUser) return false;

  return (
    normalizePhone(currentUser.customer_phone) ===
    ADMIN_PHONE
  );
}


function showToast(message) {

  const toast =
    document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(window.grimaldiToastTimer);

  window.grimaldiToastTimer =
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
}


/* =========================================================
   PAGINE
========================================================= */

function showPage(pageId) {

  document
    .querySelectorAll(".page")
    .forEach(page => {
      page.classList.remove("active");
    });

  const page =
    document.getElementById(pageId);

  if (page) {
    page.classList.add("active");
  }


  document
    .querySelectorAll(".bottom-nav button")
    .forEach(button => {

      button.classList.remove("active");

      if (button.dataset.page === pageId) {
        button.classList.add("active");
      }

    });


  window.scrollTo(0, 0);


  if (pageId === "bookingPage") {

    renderServices();
    renderBookingCalendar();

    if (selectedDate) {
      loadBusyTimes(selectedDate);
    } else {
      renderTimeSlots();
    }

  }


  if (pageId === "appointmentsPage") {
    loadMyAppointments();
  }


  if (pageId === "profilePage") {
    updateUserInterface();
  }


  if (pageId === "adminAgendaPage") {

    if (!isAdmin()) {
      showToast("Area riservata all'amministratore");
      showPage("profilePage");
      return;
    }

    if (!adminSelectedDate) {
      adminSelectedDate = getTodayString();
    }

    renderAdminCalendar();
    loadAdminAgenda();
  }

}


/* =========================================================
   SERVIZI
========================================================= */

function renderServices() {

  const container =
    document.getElementById("services");

  if (!container) return;

  container.innerHTML =
    SERVICES.map(service => {

      const selected =
        selectedService &&
        selectedService.name === service.name;

      return `
        <button
          class="service-card ${selected ? "selected" : ""}"
          onclick="selectService(${JSON.stringify(service.name)})"
        >
          <b>${escapeHtml(service.name)}</b>
          <span>€${service.price}</span>
        </button>
      `;

    }).join("");
}


function selectService(serviceName) {

  selectedService =
    SERVICES.find(
      service => service.name === serviceName
    );

  renderServices();
  updateBookingSummary();
}


/* =========================================================
   CALENDARIO PRENOTAZIONE
========================================================= */

function renderBookingCalendar() {

  const calendar =
    document.getElementById("bookingCalendar");

  const title =
    document.getElementById("bookingMonthTitle");

  if (!calendar || !title) return;


  const year = bookingMonth.getFullYear();
  const month = bookingMonth.getMonth();


  title.textContent =
    bookingMonth.toLocaleDateString(
      "it-IT",
      {
        month: "long",
        year: "numeric"
      }
    );


  calendar.innerHTML = "";


  const firstDay =
    new Date(year, month, 1);

  const lastDay =
    new Date(year, month + 1, 0);


  let startDay = firstDay.getDay();

  startDay = startDay === 0
    ? 6
    : startDay - 1;


  for (let i = 0; i < startDay; i++) {

    const empty =
      document.createElement("div");

    empty.className = "calendar-empty";

    calendar.appendChild(empty);
  }


  for (
    let day = 1;
    day <= lastDay.getDate();
    day++
  ) {

    const dateString =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const button =
      document.createElement("button");

    button.textContent = day;


    const dateObject =
      new Date(dateString + "T12:00:00");

    const isSunday =
      dateObject.getDay() === 0;


    if (
      dateString < getTodayString() ||
      isSunday
    ) {
      button.disabled = true;
      button.classList.add("disabled");
    }


    if (dateString === getTodayString()) {
      button.classList.add("today");
    }


    if (dateString === selectedDate) {
      button.classList.add("selected");
    }


    button.addEventListener("click", async () => {

      if (button.disabled) return;

      selectedDate = dateString;
      selectedTime = null;

      renderBookingCalendar();
      updateBookingSummary();

      await loadBusyTimes(dateString);

    });


    calendar.appendChild(button);
  }

}


/* =========================================================
   ORARI OCCUPATI
========================================================= */

async function loadBusyTimes(date) {

  busyTimes = [];

  if (!date) {
    renderTimeSlots();
    return;
  }


  try {

    const { data, error } =
      await supabaseClient
        .from("appointments")
        .select("start_time,status")
        .eq("appointment_date", date)
        .neq("status", "cancelled");


    if (error) {
      console.error(error);
      showToast("Errore caricamento orari");
      return;
    }


    busyTimes =
      (data || []).map(item =>
        String(item.start_time).substring(0, 5)
      );


  } catch (error) {

    console.error(error);

  }


  renderTimeSlots();
}


/* =========================================================
   RENDER ORARI
========================================================= */

function renderTimeSlots() {

  const container =
    document.getElementById("timeSlots");

  const label =
    document.getElementById(
      "selectedBookingDateLabel"
    );

  if (!container) return;


  if (!selectedDate) {

    if (label) {
      label.textContent =
        "Seleziona prima una data";
    }

    container.innerHTML = `
      <div class="empty-state">
        Prima seleziona una data.
      </div>
    `;

    return;
  }


  if (label) {
    label.textContent =
      formatDateItalian(selectedDate);
  }


  container.innerHTML =
    TIMES.map(time => {

      const occupied =
        busyTimes.includes(time);

      const selected =
        selectedTime === time;

      return `
        <button
          class="time-slot
          ${occupied ? "occupied" : ""}
          ${selected ? "selected" : ""}"
          ${occupied ? "disabled" : ""}
          onclick="selectTime('${time}')"
        >
          ${occupied ? time + " • OCCUPATO" : time}
        </button>
      `;

    }).join("");
}


function selectTime(time) {

  if (busyTimes.includes(time)) {
    showToast("Orario già occupato");
    return;
  }

  selectedTime = time;

  renderTimeSlots();
  updateBookingSummary();
}


/* =========================================================
   RIEPILOGO
========================================================= */

function updateBookingSummary() {

  const service =
    document.getElementById("summaryService");

  const date =
    document.getElementById("summaryDate");

  const time =
    document.getElementById("summaryTime");

  const price =
    document.getElementById("summaryPrice");


  if (service) {
    service.textContent =
      selectedService
        ? selectedService.name
        : "Non selezionato";
  }


  if (date) {
    date.textContent =
      selectedDate
        ? formatShortDate(selectedDate)
        : "-";
  }


  if (time) {
    time.textContent =
      selectedTime || "-";
  }


  if (price) {
    price.textContent =
      selectedService
        ? "€" + selectedService.price
        : "€0";
  }

}


/* =========================================================
   CONFERMA PRENOTAZIONE
========================================================= */

async function confirmBooking() {

  if (!currentUser) {
    showToast("Devi accedere prima di prenotare");
    openAuth();
    return;
  }


  if (!selectedService) {
    showToast("Seleziona un servizio");
    return;
  }


  if (!selectedDate) {
    showToast("Seleziona una data");
    return;
  }


  if (!selectedTime) {
    showToast("Seleziona un orario");
    return;
  }


  const button =
    document.getElementById("confirmBooking");

  if (button) {
    button.disabled = true;
    button.textContent = "CONTROLLO...";
  }


  try {

    /* CONTROLLO FINALE */

    const { data: existing, error: checkError } =
      await supabaseClient
        .from("appointments")
        .select("id")
        .eq("appointment_date", selectedDate)
        .eq("start_time", selectedTime)
        .neq("status", "cancelled")
        .maybeSingle();


    if (checkError) {
      throw checkError;
    }


    if (existing) {

      showToast("Questo orario è stato appena occupato");

      selectedTime = null;

      await loadBusyTimes(selectedDate);

      return;
    }


    if (button) {
      button.textContent =
        "PRENOTAZIONE...";
    }


    const booking = {

      customer_id: currentUser.id,

      customer_name:
        currentUser.customer_name,

      customer_phone:
        currentUser.customer_phone,

      service_name:
        selectedService.name,

      service_price:
        selectedService.price,

      appointment_date:
        selectedDate,

      start_time:
        selectedTime,

      end_time:
        getEndTime(selectedTime),

      status: "confirmed",

      notes: null

    };


    const { error } =
      await supabaseClient
        .from("appointments")
        .insert([booking]);


    if (error) {

      console.error(error);

      if (error.code === "23505") {
        showToast("Orario già occupato");
      } else {
        showToast("Errore: " + error.message);
      }

      return;
    }


    showToast("Prenotazione confermata!");


    selectedService = null;
    selectedDate = null;
    selectedTime = null;
    busyTimes = [];


    renderServices();
    renderBookingCalendar();
    renderTimeSlots();
    updateBookingSummary();


  } catch (error) {

    console.error(error);

    showToast(
      "Errore prenotazione: " +
      (error.message || "riprova")
    );

  } finally {

    if (button) {
      button.disabled = false;
      button.textContent =
        "CONFERMA PRENOTAZIONE";
    }

  }

}


/* =========================================================
   LOGIN MODAL
========================================================= */

function openAuth() {

  document
    .getElementById("authModal")
    ?.classList.remove("hidden");
}


function closeAuth() {

  document
    .getElementById("authModal")
    ?.classList.add("hidden");
}


function openRegister() {

  closeAuth();

  document
    .getElementById("registerModal")
    ?.classList.remove("hidden");
}


function closeRegister() {

  document
    .getElementById("registerModal")
    ?.classList.add("hidden");
}


/* =========================================================
   LOGIN
========================================================= */

async function loginUser() {

  const phoneInput =
    document.getElementById("phoneInput");

  const pinInput =
    document.getElementById("pinInput");


  const phone =
    normalizePhone(phoneInput.value);

  const pin =
    pinInput.value.trim();


  if (!phone) {
    showToast("Inserisci il numero di telefono");
    return;
  }


  if (!pin) {
    showToast("Inserisci il PIN");
    return;
  }


  const loginButton =
    document.getElementById("loginButton");

  if (loginButton) {
    loginButton.disabled = true;
    loginButton.textContent = "ACCESSO...";
  }


  try {

    const { data, error } =
      await supabaseClient
        .from("profiles")
        .select("*")
        .eq("customer_phone", phone)
        .maybeSingle();


    if (error) {

      console.error(error);

      showToast(
        "Errore database: " +
        error.message
      );

      return;
    }


    if (!data) {
      showToast("Numero non registrato");
      return;
    }


    if (
      String(data.customer_pin).trim() !==
      String(pin).trim()
    ) {

      showToast("PIN errato");
      return;
    }


    currentUser = data;


    localStorage.setItem(
      "grimaldiUser",
      JSON.stringify(currentUser)
    );


    updateUserInterface();

    closeAuth();


    phoneInput.value = "";
    pinInput.value = "";


    showToast(
      "Bentornato " +
      (currentUser.customer_name || "") +
      "!"
    );


    showPage("profilePage");


  } catch (error) {

    console.error(error);

    showToast(
      "Errore accesso: " +
      (error.message || "")
    );

  } finally {

    if (loginButton) {
      loginButton.disabled = false;
      loginButton.textContent = "ACCEDI";
    }

  }

}


/* =========================================================
   REGISTRAZIONE
========================================================= */

async function registerUser() {

  const name =
    document
      .getElementById("registerName")
      .value.trim();

  const surname =
    document
      .getElementById("registerSurname")
      .value.trim();

  const phone =
    normalizePhone(
      document
        .getElementById("registerPhone")
        .value
    );

  const pin =
    document
      .getElementById("registerPin")
      .value.trim();

  const pin2 =
    document
      .getElementById("registerPin2")
      .value.trim();


  if (!name) {
    showToast("Inserisci il nome");
    return;
  }

  if (!surname) {
    showToast("Inserisci il cognome");
    return;
  }

  if (phone.length < 8) {
    showToast("Numero non valido");
    return;
  }

  if (
    !/^\d{4,}$/.test(pin)
  ) {
    showToast("Il PIN deve avere almeno 4 numeri");
    return;
  }

  if (pin !== pin2) {
    showToast("I PIN non coincidono");
    return;
  }


  const button =
    document.getElementById("registerButton");

  if (button) {
    button.disabled = true;
    button.textContent = "CREAZIONE...";
  }


  try {

    const { data: existing, error: checkError } =
      await supabaseClient
        .from("profiles")
        .select("id")
        .eq("customer_phone", phone)
        .maybeSingle();


    if (checkError) {
      throw checkError;
    }


    if (existing) {
      showToast("Questo numero è già registrato");
      return;
    }


    const newUser = {

      customer_name:
        name + " " + surname,

      customer_phone:
        phone,

      customer_pin:
        pin

    };


    const { data, error } =
      await supabaseClient
        .from("profiles")
        .insert([newUser])
        .select()
        .single();


    if (error) {
      throw error;
    }


    currentUser = data;


    localStorage.setItem(
      "grimaldiUser",
      JSON.stringify(currentUser)
    );


    updateUserInterface();

    closeRegister();


    showToast("Account creato con successo!");


    showPage("profilePage");


  } catch (error) {

    console.error(error);

    showToast(
      "Errore registrazione: " +
      (error.message || "")
    );

  } finally {

    if (button) {
      button.disabled = false;
      button.textContent = "CREA ACCOUNT";
    }

  }

}


/* =========================================================
   LOGOUT
========================================================= */

function logoutUser() {

  currentUser = null;

  localStorage.removeItem("grimaldiUser");

  updateUserInterface();

  showToast("Logout effettuato");

  showPage("homePage");
}


/* =========================================================
   PROFILO UI
========================================================= */

function updateUserInterface() {

  const profileName =
    document.getElementById("profileName");

  const profilePhone =
    document.getElementById("profilePhone");

  const profileInitial =
    document.getElementById("profileInitial");

  const profileDot =
    document.querySelector(".profile-dot");

  const loginButton =
    document.getElementById("loginProfileButton");

  const logoutButton =
    document.getElementById("logoutButton");

  const adminButton =
    document.getElementById("adminAgendaNavButton");


  if (currentUser) {

    const name =
      currentUser.customer_name || "Cliente";


    if (profileName) {
      profileName.textContent = name;
    }

    if (profilePhone) {
      profilePhone.textContent =
        currentUser.customer_phone || "";
    }

    if (profileInitial) {
      profileInitial.textContent =
        name.charAt(0).toUpperCase();
    }

    if (profileDot) {
      profileDot.textContent =
        name.charAt(0).toUpperCase();
    }

    loginButton?.classList.add("hidden");

    logoutButton?.classList.remove("hidden");


    if (adminButton) {

      adminButton.style.display =
        isAdmin() ? "flex" : "none";

    }


  } else {

    if (profileName) {
      profileName.textContent = "Ospite";
    }

    if (profilePhone) {
      profilePhone.textContent =
        "Accedi per gestire il tuo profilo";
    }

    if (profileInitial) {
      profileInitial.textContent = "G";
    }

    if (profileDot) {
      profileDot.textContent = "TU";
    }

    loginButton?.classList.remove("hidden");

    logoutButton?.classList.add("hidden");

    if (adminButton) {
      adminButton.style.display = "none";
    }

  }

}


/* =========================================================
   I MIEI APPUNTAMENTI
========================================================= */

async function loadMyAppointments() {

  const container =
    document.getElementById("bookingsList");

  if (!container) return;


  if (!currentUser) {

    container.innerHTML = `
      <div class="empty-state">
        <h3>Accedi al tuo account</h3>
        <p>Potrai vedere i tuoi appuntamenti.</p>
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
    `<div class="empty-state">Caricamento...</div>`;


  try {

    const { data, error } =
      await supabaseClient
        .from("appointments")
        .select("*")
        .eq("customer_id", currentUser.id)
        .neq("status", "cancelled")
        .order("appointment_date", {
          ascending: true
        })
        .order("start_time", {
          ascending: true
        });


    if (error) throw error;


    if (!data || data.length === 0) {

      container.innerHTML = `
        <div class="empty-state">
          <h3>Nessun appuntamento</h3>
          <p>Non hai ancora prenotazioni.</p>
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


    container.innerHTML =
      data.map(appointment => `

        <div class="appointment-card">

          <div class="appointment-top">

            <div>

              <small>
                ${formatDateItalian(
                  appointment.appointment_date
                )}
              </small>

              <h3>
                ${escapeHtml(
                  appointment.service_name
                )}
              </h3>

            </div>

            <div class="appointment-time">
              ${String(
                appointment.start_time
              ).substring(0, 5)}
            </div>

          </div>

          <div class="appointment-info">

            <span>
              €${appointment.service_price}
            </span>

            <span class="booking-status">
              CONFERMATO
            </span>

          </div>

          <button
            class="danger-button"
            onclick="cancelMyBooking('${appointment.id}')"
          >
            CANCELLA APPUNTAMENTO
          </button>

        </div>

      `).join("");


  } catch (error) {

    console.error(error);

    container.innerHTML = `
      <div class="empty-state">
        Errore nel caricamento.
      </div>
    `;
  }

}


/* =========================================================
   CANCELLA APPUNTAMENTO
========================================================= */

async function cancelMyBooking(id) {

  if (
    !confirm("Vuoi cancellare questo appuntamento?")
  ) {
    return;
  }


  try {

    const { error } =
      await supabaseClient
        .from("appointments")
        .update({
          status: "cancelled"
        })
        .eq("id", id);


    if (error) throw error;


    showToast("Appuntamento cancellato");

    loadMyAppointments();


  } catch (error) {

    showToast(
      "Errore: " + error.message
    );

  }

}


/* =========================================================
   CALENDARIO ADMIN
========================================================= */

function renderAdminCalendar() {

  if (!isAdmin()) return;


  const calendar =
    document.getElementById("adminCalendar");

  const title =
    document.getElementById("adminMonthTitle");

  if (!calendar || !title) return;


  const year = adminMonth.getFullYear();
  const month = adminMonth.getMonth();


  title.textContent =
    adminMonth.toLocaleDateString(
      "it-IT",
      {
        month: "long",
        year: "numeric"
      }
    );


  calendar.innerHTML = "";


  const firstDay =
    new Date(year, month, 1);

  const lastDay =
    new Date(year, month + 1, 0);


  let start =
    firstDay.getDay();

  start = start === 0
    ? 6
    : start - 1;


  for (let i = 0; i < start; i++) {

    const empty =
      document.createElement("div");

    empty.className = "calendar-empty";

    calendar.appendChild(empty);
  }


  for (
    let day = 1;
    day <= lastDay.getDate();
    day++
  ) {

    const date =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const button =
      document.createElement("button");

    button.textContent = day;


    if (date === adminSelectedDate) {
      button.classList.add("selected");
    }

    if (date === getTodayString()) {
      button.classList.add("today");
    }


    button.onclick = () => {

      adminSelectedDate = date;

      renderAdminCalendar();

      loadAdminAgenda();
    };


    calendar.appendChild(button);
  }

}


/* =========================================================
   AGENDA ADMIN
========================================================= */

async function loadAdminAgenda() {

  if (!isAdmin()) return;


  const list =
    document.getElementById("adminAgendaList");

  const title =
    document.getElementById(
      "adminAgendaDateTitle"
    );


  if (!adminSelectedDate) {
    adminSelectedDate = getTodayString();
  }


  if (title) {
    title.textContent =
      formatDateItalian(adminSelectedDate);
  }


  if (!list) return;


  list.innerHTML =
    `<div class="empty-state">Caricamento...</div>`;


  try {

    const { data, error } =
      await supabaseClient
        .from("appointments")
        .select("*")
        .eq(
          "appointment_date",
          adminSelectedDate
        )
        .neq("status", "cancelled")
        .order("start_time");


    if (error) throw error;


    const appointments = data || [];


    updateAdminSummary(appointments);


    list.innerHTML =
      TIMES.map(time => {

        const appointment =
          appointments.find(item =>
            String(item.start_time)
              .substring(0, 5) === time
          );


        if (!appointment) {

          return `
            <div class="admin-slot free">

              <div class="admin-slot-time">
                ${time}
              </div>

              <div class="admin-slot-free">
                LIBERO
              </div>

            </div>
          `;
        }


        return `
          <div class="admin-slot booked">

            <div class="admin-slot-time">
              ${time}
            </div>

            <div class="admin-client-info">

              <b>
                ${escapeHtml(
                  appointment.customer_name
                )}
              </b>

              <small>
                ${escapeHtml(
                  appointment.customer_phone || "-"
                )}
              </small>

              <span>
                ${escapeHtml(
                  appointment.service_name
                )}
              </span>

            </div>

            <div class="admin-actions">

              <button
                onclick="openMoveBooking('${appointment.id}')"
              >
                SPOSTA
              </button>

              <button
                class="delete"
                onclick="deleteAdminBooking('${appointment.id}')"
              >
                ×
              </button>

            </div>

          </div>
        `;

      }).join("");


  } catch (error) {

    console.error(error);

    list.innerHTML =
      `<div class="empty-state">
        Errore: ${escapeHtml(error.message)}
      </div>`;
  }

}


/* =========================================================
   STATISTICHE ADMIN
========================================================= */

function updateAdminSummary(appointments) {

  const date =
    document.getElementById("adminSelectedDate");

  const booked =
    document.getElementById("adminBookedCount");

  const free =
    document.getElementById("adminFreeCount");


  if (date) {
    date.textContent =
      formatShortDate(adminSelectedDate);
  }

  if (booked) {
    booked.textContent =
      appointments.length;
  }

  if (free) {
    free.textContent =
      TIMES.length - appointments.length;
  }

}


/* =========================================================
   AGGIUNGI CLIENTE MANUALMENTE
========================================================= */

function openManualBooking() {

  if (!isAdmin()) return;


  const serviceSelect =
    document.getElementById("manualService");

  const timeSelect =
    document.getElementById("manualBookingTime");

  const dateInput =
    document.getElementById("manualBookingDate");


  serviceSelect.innerHTML =
    `<option value="">Seleziona servizio</option>`;

  SERVICES.forEach(service => {

    serviceSelect.innerHTML += `
      <option value="${escapeHtml(service.name)}">
        ${escapeHtml(service.name)} - €${service.price}
      </option>
    `;
  });


  timeSelect.innerHTML =
    `<option value="">Seleziona orario</option>`;

  TIMES.forEach(time => {

    timeSelect.innerHTML += `
      <option value="${time}">
        ${time}
      </option>
    `;
  });


  dateInput.min = getTodayString();

  dateInput.value =
    adminSelectedDate || getTodayString();


  document
    .getElementById("manualBookingModal")
    .classList.remove("hidden");
}


function closeManualBooking() {

  document
    .getElementById("manualBookingModal")
    .classList.add("hidden");
}


async function createManualBooking() {

  const name =
    document
      .getElementById("manualCustomerName")
      .value.trim();

  const phone =
    normalizePhone(
      document
        .getElementById("manualCustomerPhone")
        .value
    );

  const serviceName =
    document
      .getElementById("manualService")
      .value;

  const date =
    document
      .getElementById("manualBookingDate")
      .value;

  const time =
    document
      .getElementById("manualBookingTime")
      .value;


  if (!name || !serviceName || !date || !time) {
    showToast("Compila tutti i campi obbligatori");
    return;
  }


  const service =
    SERVICES.find(s => s.name === serviceName);


  try {

    const { data: existing } =
      await supabaseClient
        .from("appointments")
        .select("id")
        .eq("appointment_date", date)
        .eq("start_time", time)
        .neq("status", "cancelled")
        .maybeSingle();


    if (existing) {
      showToast("Orario già occupato");
      return;
    }


    const { error } =
      await supabaseClient
        .from("appointments")
        .insert([{

          customer_id: null,

          customer_name: name,

          customer_phone:
            phone || null,

          service_name:
            service.name,

          service_price:
            service.price,

          appointment_date: date,

          start_time: time,

          end_time:
            getEndTime(time),

          status: "confirmed",

          notes:
            "Inserito manualmente"

        }]);


    if (error) throw error;


    showToast("Cliente aggiunto!");

    closeManualBooking();

    adminSelectedDate = date;

    loadAdminAgenda();


  } catch (error) {

    console.error(error);

    showToast("Errore: " + error.message);

  }

}


/* =========================================================
   SPOSTA APPUNTAMENTO
========================================================= */

async function openMoveBooking(id) {

  try {

    const { data, error } =
      await supabaseClient
        .from("appointments")
        .select("*")
        .eq("id", id)
        .single();


    if (error) throw error;


    currentMoveBooking = data;


    document
      .getElementById("moveBookingId")
      .value = data.id;


    document
      .getElementById("moveBookingCustomer")
      .textContent =
      `${data.customer_name} - ${data.service_name}`;


    const dateInput =
      document.getElementById("moveBookingDate");


    dateInput.min = getTodayString();

    dateInput.value =
      data.appointment_date;


    await populateMoveTimes(
      data.appointment_date,
      data.id
    );


    document
      .getElementById("moveBookingModal")
      .classList.remove("hidden");


  } catch (error) {

    showToast("Errore apertura appuntamento");

  }

}


function closeMoveBooking() {

  document
    .getElementById("moveBookingModal")
    .classList.add("hidden");

  currentMoveBooking = null;
}


async function populateMoveTimes(date, currentId) {

  const select =
    document.getElementById("moveBookingTime");


  const { data, error } =
    await supabaseClient
      .from("appointments")
      .select("id,start_time")
      .eq("appointment_date", date)
      .neq("status", "cancelled");


  if (error) return;


  const occupied =
    (data || [])
      .filter(item => item.id !== currentId)
      .map(item =>
        String(item.start_time).substring(0, 5)
      );


  select.innerHTML = "";


  TIMES.forEach(time => {

    const option =
      document.createElement("option");

    option.value = time;

    option.textContent =
      occupied.includes(time)
        ? time + " - OCCUPATO"
        : time;

    option.disabled =
      occupied.includes(time);


    if (
      currentMoveBooking &&
      date === currentMoveBooking.appointment_date &&
      time === String(
        currentMoveBooking.start_time
      ).substring(0, 5)
    ) {
      option.selected = true;
    }


    select.appendChild(option);
  });

}


async function confirmMoveBooking() {

  const id =
    document.getElementById("moveBookingId").value;

  const date =
    document.getElementById("moveBookingDate").value;

  const time =
    document.getElementById("moveBookingTime").value;


  if (!id || !date || !time) {
    showToast("Seleziona data e orario");
    return;
  }


  try {

    const { data: existing } =
      await supabaseClient
        .from("appointments")
        .select("id")
        .eq("appointment_date", date)
        .eq("start_time", time)
        .neq("status", "cancelled")
        .neq("id", id)
        .maybeSingle();


    if (existing) {
      showToast("Orario già occupato");
      return;
    }


    const { error } =
      await supabaseClient
        .from("appointments")
        .update({

          appointment_date: date,

          start_time: time,

          end_time:
            getEndTime(time)

        })
        .eq("id", id);


    if (error) throw error;


    showToast("Appuntamento spostato!");

    closeMoveBooking();

    adminSelectedDate = date;

    loadAdminAgenda();


  } catch (error) {

    showToast(
      "Errore: " + error.message
    );

  }

}


/* =========================================================
   ELIMINA ADMIN
========================================================= */

async function deleteAdminBooking(id) {

  if (
    !confirm("Vuoi eliminare questo appuntamento?")
  ) {
    return;
  }


  try {

    const { error } =
      await supabaseClient
        .from("appointments")
        .update({
          status: "cancelled"
        })
        .eq("id", id);


    if (error) throw error;


    showToast("Appuntamento eliminato");

    loadAdminAgenda();


  } catch (error) {

    showToast(
      "Errore: " + error.message
    );

  }

}


/* =========================================================
   INSTALL
========================================================= */

function showInstall() {

  document
    .getElementById("installModal")
    ?.classList.remove("hidden");
}


function closeInstall() {

  document
    .getElementById("installModal")
    ?.classList.add("hidden");
}


/* =========================================================
   NOTIFICHE
========================================================= */

async function enableGrimaldiPush() {

  if ("Notification" in window) {

    try {

      const permission =
        await Notification.requestPermission();

      if (permission === "granted") {
        showToast("Notifiche attivate!");
      } else {
        showToast("Notifiche non autorizzate");
      }

    } catch (error) {

      showToast("Impossibile attivare le notifiche");

    }

  } else {

    showToast("Notifiche non supportate");

  }

}


/* =========================================================
   EVENTI
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {


    /* CALENDARIO PRENOTAZIONE */

    document
      .getElementById("prevBookingMonth")
      ?.addEventListener("click", () => {

        bookingMonth = new Date(
          bookingMonth.getFullYear(),
          bookingMonth.getMonth() - 1,
          1
        );

        renderBookingCalendar();

      });


    document
      .getElementById("nextBookingMonth")
      ?.addEventListener("click", () => {

        bookingMonth = new Date(
          bookingMonth.getFullYear(),
          bookingMonth.getMonth() + 1,
          1
        );

        renderBookingCalendar();

      });


    /* CALENDARIO ADMIN */

    document
      .getElementById("prevAdminMonth")
      ?.addEventListener("click", () => {

        adminMonth = new Date(
          adminMonth.getFullYear(),
          adminMonth.getMonth() - 1,
          1
        );

        renderAdminCalendar();

      });


    document
      .getElementById("nextAdminMonth")
      ?.addEventListener("click", () => {

        adminMonth = new Date(
          adminMonth.getFullYear(),
          adminMonth.getMonth() + 1,
          1
        );

        renderAdminCalendar();

      });


    /* LOGIN */

    document
      .getElementById("loginButton")
      ?.addEventListener("click", loginUser);


    document
      .getElementById("registerButton")
      ?.addEventListener("click", registerUser);


    document
      .getElementById("confirmBooking")
      ?.addEventListener("click", confirmBooking);


    /* ENTER */

    document
      .getElementById("pinInput")
      ?.addEventListener("keydown", event => {

        if (event.key === "Enter") {
          loginUser();
        }

      });


    /* CAMBIO DATA SPOSTAMENTO */

    document
      .getElementById("moveBookingDate")
      ?.addEventListener("change", async event => {

        const id =
          document
            .getElementById("moveBookingId")
            .value;

        await populateMoveTimes(
          event.target.value,
          id
        );

      });


    /* RIPRISTINO UTENTE */

    try {

      const saved =
        localStorage.getItem("grimaldiUser");


      if (saved) {

        const user =
          JSON.parse(saved);


        if (user && user.id) {

          const { data } =
            await supabaseClient
              .from("profiles")
              .select("*")
              .eq("id", user.id)
              .maybeSingle();


          if (data) {
            currentUser = data;
          } else {
            localStorage.removeItem("grimaldiUser");
          }

        }

      }

    } catch (error) {

      console.error(error);

      localStorage.removeItem("grimaldiUser");

    }


    updateUserInterface();

    renderServices();
    renderBookingCalendar();
    renderTimeSlots();
    updateBookingSummary();


    /* NASCONDE LOADING */

    setTimeout(() => {

      const loading =
        document.getElementById("loadingScreen");

      if (loading) {
        loading.classList.add("hide");
      }

    }, 800);

  }
);
