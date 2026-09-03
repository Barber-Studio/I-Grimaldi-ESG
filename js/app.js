// ========================================
// I GRIMALDI E.S.G. PARRUCCHIERI
// APP.JS - VERSIONE COMPLETA
// ========================================


// ========================================
// CONFIGURAZIONE SUPABASE
// ========================================

const SUPABASE_URL = "https://wxcdmtajcasnlohqkgmk.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_bwjP-ihASijevvu7d6r5Ew_6JaWKSDP";


let supabaseClient = null;

try {
  if (typeof supabase !== "undefined") {
    supabaseClient = supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );
  }
} catch (error) {
  console.error("Errore inizializzazione Supabase:", error);
}


// ========================================
// STATO APPLICAZIONE
// ========================================

let currentUser = null;

let selectedDate = new Date();

let selectedService = null;

let selectedTime = null;

let currentBookingId = null;


// ========================================
// SERVIZI
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
    duration: 15
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
    duration: 45
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
    duration: 10
  }
];


// ========================================
// AVVIO APPLICAZIONE
// ========================================

document.addEventListener("DOMContentLoaded", function () {

  initializeApp();

});


// ========================================
// INIZIALIZZAZIONE
// ========================================

async function initializeApp() {

  console.log("Avvio applicazione I Grimaldi");

  showSplash();

  setupNavigation();

  setupServiceButtons();

  setupBookingButtons();

  setupAuthButtons();

  setupDateControls();

  await restoreSession();

  setTimeout(function () {

    hideSplash();

  }, 1800);

}


// ========================================
// SPLASH SCREEN
// ========================================

function showSplash() {

  const splash = document.getElementById("splash");

  const app = document.getElementById("app");

  if (splash) {

    splash.style.display = "flex";

    splash.classList.remove("hidden");

  }

  if (app) {

    app.classList.add("hidden");

  }

}


function hideSplash() {

  const splash = document.getElementById("splash");

  const app = document.getElementById("app");

  if (splash) {

    splash.classList.add("fade-out");

    setTimeout(function () {

      splash.style.display = "none";

    }, 500);

  }

  if (app) {

    app.classList.remove("hidden");

  }

}


// ========================================
// NAVIGAZIONE PAGINE
// ========================================

function setupNavigation() {

  const navButtons =
    document.querySelectorAll("[data-page]");

  navButtons.forEach(function (button) {

    button.addEventListener("click", function () {

      const pageId =
        button.getAttribute("data-page");

      if (pageId) {

        showPage(pageId);

      }

    });

  });

}


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

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


// ========================================
// SERVIZI
// ========================================

function setupServiceButtons() {

  const serviceButtons =
    document.querySelectorAll("[data-service]");

  serviceButtons.forEach(function (button) {

    button.addEventListener("click", function () {

      const serviceId =
        button.getAttribute("data-service");

      selectService(serviceId);

    });

  });

}


function selectService(serviceId) {

  const service =
    services.find(function (item) {

      return item.id === serviceId;

    });

  if (!service) {

    showToast("Servizio non valido");

    return;

  }

  selectedService = service;

  const buttons =
    document.querySelectorAll("[data-service]");

  buttons.forEach(function (button) {

    button.classList.remove("selected");

  });

  const selectedButton =
    document.querySelector(
      '[data-service="' + serviceId + '"]'
    );

  if (selectedButton) {

    selectedButton.classList.add("selected");

  }

  updateBookingSummary();

}


// ========================================
// DATE
// ========================================

function setupDateControls() {

  const dateInput =
    document.getElementById("bookingDate");

  if (dateInput) {

    const today =
      new Date().toISOString().split("T")[0];

    dateInput.min = today;

    dateInput.value = today;

    dateInput.addEventListener(
      "change",
      function () {

        selectedDate =
          new Date(dateInput.value);

        selectedTime = null;

        updateBookingSummary();

        loadAvailableTimes();

      }
    );

  }

}


// ========================================
// ORARI
// ========================================

async function loadAvailableTimes() {

  const container =
    document.getElementById("timeSlots");

  if (!container) {

    return;

  }

  container.innerHTML =
    "<p>Caricamento orari...</p>";

  const times = generateAvailableTimes();

  container.innerHTML = "";

  times.forEach(function (time) {

    const button =
      document.createElement("button");

    button.type = "button";

    button.className = "time-slot";

    button.textContent = time;

    button.addEventListener(
      "click",
      function () {

        selectTime(time);

      }
    );

    container.appendChild(button);

  });

}


function generateAvailableTimes() {

  return [
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

}


function selectTime(time) {

  selectedTime = time;

  const buttons =
    document.querySelectorAll(".time-slot");

  buttons.forEach(function (button) {

    button.classList.remove("selected");

    if (button.textContent === time) {

      button.classList.add("selected");

    }

  });

  updateBookingSummary();

}


// ========================================
// RIEPILOGO PRENOTAZIONE
// ========================================

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
    document.getElementById("confirmBooking");

  if (confirmButton) {

    confirmButton.addEventListener(
      "click",
      function () {

        createBooking();

      }
    );

  }

}


async function createBooking() {

  if (!currentUser) {

    showToast(
      "Devi effettuare l'accesso prima di prenotare"
    );

    showPage("loginPage");

    return;

  }


  if (!selectedService) {

    showToast(
      "Seleziona prima un servizio"
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


  const bookingData = {

    user_id: currentUser.id,

    service_id: selectedService.id,

    service_name: selectedService.name,

    price: selectedService.price,

    booking_date:
      formatDatabaseDate(selectedDate),

    booking_time:
      selectedTime,

    status: "confirmed"

  };


  try {

    if (!supabaseClient) {

      throw new Error(
        "Supabase non disponibile"
      );

    }


    const result =
      await supabaseClient
        .from("bookings")
        .insert([bookingData])
        .select();


    if (result.error) {

      console.error(result.error);

      throw result.error;

    }


    currentBookingId =
      result.data &&
      result.data.length > 0
        ? result.data[0].id
        : null;


    showToast(
      "Prenotazione effettuata con successo!"
    );


    resetBooking();


    showPage("bookingsPage");


    loadUserBookings();


  } catch (error) {

    console.error(
      "Errore prenotazione:",
      error
    );

    showToast(
      "Errore durante la prenotazione"
    );

  }

}


// ========================================
// RESET PRENOTAZIONE
// ========================================

function resetBooking() {

  selectedService = null;

  selectedTime = null;


  const serviceButtons =
    document.querySelectorAll(
      "[data-service]"
    );

  serviceButtons.forEach(function (button) {

    button.classList.remove("selected");

  });


  const timeButtons =
    document.querySelectorAll(
      ".time-slot"
    );

  timeButtons.forEach(function (button) {

    button.classList.remove("selected");

  });


  updateBookingSummary();

}


// ========================================
// PRENOTAZIONI UTENTE
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
      "<p>Effettua l'accesso per vedere le tue prenotazioni.</p>";

    return;

  }


  container.innerHTML =
    "<p>Caricamento prenotazioni...</p>";


  try {

    if (!supabaseClient) {

      throw new Error(
        "Supabase non disponibile"
      );

    }


    const result =
      await supabaseClient
        .from("bookings")
        .select("*")
        .eq("user_id", currentUser.id)
        .order(
          "booking_date",
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
        "<p>Nessuna prenotazione presente.</p>";

      return;

    }


    container.innerHTML = "";


    bookings.forEach(function (booking) {

      const card =
        document.createElement("div");

      card.className =
        "booking-card";


      const date =
        formatDate(
          new Date(
            booking.booking_date
          )
        );


      card.innerHTML =
        '<div class="booking-info">' +
        '<strong>' +
        escapeHtml(
          booking.service_name || "Servizio"
        ) +
        "</strong>" +
        "<p>" +
        date +
        " - " +
        escapeHtml(
          booking.booking_time || ""
        ) +
        "</p>" +
        "<p>€ " +
        escapeHtml(
          String(
            booking.price || 0
          )
        ) +
        "</p>" +
        "</div>" +
        '<button class="cancel-booking" type="button">Annulla</button>';


      const cancelButton =
        card.querySelector(
          ".cancel-booking"
        );


      if (cancelButton) {

        cancelButton.addEventListener(
          "click",
          function () {

            cancelBooking(
              booking.id
            );

          }
        );

      }


      container.appendChild(card);

    });


  } catch (error) {

    console.error(
      "Errore caricamento prenotazioni:",
      error
    );


    container.innerHTML =
      "<p>Impossibile caricare le prenotazioni.</p>";

  }

}


// ========================================
// ANNULLAMENTO PRENOTAZIONE
// ========================================

async function cancelBooking(bookingId) {

  const confirmed =
    confirm(
      "Vuoi davvero annullare questa prenotazione?"
    );


  if (!confirmed) {

    return;

  }


  try {

    const result =
      await supabaseClient
        .from("bookings")
        .delete()
        .eq("id", bookingId);


    if (result.error) {

      throw result.error;

    }


    showToast(
      "Prenotazione annullata"
    );


    loadUserBookings();


  } catch (error) {

    console.error(
      "Errore annullamento:",
      error
    );


    showToast(
      "Errore durante l'annullamento"
    );

  }

}


// ========================================
// AUTENTICAZIONE
// ========================================

function setupAuthButtons() {

  const loginButton =
    document.getElementById("loginButton");

  const logoutButton =
    document.getElementById("logoutButton");


  if (loginButton) {

    loginButton.addEventListener(
      "click",
      function () {

        loginUser();

      }
    );

  }


  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      function () {

        logoutUser();

      }
    );

  }

}


// ========================================
// LOGIN
// ========================================

async function loginUser() {

  const phoneInput =
    document.getElementById("phoneInput");

  const pinInput =
    document.getElementById("pinInput");


  if (!phoneInput || !pinInput) {

    showToast(
      "Campi login non trovati"
    );

    return;

  }


  const phone =
    phoneInput.value.trim();

  const pin =
    pinInput.value.trim();


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

    if (!supabaseClient) {

      throw new Error(
        "Supabase non disponibile"
      );

    }


    const result =
      await supabaseClient
        .from("users")
        .select("*")
        .eq("phone", phone)
        .eq("pin", pin)
        .maybeSingle();


    if (result.error) {

      throw result.error;

    }


    if (!result.data) {

      showToast(
        "Numero o PIN non corretto"
      );

      return;

    }


    currentUser = result.data;


    localStorage.setItem(
      "grimaldiUser",
      JSON.stringify(currentUser)
    );


    updateUserInterface();


    showToast(
      "Bentornato " +
      (
        currentUser.name ||
        ""
      )
    );


    showPage("homePage");


  } catch (error) {

    console.error(
      "Errore login:",
      error
    );


    showToast(
      "Errore durante il login"
    );

  }

}


// ========================================
// RIPRISTINO SESSIONE
// ========================================

async function restoreSession() {

  try {

    const savedUser =
      localStorage.getItem(
        "grimaldiUser"
      );


    if (!savedUser) {

      return;

    }


    currentUser =
      JSON.parse(savedUser);


    updateUserInterface();


  } catch (error) {

    console.error(
      "Errore ripristino sessione:",
      error
    );

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
    "Hai effettuato il logout"
  );


  showPage("homePage");

}


// ========================================
// INTERFACCIA UTENTE
// ========================================

function updateUserInterface() {

  const userNameElements =
    document.querySelectorAll(
      "[data-user-name]"
    );


  userNameElements.forEach(
    function (element) {

      if (currentUser) {

        element.textContent =
          currentUser.name ||
          "Cliente";

      } else {

        element.textContent =
          "Ospite";

      }

    }
  );


  const loggedInElements =
    document.querySelectorAll(
      "[data-logged-in]"
    );


  const loggedOutElements =
    document.querySelectorAll(
      "[data-logged-out]"
    );


  loggedInElements.forEach(
    function (element) {

      element.style.display =
        currentUser
          ? ""
          : "none";

    }
  );


  loggedOutElements.forEach(
    function (element) {

      element.style.display =
        currentUser
          ? "none"
          : "";

    }
  );

}


// ========================================
// REGISTRAZIONE NUOVO CLIENTE
// ========================================

async function registerUser(
  name,
  phone,
  pin
) {

  if (!name || !phone || !pin) {

    showToast(
      "Compila tutti i campi"
    );

    return false;

  }


  try {

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
      "Registrazione completata!"
    );


    return true;


  } catch (error) {

    console.error(
      "Errore registrazione:",
      error
    );


    showToast(
      "Impossibile completare la registrazione"
    );


    return false;

  }

}


// ========================================
// FORMATTAZIONE DATA
// ========================================

function formatDate(date) {

  if (!(date instanceof Date)) {

    date = new Date(date);

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

    date = new Date(date);

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
// NOTIFICHE VISIVE
// ========================================

// =========================================
// TOAST CENTRALE ELEGANTE
// =========================================

function showToast(message, type = "default") {

  const toast = document.getElementById("toast");

  if (!toast) {
    console.error("Elemento toast non trovato");
    return;
  }

  toast.textContent = message;

  toast.className = "";

  toast.id = "toast";

  if (type === "success") {
    toast.classList.add("success");
  }

  if (type === "error") {
    toast.classList.add("error");
  }

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  clearTimeout(window.toastTimeout);

  window.toastTimeout = setTimeout(() => {

    toast.classList.remove("show");

  }, 2800);

}


// ========================================
// SICUREZZA HTML
// ========================================

function escapeHtml(value) {

  const text =
    String(value);


  return text
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

window.loadUserBookings = loadUserBookings;// =========================================
// LOADING SCREEN
// =========================================

window.addEventListener("load", function () {

  setTimeout(function () {

    const loadingScreen =
      document.getElementById("loadingScreen");

    if (loadingScreen) {
      loadingScreen.classList.add("hidden");
    }

  }, 1200);

});
// ========================================
// FINE APP.JS
// ========================================
