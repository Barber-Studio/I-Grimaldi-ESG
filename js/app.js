/* =========================================================
   I GRIMALDI E.S.G.
   APP JAVASCRIPT
========================================================= */


/* =========================================================
   SUPABASE CONFIG
========================================================= */

const SUPABASE_URL =
  "https://wxcdmtajcasnlohqkgmk.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_bwjP-ihASijevvu7d6r5Ew_6JaWKSDP";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );


/* =========================================================
   CONFIGURAZIONE
========================================================= */

const ADMIN_PHONE = "3791415355";


const SERVICES = [

  {
    name: "Shampoo",
    price: 10
  },

  {
    name: "Shampoo + Taglio",
    price: 20
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


/* =========================================================
   ORARI
   DALLE 09:00 ALLE 21:00
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

  "13:00",
  "13:30",

  "14:00",
  "14:30",

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

let bookingMonth = new Date();

let adminMonth = new Date();

let adminSelectedDate = null;

let busyTimes = [];

let currentMoveBooking = null;


/* =========================================================
   UTILITY
========================================================= */


function normalizePhone(phone) {

  return String(phone || "")
    .replace(/\D/g, "")
    .replace(/^39(?=\d{10}$)/, "");

}


function formatPhone(phone) {

  return String(phone || "")
    .replace(/\D/g, "");

}


function formatDateItalian(dateString) {

  if (!dateString) return "-";

  const date = new Date(
    dateString + "T12:00:00"
  );

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

  const date = new Date(
    dateString + "T12:00:00"
  );

  return date.toLocaleDateString(
    "it-IT",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );

}


function getTodayString() {

  const now = new Date();

  const year = now.getFullYear();

  const month =
    String(now.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(now.getDate())
      .padStart(2, "0");

  return `${year}-${month}-${day}`;

}


function escapeHtml(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function showToast(message) {

  const toast =
    document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(window.toastTimeout);

  window.toastTimeout =
    setTimeout(() => {

      toast.classList.remove("show");

    }, 3500);

}


function getEndTime(startTime) {

  const [hours, minutes] =
    startTime.split(":").map(Number);

  let totalMinutes =
    hours * 60 + minutes + 30;

  const endHours =
    Math.floor(totalMinutes / 60);

  const endMinutes =
    totalMinutes % 60;

  return (
    String(endHours).padStart(2, "0") +
    ":" +
    String(endMinutes).padStart(2, "0")
  );

}


function isAdmin() {

  if (!currentUser) return false;

  const phone =
    normalizePhone(
      currentUser.customer_phone
    );

  return (
    currentUser.is_admin === true ||
    phone === ADMIN_PHONE
  );

}


/* =========================================================
   PAGINE
========================================================= */


function showPage(pageId) {

  const pages =
    document.querySelectorAll(".page");

  pages.forEach(page => {

    page.classList.remove("active");

  });


  const target =
    document.getElementById(pageId);

  if (target) {

    target.classList.add("active");

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


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  if (pageId === "bookingPage") {

    renderServices();

    renderBookingCalendar();

    renderTimeSlots();

  }


  if (pageId === "appointmentsPage") {

    loadMyAppointments();

  }


  if (
    pageId === "adminAgendaPage" &&
    isAdmin()
  ) {

    if (!adminSelectedDate) {

      adminSelectedDate =
        getTodayString();

    }

    renderAdminCalendar();

    loadAdminAgenda();

  }


  if (pageId === "profilePage") {

    updateProfileUI();

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
          onclick="selectService('${service.name.replace(/'/g, "\\'")}')"
        >

          <b>
            ${escapeHtml(service.name)}
          </b>

          <span>
            €${service.price}
          </span>

        </button>

      `;

    }).join("");

}


function selectService(serviceName) {

  selectedService =
    SERVICES.find(
      service =>
        service.name === serviceName
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


  const year =
    bookingMonth.getFullYear();

  const month =
    bookingMonth.getMonth();


  title.textContent =
    bookingMonth.toLocaleDateString(
      "it-IT",
      {
        month: "long",
        year: "numeric"
      }
    );


  const firstDay =
    new Date(year, month, 1);

  const lastDay =
    new Date(year, month + 1, 0);


  let startDay =
    firstDay.getDay();

  startDay =
    startDay === 0
      ? 6
      : startDay - 1;


  const days =
    lastDay.getDate();


  calendar.innerHTML = "";


  for (
    let empty = 0;
    empty < startDay;
    empty++
  ) {

    const spacer =
      document.createElement("div");

    spacer.className =
      "calendar-empty";

    calendar.appendChild(spacer);

  }


  for (
    let day = 1;
    day <= days;
    day++
  ) {

    const dateString =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


    const button =
      document.createElement("button");


    button.textContent = day;


    const today =
      getTodayString();


    const dateObject =
      new Date(
        dateString + "T12:00:00"
      );


    const weekday =
      dateObject.getDay();


    const isSunday =
      weekday === 0;


    if (
      dateString < today ||
      isSunday
    ) {

      button.disabled = true;

      button.classList.add(
        "disabled"
      );

    }


    if (
      dateString === selectedDate
    ) {

      button.classList.add(
        "selected"
      );

    }


    if (
      dateString === today
    ) {

      button.classList.add(
        "today"
      );

    }


    button.onclick = () => {

      if (button.disabled) return;

      selectedDate =
        dateString;

      selectedTime =
        null;

      loadBusyTimes(
        selectedDate,
        false
      );

      renderBookingCalendar();

      updateBookingSummary();

    };


    calendar.appendChild(button);

  }

}


/* =========================================================
   CARICA ORARI OCCUPATI
========================================================= */


async function loadBusyTimes(
  date,
  rerender = true
) {

  busyTimes = [];


  if (!date) {

    if (rerender) {

      renderTimeSlots();

    }

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

      showToast(
        "Errore nel caricamento degli orari"
      );

      return;

    }


    busyTimes =
      (data || []).map(
        appointment =>
          String(
            appointment.start_time
          ).substring(0, 5)
      );


  } catch (error) {

    console.error(error);

  }


  if (rerender) {

    renderTimeSlots();

  }

}


/* =========================================================
   ORARI PRENOTAZIONE
========================================================= */


function renderTimeSlots() {

  const container =
    document.getElementById("timeSlots");

  const dateLabel =
    document.getElementById(
      "selectedBookingDateLabel"
    );


  if (!container) return;


  if (!selectedDate) {

    container.innerHTML = `

      <div class="empty-state">
        Prima seleziona una data.
      </div>

    `;


    if (dateLabel) {

      dateLabel.textContent =
        "Seleziona prima una data";

    }

    return;

  }


  if (dateLabel) {

    dateLabel.textContent =
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
          class="time-slot ${occupied ? "occupied" : ""} ${selected ? "selected" : ""}"
          ${occupied ? "disabled" : ""}
          onclick="selectTime('${time}')"
        >

          ${time}

        </button>

      `;

    }).join("");

}


function selectTime(time) {

  if (busyTimes.includes(time)) {

    showToast(
      "Questo orario è già occupato"
    );

    return;

  }


  selectedTime = time;

  renderTimeSlots();

  updateBookingSummary();

}


/* =========================================================
   RIEPILOGO PRENOTAZIONE
========================================================= */


function updateBookingSummary() {

  const serviceElement =
    document.getElementById("summaryService");

  const dateElement =
    document.getElementById("summaryDate");

  const timeElement =
    document.getElementById("summaryTime");

  const priceElement =
    document.getElementById("summaryPrice");


  if (serviceElement) {

    serviceElement.textContent =
      selectedService
        ? selectedService.name
        : "Non selezionato";

  }


  if (dateElement) {

    dateElement.textContent =
      selectedDate
        ? formatShortDate(selectedDate)
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
   CONFERMA PRENOTAZIONE
========================================================= */


async function confirmBooking() {

  if (!currentUser) {

    showToast(
      "Devi accedere prima di prenotare"
    );

    openAuth();

    return;

  }


  if (!selectedService) {

    showToast(
      "Seleziona un servizio"
    );

    return;

  }


  if (!selectedDate) {

    showToast(
      "Seleziona una data"
    );

    return;

  }


  if (!selectedTime) {

    showToast(
      "Seleziona un orario"
    );

    return;

  }


  await loadBusyTimes(
    selectedDate,
    false
  );


  if (
    busyTimes.includes(selectedTime)
  ) {

    showToast(
      "Questo orario è stato appena prenotato. Scegline un altro."
    );

    selectedTime = null;

    renderTimeSlots();

    return;

  }


  const confirmButton =
    document.getElementById(
      "confirmBooking"
    );


  if (confirmButton) {

    confirmButton.disabled = true;

    confirmButton.textContent =
      "PRENOTAZIONE IN CORSO...";

  }


  try {

    const appointmentData = {

      customer_id:
        currentUser.id,

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

      status:
        "confirmed",

      notes:
        null

    };


    const { error } =
      await supabaseClient
        .from("appointments")
        .insert(
          appointmentData
        );


    if (error) {

      console.error(
        "Errore prenotazione:",
        error
      );


      if (
        error.code === "23505"
      ) {

        showToast(
          "Questo orario è già stato prenotato"
        );

      } else {

        showToast(
          "Errore: " +
          error.message
        );

      }

      return;

    }


    showToast(
      "Prenotazione confermata!"
    );


    selectedService = null;

    selectedDate = null;

    selectedTime = null;

    busyTimes = [];


    renderServices();

    renderBookingCalendar();

    renderTimeSlots();

    updateBookingSummary();


    if (
      window.sendBookingNotification
    ) {

      window.sendBookingNotification();

    }


  } catch (error) {

    console.error(error);

    showToast(
      "Errore durante la prenotazione"
    );

  } finally {

    if (confirmButton) {

      confirmButton.disabled = false;

      confirmButton.textContent =
        "CONFERMA PRENOTAZIONE";

    }

  }

}


/* =========================================================
   AUTENTICAZIONE
========================================================= */


function openAuth() {

  document
    .getElementById("authModal")
    .classList
    .remove("hidden");

}


function closeAuth() {

  document
    .getElementById("authModal")
    .classList
    .add("hidden");

}


function openRegister() {

  closeAuth();

  document
    .getElementById("registerModal")
    .classList
    .remove("hidden");

}


function closeRegister() {

  document
    .getElementById("registerModal")
    .classList
    .add("hidden");

}


async function loginUser() {

  const phoneInput =
    document
      .getElementById("phoneInput")
      .value
      .trim();


  const pin =
    document
      .getElementById("pinInput")
      .value
      .trim();


  const phone =
    normalizePhone(phoneInput);


  if (!phone) {

    showToast(
      "Inserisci il numero di telefono"
    );

    return;

  }


  if (!pin) {

    showToast(
      "Inserisci il PIN"
    );

    return;

  }


  try {

    const { data, error } =
      await supabaseClient
        .from("profiles")
        .select("*")
        .eq(
          "customer_phone",
          phone
        )
        .maybeSingle();


    if (error) {

      console.error(error);

      showToast(
        "Errore durante l'accesso"
      );

      return;

    }


    if (!data) {

      showToast(
        "Numero non registrato"
      );

      return;

    }


    if (
      String(data.customer_pin) !==
      String(pin)
    ) {

      showToast(
        "PIN errato"
      );

      return;

    }


    currentUser = data;


    /* ADMIN AUTOMATICO */

    if (
      normalizePhone(
        currentUser.customer_phone
      ) === ADMIN_PHONE &&
      currentUser.is_admin !== true
    ) {

      await supabaseClient
        .from("profiles")
        .update({
          is_admin: true,
          role: "admin"
        })
        .eq(
          "id",
          currentUser.id
        );


      currentUser.is_admin = true;

      currentUser.role = "admin";

    }


    localStorage.setItem(
      "grimaldiUser",
      JSON.stringify(currentUser)
    );


    updateUserInterface();

    closeAuth();


    document
      .getElementById("phoneInput")
      .value = "";

    document
      .getElementById("pinInput")
      .value = "";


    showToast(
      `Bentornato ${currentUser.customer_name}!`
    );


    showPage("profilePage");


  } catch (error) {

    console.error(error);

    showToast(
      "Errore durante l'accesso"
    );

  }

}


/* =========================================================
   REGISTRAZIONE
========================================================= */


async function registerUser() {

  const name =
    document
      .getElementById("registerName")
      .value
      .trim();


  const surname =
    document
      .getElementById("registerSurname")
      .value
      .trim();


  const phoneInput =
    document
      .getElementById("registerPhone")
      .value
      .trim();


  const phone =
    normalizePhone(phoneInput);


  const pin =
    document
      .getElementById("registerPin")
      .value
      .trim();


  const pin2 =
    document
      .getElementById("registerPin2")
      .value
      .trim();


  if (!name) {

    showToast(
      "Inserisci il nome"
    );

    return;

  }


  if (!surname) {

    showToast(
      "Inserisci il cognome"
    );

    return;

  }


  if (!phone) {

    showToast(
      "Inserisci il numero"
    );

    return;

  }


  if (phone.length < 8) {

    showToast(
      "Numero di telefono non valido"
    );

    return;

  }


  if (
    pin.length < 4 ||
    !/^\d+$/.test(pin)
  ) {

    showToast(
      "Il PIN deve avere almeno 4 cifre"
    );

    return;

  }


  if (pin !== pin2) {

    showToast(
      "I PIN non coincidono"
    );

    return;

  }


  try {

    const { data: existingUser } =
      await supabaseClient
        .from("profiles")
        .select("id")
        .eq(
          "customer_phone",
          phone
        )
        .maybeSingle();


    if (existingUser) {

      showToast(
        "Questo numero è già registrato"
      );

      return;

    }


    const fullName =
      `${name} ${surname}`;


    const newUser = {

      customer_name:
        fullName,

      customer_phone:
        phone,

      customer_pin:
        pin,

      role:
        phone === ADMIN_PHONE
          ? "admin"
          : "customer",

      is_admin:
        phone === ADMIN_PHONE

    };


    const { data, error } =
      await supabaseClient
        .from("profiles")
        .insert(newUser)
        .select()
        .single();


    if (error) {

      console.error(error);

      showToast(
        "Errore registrazione: " +
        error.message
      );

      return;

    }


    currentUser = data;


    localStorage.setItem(
      "grimaldiUser",
      JSON.stringify(currentUser)
    );


    updateUserInterface();

    closeRegister();


    showToast(
      "Account creato con successo!"
    );


    showPage("profilePage");


  } catch (error) {

    console.error(error);

    showToast(
      "Errore durante la registrazione"
    );

  }

}


/* =========================================================
   LOGOUT
========================================================= */


function logoutUser() {

  currentUser = null;

  localStorage.removeItem(
    "grimaldiUser"
  );


  updateUserInterface();

  showToast(
    "Hai effettuato il logout"
  );


  showPage("homePage");

}


/* =========================================================
   UI UTENTE
========================================================= */


function updateUserInterface() {

  const profileName =
    document.getElementById("profileName");

  const profilePhone =
    document.getElementById("profilePhone");

  const profileInitial =
    document.getElementById("profileInitial");

  const loginButton =
    document.getElementById(
      "loginProfileButton"
    );

  const logoutButton =
    document.getElementById(
      "logoutButton"
    );

  const profileDot =
    document.querySelector(
      ".profile-dot"
    );

  const adminNav =
    document.getElementById(
      "adminAgendaNavButton"
    );


  if (currentUser) {

    if (profileName) {

      profileName.textContent =
        currentUser.customer_name ||
        "Cliente";

    }


    if (profilePhone) {

      profilePhone.textContent =
        currentUser.customer_phone;

    }


    if (profileInitial) {

      profileInitial.textContent =
        (
          currentUser.customer_name ||
          "G"
        )
          .charAt(0)
          .toUpperCase();

    }


    if (profileDot) {

      profileDot.textContent =
        (
          currentUser.customer_name ||
          "TU"
        )
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


    if (
      adminNav &&
      isAdmin()
    ) {

      adminNav.style.display =
        "flex";

    }


  } else {

    if (profileName) {

      profileName.textContent =
        "Ospite";

    }


    if (profilePhone) {

      profilePhone.textContent =
        "Accedi per gestire il tuo profilo";

    }


    if (profileInitial) {

      profileInitial.textContent =
        "G";

    }


    if (profileDot) {

      profileDot.textContent =
        "TU";

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


    if (adminNav) {

      adminNav.style.display =
        "none";

    }

  }

}


function updateProfileUI() {

  updateUserInterface();

}


/* =========================================================
   I MIEI APPUNTAMENTI
========================================================= */


async function loadMyAppointments() {

  const container =
    document.getElementById(
      "bookingsList"
    );


  if (!container) return;


  if (!currentUser) {

    container.innerHTML = `

      <div class="empty-state">

        <h3>
          Accedi al tuo account
        </h3>

        <p>
          Potrai vedere e gestire i tuoi appuntamenti.
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

    const { data, error } =
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

      console.error(error);

      container.innerHTML = `

        <div class="empty-state">
          Errore nel caricamento.
        </div>

      `;

      return;

    }


    const appointments =
      (data || []).filter(
        appointment =>
          appointment.status !== "cancelled"
      );


    if (!appointments.length) {

      container.innerHTML = `

        <div class="empty-state">

          <h3>
            Nessun appuntamento
          </h3>

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


    container.innerHTML =
      appointments.map(appointment => `

        <div class="appointment-card">

          <div class="appointment-top">

            <div>

              <small>
                ${formatDateItalian(appointment.appointment_date)}
              </small>

              <h3>
                ${escapeHtml(
                  appointment.service_name ||
                  "Servizio"
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
              €${appointment.service_price || 0}
            </span>

            <span class="booking-status">

              ${appointment.status === "confirmed"
                ? "CONFERMATO"
                : escapeHtml(
                    appointment.status || ""
                  )
              }

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

  }

}


/* =========================================================
   CANCELLA APPUNTAMENTO CLIENTE
========================================================= */


async function cancelMyBooking(id) {

  const confirmCancel =
    confirm(
      "Vuoi davvero cancellare questo appuntamento?"
    );


  if (!confirmCancel) return;


  try {

    const { error } =
      await supabaseClient
        .from("appointments")
        .update({
          status: "cancelled"
        })
        .eq("id", id);


    if (error) {

      showToast(
        "Errore: " +
        error.message
      );

      return;

    }


    showToast(
      "Appuntamento cancellato"
    );


    loadMyAppointments();


  } catch (error) {

    console.error(error);

  }

}


/* =========================================================
   CALENDARIO ADMIN
========================================================= */


function renderAdminCalendar() {

  if (!isAdmin()) return;


  const calendar =
    document.getElementById(
      "adminCalendar"
    );

  const title =
    document.getElementById(
      "adminMonthTitle"
    );


  if (!calendar || !title) return;


  const year =
    adminMonth.getFullYear();

  const month =
    adminMonth.getMonth();


  title.textContent =
    adminMonth.toLocaleDateString(
      "it-IT",
      {
        month: "long",
        year: "numeric"
      }
    );


  const firstDay =
    new Date(year, month, 1);

  const lastDay =
    new Date(year, month + 1, 0);


  let startDay =
    firstDay.getDay();

  startDay =
    startDay === 0
      ? 6
      : startDay - 1;


  calendar.innerHTML = "";


  for (
    let empty = 0;
    empty < startDay;
    empty++
  ) {

    const spacer =
      document.createElement("div");

    spacer.className =
      "calendar-empty";

    calendar.appendChild(spacer);

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


    if (
      dateString === adminSelectedDate
    ) {

      button.classList.add(
        "selected"
      );

    }


    if (
      dateString === getTodayString()
    ) {

      button.classList.add(
        "today"
      );

    }


    button.onclick = () => {

      adminSelectedDate =
        dateString;

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

  if (!adminSelectedDate) {

    adminSelectedDate =
      getTodayString();

  }


  const list =
    document.getElementById(
      "adminAgendaList"
    );

  const title =
    document.getElementById(
      "adminAgendaDateTitle"
    );


  if (title) {

    title.textContent =
      formatDateItalian(
        adminSelectedDate
      );

  }


  if (!list) return;


  list.innerHTML = `

    <div class="empty-state">
      Caricamento agenda...
    </div>

  `;


  try {

    const { data, error } =
      await supabaseClient
        .from("appointments")
        .select("*")
        .eq(
          "appointment_date",
          adminSelectedDate
        )
        .neq(
          "status",
          "cancelled"
        )
        .order(
          "start_time",
          {
            ascending: true
          }
        );


    if (error) {

      console.error(error);

      list.innerHTML = `

        <div class="empty-state">
          Errore caricamento agenda.
        </div>

      `;

      return;

    }


    const appointments =
      data || [];


    updateAdminSummary(
      appointments
    );


    if (!appointments.length) {

      list.innerHTML = `

        <div class="empty-state">

          <h3>
            Nessun appuntamento
          </h3>

          <p>
            Tutti gli orari sono disponibili.
          </p>

        </div>

      `;

      return;

    }


    list.innerHTML =
      TIMES.map(time => {

        const appointment =
          appointments.find(
            item =>
              String(
                item.start_time
              ).substring(0, 5) === time
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
                  appointment.customer_phone
                )}
              </small>

              <span>
                ${escapeHtml(
                  appointment.service_name ||
                  "Servizio"
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

  }

}


/* =========================================================
   RIEPILOGO ADMIN
========================================================= */


function updateAdminSummary(appointments) {

  const dateElement =
    document.getElementById(
      "adminSelectedDate"
    );

  const bookedElement =
    document.getElementById(
      "adminBookedCount"
    );

  const freeElement =
    document.getElementById(
      "adminFreeCount"
    );


  if (dateElement) {

    dateElement.textContent =
      formatShortDate(
        adminSelectedDate
      );

  }


  if (bookedElement) {

    bookedElement.textContent =
      appointments.length;

  }


  if (freeElement) {

    freeElement.textContent =
      TIMES.length -
      appointments.length;

  }

}


/* =========================================================
   AGGIUNGI CLIENTE MANUALMENTE
========================================================= */


function openManualBooking() {

  if (!isAdmin()) return;


  const modal =
    document.getElementById(
      "manualBookingModal"
    );


  const serviceSelect =
    document.getElementById(
      "manualService"
    );


  const timeSelect =
    document.getElementById(
      "manualBookingTime"
    );


  const dateInput =
    document.getElementById(
      "manualBookingDate"
    );


  if (serviceSelect) {

    serviceSelect.innerHTML = `

      <option value="">
        Seleziona servizio
      </option>

    `;


    SERVICES.forEach(service => {

      const option =
        document.createElement("option");

      option.value =
        service.name;

      option.textContent =
        `${service.name} - €${service.price}`;

      serviceSelect.appendChild(option);

    });

  }


  if (timeSelect) {

    timeSelect.innerHTML = `

      <option value="">
        Seleziona orario
      </option>

    `;


    TIMES.forEach(time => {

      const option =
        document.createElement("option");

      option.value = time;

      option.textContent = time;

      timeSelect.appendChild(option);

    });

  }


  if (dateInput) {

    dateInput.min =
      getTodayString();

    dateInput.value =
      adminSelectedDate ||
      getTodayString();

  }


  modal.classList.remove("hidden");

}


function closeManualBooking() {

  document
    .getElementById(
      "manualBookingModal"
    )
    .classList
    .add("hidden");

}


async function createManualBooking() {

  if (!isAdmin()) return;


  const customerName =
    document
      .getElementById(
        "manualCustomerName"
      )
      .value
      .trim();


  const customerPhone =
    normalizePhone(
      document
        .getElementById(
          "manualCustomerPhone"
        )
        .value
    );


  const serviceName =
    document
      .getElementById(
        "manualService"
      )
      .value;


  const date =
    document
      .getElementById(
        "manualBookingDate"
      )
      .value;


  const time =
    document
      .getElementById(
        "manualBookingTime"
      )
      .value;


  if (!customerName) {

    showToast(
      "Inserisci il nome del cliente"
    );

    return;

  }


  if (!serviceName) {

    showToast(
      "Seleziona un servizio"
    );

    return;

  }


  if (!date) {

    showToast(
      "Seleziona una data"
    );

    return;

  }


  if (!time) {

    showToast(
      "Seleziona un orario"
    );

    return;

  }


  const service =
    SERVICES.find(
      item =>
        item.name === serviceName
    );


  const { data: existing } =
    await supabaseClient
      .from("appointments")
      .select("id")
      .eq(
        "appointment_date",
        date
      )
      .eq(
        "start_time",
        time
      )
      .neq(
        "status",
        "cancelled"
      )
      .maybeSingle();


  if (existing) {

    showToast(
      "Questo orario è già occupato"
    );

    return;

  }


  try {

    const { error } =
      await supabaseClient
        .from("appointments")
        .insert({

          customer_id:
            null,

          customer_name:
            customerName,

          customer_phone:
            customerPhone || null,

          service_name:
            service.name,

          service_price:
            service.price,

          appointment_date:
            date,

          start_time:
            time,

          end_time:
            getEndTime(time),

          status:
            "confirmed",

          notes:
            "Inserito manualmente dall'admin"

        });


    if (error) {

      console.error(error);

      showToast(
        "Errore: " +
        error.message
      );

      return;

    }


    showToast(
      "Cliente aggiunto in agenda"
    );


    closeManualBooking();


    adminSelectedDate = date;


    loadAdminAgenda();

    renderAdminCalendar();


  } catch (error) {

    console.error(error);

  }

}


/* =========================================================
   SPOSTA APPUNTAMENTO
========================================================= */


async function openMoveBooking(id) {

  if (!isAdmin()) return;


  const { data, error } =
    await supabaseClient
      .from("appointments")
      .select("*")
      .eq("id", id)
      .single();


  if (error || !data) {

    showToast(
      "Appuntamento non trovato"
    );

    return;

  }


  currentMoveBooking = data;


  document
    .getElementById(
      "moveBookingId"
    )
    .value = data.id;


  document
    .getElementById(
      "moveBookingCustomer"
    )
    .textContent =
      `${data.customer_name} - ${data.service_name}`;


  const dateInput =
    document.getElementById(
      "moveBookingDate"
    );


  dateInput.min =
    getTodayString();


  dateInput.value =
    data.appointment_date;


  await populateMoveTimes(
    data.appointment_date,
    data.id
  );


  document
    .getElementById(
      "moveBookingModal"
    )
    .classList
    .remove("hidden");

}


function closeMoveBooking() {

  document
    .getElementById(
      "moveBookingModal"
    )
    .classList
    .add("hidden");


  currentMoveBooking = null;

}


async function populateMoveTimes(
  date,
  currentId
) {

  const select =
    document.getElementById(
      "moveBookingTime"
    );


  select.innerHTML = `

    <option value="">
      Seleziona nuovo orario
    </option>

  `;


  const { data } =
    await supabaseClient
      .from("appointments")
      .select("id,start_time")
      .eq(
        "appointment_date",
        date
      )
      .neq(
        "status",
        "cancelled"
      );


  const occupied =
    (data || [])
      .filter(
        appointment =>
          appointment.id !== currentId
      )
      .map(
        appointment =>
          String(
            appointment.start_time
          ).substring(0, 5)
      );


  TIMES.forEach(time => {

    const option =
      document.createElement("option");


    option.value = time;

    option.textContent =
      occupied.includes(time)
        ? `${time} - OCCUPATO`
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
    document
      .getElementById(
        "moveBookingId"
      )
      .value;


  const date =
    document
      .getElementById(
        "moveBookingDate"
      )
      .value;


  const time =
    document
      .getElementById(
        "moveBookingTime"
      )
      .value;


  if (!id || !date || !time) {

    showToast(
      "Completa data e orario"
    );

    return;

  }


  const { data: existing } =
    await supabaseClient
      .from("appointments")
      .select("id")
      .eq(
        "appointment_date",
        date
      )
      .eq(
        "start_time",
        time
      )
      .neq(
        "status",
        "cancelled"
      )
      .neq(
        "id",
        id
      )
      .maybeSingle();


  if (existing) {

    showToast(
      "Questo orario è già occupato"
    );

    return;

  }


  try {

    const { error } =
      await supabaseClient
        .from("appointments")
        .update({

          appointment_date:
            date,

          start_time:
            time,

          end_time:
            getEndTime(time),

          status:
            "confirmed"

        })
        .eq("id", id);


    if (error) {

      showToast(
        "Errore: " +
        error.message
      );

      return;

    }


    showToast(
      "Appuntamento spostato"
    );


    closeMoveBooking();


    adminSelectedDate = date;


    renderAdminCalendar();

    loadAdminAgenda();


  } catch (error) {

    console.error(error);

  }

}


/* =========================================================
   CAMBIO DATA MODALE SPOSTAMENTO
========================================================= */


document.addEventListener(
  "change",
  async event => {

    if (
      event.target &&
      event.target.id === "moveBookingDate"
    ) {

      const id =
        document
          .getElementById(
            "moveBookingId"
          )
          .value;


      await populateMoveTimes(
        event.target.value,
        id
      );

    }

  }
);


/* =========================================================
   ELIMINA APPUNTAMENTO ADMIN
========================================================= */


async function deleteAdminBooking(id) {

  if (!isAdmin()) return;


  const confirmation =
    confirm(
      "Vuoi eliminare questo appuntamento?"
    );


  if (!confirmation) return;


  try {

    const { error } =
      await supabaseClient
        .from("appointments")
        .update({
          status: "cancelled"
        })
        .eq("id", id);


    if (error) {

      showToast(
        "Errore: " +
        error.message
      );

      return;

    }


    showToast(
      "Appuntamento eliminato"
    );


    loadAdminAgenda();


  } catch (error) {

    console.error(error);

  }

}


/* =========================================================
   INSTALLAZIONE APP
========================================================= */


function showInstall() {

  document
    .getElementById(
      "installModal"
    )
    .classList
    .remove("hidden");

}


function closeInstall() {

  document
    .getElementById(
      "installModal"
    )
    .classList
    .add("hidden");

}


/* =========================================================
   ONESIGNAL NOTIFICHE
========================================================= */


window.enableGrimaldiPush =
  async function () {

    try {

      if (
        !window.OneSignalDeferred
      ) {

        showToast(
          "Sistema notifiche non ancora pronto"
        );

        return;

      }


      window.OneSignalDeferred.push(
        async function (OneSignal) {

          try {

            await OneSignal.Notifications.requestPermission();

            showToast(
              "Notifiche attivate!"
            );

          } catch (error) {

            console.error(error);

            showToast(
              "Impossibile attivare le notifiche"
            );

          }

        }
      );

    } catch (error) {

      console.error(error);

    }

  };


/* =========================================================
   CAMBIO MESE CALENDARIO PRENOTAZIONE
========================================================= */


document
  .getElementById("prevBookingMonth")
  ?.addEventListener(
    "click",
    () => {

      bookingMonth =
        new Date(
          bookingMonth.getFullYear(),
          bookingMonth.getMonth() - 1,
          1
        );

      renderBookingCalendar();

    }
  );


document
  .getElementById("nextBookingMonth")
  ?.addEventListener(
    "click",
    () => {

      bookingMonth =
        new Date(
          bookingMonth.getFullYear(),
          bookingMonth.getMonth() + 1,
          1
        );

      renderBookingCalendar();

    }
  );


/* =========================================================
   CAMBIO MESE ADMIN
========================================================= */


document
  .getElementById("prevAdminMonth")
  ?.addEventListener(
    "click",
    () => {

      adminMonth =
        new Date(
          adminMonth.getFullYear(),
          adminMonth.getMonth() - 1,
          1
        );

      renderAdminCalendar();

    }
  );


document
  .getElementById("nextAdminMonth")
  ?.addEventListener(
    "click",
    () => {

      adminMonth =
        new Date(
          adminMonth.getFullYear(),
          adminMonth.getMonth() + 1,
          1
        );

      renderAdminCalendar();

    }
  );


/* =========================================================
   BOTTONI
========================================================= */


document
  .getElementById("loginButton")
  ?.addEventListener(
    "click",
    loginUser
  );


document
  .getElementById("registerButton")
  ?.addEventListener(
    "click",
    registerUser
  );


document
  .getElementById("confirmBooking")
  ?.addEventListener(
    "click",
    confirmBooking
  );


/* =========================================================
   ENTER LOGIN
========================================================= */


document
  .getElementById("pinInput")
  ?.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        loginUser();

      }

    }
  );


/* =========================================================
   RIPRISTINA SESSIONE
========================================================= */


async function restoreSession() {

  try {

    const savedUser =
      localStorage.getItem(
        "grimaldiUser"
      );


    if (!savedUser) {

      updateUserInterface();

      return;

    }


    const parsedUser =
      JSON.parse(savedUser);


    if (!parsedUser?.id) {

      localStorage.removeItem(
        "grimaldiUser"
      );

      updateUserInterface();

      return;

    }


    const { data, error } =
      await supabaseClient
        .from("profiles")
        .select("*")
        .eq(
          "id",
          parsedUser.id
        )
        .maybeSingle();


    if (
      error ||
      !data
    ) {

      localStorage.removeItem(
        "grimaldiUser"
      );

      currentUser = null;

      updateUserInterface();

      return;

    }


    currentUser = data;


    /* FORZA ADMIN SUL TUO NUMERO */

    if (
      normalizePhone(
        currentUser.customer_phone
      ) === ADMIN_PHONE
    ) {

      currentUser.is_admin = true;

    }


    localStorage.setItem(
      "grimaldiUser",
      JSON.stringify(currentUser)
    );


    updateUserInterface();


  } catch (error) {

    console.error(error);

    currentUser = null;

    updateUserInterface();

  }

}


/* =========================================================
   CARICAMENTO APP
========================================================= */


document.addEventListener(
  "DOMContentLoaded",
  async () => {

    renderServices();

    renderBookingCalendar();

    updateBookingSummary();

    await restoreSession();


    const loadingScreen =
      document.getElementById(
        "loadingScreen"
      );


    setTimeout(() => {

      if (loadingScreen) {

        loadingScreen.classList.add(
          "hide"
        );

      }

    }, 1200);

  }
);
