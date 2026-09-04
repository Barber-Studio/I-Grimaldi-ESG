// ========================================
// I GRIMALDI E.S.G. PARRUCCHIERI
// APP.JS - VERSIONE STABILE DEFINITIVA
// ========================================


// ========================================
// CONFIGURAZIONE
// ========================================

const SUPABASE_URL = "https://wxcdmtajcasnlohqkgmk.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_bwjP-ihASijevvu7d6r5Ew_6JaWKSDP";

// IMPORTANTE:
// Questa costante esiste UNA SOLA VOLTA
const ADMIN_PHONE = "3791415355";

let supabaseClient = null;


// ========================================
// INIZIALIZZAZIONE SUPABASE
// ========================================

try {

  if (typeof supabase !== "undefined") {

    supabaseClient = supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

    console.log("Supabase collegato");

  } else {

    console.error("Libreria Supabase non caricata");

  }

} catch (error) {

  console.error(
    "Errore inizializzazione Supabase:",
    error
  );

}


// ========================================
// STATO APPLICAZIONE
// ========================================

let currentUser = null;

let selectedDate = new Date();

let selectedService = null;

let selectedTime = null;

let currentBookingId = null;

let toastTimeout = null;

let busyTimes = [];


// ========================================
// SERVIZI UFFICIALI
// ========================================

const services = [

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


// ========================================
// ORARI DISPONIBILI
// ========================================

const availableTimes = [

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


// ========================================
// AVVIO
// ========================================

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    await initializeApp();

  }
);


// ========================================
// INIZIALIZZAZIONE APP
// ========================================

async function initializeApp() {

  console.log(
    "Avvio I GRIMALDI E.S.G."
  );


  showLoading();


  setupNavigation();

  setupServiceButtons();

  setupBookingButtons();

  setupAuthButtons();

  setupDateControls();

  setupRegisterButtons();


  await restoreSession();


  await loadAvailableTimes();


  setTimeout(function () {

    hideLoading();

  }, 1200);

}


// ========================================
// SPLASH SCREEN
// ========================================

function showLoading() {

  const loadingScreen =
    document.getElementById("loadingScreen");

  const splash =
    document.getElementById("splash");

  const app =
    document.getElementById("app");


  if (loadingScreen) {

    loadingScreen.classList.remove("hidden");

    loadingScreen.style.display = "flex";

  }


  if (splash) {

    splash.classList.remove("hidden");

    splash.classList.remove("fade-out");

    splash.style.display = "flex";

  }


  if (app) {

    app.classList.add("app-loading");

  }

}


function hideLoading() {

  const loadingScreen =
    document.getElementById("loadingScreen");

  const splash =
    document.getElementById("splash");

  const app =
    document.getElementById("app");


  if (loadingScreen) {

    loadingScreen.classList.add("hidden");

    setTimeout(function () {

      loadingScreen.style.display = "none";

    }, 500);

  }


  if (splash) {

    splash.classList.add("fade-out");

    setTimeout(function () {

      splash.style.display = "none";

    }, 500);

  }


  if (app) {

    app.classList.remove("app-loading");

  }

}


// ========================================
// NAVIGAZIONE
// ========================================

function setupNavigation() {

  const navButtons =
    document.querySelectorAll("[data-page]");


  navButtons.forEach(function (button) {

    button.addEventListener(
      "click",
      function (event) {

        event.preventDefault();


        const pageId =
          button.getAttribute("data-page");


        if (pageId) {

          showPage(pageId);

        }

      }
    );

  });

}


// ========================================
// MOSTRA PAGINA
// ========================================

function showPage(pageId) {

  const pages =
    document.querySelectorAll(".page");


  pages.forEach(function (page) {

    page.classList.remove("active");

  });


  const selectedPage =
    document.getElementById(pageId);


  if (selectedPage) {

    selectedPage.classList.add("active");

  }


  const navButtons =
    document.querySelectorAll("[data-page]");


  navButtons.forEach(function (button) {

    button.classList.remove("active");


    if (
      button.getAttribute("data-page") ===
      pageId
    ) {

      button.classList.add("active");

    }

  });


  window.scrollTo({

    top: 0,

    behavior: "smooth"

  });


  if (pageId === "bookingsPage") {

    loadUserBookings();

  }


  if (pageId === "adminPage") {

    loadAdminAgenda();

  }


  updateUserInterface();

}


// ========================================
// CONTROLLO ADMIN
// ========================================

function isAdmin() {

  if (!currentUser) {

    return false;

  }


  const phone =
    normalizePhone(
      currentUser.phone || ""
    );


  const admin =
    normalizePhone(
      ADMIN_PHONE
    );


  return phone === admin;

}


function normalizePhone(phone) {

  return String(phone)
    .replace(/\D/g, "")
    .replace(/^39/, function (match) {

      if (
        String(phone)
          .replace(/\D/g, "")
          .length > 10
      ) {

        return "";

      }

      return match;

    });

}


// ========================================
// SERVIZI
// ========================================

function setupServiceButtons() {

  const buttons =
    document.querySelectorAll("[data-service]");


  buttons.forEach(function (button) {

    button.addEventListener(
      "click",
      function () {

        const serviceId =
          button.getAttribute("data-service");


        selectService(serviceId);

      }
    );

  });

}


function selectService(serviceId) {

  const service =
    services.find(function (item) {

      return item.id === serviceId;

    });


  if (!service) {

    showToast(
      "Servizio non valido",
      "error"
    );

    return;

  }


  selectedService = service;


  document
    .querySelectorAll("[data-service]")
    .forEach(function (button) {

      button.classList.remove(
        "selected"
      );

    });


  const selectedButton =
    document.querySelector(
      '[data-service="' +
      serviceId +
      '"]'
    );


  if (selectedButton) {

    selectedButton.classList.add(
      "selected"
    );

  }


  updateBookingSummary();

}


// ========================================
// DATA
// ========================================

function setupDateControls() {

  const dateInput =
    document.getElementById(
      "bookingDate"
    );


  if (!dateInput) {

    return;

  }


  const today =
    getTodayString();


  dateInput.min = today;


  if (!dateInput.value) {

    dateInput.value = today;

  }


  selectedDate =
    new Date(
      dateInput.value +
      "T12:00:00"
    );


  dateInput.addEventListener(
    "change",
    async function () {

      selectedDate =
        new Date(
          dateInput.value +
          "T12:00:00"
        );


      selectedTime = null;


      updateBookingSummary();


      await loadAvailableTimes();

    }
  );

}


function getTodayString() {

  const date = new Date();


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


  return (
    year +
    "-" +
    month +
    "-" +
    day
  );

}


// ========================================
// CARICA ORARI OCCUPATI
// ========================================

async function loadBusyTimes() {

  busyTimes = [];


  if (!supabaseClient) {

    return;

  }


  try {

    const bookingDate =
      formatDatabaseDate(
        selectedDate
      );


    const result =
      await supabaseClient
        .from("bookings")
        .select(
          "booking_time,status"
        )
        .eq(
          "booking_date",
          bookingDate
        )
        .neq(
          "status",
          "cancelled"
        );


    if (result.error) {

      console.error(
        "Errore orari occupati:",
        result.error
      );

      return;

    }


    busyTimes =
      (result.data || [])
        .map(function (booking) {

          return booking.booking_time;

        });


  } catch (error) {

    console.error(
      "Errore caricamento orari:",
      error
    );

  }

}


// ========================================
// MOSTRA ORARI
// ========================================

async function loadAvailableTimes() {

  const container =
    document.getElementById(
      "timeSlots"
    );


  if (!container) {

    return;

  }


  container.innerHTML =
    '<div class="times-loading">' +
    "Caricamento orari..." +
    "</div>";


  await loadBusyTimes();


  container.innerHTML = "";


  availableTimes.forEach(function (time) {

    const button =
      document.createElement("button");


    button.type = "button";


    button.className =
      "time-slot";


    button.textContent =
      time;


    const isBusy =
      busyTimes.includes(time);


    if (isBusy) {

      button.classList.add("busy");

      button.disabled = true;

      button.title =
        "Orario già occupato";

    }


    if (
      selectedTime === time &&
      !isBusy
    ) {

      button.classList.add(
        "selected"
      );

    }


    if (!isBusy) {

      button.addEventListener(
        "click",
        function () {

          selectTime(time);

        }
      );

    }


    container.appendChild(button);

  });

}


// ========================================
// SELEZIONE ORARIO
// ========================================

function selectTime(time) {

  if (busyTimes.includes(time)) {

    showToast(
      "Questo orario è già occupato",
      "error"
    );

    return;

  }


  selectedTime = time;


  document
    .querySelectorAll(".time-slot")
    .forEach(function (button) {

      button.classList.remove(
        "selected"
      );


      if (
        button.textContent === time
      ) {

        button.classList.add(
          "selected"
        );

      }

    });


  updateBookingSummary();

}


// ========================================
// RIEPILOGO
// ========================================

function updateBookingSummary() {

  const serviceElement =
    document.getElementById(
      "summaryService"
    );

  const dateElement =
    document.getElementById(
      "summaryDate"
    );

  const timeElement =
    document.getElementById(
      "summaryTime"
    );

  const priceElement =
    document.getElementById(
      "summaryPrice"
    );


  if (serviceElement) {

    serviceElement.textContent =
      selectedService
        ? selectedService.name
        : "Non selezionato";

  }


  if (dateElement) {

    dateElement.textContent =
      selectedDate
        ? formatDate(selectedDate)
        : "-";

  }


  if (timeElement) {

    timeElement.textContent =
      selectedTime || "-";

  }


  if (priceElement) {

    priceElement.textContent =
      selectedService
        ? "€ " + selectedService.price
        : "€ 0";

  }

}


// ========================================
// PRENOTAZIONE
// ========================================

function setupBookingButtons() {

  const confirmButton =
    document.getElementById(
      "confirmBooking"
    );


  if (confirmButton) {

    confirmButton.addEventListener(
      "click",
      createBooking
    );

  }

}


// ========================================
// CREA PRENOTAZIONE
// ========================================

async function createBooking() {

  if (!currentUser) {

    showToast(
      "Accedi prima di prenotare",
      "error"
    );


    showPage("loginPage");

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


  if (busyTimes.includes(selectedTime)) {

    showToast(
      "Questo orario è stato appena occupato",
      "error"
    );


    await loadAvailableTimes();

    return;

  }


  try {

    if (!supabaseClient) {

      throw new Error(
        "Supabase non disponibile"
      );

    }


    showToast(
      "Conferma prenotazione..."
    );


    // Ricontrollo direttamente dal database

    const date =
      formatDatabaseDate(
        selectedDate
      );


    const existing =
      await supabaseClient
        .from("bookings")
        .select("id")
        .eq(
          "booking_date",
          date
        )
        .eq(
          "booking_time",
          selectedTime
        )
        .neq(
          "status",
          "cancelled"
        )
        .maybeSingle();


    if (existing.data) {

      showToast(
        "Orario appena occupato",
        "error"
      );


      await loadAvailableTimes();

      return;

    }


    const bookingData = {

      user_id:
        currentUser.id,

      service_id:
        selectedService.id,

      service_name:
        selectedService.name,

      price:
        selectedService.price,

      booking_date:
        date,

      booking_time:
        selectedTime,

      status:
        "confirmed"

    };


    const result =
      await supabaseClient
        .from("bookings")
        .insert([
          bookingData
        ])
        .select()
        .single();


    if (result.error) {

      throw result.error;

    }


    currentBookingId =
      result.data.id;


    showToast(
      "Prenotazione confermata!",
      "success"
    );


    resetBooking();


    await loadAvailableTimes();


    setTimeout(function () {

      showPage(
        "bookingsPage"
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


// ========================================
// RESET PRENOTAZIONE
// ========================================

function resetBooking() {

  selectedService = null;

  selectedTime = null;


  document
    .querySelectorAll("[data-service]")
    .forEach(function (button) {

      button.classList.remove(
        "selected"
      );

    });


  document
    .querySelectorAll(".time-slot")
    .forEach(function (button) {

      button.classList.remove(
        "selected"
      );

    });


  updateBookingSummary();

}


// ========================================
// PRENOTAZIONI CLIENTE
// ========================================

async function loadUserBookings() {

  const container =
    document.getElementById(
      "bookingsList"
    );


  if (!container) {

    return;

  }


  if (!currentUser) {

    container.innerHTML =
      '<div class="empty-state">' +
      "<h3>Accesso richiesto</h3>" +
      "<p>Accedi per vedere le prenotazioni.</p>" +
      "</div>";

    return;

  }


  container.innerHTML =
    '<div class="bookings-loading">' +
    "Caricamento..." +
    "</div>";


  try {

    const result =
      await supabaseClient
        .from("bookings")
        .select("*")
        .eq(
          "user_id",
          currentUser.id
        )
        .order(
          "booking_date",
          {
            ascending: true
          }
        )
        .order(
          "booking_time",
          {
            ascending: true
          }
        );


    if (result.error) {

      throw result.error;

    }


    const bookings =
      result.data || [];


    if (bookings.length === 0) {

      container.innerHTML =
        '<div class="empty-state">' +
        "<h3>Nessuna prenotazione</h3>" +
        "<p>Non hai ancora prenotazioni.</p>" +
        "</div>";

      return;

    }


    container.innerHTML = "";


    bookings.forEach(function (booking) {

      const card =
        document.createElement("div");


      card.className =
        "booking-card";


      const bookingDate =
        new Date(
          booking.booking_date +
          "T12:00:00"
        );


      card.innerHTML =
        '<div class="booking-info">' +

        "<strong>" +
        escapeHtml(
          booking.service_name
        ) +
        "</strong>" +

        '<div class="booking-detail">' +
        formatDate(bookingDate) +
        "</div>" +

        '<div class="booking-detail">' +
        escapeHtml(
          booking.booking_time
        ) +
        "</div>" +

        '<div class="booking-price">' +
        "€ " +
        escapeHtml(
          String(booking.price)
        ) +
        "</div>" +

        "</div>" +

        '<button class="cancel-booking" type="button">' +
        "Annulla" +
        "</button>";


      const cancelButton =
        card.querySelector(
          ".cancel-booking"
        );


      cancelButton.addEventListener(
        "click",
        function () {

          cancelBooking(
            booking.id
          );

        }
      );


      container.appendChild(card);

    });


  } catch (error) {

    console.error(error);


    container.innerHTML =
      '<div class="empty-state">' +
      "<h3>Errore</h3>" +
      "<p>Impossibile caricare le prenotazioni.</p>" +
      "</div>";

  }

}


// ========================================
// ANNULLA PRENOTAZIONE
// ========================================

async function cancelBooking(bookingId) {

  const confirmed =
    window.confirm(
      "Vuoi annullare la prenotazione?"
    );


  if (!confirmed) {

    return;

  }


  try {

    const result =
      await supabaseClient
        .from("bookings")
        .delete()
        .eq(
          "id",
          bookingId
        );


    if (result.error) {

      throw result.error;

    }


    showToast(
      "Prenotazione annullata",
      "success"
    );


    await loadUserBookings();

    await loadAvailableTimes();


  } catch (error) {

    console.error(error);


    showToast(
      "Errore durante annullamento",
      "error"
    );

  }

}


// ========================================
// AGENDA ADMIN
// ========================================

async function loadAdminAgenda() {

  const container =
    document.getElementById(
      "adminAgenda"
    );


  if (!container) {

    return;

  }


  if (!isAdmin()) {

    container.innerHTML =
      '<div class="empty-state">' +
      "<h3>Area riservata</h3>" +
      "<p>Non hai i permessi amministratore.</p>" +
      "</div>";

    return;

  }


  container.innerHTML =
    '<div class="bookings-loading">' +
    "Caricamento agenda..." +
    "</div>";


  try {

    const result =
      await supabaseClient
        .from("bookings")
        .select("*")
        .order(
          "booking_date",
          {
            ascending: true
          }
        )
        .order(
          "booking_time",
          {
            ascending: true
          }
        );


    if (result.error) {

      throw result.error;

    }


    const bookings =
      result.data || [];


    if (bookings.length === 0) {

      container.innerHTML =
        '<div class="empty-state">' +
        "<h3>Agenda vuota</h3>" +
        "<p>Non ci sono prenotazioni.</p>" +
        "</div>";

      return;

    }


    container.innerHTML = "";


    bookings.forEach(function (booking) {

      const card =
        document.createElement("div");


      card.className =
        "admin-booking-card";


      card.innerHTML =
        '<div class="admin-booking-date">' +

        formatDate(
          new Date(
            booking.booking_date +
            "T12:00:00"
          )
        ) +

        "</div>" +

        '<div class="admin-booking-time">' +
        escapeHtml(
          booking.booking_time
        ) +
        "</div>" +

        '<div class="admin-booking-service">' +
        escapeHtml(
          booking.service_name
        ) +
        "</div>" +

        '<div class="admin-booking-price">' +
        "€ " +
        escapeHtml(
          String(
            booking.price || 0
          )
        ) +
        "</div>";


      container.appendChild(card);

    });


  } catch (error) {

    console.error(
      "Errore agenda:",
      error
    );


    container.innerHTML =
      '<div class="empty-state">' +
      "<h3>Errore agenda</h3>" +
      "<p>" +
      escapeHtml(
        error.message ||
        "Impossibile caricare l'agenda"
      ) +
      "</p>" +
      "</div>";

  }

}


// ========================================
// AUTH BUTTONS
// ========================================

function setupAuthButtons() {

  const loginButton =
    document.getElementById(
      "loginButton"
    );

  const logoutButton =
    document.getElementById(
      "logoutButton"
    );


  if (loginButton) {

    loginButton.addEventListener(
      "click",
      function (event) {

        event.preventDefault();

        loginUser();

      }
    );

  }


  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      function (event) {

        event.preventDefault();

        logoutUser();

      }
    );

  }


  const pinInput =
    document.getElementById(
      "pinInput"
    );


  if (pinInput) {

    pinInput.addEventListener(
      "keydown",
      function (event) {

        if (event.key === "Enter") {

          event.preventDefault();

          loginUser();

        }

      }
    );

  }

}


// ========================================
// LOGIN
// ========================================

async function loginUser() {

  const phoneInput =
    document.getElementById(
      "phoneInput"
    );

  const pinInput =
    document.getElementById(
      "pinInput"
    );


  if (!phoneInput || !pinInput) {

    return;

  }


  const phone =
    phoneInput.value.trim();

  const pin =
    pinInput.value.trim();


  if (!phone || !pin) {

    showToast(
      "Inserisci numero e PIN",
      "error"
    );

    return;

  }


  try {

    showToast(
      "Accesso in corso..."
    );


    const result =
      await supabaseClient
        .from("users")
        .select("*")
        .eq(
          "phone",
          phone
        )
        .eq(
          "pin",
          pin
        )
        .maybeSingle();


    if (result.error) {

      throw result.error;

    }


    if (!result.data) {

      showToast(
        "Numero o PIN non corretto",
        "error"
      );

      return;

    }


    currentUser =
      result.data;


    localStorage.setItem(
      "grimaldiUser",
      JSON.stringify(currentUser)
    );


    updateUserInterface();


    showToast(
      "Bentornato " +
      (currentUser.name || ""),
      "success"
    );


    setTimeout(function () {

      showPage("homePage");

    }, 400);


  } catch (error) {

    console.error(error);


    showToast(
      "Errore durante il login",
      "error"
    );

  }

}


// ========================================
// REGISTRAZIONE
// ========================================

function setupRegisterButtons() {

  const registerButton =
    document.getElementById(
      "registerButton"
    );


  if (registerButton) {

    registerButton.addEventListener(
      "click",
      handleRegistration
    );

  }

}


async function handleRegistration() {

  const nameInput =
    document.getElementById(
      "registerName"
    );

  const phoneInput =
    document.getElementById(
      "registerPhone"
    );

  const pinInput =
    document.getElementById(
      "registerPin"
    );


  if (
    !nameInput ||
    !phoneInput ||
    !pinInput
  ) {

    return;

  }


  await registerUser(

    nameInput.value.trim(),

    phoneInput.value.trim(),

    pinInput.value.trim()

  );

}


async function registerUser(
  name,
  phone,
  pin
) {

  if (!name || !phone || !pin) {

    showToast(
      "Compila tutti i campi",
      "error"
    );

    return false;

  }


  if (pin.length < 4) {

    showToast(
      "Il PIN deve avere almeno 4 cifre",
      "error"
    );

    return false;

  }


  try {

    const existing =
      await supabaseClient
        .from("users")
        .select("id")
        .eq(
          "phone",
          phone
        )
        .maybeSingle();


    if (existing.data) {

      showToast(
        "Numero già registrato",
        "error"
      );

      return false;

    }


    const result =
      await supabaseClient
        .from("users")
        .insert([

          {
            name: name,
            phone: phone,
            pin: pin
          }

        ])
        .select()
        .single();


    if (result.error) {

      throw result.error;

    }


    currentUser =
      result.data;


    localStorage.setItem(
      "grimaldiUser",
      JSON.stringify(currentUser)
    );


    updateUserInterface();


    showToast(
      "Registrazione completata!",
      "success"
    );


    showPage("homePage");


    return true;


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


    return false;

  }

}


// ========================================
// RIPRISTINA SESSIONE
// ========================================

async function restoreSession() {

  try {

    const saved =
      localStorage.getItem(
        "grimaldiUser"
      );


    if (!saved) {

      updateUserInterface();

      return;

    }


    currentUser =
      JSON.parse(saved);


    updateUserInterface();


  } catch (error) {

    currentUser = null;


    localStorage.removeItem(
      "grimaldiUser"
    );


    updateUserInterface();

  }

}


// ========================================
// LOGOUT
// ========================================

function logoutUser() {

  currentUser = null;


  localStorage.removeItem(
    "grimaldiUser"
  );


  updateUserInterface();


  showToast(
    "Logout effettuato",
    "success"
  );


  showPage("homePage");

}


// ========================================
// INTERFACCIA UTENTE
// ========================================

function updateUserInterface() {

  document
    .querySelectorAll("[data-user-name]")
    .forEach(function (element) {

      element.textContent =
        currentUser
          ? currentUser.name || "Cliente"
          : "Ospite";

    });


  document
    .querySelectorAll("[data-logged-in]")
    .forEach(function (element) {

      element.style.display =
        currentUser
          ? ""
          : "none";

    });


  document
    .querySelectorAll("[data-logged-out]")
    .forEach(function (element) {

      element.style.display =
        currentUser
          ? "none"
          : "";

    });


  // AREA ADMIN

  document
    .querySelectorAll("[data-admin]")
    .forEach(function (element) {

      element.style.display =
        isAdmin()
          ? ""
          : "none";

    });


  document.body.classList.toggle(
    "user-logged-in",
    !!currentUser
  );


  document.body.classList.toggle(
    "is-admin",
    isAdmin()
  );

}


// ========================================
// FORMATTAZIONE DATA
// ========================================

function formatDate(date) {

  if (!(date instanceof Date)) {

    date =
      new Date(date);

  }


  if (isNaN(date.getTime())) {

    return "-";

  }


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


function formatDatabaseDate(date) {

  if (!(date instanceof Date)) {

    date =
      new Date(date);

  }


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


  return (
    year +
    "-" +
    month +
    "-" +
    day
  );

}


// ========================================
// TOAST
// ========================================

function showToast(
  message,
  type = "default"
) {

  let toast =
    document.getElementById(
      "toast"
    );


  if (!toast) {

    toast =
      document.createElement("div");


    toast.id = "toast";


    document.body.appendChild(toast);

  }


  toast.textContent = message;


  toast.className = "toast";


  if (type === "success") {

    toast.classList.add("success");

  }


  if (type === "error") {

    toast.classList.add("error");

  }


  requestAnimationFrame(function () {

    toast.classList.add("show");

  });


  if (toastTimeout) {

    clearTimeout(toastTimeout);

  }


  toastTimeout =
    setTimeout(function () {

      toast.classList.remove("show");

    }, 3000);

}


// ========================================
// SICUREZZA HTML
// ========================================

function escapeHtml(value) {

  return String(value)

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}


// ========================================
// FUNZIONI GLOBALI
// ========================================

window.showPage = showPage;

window.selectService = selectService;

window.selectTime = selectTime;

window.createBooking = createBooking;

window.cancelBooking = cancelBooking;

window.loginUser = loginUser;

window.logoutUser = logoutUser;

window.registerUser = registerUser;

window.loadUserBookings = loadUserBookings;

window.loadAdminAgenda = loadAdminAgenda;

window.showToast = showToast;

window.showLoading = showLoading;

window.hideLoading = hideLoading;


// ========================================
// FINE APP.JS
// ========================================
