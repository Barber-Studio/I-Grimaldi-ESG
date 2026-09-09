
/* =====================================================
   I GRIMALDI E.S.G. - APP.JS
   Compatibile con index.html
===================================================== */


/* =====================================================
   CONFIGURAZIONE SUPABASE
===================================================== */

const SUPABASE_URL = "https://wxcdmtajcasnlohqkgmk.supabase.co";
const SUPABASE_KEY = "sb_publishable_bwjP-ihASijevvu7d6r5Ew_6JaWKSDP";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* =====================================================
   CONFIGURAZIONE APP
===================================================== */

const ADMIN_PHONES = [
  "3791415355"
  // Inserisci qui i numeri admin normalizzati
  // esempio: "393331234567"
];


const SERVICES = [
  {
    id: "shampoo-taglio",
    name: "Shampoo + Taglio",
    price: 20
  },
  {
    id: "barba-5",
    name: "Barba 5€",
    price: 5
  },
  {
    id: "barba-10",
    name: "Barba 10€",
    price: 10
  },
  {
    id: "colore",
    name: "Colore",
    price: 20
  },
  {
    id: "colore-barba",
    name: "Colore Barba",
    price: 10
  },
  {
    id: "fiala",
    name: "Fiala",
    price: 5
  },
  {
    id: "shampoo",
    name: "shampoo",
    price: 10
  }
];


/* =====================================================
   ORARI
===================================================== */

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


/* =====================================================
   STATO APP
===================================================== */

let currentUser = null;
let currentProfile = null;

let selectedService = null;
let selectedDate = null;
let selectedTime = null;

let bookingMonth = new Date();
let adminMonth = new Date();
let adminSelectedDate = null;

let busyTimes = [];

let deferredPrompt = null;


/* =====================================================
   UTILITA
===================================================== */

function $(id) {
  return document.getElementById(id);
}


function normalizePhone(phone) {

  if (!phone) return "";

  let clean = phone.replace(/\D/g, "");

  if (clean.startsWith("00")) {
    clean = clean.substring(2);
  }

  if (clean.startsWith("39") && clean.length >= 11) {
    return clean;
  }

  if (clean.length === 10 && clean.startsWith("3")) {
    return "39" + clean;
  }

  return clean;
}


function createEmailFromPhone(phone) {

  const normalized = normalizePhone(phone);

  return normalized + "@igrimaldi.app";
}


function formatDate(dateString) {

  if (!dateString) return "-";

  const date = new Date(dateString + "T12:00:00");

  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}


function formatShortDate(dateString) {

  if (!dateString) return "-";

  const date = new Date(dateString + "T12:00:00");

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}


function todayString() {

  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function dateToString(date) {

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function getInitial(name) {

  if (!name) return "G";

  return name
    .trim()
    .charAt(0)
    .toUpperCase();
}


function isAdmin() {

  if (!currentProfile) return false;

  const phone = normalizePhone(
    currentProfile.phone
  );

  return ADMIN_PHONES.includes(phone);
}


function getServiceById(id) {

  return SERVICES.find(
    service => service.id === id
  );
}


function getServiceName(serviceId) {

  const service = getServiceById(serviceId);

  if (service) {
    return service.name;
  }

  return serviceId || "Servizio";
}


function getServicePrice(serviceId) {

  const service = getServiceById(serviceId);

  if (service) {
    return service.price;
  }

  return 0;
}


/* =====================================================
   TOAST
===================================================== */

function showToast(message, type = "success") {

  const toast = $("toast");

  if (!toast) return;

  toast.textContent = message;

  toast.className = "";

  toast.classList.add(
    "show",
    type
  );

  setTimeout(() => {

    toast.classList.remove(
      "show",
      "success",
      "error"
    );

  }, 3500);
}


/* =====================================================
   PAGINE
===================================================== */

function showPage(pageId) {

  const pages = document.querySelectorAll(".page");

  pages.forEach(page => {

    page.classList.remove("active");

  });


  const targetPage = $(pageId);

  if (targetPage) {

    targetPage.classList.add("active");

  }


  const navButtons = document.querySelectorAll(
    ".bottom-nav button[data-page]"
  );


  navButtons.forEach(button => {

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


  if (pageId === "appointmentsPage") {

    loadMyAppointments();

  }


  if (
    pageId === "adminAgendaPage" &&
    isAdmin()
  ) {

    loadAdminAgenda();

  }


  if (pageId === "profilePage") {

    updateProfileUI();

  }

}


window.showPage = showPage;


/* =====================================================
   MODALI
===================================================== */

function openAuth() {

  $("authModal").classList.add("active");

}


function closeAuth() {

  $("authModal").classList.remove("active");

}


function openRegister() {

  closeAuth();

  $("registerModal").classList.remove("hidden");

  $("registerModal").classList.add("active");

}


function closeRegister() {

  $("registerModal").classList.remove("active");

  $("registerModal").classList.add("hidden");

}


function showInstall() {

  const modal = $("installModal");

  modal.classList.remove("hidden");

  modal.classList.add("active");

}


function closeInstall() {

  const modal = $("installModal");

  modal.classList.remove("active");

  modal.classList.add("hidden");

}


window.openAuth = openAuth;
window.closeAuth = closeAuth;

window.openRegister = openRegister;
window.closeRegister = closeRegister;

window.showInstall = showInstall;
window.closeInstall = closeInstall;


/* =====================================================
   PROFILO
===================================================== */

function updateProfileUI() {

  const loginButton =
    $("loginProfileButton");

  const logoutButton =
    $("logoutButton");

  const profileName =
    $("profileName");

  const profilePhone =
    $("profilePhone");

  const profileInitial =
    $("profileInitial");


  if (currentUser && currentProfile) {

    profileName.textContent =
      currentProfile.full_name ||
      "Cliente";

    profilePhone.textContent =
      currentProfile.phone ||
      "";

    profileInitial.textContent =
      getInitial(
        currentProfile.full_name
      );


    loginButton.classList.add("hidden");

    logoutButton.classList.remove("hidden");


  } else {

    profileName.textContent =
      "Ospite";

    profilePhone.textContent =
      "Accedi per gestire il tuo profilo";

    profileInitial.textContent =
      "G";


    loginButton.classList.remove("hidden");

    logoutButton.classList.add("hidden");

  }


  updateNavigationForRole();

}


/* =====================================================
   NAVIGAZIONE ADMIN
===================================================== */

function updateNavigationForRole() {

  const adminButton =
    $("adminAgendaNavButton");

  const appointmentsButton =
    $("appointmentsNavButton");

  if (isAdmin()) {

    adminButton.style.display = "";

    appointmentsButton.style.display = "none";

  } else {

    adminButton.style.display = "none";

    appointmentsButton.style.display = "";

  }

}


/* =====================================================
   AUTENTICAZIONE - REGISTRAZIONE
===================================================== */

async function registerUser() {

  const name =
    $("registerName").value.trim();

  const surname =
    $("registerSurname").value.trim();

  const phone =
    $("registerPhone").value.trim();

  const pin =
    $("registerPin").value.trim();

  const pin2 =
    $("registerPin2").value.trim();


  if (!name) {

    showToast(
      "Inserisci il nome",
      "error"
    );

    return;
  }


  if (!surname) {

    showToast(
      "Inserisci il cognome",
      "error"
    );

    return;
  }


  if (!phone) {

    showToast(
      "Inserisci il numero di telefono",
      "error"
    );

    return;
  }


  if (!/^\d{4,6}$/.test(pin)) {

    showToast(
      "Il PIN deve avere da 4 a 6 cifre",
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


  const normalizedPhone =
    normalizePhone(phone);

  const email =
    createEmailFromPhone(phone);

  const fullName =
    `${name} ${surname}`.trim();


  const registerButton =
    $("registerButton");


  registerButton.disabled = true;

  registerButton.textContent =
    "CREAZIONE...";


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signUp({

        email: email,

        password: pin,

        options: {

          data: {

            full_name:
              fullName,

            phone:
              normalizedPhone

          }

        }

      });


    if (error) {

      throw error;

    }


    if (!data.user) {

      throw new Error(
        "Impossibile creare l'account"
      );

    }


    const {
      error: profileError
    } =
      await supabaseClient
        .from("profiles")
        .upsert({

          id:
            data.user.id,

          full_name:
            fullName,

          phone:
            normalizedPhone

        });


    if (profileError) {

      console.error(
        "Errore profilo:",
        profileError
      );

    }


    showToast(
      "Account creato con successo"
    );


    closeRegister();


    if (data.session) {

      currentUser =
        data.user;

      await loadProfile();

      updateProfileUI();

      await requestPushPermission();

    } else {

      showToast(
        "Account creato. Ora accedi.",
        "success"
      );

      openAuth();

    }


  } catch (error) {

    console.error(error);

    showToast(
      error.message ||
      "Errore durante la registrazione",
      "error"
    );

  } finally {

    registerButton.disabled = false;

    registerButton.textContent =
      "CREA ACCOUNT";

  }

}


/* =====================================================
   LOGIN
===================================================== */

async function loginUser() {

  const phone =
    $("phoneInput").value.trim();

  const pin =
    $("pinInput").value.trim();


  if (!phone || !pin) {

    showToast(
      "Inserisci numero e PIN",
      "error"
    );

    return;

  }


  const email =
    createEmailFromPhone(phone);


  const loginButton =
    $("loginButton");


  loginButton.disabled = true;

  loginButton.textContent =
    "ACCESSO...";


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .auth
        .signInWithPassword({

          email,
          password: pin

        });


    if (error) {

      throw error;

    }


    currentUser =
      data.user;


    await loadProfile();


    updateProfileUI();


    closeAuth();


    showToast(
      "Bentornato!"
    );


    await requestPushPermission();


  } catch (error) {

    console.error(error);

    showToast(
      "Numero o PIN non corretti",
      "error"
    );

  } finally {

    loginButton.disabled = false;

    loginButton.textContent =
      "ACCEDI";

  }

}


/* =====================================================
   LOGOUT
===================================================== */

async function logoutUser() {

  try {

    await supabaseClient.auth.signOut();

    currentUser = null;

    currentProfile = null;


    updateProfileUI();


    showPage("homePage");


    showToast(
      "Hai effettuato il logout"
    );


  } catch (error) {

    console.error(error);

    showToast(
      "Errore durante il logout",
      "error"
    );

  }

}


window.logoutUser = logoutUser;


/* =====================================================
   CARICAMENTO SESSIONE
===================================================== */

async function checkSession() {

  try {

    const {
      data
    } =
      await supabaseClient
        .auth
        .getSession();


    if (
      data &&
      data.session
    ) {

      currentUser =
        data.session.user;


      await loadProfile();

    }


    updateProfileUI();


  } catch (error) {

    console.error(
      "Session error:",
      error
    );

  }

}


/* =====================================================
   CARICA PROFILO
===================================================== */

async function loadProfile() {

  if (!currentUser) return;


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("profiles")
        .select("*")
        .eq(
          "id",
          currentUser.id
        )
        .single();


    if (
      error &&
      error.code !== "PGRST116"
    ) {

      throw error;

    }


    if (data) {

      currentProfile = data;

      return;

    }


    const metadata =
      currentUser.user_metadata || {};


    const fullName =
      metadata.full_name ||
      "Cliente";


    const phone =
      metadata.phone ||
      "";


    const {
      data: newProfile,
      error: insertError
    } =
      await supabaseClient
        .from("profiles")
        .insert({

          id:
            currentUser.id,

          full_name:
            fullName,

          phone:
            phone

        })
        .select()
        .single();


    if (insertError) {

      throw insertError;

    }


    currentProfile =
      newProfile;


  } catch (error) {

    console.error(
      "Errore caricamento profilo:",
      error
    );

  }

}


/* =====================================================
   SERVIZI
===================================================== */

function renderServices() {

  const container =
    $("services");

  if (!container) return;


  container.innerHTML = "";


  SERVICES.forEach(service => {

    const button =
      document.createElement("button");


    button.className =
      "service-card";


    if (
      selectedService &&
      selectedService.id === service.id
    ) {

      button.classList.add("selected");

    }


    button.innerHTML = `

      <div>

        <b>
          ${escapeHTML(service.name)}
        </b>

        <small>
          Servizio professionale I Grimaldi
        </small>

      </div>

      <strong>
        €${service.price}
      </strong>

    `;


    button.addEventListener(
      "click",
      () => {

        selectedService =
          service;


        renderServices();

        updateBookingSummary();

      }
    );


    container.appendChild(button);

  });

}


/* =====================================================
   CALENDARIO PRENOTAZIONE
===================================================== */

function renderBookingCalendar() {

  const title =
    $("bookingMonthTitle");

  const calendar =
    $("bookingCalendar");


  if (!title || !calendar) return;


  const year =
    bookingMonth.getFullYear();

  const month =
    bookingMonth.getMonth();


  title.textContent =
    new Intl.DateTimeFormat(
      "it-IT",
      {
        month: "long",
        year: "numeric"
      }
    ).format(
      new Date(year, month, 1)
    );


  calendar.innerHTML = "";


  const firstDay =
    new Date(year, month, 1);


  let startDay =
    firstDay.getDay();


  startDay =
    startDay === 0
      ? 6
      : startDay - 1;


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

    calendar.appendChild(empty);

  }


  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const date =
      new Date(year, month, day);


    const dateString =
      dateToString(date);


    const button =
      document.createElement("button");


    button.type = "button";

    button.textContent = day;


    const weekday =
      date.getDay();


    const isSunday =
      weekday === 0;


    const today =
      todayString();


    if (
      dateString < today ||
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


        await loadBusyTimes(
          selectedDate
        );


        renderBookingCalendar();

        renderTimeSlots();

        updateBookingSummary();

      }
    );


    calendar.appendChild(button);

  }

}


/* =====================================================
   ORARI OCCUPATI
===================================================== */

async function loadBusyTimes(date) {

  busyTimes = [];


  if (!date) return;


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
          date
        )
        .neq(
          "status",
          "cancelled"
        );


    if (error) {

      throw error;

    }


    busyTimes =
      (data || []).map(item =>
        String(item.start_time).substring(0, 5)
      );


  } catch (error) {

    console.error(
      "Errore orari occupati:",
      error
    );

  }

}


/* =====================================================
   ORARI DISPONIBILI
===================================================== */

function renderTimeSlots() {

  const container =
    $("timeSlots");


  if (!container) return;


  container.innerHTML = "";


  const label =
    $("selectedBookingDateLabel");


  if (!selectedDate) {

    if (label) {

      label.textContent =
        "Prima seleziona una data";

    }


    const message =
      document.createElement("p");

    message.textContent =
      "Seleziona prima un giorno dal calendario.";

    container.appendChild(message);

    return;

  }


  if (label) {

    label.textContent =
      formatDate(selectedDate);

  }


  TIMES.forEach(time => {

    const button =
      document.createElement("button");


    button.type = "button";

    button.textContent =
      time;


    const occupied =
      busyTimes.includes(time);


    if (occupied) {

      button.disabled = true;

      button.classList.add("busy");

    }


    if (
      selectedTime === time
    ) {

      button.classList.add("selected");

    }


    button.addEventListener(
      "click",
      () => {

        if (occupied) return;


        selectedTime =
          time;


        renderTimeSlots();

        updateBookingSummary();

      }
    );


    container.appendChild(button);

  });

}


/* =====================================================
   RIEPILOGO PRENOTAZIONE
===================================================== */

function updateBookingSummary() {

  $("summaryService").textContent =
    selectedService
      ? selectedService.name
      : "Non selezionato";


  $("summaryDate").textContent =
    selectedDate
      ? formatShortDate(selectedDate)
      : "-";


  $("summaryTime").textContent =
    selectedTime || "-";


  $("summaryPrice").textContent =
    selectedService
      ? `€${selectedService.price}`
      : "€0";

}


/* =====================================================
   PRENOTAZIONE CLIENTE
===================================================== */

async function confirmBooking() {

  if (!currentUser) {

    showToast(
      "Accedi prima di prenotare",
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


  const confirmButton =
    $("confirmBooking");


  confirmButton.disabled = true;

  confirmButton.textContent =
    "CONTROLLO DISPONIBILITÀ...";


  try {

    /*
      CONTROLLO FINALE
      Evita doppie prenotazioni
    */

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
        )
        .limit(1);


    if (checkError) {

      throw checkError;

    }


    if (
      existing &&
      existing.length > 0
    ) {

      showToast(
        "Questo orario è appena stato prenotato",
        "error"
      );


      await loadBusyTimes(
        selectedDate
      );

      renderTimeSlots();

      return;

    }


    confirmButton.textContent =
      "CREAZIONE PRENOTAZIONE...";


    const customerName =
      currentProfile?.full_name ||
      "Cliente";


    const customerPhone =
      currentProfile?.phone ||
      "";


    const endTime =
      calculateEndTime(
        selectedTime
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
            customerName,

          customer_phone:
            customerPhone,

          service_id:
            selectedService.id,

          service_name:
            selectedService.name,

          price:
            selectedService.price,

          appointment_date:
            selectedDate,

          start_time:
            selectedTime,

          end_time:
            endTime,

          status:
            "confirmed",

          notes:
            null

        })
        .select()
        .single();


    if (error) {

      throw error;

    }


    showToast(
      "Prenotazione confermata!"
    );


    /*
      RESET PRENOTAZIONE
    */

    selectedService = null;

    selectedDate = null;

    selectedTime = null;

    busyTimes = [];


    renderServices();

    renderBookingCalendar();

    renderTimeSlots();

    updateBookingSummary();


    /*
      NOTIFICHE
    */

    sendBookingPush(
      data,
      "confirmed"
    );


    showPage(
      "appointmentsPage"
    );


  } catch (error) {

    console.error(
      "Booking error:",
      error
    );


    showToast(
      error.message ||
      "Errore durante la prenotazione",
      "error"
    );


  } finally {

    confirmButton.disabled = false;

    confirmButton.textContent =
      "CONFERMA PRENOTAZIONE";

  }

}


/* =====================================================
   CALCOLO FINE APPUNTAMENTO
===================================================== */

function calculateEndTime(startTime) {

  const [
    hour,
    minute
  ] =
    startTime.split(":").map(Number);


  const date =
    new Date();


  date.setHours(
    hour,
    minute + 30,
    0,
    0
  );


  return String(
    date.getHours()
  ).padStart(2, "0")
  +
  ":"
  +
  String(
    date.getMinutes()
  ).padStart(2, "0");


}


/* =====================================================
   APPUNTAMENTI CLIENTE
===================================================== */

async function loadMyAppointments() {

  const container =
    $("bookingsList");


  if (!container) return;


  if (!currentUser) {

    container.innerHTML = `

      <div class="empty-state">

        <h3>
          Accedi al tuo account
        </h3>

        <p>
          Potrai vedere e gestire le tue prenotazioni.
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

    <div class="loading-list">

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


    renderMyAppointments(
      data || []
    );


  } catch (error) {

    console.error(error);


    container.innerHTML = `

      <div class="empty-state">

        <p>
          Errore nel caricamento.
        </p>

      </div>

    `;

  }

}


function renderMyAppointments(bookings) {

  const container =
    $("bookingsList");


  if (!container) return;


  if (
    !bookings ||
    bookings.length === 0
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <h3>
          Nessun appuntamento
        </h3>

        <p>
          Non hai ancora prenotazioni.
        </p>

      </div>

    `;

    return;

  }


  const today =
    todayString();


  const sorted =
    [...bookings].sort(
      (a, b) => {

        const aDate =
          `${a.appointment_date} ${a.start_time}`;

        const bDate =
          `${b.appointment_date} ${b.start_time}`;

        return aDate.localeCompare(bDate);

      }
    );


  container.innerHTML =
    sorted.map(booking => {

      const isPast =
        booking.appointment_date < today;


      const isCancelled =
        booking.status === "cancelled";


      return `

        <div class="appointment-card">

          <div class="appointment-top">

            <div>

              <small>
                ${isCancelled
                  ? "ANNULLATO"
                  : isPast
                    ? "PASSATO"
                    : "CONFERMATO"
                }
              </small>

              <h3>
                ${escapeHTML(
                  booking.service_name ||
                  getServiceName(
                    booking.service_id
                  )
                )}
              </h3>

            </div>

            <b>
              €${booking.price || 0}
            </b>

          </div>


          <div class="appointment-details">

            <span>
              ${formatDate(
                booking.appointment_date
              )}
            </span>

            <span>
              ${String(
                booking.start_time
              ).substring(0, 5)}
            </span>

          </div>


          ${
            !isPast &&
            !isCancelled
              ? `

                <button
                  class="danger-button"
                  onclick="cancelBooking('${booking.id}')"
                >
                  ANNULLA
                </button>

              `
              : ""
          }

        </div>

      `;

    }).join("");

}


/* =====================================================
   CANCELLA APPUNTAMENTO CLIENTE
===================================================== */

async function cancelBooking(id) {

  const confirmCancel =
    confirm(
      "Vuoi annullare questo appuntamento?"
    );


  if (!confirmCancel) return;


  try {

    const {
      data,
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
          id
        )
        .eq(
          "customer_id",
          currentUser.id
        )
        .select()
        .single();


    if (error) {

      throw error;

    }


    showToast(
      "Appuntamento annullato"
    );


    await loadMyAppointments();


    if (data) {

      sendBookingPush(
        data,
        "cancelled"
      );

    }


  } catch (error) {

    console.error(error);

    showToast(
      "Errore durante l'annullamento",
      "error"
    );

  }

}


window.cancelBooking = cancelBooking;


/* =====================================================
   CALENDARIO ADMIN
===================================================== */

function renderAdminCalendar() {

  const title =
    $("adminMonthTitle");

  const calendar =
    $("adminCalendar");


  if (!title || !calendar) return;


  const year =
    adminMonth.getFullYear();

  const month =
    adminMonth.getMonth();


  title.textContent =
    new Intl.DateTimeFormat(
      "it-IT",
      {
        month: "long",
        year: "numeric"
      }
    ).format(
      new Date(year, month, 1)
    );


  calendar.innerHTML = "";


  const firstDay =
    new Date(year, month, 1);


  let startDay =
    firstDay.getDay();


  startDay =
    startDay === 0
      ? 6
      : startDay - 1;


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

    calendar.appendChild(empty);

  }


  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const date =
      new Date(year, month, day);


    const dateString =
      dateToString(date);


    const button =
      document.createElement("button");


    button.type = "button";

    button.textContent = day;


    if (
      dateString === adminSelectedDate
    ) {

      button.classList.add(
        "selected"
      );

    }


    button.addEventListener(
      "click",
      async () => {

        adminSelectedDate =
          dateString;


        renderAdminCalendar();

        await loadAdminAgenda();

      }
    );


    calendar.appendChild(button);

  }

}


/* =====================================================
   AGENDA ADMIN
===================================================== */

async function loadAdminAgenda() {

  if (!isAdmin()) return;


  if (!adminSelectedDate) {

    adminSelectedDate =
      todayString();

  }


  $("adminSelectedDate").textContent =
    formatShortDate(
      adminSelectedDate
    );


  $("adminAgendaDateTitle").textContent =
    formatDate(
      adminSelectedDate
    );


  const container =
    $("adminAgendaList");


  container.innerHTML = `

    <div class="loading-list">

      Caricamento agenda...

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

      throw error;

    }


    const bookings =
      data || [];


    $("adminBookedCount").textContent =
      bookings.length;


    $("adminFreeCount").textContent =
      TIMES.length -
      bookings.length;


    renderAdminAgenda(
      bookings
    );


    renderAdminCalendar();


  } catch (error) {

    console.error(error);


    container.innerHTML = `

      <div class="empty-state">

        Errore caricamento agenda.

      </div>

    `;

  }

}


function renderAdminAgenda(bookings) {

  const container =
    $("adminAgendaList");


  if (!container) return;


  container.innerHTML = "";


  TIMES.forEach(time => {

    const booking =
      bookings.find(item =>
        String(
          item.start_time
        ).substring(0, 5) === time
      );


    const row =
      document.createElement("div");


    row.className =
      "admin-time-row";


    if (booking) {

      row.classList.add("booked");


      row.innerHTML = `

        <div class="admin-time">

          ${time}

        </div>


        <div class="admin-client">

          <b>
            ${escapeHTML(
              booking.customer_name ||
              "Cliente"
            )}
          </b>

          <small>
            ${escapeHTML(
              booking.service_name ||
              getServiceName(
                booking.service_id
              )
            )}
            ·
            ${escapeHTML(
              booking.customer_phone ||
              ""
            )}
          </small>

        </div>


        <div class="admin-actions">

          <button
            onclick="openMoveBooking('${booking.id}')"
          >
            SPOSTA
          </button>


          <button
            class="delete"
            onclick="adminCancelBooking('${booking.id}')"
          >
            ×
          </button>

        </div>

      `;


    } else {

      row.classList.add("free");


      row.innerHTML = `

        <div class="admin-time">

          ${time}

        </div>


        <div class="admin-client">

          <b>
            Disponibile
          </b>

          <small>
            Orario libero
          </small>

        </div>

      `;

    }


    container.appendChild(row);

  });

}


/* =====================================================
   CANCELLAZIONE ADMIN
===================================================== */

async function adminCancelBooking(id) {

  if (!isAdmin()) return;


  const confirmed =
    confirm(
      "Vuoi annullare questo appuntamento?"
    );


  if (!confirmed) return;


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("appointments")
        .update({

          status:
            "cancelled"

        })
        .eq("id", id)
        .select()
        .single();


    if (error) {

      throw error;

    }


    showToast(
      "Appuntamento annullato"
    );


    await loadAdminAgenda();


    if (data) {

      sendBookingPush(
        data,
        "cancelled"
      );

    }


  } catch (error) {

    console.error(error);

    showToast(
      "Errore annullamento",
      "error"
    );

  }

}


window.adminCancelBooking =
  adminCancelBooking;


/* =====================================================
   AGGIUNTA MANUALE CLIENTE
===================================================== */

function openManualBooking() {

  if (!isAdmin()) return;


  const modal =
    $("manualBookingModal");


  modal.classList.remove("hidden");

  modal.classList.add("active");


  const dateInput =
    $("manualBookingDate");


  dateInput.min =
    todayString();


  dateInput.value =
    adminSelectedDate ||
    todayString();


  populateManualServices();

  populateManualTimes();

}


function closeManualBooking() {

  const modal =
    $("manualBookingModal");


  modal.classList.remove("active");

  modal.classList.add("hidden");

}


window.openManualBooking =
  openManualBooking;

window.closeManualBooking =
  closeManualBooking;


/* =====================================================
   SELECT SERVIZI ADMIN
===================================================== */

function populateManualServices() {

  const select =
    $("manualService");


  select.innerHTML = `

    <option value="">
      Seleziona servizio
    </option>

  `;


  SERVICES.forEach(service => {

    const option =
      document.createElement("option");


    option.value =
      service.id;


    option.textContent =
      `${service.name} - €${service.price}`;


    select.appendChild(option);

  });

}


/* =====================================================
   SELECT ORARI ADMIN
===================================================== */

function populateManualTimes() {

  const select =
    $("manualBookingTime");


  select.innerHTML = `

    <option value="">
      Seleziona orario
    </option>

  `;


  TIMES.forEach(time => {

    const option =
      document.createElement("option");


    option.value =
      time;


    option.textContent =
      time;


    select.appendChild(option);

  });

}


/* =====================================================
   CREA APPUNTAMENTO MANUALE
===================================================== */

async function createManualBooking() {

  if (!isAdmin()) return;


  const name =
    $("manualCustomerName")
      .value
      .trim();


  const phone =
    $("manualCustomerPhone")
      .value
      .trim();


  const serviceId =
    $("manualService")
      .value;


  const date =
    $("manualBookingDate")
      .value;


  const time =
    $("manualBookingTime")
      .value;


  if (
    !name ||
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


  const service =
    getServiceById(
      serviceId
    );


  if (!service) {

    showToast(
      "Servizio non valido",
      "error"
    );

    return;

  }


  try {

    /*
      CONTROLLO ORARIO
    */

    const {
      data: existing,
      error: checkError
    } =
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
        .limit(1);


    if (checkError) {

      throw checkError;

    }


    if (
      existing &&
      existing.length
    ) {

      showToast(
        "Questo orario è già occupato",
        "error"
      );

      return;

    }


    const {
      data,
      error
    } =
      await supabaseClient
        .from("appointments")
        .insert({

          customer_id:
            null,

          customer_name:
            name,

          customer_phone:
            normalizePhone(phone),

          service_id:
            service.id,

          service_name:
            service.name,

          price:
            service.price,

          appointment_date:
            date,

          start_time:
            time,

          end_time:
            calculateEndTime(time),

          status:
            "confirmed",

          notes:
            "Creato manualmente da admin"

        })
        .select()
        .single();


    if (error) {

      throw error;

    }


    showToast(
      "Appuntamento aggiunto!"
    );


    closeManualBooking();


    adminSelectedDate =
      date;


    await loadAdminAgenda();


    sendBookingPush(
      data,
      "manual"
    );


  } catch (error) {

    console.error(error);

    showToast(
      error.message ||
      "Errore creazione appuntamento",
      "error"
    );

  }

}


window.createManualBooking =
  createManualBooking;


/* =====================================================
   SPOSTA APPUNTAMENTO
===================================================== */

async function openMoveBooking(id) {

  if (!isAdmin()) return;


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("appointments")
        .select("*")
        .eq("id", id)
        .single();


    if (error) {

      throw error;

    }


    $("moveBookingId").value =
      data.id;


    $("moveBookingCustomer").textContent =
      `${data.customer_name || "Cliente"} - ${getServiceName(data.service_id)}`;


    const dateInput =
      $("moveBookingDate");


    dateInput.min =
      todayString();


    dateInput.value =
      data.appointment_date;


    await populateMoveTimes(
      data.appointment_date,
      data.id,
      String(
        data.start_time
      ).substring(0, 5)
    );


    const modal =
      $("moveBookingModal");


    modal.classList.remove("hidden");

    modal.classList.add("active");


  } catch (error) {

    console.error(error);

    showToast(
      "Errore caricamento appuntamento",
      "error"
    );

  }

}


function closeMoveBooking() {

  const modal =
    $("moveBookingModal");


  modal.classList.remove("active");

  modal.classList.add("hidden");

}


window.openMoveBooking =
  openMoveBooking;

window.closeMoveBooking =
  closeMoveBooking;


/* =====================================================
   ORARI SPOSTAMENTO
===================================================== */

async function populateMoveTimes(
  date,
  bookingId,
  selected
) {

  const select =
    $("moveBookingTime");


  select.innerHTML = `

    <option value="">
      Seleziona nuovo orario
    </option>

  `;


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("appointments")
        .select("id,start_time,status")
        .eq(
          "appointment_date",
          date
        )
        .neq(
          "status",
          "cancelled"
        );


    if (error) {

      throw error;

    }


    const occupied =
      (data || [])
        .filter(item =>
          item.id !== bookingId
        )
        .map(item =>
          String(
            item.start_time
          ).substring(0, 5)
        );


    TIMES.forEach(time => {

      const option =
        document.createElement("option");


      option.value =
        time;


      option.textContent =
        occupied.includes(time)
          ? `${time} - Occupato`
          : time;


      if (
        occupied.includes(time)
      ) {

        option.disabled = true;

      }


      if (
        time === selected
      ) {

        option.selected = true;

      }


      select.appendChild(option);

    });


  } catch (error) {

    console.error(error);

  }

}


/* =====================================================
   CONFERMA SPOSTAMENTO
===================================================== */

async function confirmMoveBooking() {

  if (!isAdmin()) return;


  const id =
    $("moveBookingId").value;


  const date =
    $("moveBookingDate").value;


  const time =
    $("moveBookingTime").value;


  if (
    !id ||
    !date ||
    !time
  ) {

    showToast(
      "Seleziona data e orario",
      "error"
    );

    return;

  }


  try {

    const {
      data: existing,
      error: checkError
    } =
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
        .limit(1);


    if (checkError) {

      throw checkError;

    }


    if (
      existing &&
      existing.length
    ) {

      showToast(
        "Orario già occupato",
        "error"
      );

      return;

    }


    const {
      data,
      error
    } =
      await supabaseClient
        .from("appointments")
        .update({

          appointment_date:
            date,

          start_time:
            time,

          end_time:
            calculateEndTime(time),

          status:
            "confirmed"

        })
        .eq("id", id)
        .select()
        .single();


    if (error) {

      throw error;

    }


    closeMoveBooking();


    adminSelectedDate =
      date;


    await loadAdminAgenda();


    showToast(
      "Appuntamento spostato!"
    );


    sendBookingPush(
      data,
      "moved"
    );


  } catch (error) {

    console.error(error);

    showToast(
      "Errore spostamento",
      "error"
    );

  }

}


window.confirmMoveBooking =
  confirmMoveBooking;


/* =====================================================
   ONESIGNAL
===================================================== */

async function requestPushPermission() {

  if (!currentUser) return;

  if (!window.oneSignalReady) return;

  try {

    window.OneSignalDeferred.push(
      async function (OneSignal) {

        try {

          const permission =
            await OneSignal.Notifications.permission;


          if (
            permission !== "granted"
          ) {

            await OneSignal.Notifications.requestPermission();

          }


          await OneSignal.login(
            currentUser.id
          );


          console.log(
            "OneSignal collegato:",
            currentUser.id
          );


        } catch (error) {

          console.error(
            "OneSignal permission:",
            error
          );

        }

      }
    );


  } catch (error) {

    console.error(error);

  }

}


window.enableGrimaldiPush =
  requestPushPermission;


/* =====================================================
   NOTIFICHE BACKEND
===================================================== */

/*
  IMPORTANTE:

  Le vere notifiche push NON devono essere inviate
  direttamente dal browser con la REST API OneSignal,
  perché la REST API richiede una chiave segreta.

  Questo codice chiama una Edge Function Supabase.

  Devi creare:

  send-notification

  Endpoint:

  /functions/v1/send-notification
*/

async function sendBookingPush(
  booking,
  action
) {

  try {

    if (!booking) return;


    await supabaseClient.functions.invoke(
      "send-notification",
      {

        body: {

          booking_id:
            booking.id,

          action:
            action

        }

      }
    );


  } catch (error) {

    /*
      La prenotazione non deve fallire
      se la notifica ha un problema.
    */

    console.warn(
      "Notifica non inviata:",
      error
    );

  }

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =====================================================
   EVENT LISTENERS
===================================================== */

function setupEventListeners() {

  /*
     LOGIN
  */

  $("loginButton")
    ?.addEventListener(
      "click",
      loginUser
    );


  /*
     REGISTER
  */

  $("registerButton")
    ?.addEventListener(
      "click",
      registerUser
    );


  /*
     PRENOTAZIONE
  */

  $("confirmBooking")
    ?.addEventListener(
      "click",
      confirmBooking
    );


  /*
     CALENDARIO CLIENTE
  */

  $("prevBookingMonth")
    ?.addEventListener(
      "click",
      () => {

        const previous =
          new Date(
            bookingMonth.getFullYear(),
            bookingMonth.getMonth() - 1,
            1
          );


        const current =
          new Date();

        current.setDate(1);


        if (
          previous >= current
        ) {

          bookingMonth =
            previous;

          renderBookingCalendar();

        }

      }
    );


  $("nextBookingMonth")
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


  /*
     CALENDARIO ADMIN
  */

  $("prevAdminMonth")
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


  $("nextAdminMonth")
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


  /*
     CAMBIO DATA SPOSTAMENTO
  */

  $("moveBookingDate")
    ?.addEventListener(
      "change",
      async event => {

        const id =
          $("moveBookingId").value;


        const selected =
          $("moveBookingTime").value;


        await populateMoveTimes(
          event.target.value,
          id,
          selected
        );

      }
    );


  /*
     PWA INSTALL
  */

  window.addEventListener(
    "beforeinstallprompt",
    event => {

      event.preventDefault();

      deferredPrompt =
        event;

    }
  );


  /*
     ENTER LOGIN
  */

  $("pinInput")
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


  /*
     ENTER REGISTER
  */

  $("registerPin2")
    ?.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter"
        ) {

          registerUser();

        }

      }
    );

}


/* =====================================================
   CHIUSURA MODALI CLICK ESTERNO
===================================================== */

function setupModalClosing() {

  const modals =
    document.querySelectorAll(
      ".modal"
    );


  modals.forEach(modal => {

    modal.addEventListener(
      "click",
      event => {

        if (
          event.target === modal
        ) {

          modal.classList.remove(
            "active"
          );

        }

      }
    );

  });

}


/* =====================================================
   AUTH STATE CHANGE
===================================================== */

function setupAuthListener() {

  supabaseClient.auth.onAuthStateChange(
    async (
      event,
      session
    ) => {

      if (
        session &&
        session.user
      ) {

        currentUser =
          session.user;


        /*
          Piccolo timeout per evitare
          conflitti con Supabase
        */

        setTimeout(
          async () => {

            await loadProfile();

            updateProfileUI();

          },
          0
        );


      } else {

        currentUser = null;

        currentProfile = null;

        updateProfileUI();

      }

    }
  );

}


/* =====================================================
   LOADING SCREEN
===================================================== */

function hideLoading() {

  const loading =
    $("loadingScreen");


  if (!loading) return;


  setTimeout(() => {

    loading.classList.add("hidden");


    setTimeout(() => {

      loading.style.display =
        "none";

    }, 600);


  }, 700);

}


/* =====================================================
   AVVIO APP
===================================================== */

async function initApp() {

  console.log(
    "I GRIMALDI APP AVVIATA"
  );


  setupEventListeners();

  setupModalClosing();

  setupAuthListener();


  /*
     Mese iniziale
  */

  bookingMonth =
    new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );


  adminMonth =
    new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );


  adminSelectedDate =
    todayString();


  /*
     Render iniziale
  */

  renderServices();

  renderBookingCalendar();

  renderTimeSlots();

  updateBookingSummary();

  renderAdminCalendar();


  /*
     Sessione
  */

  await checkSession();


  /*
     Nasconde loading
  */

  hideLoading();


}


/* =====================================================
   DOM READY
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  initApp
);
