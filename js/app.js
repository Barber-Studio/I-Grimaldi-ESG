// ==========================================
// I GRIMALDI E.S.G. - APP.JS
// VERSIONE COMPLETA
// ==========================================


// ==========================================
// CONFIGURAZIONE SUPABASE
// ==========================================

const SUPABASE_URL = "https://wxcdmtajcasnlohqkgmk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_bwjP-ihASijevvu7d6r5Ew_6JaWKSDP";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ==========================================
// STATO APPLICAZIONE
// ==========================================

let currentUser = null;
let selectedDate = new Date();
let selectedService = null;

const services = [
  {
    id: "shampoo_taglio",
    name: "Shampoo + Taglio",
    price: 20
  },
  {
    id: "barba_5",
    name: "Barba",
    price: 5
  },
  {
    id: "barba_10",
    name: "Barba",
    price: 10
  },
  {
    id: "colore",
    name: "Colore",
    price: 20
  },
  {
    id: "colore_barba",
    name: "Colore Barba",
    price: 10
  },
  {
    id: "fiala",
    name: "Fiala",
    price: 5
  }
];


// ==========================================
// INIZIALIZZAZIONE
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {

  console.log("I Grimaldi E.S.G. avviato");

  // Nasconde immediatamente il loader
  hideLoader();

  // Controlla se esiste una sessione salvata
  loadSavedUser();

  // Aggiorna interfaccia
  updateUserInterface();

  // Mostra i servizi
  renderServices();

  // Carica prenotazioni se utente loggato
  if (currentUser) {
    await loadBookings();
  }

});


// ==========================================
// LOADER
// ==========================================

function hideLoader() {

  const loader = document.getElementById("loading");

  if (loader) {
    loader.style.display = "none";
  }

  const app = document.getElementById("app");

  if (app) {
    app.classList.remove("hidden");
    app.style.display = "";
  }

}


function showLoader() {

  const loader = document.getElementById("loading");

  if (loader) {
    loader.style.display = "flex";
  }

}


function forceHideLoader() {

  const loader = document.getElementById("loading");

  if (loader) {
    loader.style.display = "none";
  }

}


// Sicurezza: anche se qualcosa va storto,
// il caricamento sparisce dopo massimo 3 secondi

setTimeout(() => {
  forceHideLoader();
}, 3000);


// ==========================================
// SESSIONE LOCALE
// ==========================================

function loadSavedUser() {

  try {

    const savedUser = localStorage.getItem("grimaldi_user");

    if (savedUser) {

      currentUser = JSON.parse(savedUser);

      console.log("Utente recuperato:", currentUser);

    }

  } catch (error) {

    console.error("Errore recupero utente:", error);

    localStorage.removeItem("grimaldi_user");

  }

}


function saveUser(user) {

  currentUser = user;

  localStorage.setItem(
    "grimaldi_user",
    JSON.stringify(user)
  );

}


function clearUser() {

  currentUser = null;

  localStorage.removeItem("grimaldi_user");

}


// ==========================================
// UTILITA
// ==========================================

function $(id) {

  return document.getElementById(id);

}


function showElement(id) {

  const element = $(id);

  if (element) {
    element.classList.remove("hidden");
    element.style.display = "";
  }

}


function hideElement(id) {

  const element = $(id);

  if (element) {
    element.classList.add("hidden");
  }

}


function escapeHtml(text) {

  if (text === null || text === undefined) {
    return "";
  }

  const div = document.createElement("div");

  div.textContent = text;

  return div.innerHTML;

}


function formatPrice(price) {

  return Number(price).toFixed(2).replace(".00", "") + "€";

}


function normalizePhone(phone) {

  if (!phone) return "";

  return phone
    .trim()
    .replace(/\s/g, "")
    .replace(/-/g, "");

}


// ==========================================
// MESSAGGI
// ==========================================

function showMessage(message, type = "success") {

  let messageBox = document.getElementById("appMessage");

  if (!messageBox) {

    messageBox = document.createElement("div");

    messageBox.id = "appMessage";

    document.body.appendChild(messageBox);

  }

  messageBox.textContent = message;

  messageBox.className = `app-message ${type}`;

  messageBox.style.display = "block";

  setTimeout(() => {

    messageBox.style.display = "none";

  }, 3500);

}


// ==========================================
// INTERFACCIA UTENTE
// ==========================================

function updateUserInterface() {

  const loginButton = $("loginBtn");
  const userButton = $("userBtn");
  const userName = $("userName");
  const adminButton = $("adminBtn");

  // Non loggato
  if (!currentUser) {

    if (loginButton) {
      loginButton.classList.remove("hidden");
      loginButton.style.display = "";
    }

    if (userButton) {
      userButton.classList.add("hidden");
    }

    if (adminButton) {
      adminButton.classList.add("hidden");
    }

    return;

  }

  // Loggato
  if (loginButton) {
    loginButton.classList.add("hidden");
  }

  if (userButton) {
    userButton.classList.remove("hidden");
    userButton.style.display = "";
  }

  if (userName) {

    userName.textContent =
      currentUser.name || "Profilo";

  }

  // ADMIN
  if (currentUser.is_admin === true) {

    if (adminButton) {

      adminButton.classList.remove("hidden");
      adminButton.style.display = "";

    }

  } else {

    if (adminButton) {
      adminButton.classList.add("hidden");
    }

  }

}


// ==========================================
// LOGIN
// ==========================================

async function login() {

  const phoneInput = $("loginPhone");
  const pinInput = $("loginPin");

  if (!phoneInput || !pinInput) {

    showMessage(
      "Errore: campi login non trovati",
      "error"
    );

    return;

  }

  const phone = normalizePhone(phoneInput.value);
  const pin = pinInput.value.trim();

  if (!phone) {

    showMessage(
      "Inserisci il numero di telefono",
      "error"
    );

    return;

  }

  if (!pin) {

    showMessage(
      "Inserisci il PIN",
      "error"
    );

    return;

  }

  try {

    showLoader();

    const { data, error } = await supabaseClient
      .from("customers")
      .select("*")
      .eq("phone", phone)
      .eq("pin", pin)
      .maybeSingle();

    if (error) {

      console.error(error);

      throw error;

    }

    if (!data) {

      showMessage(
        "Numero o PIN non corretti",
        "error"
      );

      hideLoader();

      return;

    }

    saveUser(data);

    updateUserInterface();

    closeModal("authModal");

    phoneInput.value = "";
    pinInput.value = "";

    hideLoader();

    showMessage(
      `Bentornato ${data.name}!`
    );

    await loadBookings();

  } catch (error) {

    console.error("Errore login:", error);

    hideLoader();

    showMessage(
      "Errore durante il login",
      "error"
    );

  }

}


// ==========================================
// REGISTRAZIONE
// ==========================================

async function register() {

  const nameInput = $("regName");
  const surnameInput = $("regSurname");
  const phoneInput = $("regPhone");
  const pinInput = $("regPin");

  if (
    !nameInput ||
    !surnameInput ||
    !phoneInput ||
    !pinInput
  ) {

    showMessage(
      "Errore: campi registrazione non trovati",
      "error"
    );

    return;

  }

  const name = nameInput.value.trim();
  const surname = surnameInput.value.trim();
  const phone = normalizePhone(phoneInput.value);
  const pin = pinInput.value.trim();

  if (!name || !surname || !phone || !pin) {

    showMessage(
      "Compila tutti i campi",
      "error"
    );

    return;

  }

  if (pin.length < 4) {

    showMessage(
      "Il PIN deve avere almeno 4 numeri",
      "error"
    );

    return;

  }

  try {

    showLoader();

    // Controllo numero già registrato

    const { data: existingUser } =
      await supabaseClient
        .from("customers")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();


    if (existingUser) {

      hideLoader();

      showMessage(
        "Questo numero è già registrato. Effettua il login.",
        "error"
      );

      return;

    }


    // Crea utente

    const { data, error } =
      await supabaseClient
        .from("customers")
        .insert([
          {
            name: name,
            surname: surname,
            phone: phone,
            pin: pin,
            is_admin: false
          }
        ])
        .select()
        .single();


    if (error) {

      console.error(error);

      throw error;

    }


    saveUser(data);

    updateUserInterface();

    closeModal("registerModal");

    hideLoader();

    showMessage(
      "Registrazione completata con successo!"
    );

  } catch (error) {

    console.error(
      "Errore registrazione:",
      error
    );

    hideLoader();

    showMessage(
      "Errore durante la registrazione",
      "error"
    );

  }

}


// ==========================================
// LOGOUT
// ==========================================

function logout() {

  clearUser();

  updateUserInterface();

  showMessage("Logout effettuato");

  const bookingsContainer = $("myBookings");

  if (bookingsContainer) {

    bookingsContainer.innerHTML = "";

  }

  closeModal("profileModal");

}


// ==========================================
// MODALI
// ==========================================

function openModal(id) {

  const modal = $(id);

  if (!modal) return;

  modal.classList.remove("hidden");

  modal.style.display = "flex";

}


function closeModal(id) {

  const modal = $(id);

  if (!modal) return;

  modal.classList.add("hidden");

  modal.style.display = "none";

}


function openAuth() {

  openModal("authModal");

}


function openRegister() {

  closeModal("authModal");

  openModal("registerModal");

}


function openProfile() {

  if (!currentUser) {

    openAuth();

    return;

  }

  const profileName = $("profileName");
  const profileSurname = $("profileSurname");
  const profilePhone = $("profilePhone");

  if (profileName) {
    profileName.textContent = currentUser.name || "";
  }

  if (profileSurname) {
    profileSurname.textContent =
      currentUser.surname || "";
  }

  if (profilePhone) {
    profilePhone.textContent =
      currentUser.phone || "";
  }

  openModal("profileModal");

}


// ==========================================
// SERVIZI
// ==========================================

function renderServices() {

  const container = $("servicesList");

  if (!container) return;

  container.innerHTML = "";

  services.forEach(service => {

    const button = document.createElement("button");

    button.className = "service-card";

    button.innerHTML = `
      <div class="service-name">
        ${escapeHtml(service.name)}
      </div>

      <div class="service-price">
        ${formatPrice(service.price)}
      </div>
    `;

    button.addEventListener("click", () => {

      selectService(service);

    });

    container.appendChild(button);

  });

}


function selectService(service) {

  selectedService = service;

  document
    .querySelectorAll(".service-card")
    .forEach(card => {

      card.classList.remove("selected");

    });


  const selectedServiceText =
    $("selectedService");

  if (selectedServiceText) {

    selectedServiceText.textContent =
      `${service.name} - ${formatPrice(service.price)}`;

  }


  showMessage(
    `${service.name} selezionato`
  );

}


// ==========================================
// PRENOTAZIONE
// ==========================================

async function createBooking() {

  if (!currentUser) {

    showMessage(
      "Devi prima effettuare il login",
      "error"
    );

    openAuth();

    return;

  }


  if (!selectedService) {

    showMessage(
      "Seleziona un servizio",
      "error"
    );

    return;

  }


  const dateInput = $("bookingDate");
  const timeInput = $("bookingTime");

  if (!dateInput || !timeInput) {

    showMessage(
      "Seleziona data e orario",
      "error"
    );

    return;

  }


  const bookingDate = dateInput.value;
  const bookingTime = timeInput.value;


  if (!bookingDate || !bookingTime) {

    showMessage(
      "Seleziona data e orario",
      "error"
    );

    return;

  }


  try {

    showLoader();


    // Controlla giorno bloccato

    const { data: blockedDay } =
      await supabaseClient
        .from("blocked_days")
        .select("*")
        .eq("blocked_date", bookingDate)
        .maybeSingle();


    if (blockedDay) {

      hideLoader();

      showMessage(
        "Questo giorno non è disponibile",
        "error"
      );

      return;

    }


    // Controlla se orario occupato

    const { data: occupiedBooking } =
      await supabaseClient
        .from("bookings")
        .select("id")
        .eq("booking_date", bookingDate)
        .eq("booking_time", bookingTime)
        .neq("status", "cancelled")
        .maybeSingle();


    if (occupiedBooking) {

      hideLoader();

      showMessage(
        "Questo orario è già occupato",
        "error"
      );

      return;

    }


    // Inserisce prenotazione

    const bookingData = {

      customer_id: currentUser.id,

      customer_name: currentUser.name,

      customer_surname: currentUser.surname,

      customer_phone: currentUser.phone,

      service: selectedService.name,

      booking_date: bookingDate,

      booking_time: bookingTime,

      price: selectedService.price,

      status: "confirmed"

    };


    const { data, error } =
      await supabaseClient
        .from("bookings")
        .insert([bookingData])
        .select()
        .single();


    if (error) {

      console.error(error);

      throw error;

    }


    hideLoader();

    showMessage(
      "Prenotazione effettuata con successo!"
    );


    selectedService = null;


    if (dateInput) {
      dateInput.value = "";
    }


    if (timeInput) {
      timeInput.value = "";
    }


    const selectedServiceText =
      $("selectedService");

    if (selectedServiceText) {

      selectedServiceText.textContent =
        "Nessun servizio selezionato";

    }


    await loadBookings();


  } catch (error) {

    console.error(
      "Errore prenotazione:",
      error
    );

    hideLoader();

    showMessage(
      "Errore durante la prenotazione",
      "error"
    );

  }

}


// ==========================================
// LE MIE PRENOTAZIONI
// ==========================================

async function loadBookings() {

  if (!currentUser) return;


  const container = $("myBookings");

  if (!container) return;


  try {

    container.innerHTML = `
      <div class="empty-bookings">
        Caricamento prenotazioni...
      </div>
    `;


    let query = supabaseClient
      .from("bookings")
      .select("*")
      .order("booking_date", {
        ascending: false
      });


    // Admin vede tutte le prenotazioni

    if (!currentUser.is_admin) {

      query = query.eq(
        "customer_id",
        currentUser.id
      );

    }


    const { data, error } =
      await query;


    if (error) {

      console.error(error);

      container.innerHTML = `
        <div class="empty-bookings">
          Impossibile caricare le prenotazioni
        </div>
      `;

      return;

    }


    if (!data || data.length === 0) {

      container.innerHTML = `
        <div class="empty-bookings">
          Nessuna prenotazione trovata
        </div>
      `;

      return;

    }


    container.innerHTML = "";


    data.forEach(booking => {

      const card =
        document.createElement("div");

      card.className = "booking-card";


      const customerInfo =
        currentUser.is_admin
          ? `
            <div class="booking-customer">
              ${escapeHtml(booking.customer_name)}
              ${escapeHtml(booking.customer_surname)}
            </div>

            <div class="booking-phone">
              ${escapeHtml(booking.customer_phone)}
            </div>
          `
          : "";


      card.innerHTML = `

        <div class="booking-top">

          <div>

            <div class="booking-service">
              ${escapeHtml(booking.service)}
            </div>

            ${customerInfo}

          </div>

          <span class="booking-status ${escapeHtml(booking.status)}">

            ${booking.status === "cancelled"
              ? "Annullata"
              : "Confermata"}

          </span>

        </div>


        <div class="booking-details">

          <span>📅 ${formatDate(booking.booking_date)}</span>

          <span>🕒 ${escapeHtml(booking.booking_time)}</span>

          <span>€ ${booking.price}</span>

        </div>


        ${booking.status !== "cancelled"
          ? `
            <button
              class="cancel-booking-btn"
              onclick="cancelBooking('${booking.id}')"
            >
              Annulla prenotazione
            </button>
          `
          : ""
        }

      `;


      container.appendChild(card);

    });


  } catch (error) {

    console.error(error);

  }

}


// ==========================================
// ANNULLA PRENOTAZIONE
// ==========================================

async function cancelBooking(bookingId) {

  if (!confirm(
    "Vuoi annullare questa prenotazione?"
  )) {
    return;
  }


  try {

    showLoader();


    const { error } =
      await supabaseClient
        .from("bookings")
        .update({
          status: "cancelled"
        })
        .eq("id", bookingId);


    if (error) {

      throw error;

    }


    hideLoader();

    showMessage(
      "Prenotazione annullata"
    );

    await loadBookings();


  } catch (error) {

    console.error(error);

    hideLoader();

    showMessage(
      "Errore durante l'annullamento",
      "error"
    );

  }

}


// ==========================================
// AGENDA ADMIN
// ==========================================

async function openAgenda() {

  if (!currentUser) {

    openAuth();

    return;

  }


  if (!currentUser.is_admin) {

    showMessage(
      "Accesso riservato all'amministratore",
      "error"
    );

    return;

  }


  const agenda = $("agendaPage");

  if (agenda) {

    agenda.classList.remove("hidden");

  }


  await loadAdminBookings();

}


// ==========================================
// CARICA AGENDA ADMIN
// ==========================================

async function loadAdminBookings() {

  const container = $("agendaBookings");

  if (!container) return;


  container.innerHTML = `
    <div class="empty-bookings">
      Caricamento agenda...
    </div>
  `;


  try {

    const { data, error } =
      await supabaseClient
        .from("bookings")
        .select("*")
        .order("booking_date", {
          ascending: true
        })
        .order("booking_time", {
          ascending: true
        });


    if (error) {

      console.error(error);

      throw error;

    }


    if (!data || data.length === 0) {

      container.innerHTML = `
        <div class="empty-bookings">
          Nessuna prenotazione
        </div>
      `;

      return;

    }


    container.innerHTML = "";


    data.forEach(booking => {

      const item =
        document.createElement("div");

      item.className = "agenda-booking";


      item.innerHTML = `

        <div class="agenda-time">

          ${escapeHtml(booking.booking_time)}

        </div>


        <div class="agenda-info">

          <strong>
            ${escapeHtml(booking.customer_name)}
            ${escapeHtml(booking.customer_surname)}
          </strong>

          <span>
            ${escapeHtml(booking.service)}
          </span>

          <span>
            ${escapeHtml(booking.customer_phone)}
          </span>

        </div>


        <div class="agenda-price">

          ${formatPrice(booking.price)}

        </div>

      `;


      container.appendChild(item);

    });


  } catch (error) {

    console.error(error);


    container.innerHTML = `

      <div class="empty-bookings">

        Errore nel caricamento dell'agenda

      </div>

    `;

  }

}


// ==========================================
// CHIUDI AGENDA
// ==========================================

function closeAgenda() {

  const agenda = $("agendaPage");

  if (agenda) {

    agenda.classList.add("hidden");

  }

}


// ==========================================
// GIORNI BLOCCATI ADMIN
// ==========================================

async function blockDay() {

  if (!currentUser?.is_admin) {

    showMessage(
      "Accesso non autorizzato",
      "error"
    );

    return;

  }


  const input = $("blockDate");

  if (!input || !input.value) {

    showMessage(
      "Seleziona una data",
      "error"
    );

    return;

  }


  try {

    showLoader();


    const { error } =
      await supabaseClient
        .from("blocked_days")
        .insert([
          {
            blocked_date: input.value
          }
        ]);


    if (error) {

      throw error;

    }


    hideLoader();

    showMessage(
      "Giorno bloccato correttamente"
    );


  } catch (error) {

    console.error(error);

    hideLoader();

    showMessage(
      "Errore nel blocco del giorno",
      "error"
    );

  }

}


// ==========================================
// FORMATTA DATA
// ==========================================

function formatDate(dateString) {

  if (!dateString) return "";

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


// ==========================================
// CONTROLLO DISPONIBILITA ORARI
// ==========================================

async function checkAvailableTimes() {

  const dateInput = $("bookingDate");

  if (!dateInput || !dateInput.value) return;


  const bookingDate = dateInput.value;


  try {

    const { data, error } =
      await supabaseClient
        .from("bookings")
        .select("booking_time")
        .eq("booking_date", bookingDate)
        .neq("status", "cancelled");


    if (error) {

      console.error(error);

      return;

    }


    const occupiedTimes =
      data.map(item => item.booking_time);


    document
      .querySelectorAll("[data-time]")
      .forEach(button => {

        const time =
          button.dataset.time;


        if (occupiedTimes.includes(time)) {

          button.classList.add("occupied");

          button.disabled = true;

        } else {

          button.classList.remove("occupied");

          button.disabled = false;

        }

      });


  } catch (error) {

    console.error(error);

  }

}


// ==========================================
// CAMBIO DATA
// ==========================================

const bookingDateInput =
 document.addEventListener("DOMContentLoaded", () => {

  const bookingDateInput =
    const bookingDateInput = document.getElementById("bookingDate");

if (bookingDateInput) {
  bookingDateInput.addEventListener("change", checkAvailableTimes);
}


// ==========================================
// ESPOSIZIONE FUNZIONI HTML
// ==========================================

window.login = login;

window.register = register;

window.logout = logout;

window.openAuth = openAuth;

window.openRegister = openRegister;

window.openProfile = openProfile;

window.openAgenda = openAgenda;

window.closeAgenda = closeAgenda;

window.closeModal = closeModal;

window.openModal = openModal;

window.createBooking = createBooking;

window.cancelBooking = cancelBooking;

window.blockDay = blockDay;

window.checkAvailableTimes =
  checkAvailableTimes;


// ==========================================
// FINE APP
// ==========================================

console.log(
  "I Grimaldi E.S.G. App pronta"
);
