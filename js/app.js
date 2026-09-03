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
  },

  {
    id: "taglio_bambino",
    name: "Taglio Bambino",
    price: 15,
    duration: 30
  }

];


// ========================================
// AVVIO APPLICAZIONE
// ========================================

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    await initializeApp();

  }
);


// ========================================
// INIZIALIZZAZIONE
// ========================================

async function initializeApp() {

  console.log(
    "Avvio applicazione I Grimaldi E.S.G."
  );


  // Mostra caricamento iniziale

  showLoading();


  // Configurazioni

  setupNavigation();

  setupServiceButtons();

  setupBookingButtons();

  setupAuthButtons();

  setupDateControls();

  setupRegisterButtons();


  // Carica orari

  loadAvailableTimes();


  // Ripristina eventuale login

  await restoreSession();


  // Piccolo tempo per splash elegante

  setTimeout(function () {

    hideLoading();

  }, 1400);

}


// ========================================
// LOADING / SPLASH SCREEN
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


// Manteniamo compatibilità vecchie funzioni

function showSplash() {

  showLoading();

}


function hideSplash() {

  hideLoading();

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


  // Aggiorna eventuale stato navigazione

  const navButtons =
    document.querySelectorAll("[data-page]");


  navButtons.forEach(function (button) {

    const buttonPage =
      button.getAttribute("data-page");


    button.classList.remove("active");


    if (buttonPage === pageId) {

      button.classList.add("active");

    }

  });


  // Scroll in alto

  window.scrollTo({

    top: 0,

    behavior: "smooth"

  });


  // Carica prenotazioni quando necessario

  if (pageId === "bookingsPage") {

    loadUserBookings();

  }


  // Aggiorna interfaccia

  updateUserInterface();

}


// ========================================
// SERVIZI
// ========================================

function setupServiceButtons() {

  const serviceButtons =
    document.querySelectorAll("[data-service]");


  serviceButtons.forEach(function (button) {

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


  const buttons =
    document.querySelectorAll("[data-service]");


  buttons.forEach(function (button) {

    button.classList.remove("selected");

  });


  const selectedButton =
    document.querySelector(
      '[data-service="' +
      serviceId +
      '"]'
    );


  if (selectedButton) {

    selectedButton.classList.add("selected");

  }


  updateBookingSummary();

}


// ========================================
// CONTROLLO DATE
// ========================================

function setupDateControls() {

  const dateInput =
    document.getElementById("bookingDate");


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
    function () {

      selectedDate =
        new Date(
          dateInput.value +
          "T12:00:00"
        );


      selectedTime = null;


      updateBookingSummary();


      loadAvailableTimes();

    }
  );

}


function getTodayString() {

  const today =
    new Date();


  const year =
    today.getFullYear();


  const month =
    String(
      today.getMonth() + 1
    ).padStart(2, "0");


  const day =
    String(
      today.getDate()
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
// ORARI DISPONIBILI
// ========================================

async function loadAvailableTimes() {

  const container =
    document.getElementById("timeSlots");


  if (!container) {

    return;

  }


  container.innerHTML =
    '<div class="times-loading">' +
    'Caricamento orari...' +
    '</div>';


  try {

    const times =
      generateAvailableTimes();


    container.innerHTML = "";


    times.forEach(function (time) {

      const button =
        document.createElement("button");


      button.type = "button";

      button.className =
        "time-slot";


      button.textContent =
        time;


      if (selectedTime === time) {

        button.classList.add(
          "selected"
        );

      }


      button.addEventListener(
        "click",
        function () {

          selectTime(time);

        }
      );


      container.appendChild(button);

    });

  } catch (error) {

    console.error(
      "Errore caricamento orari:",
      error
    );


    container.innerHTML =
      "<p>Impossibile caricare gli orari.</p>";

  }

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


// ========================================
// SELEZIONE ORARIO
// ========================================

function selectTime(time) {

  selectedTime = time;


  const buttons =
    document.querySelectorAll(
      ".time-slot"
    );


  buttons.forEach(function (button) {

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
// RIEPILOGO PRENOTAZIONE
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
        ? "€ " +
          selectedService.price
        : "€ 0";

  }

}


// ========================================
// BOTTONI PRENOTAZIONE
// ========================================

function setupBookingButtons() {

  const confirmButton =
    document.getElementById(
      "confirmBooking"
    );


  if (confirmButton) {

    confirmButton.addEventListener(
      "click",
      function () {

        createBooking();

      }
    );

  }

}


// ========================================
// CREA PRENOTAZIONE
// ========================================

async function createBooking() {

  if (!currentUser) {

    showToast(
      "Accedi prima di effettuare una prenotazione",
      "error"
    );


    showPage("loginPage");

    return;

  }


  if (!selectedService) {

    showToast(
      "Seleziona prima un servizio",
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
      formatDatabaseDate(
        selectedDate
      ),

    booking_time:
      selectedTime,

    status:
      "confirmed"

  };


  try {

    if (!supabaseClient) {

      throw new Error(
        "Supabase non disponibile"
      );

    }


    showToast(
      "Sto confermando la prenotazione..."
    );


    const result =
      await supabaseClient
        .from("bookings")
        .insert([bookingData])
        .select();


    if (result.error) {

      throw result.error;

    }


    currentBookingId =
      result.data &&
      result.data.length > 0
        ? result.data[0].id
        : null;


    resetBooking();


    showToast(
      "Prenotazione confermata!",
      "success"
    );


    setTimeout(function () {

      showPage(
        "bookingsPage"
      );


      loadUserBookings();

    }, 500);


  } catch (error) {

    console.error(
      "Errore prenotazione:",
      error
    );


    showToast(
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


  const serviceButtons =
    document.querySelectorAll(
      "[data-service]"
    );


  serviceButtons.forEach(function (
    button
  ) {

    button.classList.remove(
      "selected"
    );

  });


  const timeButtons =
    document.querySelectorAll(
      ".time-slot"
    );


  timeButtons.forEach(function (
    button
  ) {

    button.classList.remove(
      "selected"
    );

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

      '<div class="empty-state">' +
      "<h3>Non hai effettuato l'accesso</h3>" +
      "<p>Accedi per vedere le tue prenotazioni.</p>" +
      "</div>";

    return;

  }


  container.innerHTML =

    '<div class="bookings-loading">' +
    "Caricamento prenotazioni..." +
    "</div>";


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
        .eq(
          "user_id",
          currentUser.id
        )
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

        '<div class="empty-state">' +
        "<h3>Nessuna prenotazione</h3>" +
        "<p>Non hai ancora prenotazioni.</p>" +
        "</div>";

      return;

    }


    container.innerHTML = "";


    bookings.forEach(function (
      booking
    ) {

      const card =
        document.createElement("div");


      card.className =
        "booking-card";


      const date =
        formatDate(
          new Date(
            booking.booking_date +
            "T12:00:00"
          )
        );


      card.innerHTML =

        '<div class="booking-info">' +

        "<strong>" +

        escapeHtml(
          booking.service_name ||
          "Servizio"
        ) +

        "</strong>" +


        '<div class="booking-detail">' +

        date +

        "</div>" +


        '<div class="booking-detail">' +

        escapeHtml(
          booking.booking_time || ""
        ) +

        "</div>" +


        '<div class="booking-price">' +

        "€ " +

        escapeHtml(
          String(
            booking.price || 0
          )
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

      '<div class="empty-state">' +
      "<h3>Errore</h3>" +
      "<p>Impossibile caricare le prenotazioni.</p>" +
      "</div>";

  }

}


// ========================================
// ANNULLAMENTO PRENOTAZIONE
// ========================================

async function cancelBooking(bookingId) {

  const confirmed =
    window.confirm(
      "Vuoi davvero annullare questa prenotazione?"
    );


  if (!confirmed) {

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


    loadUserBookings();


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


// ========================================
// AUTENTICAZIONE
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


  // Login con tasto INVIO

  const pinInput =
    document.getElementById(
      "pinInput"
    );


  if (pinInput) {

    pinInput.addEventListener(
      "keydown",
      function (event) {

        if (
          event.key === "Enter"
        ) {

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

    showToast(
      "Campi login non trovati",
      "error"
    );

    return;

  }


  const phone =
    phoneInput.value.trim();


  const pin =
    pinInput.value.trim();


  if (!phone) {

    showToast(
      "Inserisci il numero di telefono",
      "error"
    );


    phoneInput.focus();

    return;

  }


  if (!pin) {

    showToast(
      "Inserisci il PIN",
      "error"
    );


    pinInput.focus();

    return;

  }


  try {

    if (!supabaseClient) {

      throw new Error(
        "Supabase non disponibile"
      );

    }


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
      JSON.stringify(
        currentUser
      )
    );


    updateUserInterface();


    showToast(
      "Bentornato " +
      (
        currentUser.name ||
        "!"
      ),
      "success"
    );


    setTimeout(function () {

      showPage(
        "homePage"
      );

    }, 350);


  } catch (error) {

    console.error(
      "Errore login:",
      error
    );


    showToast(
      "Errore durante il login",
      "error"
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

      updateUserInterface();

      return;

    }


    const parsedUser =
      JSON.parse(savedUser);


    if (
      !parsedUser ||
      !parsedUser.id
    ) {

      localStorage.removeItem(
        "grimaldiUser"
      );


      updateUserInterface();

      return;

    }


    currentUser =
      parsedUser;


    updateUserInterface();


  } catch (error) {

    console.error(
      "Errore ripristino sessione:",
      error
    );


    localStorage.removeItem(
      "grimaldiUser"
    );


    currentUser = null;


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
    "Hai effettuato il logout",
    "success"
  );


  showPage(
    "homePage"
  );

}


// ========================================
// INTERFACCIA UTENTE
// ========================================

function updateUserInterface() {

  // Nome utente

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


  // Elementi visibili solo login

  const loggedInElements =
    document.querySelectorAll(
      "[data-logged-in]"
    );


  loggedInElements.forEach(
    function (element) {

      if (currentUser) {

        element.style.display = "";

      } else {

        element.style.display =
          "none";

      }

    }
  );


  // Elementi visibili solo logout

  const loggedOutElements =
    document.querySelectorAll(
      "[data-logged-out]"
    );


  loggedOutElements.forEach(
    function (element) {

      if (currentUser) {

        element.style.display =
          "none";

      } else {

        element.style.display =
          "";

      }

    }
  );


  // Corpo applicazione

  document.body.classList.toggle(
    "user-logged-in",
    !!currentUser
  );

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
      function () {

        handleRegistration();

      }
    );

  }

}


// ========================================
// GESTIONE REGISTRAZIONE
// ========================================

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


  const name =
    nameInput.value.trim();


  const phone =
    phoneInput.value.trim();


  const pin =
    pinInput.value.trim();


  const success =
    await registerUser(
      name,
      phone,
      pin
    );


  if (success) {

    showPage(
      "homePage"
    );

  }

}


// ========================================
// CREA NUOVO UTENTE
// ========================================

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


  try {

    if (!supabaseClient) {

      throw new Error(
        "Supabase non disponibile"
      );

    }


    // Controlla se numero già esistente

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
        "Questo numero è già registrato",
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
      JSON.stringify(
        currentUser
      )
    );


    updateUserInterface();


    showToast(
      "Registrazione completata!",
      "success"
    );


    return true;


  } catch (error) {

    console.error(
      "Errore registrazione:",
      error
    );


    showToast(
      "Impossibile completare la registrazione",
      "error"
    );


    return false;

  }

}


// ========================================
// FORMATTAZIONE DATA
// ========================================

function formatDate(date) {

  if (!(date instanceof Date)) {

    date =
      new Date(date);

  }


  if (
    isNaN(
      date.getTime()
    )
  ) {

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


// ========================================
// DATA DATABASE
// ========================================

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
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return (

    year +

    "-" +

    month +

    "-" +

    day

  );

}


// ========================================
// TOAST CENTRALE ELEGANTE
// ========================================

function showToast(
  message,
  type = "default"
) {

  let toast =
    document.getElementById(
      "toast"
    );


  // Se non esiste lo crea automaticamente

  if (!toast) {

    toast =
      document.createElement("div");


    toast.id =
      "toast";


    document.body.appendChild(
      toast
    );

  }


  toast.textContent =
    message;


  // Reset classi

  toast.className =
    "";


  // Classe base

  toast.classList.add(
    "toast"
  );


  if (type === "success") {

    toast.classList.add(
      "success"
    );

  }


  if (type === "error") {

    toast.classList.add(
      "error"
    );

  }


  // Mostra

  requestAnimationFrame(
    function () {

      toast.classList.add(
        "show"
      );

    }
  );


  // Cancella vecchio timeout

  if (toastTimeout) {

    clearTimeout(
      toastTimeout
    );

  }


  // Nasconde dopo tempo

  toastTimeout =
    setTimeout(
      function () {

        toast.classList.remove(
          "show"
        );

      },
      2600
    );

}


// ========================================
// SICUREZZA HTML
// ========================================

function escapeHtml(value) {

  const text =
    String(value);


  return text

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


// ========================================
// FUNZIONI GLOBALI
// ========================================

window.showPage =
  showPage;


window.selectService =
  selectService;


window.selectTime =
  selectTime;


window.createBooking =
  createBooking;


window.cancelBooking =
  cancelBooking;


window.loginUser =
  loginUser;


window.logoutUser =
  logoutUser;


window.loadUserBookings =
  loadUserBookings;


window.registerUser =
  registerUser;


window.showToast =
  showToast;


window.showLoading =
  showLoading;


window.hideLoading =
  hideLoading;


// ========================================
// FINE APP.JS
// ========================================
