// =====================================================
// I GRIMALDI E.S.G. PARRUCCHIERI
// APP.JS FINALE
// =====================================================


// =====================================================
// CONFIGURAZIONE SUPABASE
// =====================================================

const SUPABASE_URL = "https://wxcdmtajcasnlohqkgmk.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_bwjP-ihASijevvu7d6r5Ew_6JaWKSDP";

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


// =====================================================
// CONFIGURAZIONE
// =====================================================

const ADMIN_PHONE = "ADMIN";

const SERVICES = [
  {
    id: "shampoo_taglio",
    name: "Shampoo + Taglio",
    price: 20,
    duration: 30
  },
  {
    id: "barba_5",
    name: "Barba",
    price: 5,
    duration: 30
  },
  {
    id: "barba_10",
    name: "Barba",
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


// =====================================================
// STATO APP
// =====================================================

let currentUser = null;

let selectedService = null;

let selectedBookingDate = null;

let selectedBookingTime = null;

let bookingMonth = new Date();

let agendaMonth = new Date();

let agendaSelectedDate = new Date();

let busyTimes = [];

let allAppointments = [];

let toastTimer = null;


// =====================================================
// AVVIO APP
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

  initializeServiceList();

  initializeAdminSelects();

  restoreSession();

  updateNavigation();

  updateProfile();

  renderBookingCalendar();

  renderBookingTimes();

  renderAgendaCalendar();

  updateAgendaDate();

  setTimeout(() => {

    const loading = document.getElementById("loadingScreen");

    const app = document.getElementById("app");

    if (loading) {
      loading.classList.add("hidden");

      setTimeout(() => {
        loading.style.display = "none";
      }, 500);
    }

    if (app) {
      app.classList.remove("hidden");
    }

  }, 1500);

});


// =====================================================
// UTILITIES
// =====================================================

function formatPhone(phone) {

  return String(phone || "")
    .replace(/\s+/g, "")
    .replace(/-/g, "");

}


function getTodayString() {

  const today = new Date();

  return formatDateISO(today);

}


function formatDateISO(date) {

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;

}


function formatItalianDate(dateString) {

  if (!dateString) return "";

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


function formatMonth(date) {

  return date.toLocaleDateString(
    "it-IT",
    {
      month: "long",
      year: "numeric"
    }
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


function getService(serviceName) {

  return SERVICES.find(
    service =>
      service.name === serviceName ||
      service.id === serviceName
  );

}


function getServicePrice(serviceName) {

  const service = getService(serviceName);

  return service ? service.price : 0;

}


function isAdmin() {

  return currentUser &&
    (
      currentUser.is_admin === true ||
      currentUser.role === "admin"
    );

}


// =====================================================
// TOAST
// =====================================================

function showToast(message, type = "default") {

  const toast =
    document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;

  toast.className = "";

  toast.classList.add("toast");

  if (type === "success") {
    toast.classList.add("success");
  }

  if (type === "error") {
    toast.classList.add("error");
  }

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {

    toast.classList.remove("show");

  }, 3000);

}


// =====================================================
// PAGINE
// =====================================================

function showPage(pageId) {

  const pages =
    document.querySelectorAll(".page");

  pages.forEach(page => {

    page.classList.remove("active");

  });

  const page =
    document.getElementById(pageId);

  if (page) {

    page.classList.add("active");

  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  if (pageId === "bookingPage") {

    renderBookingCalendar();

    renderBookingTimes();

  }


  if (pageId === "appointmentsPage") {

    loadMyAppointments();

  }


  if (pageId === "agendaPage") {

    if (!isAdmin()) {

      showToast(
        "Area riservata all'amministratore",
        "error"
      );

      showPage("homePage");

      return;

    }

    loadAgenda();

  }


  if (pageId === "profilePage") {

    updateProfile();

  }

}


// =====================================================
// NAVIGAZIONE TERZO PULSANTE
// =====================================================

function thirdNav() {

  if (isAdmin()) {

    showPage("agendaPage");

  } else {

    if (!currentUser) {

      openAuth();

      return;

    }

    showPage("appointmentsPage");

  }

}


function updateNavigation() {

  const thirdLabel =
    document.getElementById("thirdLabel");

  if (!thirdLabel) return;

  if (isAdmin()) {

    thirdLabel.textContent = "Agenda";

  } else {

    thirdLabel.textContent = "Appuntamenti";

  }

}


// =====================================================
// LOGIN MODAL
// =====================================================

function openAuth() {

  const modal =
    document.getElementById("authModal");

  if (!modal) return;

  modal.classList.remove("hidden");

}


function closeAuth() {

  const modal =
    document.getElementById("authModal");

  if (!modal) return;

  modal.classList.add("hidden");

}


// =====================================================
// REGISTRAZIONE
// =====================================================

function openRegister() {

  closeAuth();

  const modal =
    document.getElementById("registerModal");

  if (modal) {

    modal.classList.remove("hidden");

  }

}


function closeRegister() {

  const modal =
    document.getElementById("registerModal");

  if (modal) {

    modal.classList.add("hidden");

  }

}


// =====================================================
// CREAZIONE EMAIL TECNICA
// =====================================================

function createEmailFromPhone(phone) {

  const cleanPhone =
    String(phone || "")
      .replace(/\D/g, "");

  return `${cleanPhone}@igrimaldi.app`;

}


// =====================================================
// REGISTRAZIONE UTENTE
// =====================================================

async function register() {

  const name =
    document.getElementById("regName")
      ?.value
      .trim();

  const surname =
    document.getElementById("regSurname")
      ?.value
      .trim();

  const phone =
    document.getElementById("regPhone")
      ?.value
      .trim();

  const pin =
    document.getElementById("regPin")
      ?.value
      .trim();

  const pin2 =
    document.getElementById("regPin2")
      ?.value
      .trim();


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


  if (pin.length < 4) {

    showToast(
      "Il PIN deve avere almeno 4 numeri",
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


  if (!supabaseClient) {

    showToast(
      "Connessione al database non disponibile",
      "error"
    );

    return;

  }


  try {

    showToast(
      "Registrazione in corso..."
    );


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


    if (error) {

      console.error(error);

      if (
        error.message
          .toLowerCase()
          .includes("already")
      ) {

        throw new Error(
          "Numero di telefono già registrato"
        );

      }

      throw error;

    }


    if (!data.user) {

      throw new Error(
        "Impossibile creare l'account"
      );

    }


    currentUser = {
      id: data.user.id,
      name: name,
      surname: surname,
      phone: phone,
      role: "customer"
    };


    localStorage.setItem(
      "grimaldiUser",
      JSON.stringify(currentUser)
    );


    closeRegister();

    updateNavigation();

    updateProfile();


    showToast(
      "Account creato con successo!",
      "success"
    );


    showPage("homePage");


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

  }

}


// =====================================================
// LOGIN
// =====================================================

async function login() {

  const phone =
    document.getElementById("loginPhone")
      ?.value
      .trim();

  const pin =
    document.getElementById("loginPin")
      ?.value
      .trim();

  const errorBox =
    document.getElementById("loginError");


  if (errorBox) {

    errorBox.textContent = "";

  }


  if (!phone || !pin) {

    if (errorBox) {

      errorBox.textContent =
        "Inserisci numero e PIN";

    }

    return;

  }


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


    if (error) {

      throw error;

    }


    if (!data.user) {

      throw new Error(
        "Accesso non riuscito"
      );

    }


    const metadata =
      data.user.user_metadata || {};


    currentUser = {
      id: data.user.id,
      name:
        metadata.name ||
        "Cliente",
      surname:
        metadata.surname ||
        "",
      phone:
        metadata.phone ||
        phone,
      role:
        metadata.role ||
        "customer",
      is_admin:
        metadata.is_admin ||
        false
    };


    localStorage.setItem(
      "grimaldiUser",
      JSON.stringify(currentUser)
    );


    closeAuth();

    updateNavigation();

    updateProfile();


    showToast(
      `Bentornato ${currentUser.name}!`,
      "success"
    );


    showPage("homePage");


  } catch (error) {

    console.error(error);

    if (errorBox) {

      errorBox.textContent =
        "Numero o PIN non corretto";

    }

  }

}


// =====================================================
// RIPRISTINO SESSIONE
// =====================================================

async function restoreSession() {

  try {

    const saved =
      localStorage.getItem("grimaldiUser");

    if (saved) {

      currentUser =
        JSON.parse(saved);

    }


    if (supabaseClient) {

      const {
        data
      } =
        await supabaseClient.auth.getSession();


      if (
        !data.session &&
        !saved
      ) {

        currentUser = null;

      }

    }


  } catch (error) {

    console.error(error);

    currentUser = null;

  }


  updateNavigation();

  updateProfile();

}


// =====================================================
// LOGOUT
// =====================================================

async function logout() {

  try {

    if (supabaseClient) {

      await supabaseClient.auth.signOut();

    }

  } catch (error) {

    console.error(error);

  }


  currentUser = null;

  localStorage.removeItem(
    "grimaldiUser"
  );


  updateNavigation();

  updateProfile();


  showToast(
    "Logout effettuato",
    "success"
  );


  showPage("homePage");

}


// =====================================================
// PROFILO
// =====================================================

function updateProfile() {

  const container =
    document.getElementById("profileContent");

  if (!container) return;


  if (!currentUser) {

    container.innerHTML = `
      <div class="profile-guest">
        <h3>Accedi al tuo account</h3>
        <p>
          Registrati o accedi per gestire
          i tuoi appuntamenti.
        </p>
        <button onclick="openAuth()">
          ACCEDI
        </button>
      </div>
    `;

    return;

  }


  const roleText =
    isAdmin()
      ? "AMMINISTRATORE"
      : "CLIENTE";


  container.innerHTML = `
    <div class="profile-user-header">
      <div class="profile-avatar">
        ${escapeHtml(
          currentUser.name
            ?.charAt(0)
            ?.toUpperCase() || "I"
        )}
      </div>

      <div>
        <span>${roleText}</span>
        <h3>
          ${escapeHtml(
            currentUser.name || ""
          )}
          ${escapeHtml(
            currentUser.surname || ""
          )}
        </h3>
        <p>
          ${escapeHtml(
            currentUser.phone || ""
          )}
        </p>
      </div>
    </div>
  `;

}


// =====================================================
// SERVIZI
// =====================================================

function initializeServiceList() {

  const container =
    document.getElementById("services");

  if (!container) return;


  container.innerHTML = "";


  SERVICES.forEach(service => {

    const button =
      document.createElement("button");

    button.type = "button";

    button.className =
      "service-card";

    button.dataset.service =
      service.id;


    button.innerHTML = `
      <div class="service-card-content">

        <div>
          <strong>
            ${service.name}
          </strong>

          <small>
            Servizio professionale
          </small>
        </div>

        <div class="service-price">
          €${service.price}
        </div>

      </div>
    `;


    button.onclick = () => {

      selectBookingService(
        service.id
      );

    };


    container.appendChild(button);

  });

}


function selectBookingService(serviceId) {

  selectedService =
    SERVICES.find(
      service =>
        service.id === serviceId
    );


  document
    .querySelectorAll(".service-card")
    .forEach(button => {

      button.classList.remove(
        "selected"
      );

    });


  const selected =
    document.querySelector(
      `[data-service="${serviceId}"]`
    );


  if (selected) {

    selected.classList.add(
      "selected"
    );

  }


  showToast(
    `${selectedService.name} selezionato`
  );

}


// =====================================================
// CALENDARIO PRENOTAZIONE
// =====================================================

function renderBookingCalendar() {

  const grid =
    document.getElementById(
      "bookingCalendar"
    );

  const title =
    document.getElementById(
      "bookingMonthTitle"
    );


  if (!grid || !title) return;


  title.textContent =
    formatMonth(bookingMonth);


  grid.innerHTML = "";


  const year =
    bookingMonth.getFullYear();

  const month =
    bookingMonth.getMonth();


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


  for (
    let i = 0;
    i < startDay;
    i++
  ) {

    const empty =
      document.createElement("div");

    empty.className =
      "calendar-empty";

    grid.appendChild(empty);

  }


  const today =
    getTodayString();


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


    const dateString =
      formatDateISO(date);


    const button =
      document.createElement("button");

    button.type = "button";

    button.textContent = day;


    if (dateString < today) {

      button.disabled = true;

      button.classList.add(
        "disabled"
      );

    }


    if (
      selectedBookingDate ===
      dateString
    ) {

      button.classList.add(
        "selected"
      );

    }


    button.onclick = async () => {

      if (dateString < today) return;

      selectedBookingDate =
        dateString;

      selectedBookingTime =
        null;


      const label =
        document.getElementById(
          "selectedBookingDateLabel"
        );


      if (label) {

        label.textContent =
          formatItalianDate(
            dateString
          );

      }


      renderBookingCalendar();

      await loadBusyTimes();

      renderBookingTimes();

    };


    grid.appendChild(button);

  }

}


function changeBookingMonth(direction) {

  bookingMonth.setMonth(
    bookingMonth.getMonth() +
    direction
  );


  const today =
    new Date();


  const minimumMonth =
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );


  if (
    bookingMonth < minimumMonth
  ) {

    bookingMonth =
      new Date(minimumMonth);

  }


  renderBookingCalendar();

}


// =====================================================
// ORARI PRENOTAZIONE
// =====================================================

async function loadBusyTimes() {

  busyTimes = [];


  if (
    !selectedBookingDate ||
    !supabaseClient
  ) return;


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("appointments")
        .select("start_time")
        .eq(
          "appointment_date",
          selectedBookingDate
        )
        .neq(
          "status",
          "cancelled"
        );


    if (error) {

      console.error(error);

      return;

    }


    busyTimes =
      (data || [])
        .map(item =>
          String(item.start_time)
            .substring(0, 5)
        );


  } catch (error) {

    console.error(error);

  }

}


function renderBookingTimes() {

  const container =
    document.getElementById(
      "bookingTimesElegant"
    );

  if (!container) return;


  container.innerHTML = "";


  if (!selectedBookingDate) {

    container.innerHTML = `
      <p class="times-placeholder">
        Seleziona prima una data
      </p>
    `;

    return;

  }


  TIMES.forEach(time => {

    const button =
      document.createElement("button");

    button.type = "button";

    button.textContent = time;

    button.className =
      "booking-time";


    const isBusy =
      busyTimes.includes(time);


    if (isBusy) {

      button.disabled = true;

      button.classList.add("busy");

      button.textContent =
        `${time} · Occupato`;

    }


    if (
      selectedBookingTime === time
    ) {

      button.classList.add(
        "selected"
      );

    }


    button.onclick = () => {

      selectedBookingTime = time;

      renderBookingTimes();

    };


    container.appendChild(button);

  });

}


// =====================================================
// CREA PRENOTAZIONE
// =====================================================

async function createBooking() {

  if (!currentUser) {

    openAuth();

    showToast(
      "Accedi prima di prenotare",
      "error"
    );

    return;

  }


  if (!selectedService) {

    showToast(
      "Seleziona un servizio",
      "error"
    );

    return;

  }


  if (!selectedBookingDate) {

    showToast(
      "Seleziona una data",
      "error"
    );

    return;

  }


  if (!selectedBookingTime) {

    showToast(
      "Seleziona un orario",
      "error"
    );

    return;

  }


  await loadBusyTimes();


  if (
    busyTimes.includes(
      selectedBookingTime
    )
  ) {

    showToast(
      "Questo orario è stato appena occupato",
      "error"
    );

    renderBookingTimes();

    return;

  }


  const [hours, minutes] =
    selectedBookingTime
      .split(":")
      .map(Number);


  const endDate =
    new Date(
      2000,
      0,
      1,
      hours,
      minutes
    );


  endDate.setMinutes(
    endDate.getMinutes() + 30
  );


  const endTime =
    `${String(
      endDate.getHours()
    ).padStart(2, "0")}:${String(
      endDate.getMinutes()
    ).padStart(2, "0")}`;


  const appointment = {

    customer_id:
      currentUser.id,

    customer_name:
      `${currentUser.name || ""} ${currentUser.surname || ""}`
        .trim(),

    customer_phone:
      currentUser.phone || "",

    appointment_date:
      selectedBookingDate,

    start_time:
      selectedBookingTime,

    end_time:
      endTime,

    service:
      selectedService.name,

    status:
      "confirmed"

  };


  try {

    showToast(
      "Conferma prenotazione..."
    );


    const {
      error
    } =
      await supabaseClient
        .from("appointments")
        .insert([appointment]);


    if (error) {

      throw error;

    }


    showToast(
      "Prenotazione confermata!",
      "success"
    );


    selectedService = null;

    selectedBookingTime = null;


    document
      .querySelectorAll(".service-card")
      .forEach(button => {

        button.classList.remove(
          "selected"
        );

      });


    await loadBusyTimes();

    renderBookingTimes();


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

  }

}


// =====================================================
// I MIEI APPUNTAMENTI
// =====================================================

async function loadMyAppointments() {

  const container =
    document.getElementById(
      "myAppointments"
    );

  if (!container) return;


  if (!currentUser) {

    container.innerHTML = `
      <div class="card empty-state">
        <h3>Accedi al tuo account</h3>
        <p>
          Devi accedere per vedere
          i tuoi appuntamenti.
        </p>
      </div>
    `;

    return;

  }


  container.innerHTML = `
    <div class="card">
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
          "customer_id",
          currentUser.id
        )
        .order(
          "appointment_date",
          {
            ascending: true
          }
        );


    if (error) {

      throw error;

    }


    if (!data || data.length === 0) {

      container.innerHTML = `
        <div class="card empty-state">
          <h3>Nessun appuntamento</h3>
          <p>
            Non hai ancora effettuato
            una prenotazione.
          </p>
        </div>
      `;

      return;

    }


    container.innerHTML = "";


    data.forEach(appointment => {

      const service =
        getService(
          appointment.service
        );


      const card =
        document.createElement("div");

      card.className =
        "card appointment-card";


      card.innerHTML = `

        <div class="appointment-top">

          <div>
            <span>APPUNTAMENTO</span>

            <h3>
              ${escapeHtml(
                appointment.service
              )}
            </h3>
          </div>

          <strong>
            €${service ? service.price : ""}
          </strong>

        </div>


        <div class="appointment-details">

          <p>
            📅
            ${formatItalianDate(
              appointment.appointment_date
            )}
          </p>

          <p>
            🕒
            ${String(
              appointment.start_time
            ).substring(0, 5)}
          </p>

        </div>


        <button
          class="cancel-booking"
          onclick="cancelAppointment('${appointment.id}')"
        >
          ANNULLA APPUNTAMENTO
        </button>

      `;


      container.appendChild(card);

    });


  } catch (error) {

    console.error(error);

    container.innerHTML = `
      <div class="card empty-state">
        Errore nel caricamento.
      </div>
    `;

  }

}


// =====================================================
// CANCELLA APPUNTAMENTO
// =====================================================

async function cancelAppointment(id) {

  const confirmed =
    confirm(
      "Vuoi annullare questo appuntamento?"
    );


  if (!confirmed) return;


  try {

    const {
      error
    } =
      await supabaseClient
        .from("appointments")
        .update({
          status: "cancelled"
        })
        .eq("id", id);


    if (error) {

      throw error;

    }


    showToast(
      "Appuntamento annullato",
      "success"
    );


    loadMyAppointments();


  } catch (error) {

    console.error(error);

    showToast(
      "Errore durante l'annullamento",
      "error"
    );

  }

}


// =====================================================
// AGENDA ADMIN
// =====================================================

async function loadAgenda() {

  if (!isAdmin()) return;


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("appointments")
        .select("*")
        .neq(
          "status",
          "cancelled"
        );


    if (error) {

      throw error;

    }


    allAppointments =
      data || [];


    updateAgendaSummary();

    renderAgendaCalendar();

    renderAgendaSlots();


  } catch (error) {

    console.error(error);

    showToast(
      "Errore caricamento agenda",
      "error"
    );

  }

}


function updateAgendaSummary() {

  const count =
    document.getElementById(
      "agendaCount"
    );

  const revenue =
    document.getElementById(
      "agendaRevenue"
    );


  const today =
    getTodayString();


  const todayAppointments =
    allAppointments.filter(
      appointment =>
        appointment.appointment_date ===
        today
    );


  let total = 0;


  todayAppointments.forEach(
    appointment => {

      total += getServicePrice(
        appointment.service
      );

    }
  );


  if (count) {

    count.textContent =
      todayAppointments.length;

  }


  if (revenue) {

    revenue.textContent =
      `€${total}`;

  }

}


// =====================================================
// CALENDARIO AGENDA
// =====================================================

function renderAgendaCalendar() {

  const grid =
    document.getElementById(
      "calendarGrid"
    );

  const title =
    document.getElementById(
      "monthTitle"
    );

  if (!grid || !title) return;


  title.textContent =
    formatMonth(agendaMonth);


  grid.innerHTML = "";


  const year =
    agendaMonth.getFullYear();

  const month =
    agendaMonth.getMonth();


  const first =
    new Date(year, month, 1);


  let start =
    first.getDay() - 1;

  if (start < 0) start = 6;


  const totalDays =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  for (
    let i = 0;
    i < start;
    i++
  ) {

    grid.appendChild(
      document.createElement("div")
    );

  }


  for (
    let day = 1;
    day <= totalDays;
    day++
  ) {

    const date =
      new Date(
        year,
        month,
        day
      );


    const dateString =
      formatDateISO(date);


    const appointments =
      allAppointments.filter(
        item =>
          item.appointment_date ===
          dateString
      );


    const button =
      document.createElement("button");


    button.type = "button";

    button.className =
      "agenda-day";


    button.innerHTML = `
      <span>${day}</span>
      ${
        appointments.length > 0
          ? `<small>${appointments.length}</small>`
          : ""
      }
    `;


    if (
      formatDateISO(
        agendaSelectedDate
      ) === dateString
    ) {

      button.classList.add(
        "selected"
      );

    }


    if (appointments.length > 0) {

      button.classList.add(
        "has-bookings"
      );

    }


    button.onclick = () => {

      agendaSelectedDate = date;

      updateAgendaDate();

      renderAgendaCalendar();

      renderAgendaSlots();

    };


    grid.appendChild(button);

  }

}


function changeMonth(direction) {

  agendaMonth.setMonth(
    agendaMonth.getMonth() +
    direction
  );


  renderAgendaCalendar();

}


// =====================================================
// DATA AGENDA
// =====================================================

function updateAgendaDate() {

  const title =
    document.getElementById(
      "selectedDateTitle"
    );

  if (!title) return;


  title.textContent =
    formatItalianDate(
      formatDateISO(
        agendaSelectedDate
      )
    );

}


// =====================================================
// SLOT AGENDA
// =====================================================

function renderAgendaSlots() {

  const container =
    document.getElementById(
      "agendaSlots"
    );

  if (!container) return;


  const selectedDateString =
    formatDateISO(
      agendaSelectedDate
    );


  const appointments =
    allAppointments.filter(
      appointment =>
        appointment.appointment_date ===
        selectedDateString
    );


  appointments.sort(
    (a, b) =>
      String(a.start_time)
        .localeCompare(
          String(b.start_time)
        )
  );


  if (appointments.length === 0) {

    container.innerHTML = `
      <div class="card empty-state">
        <h3>Nessun appuntamento</h3>
        <p>
          Giornata libera.
        </p>
      </div>
    `;

    return;

  }


  container.innerHTML = "";


  appointments.forEach(
    appointment => {

      const service =
        getService(
          appointment.service
        );


      const card =
        document.createElement("div");

      card.className =
        "agenda-appointment";


      card.innerHTML = `

        <div class="agenda-time">
          ${String(
            appointment.start_time
          ).substring(0, 5)}
        </div>

        <div class="agenda-client">

          <strong>
            ${escapeHtml(
              appointment.customer_name
            )}
          </strong>

          <span>
            ${escapeHtml(
              appointment.service
            )}
          </span>

          <small>
            ${escapeHtml(
              appointment.customer_phone ||
              ""
            )}
          </small>

        </div>

        <div class="agenda-price">
          €${service ? service.price : ""}
        </div>

      `;


      container.appendChild(card);

    }
  );

}


// =====================================================
// ADMIN AGGIUNGI CLIENTE
// =====================================================

function initializeAdminSelects() {

  const serviceSelect =
    document.getElementById(
      "adminService"
    );

  const timeSelect =
    document.getElementById(
      "adminTime"
    );


  if (serviceSelect) {

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

    TIMES.forEach(time => {

      const option =
        document.createElement("option");

      option.value = time;

      option.textContent = time;

      timeSelect.appendChild(option);

    });

  }


  const blockTime =
    document.getElementById(
      "blockTime"
    );


  if (blockTime) {

    TIMES.forEach(time => {

      const option =
        document.createElement("option");

      option.value = time;

      option.textContent = time;

      blockTime.appendChild(option);

    });

  }

}


function openAddClient() {

  if (!isAdmin()) return;


  const modal =
    document.getElementById(
      "addModal"
    );

  if (!modal) return;


  const dateInput =
    document.getElementById(
      "adminDate"
    );


  if (dateInput) {

    dateInput.value =
      formatDateISO(
        agendaSelectedDate
      );

  }


  modal.classList.remove("hidden");

}


async function adminAddBooking() {

  const name =
    document.getElementById(
      "adminName"
    )?.value.trim();

  const phone =
    document.getElementById(
      "adminPhone"
    )?.value.trim();

  const service =
    document.getElementById(
      "adminService"
    )?.value;

  const date =
    document.getElementById(
      "adminDate"
    )?.value;

  const time =
    document.getElementById(
      "adminTime"
    )?.value;


  if (
    !name ||
    !service ||
    !date ||
    !time
  ) {

    showToast(
      "Compila tutti i campi obbligatori",
      "error"
    );

    return;

  }


  const [hour, minute] =
    time.split(":").map(Number);


  const end =
    new Date(
      2000,
      0,
      1,
      hour,
      minute
    );


  end.setMinutes(
    end.getMinutes() + 30
  );


  const endTime =
    `${String(
      end.getHours()
    ).padStart(2, "0")}:${String(
      end.getMinutes()
    ).padStart(2, "0")}`;


  try {

    const {
      error
    } =
      await supabaseClient
        .from("appointments")
        .insert([{

          customer_id: null,

          customer_name: name,

          customer_phone:
            phone || "",

          appointment_date: date,

          start_time: time,

          end_time: endTime,

          service: service,

          status: "confirmed"

        }]);


    if (error) {

      throw error;

    }


    closeModal("addModal");

    showToast(
      "Appuntamento aggiunto!",
      "success"
    );


    loadAgenda();


  } catch (error) {

    console.error(error);

    showToast(
      error.message ||
      "Errore salvataggio",
      "error"
    );

  }

}


// =====================================================
// BLOCCO
// =====================================================

function openBlock() {

  if (!isAdmin()) return;


  const modal =
    document.getElementById(
      "blockModal"
    );


  if (!modal) return;


  const date =
    document.getElementById(
      "blockDate"
    );


  if (date) {

    date.value =
      formatDateISO(
        agendaSelectedDate
      );

  }


  modal.classList.remove("hidden");

}


async function saveBlock() {

  showToast(
    "Funzione blocco disponibile nella prossima sincronizzazione"
  );


  closeModal("blockModal");

}


// =====================================================
// MODAL
// =====================================================

function closeModal(id) {

  const modal =
    document.getElementById(id);

  if (modal) {

    modal.classList.add("hidden");

  }

}


// =====================================================
// NOTIFICHE
// =====================================================

function requestNotifications() {

  if (
    !("Notification" in window)
  ) {

    showToast(
      "Notifiche non supportate dal dispositivo",
      "error"
    );

    return;

  }


  if (
    Notification.permission ===
    "granted"
  ) {

    showToast(
      "Notifiche già attive",
      "success"
    );

    return;

  }


  document
    .getElementById("notificationModal")
    ?.classList.remove("hidden");

}


async function enableNotifications() {

  try {

    const permission =
      await Notification.requestPermission();


    if (
      permission === "granted"
    ) {

      showToast(
        "Notifiche attivate!",
        "success"
      );

    } else {

      showToast(
        "Permesso notifiche non concesso",
        "error"
      );

    }


  } catch (error) {

    console.error(error);

  }


  closeNotifications();

}


function closeNotifications() {

  document
    .getElementById("notificationModal")
    ?.classList.add("hidden");

}


// =====================================================
// INSTALLAZIONE PWA
// =====================================================

function showInstall() {

  document
    .getElementById("installModal")
    ?.classList.remove("hidden");

}


// =====================================================
// ESPOSIZIONE FUNZIONI GLOBALI
// =====================================================

window.showPage = showPage;

window.thirdNav = thirdNav;

window.openAuth = openAuth;

window.closeAuth = closeAuth;

window.openRegister = openRegister;

window.closeRegister = closeRegister;

window.register = register;

window.login = login;

window.logout = logout;

window.changeBookingMonth =
  changeBookingMonth;

window.createBooking =
  createBooking;

window.cancelAppointment =
  cancelAppointment;

window.changeMonth =
  changeMonth;

window.openAddClient =
  openAddClient;

window.adminAddBooking =
  adminAddBooking;

window.openBlock =
  openBlock;

window.saveBlock =
  saveBlock;

window.closeModal =
  closeModal;

window.requestNotifications =
  requestNotifications;

window.enableNotifications =
  enableNotifications;

window.closeNotifications =
  closeNotifications;

window.showInstall =
  showInstall;

window.showToast =
  showToast;


// =====================================================
// FINE APP
// =====================================================
