// ========================================
// I GRIMALDI E.S.G.
// APP COMPLETA
// ========================================


// ========================================
// SUPABASE
// ========================================

const SUPABASE_URL =
  "https://wxcdmtajcasnlohqkgmk.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_bwjP-ihASijevvu7d6r5Ew_6JaWKSDP";


let supabaseClient = null;


try {

  if (typeof supabase !== "undefined") {

    supabaseClient =
      supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );

  }

} catch (error) {

  console.error(
    "Errore Supabase:",
    error
  );

}


// ========================================
// STATO
// ========================================

let currentUser = null;

let selectedService = null;

let selectedDate = null;

let selectedTime = null;

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
// ORARI
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
// INIT
// ========================================

async function initializeApp() {

  console.log(
    "I GRIMALDI E.S.G. avvio"
  );


  showLoading();


  setupDate();


  renderServices();


  renderTimes();


  await restoreSession();


  updateProfile();


  setTimeout(function () {

    hideLoading();

  }, 1800);

}


// ========================================
// SPLASH
// ========================================

function showLoading() {

  const loading =
    document.getElementById(
      "loadingScreen"
    );

  const app =
    document.getElementById(
      "app"
    );


  if (loading) {

    loading.classList.remove(
      "hidden"
    );

  }


  if (app) {

    app.classList.add(
      "hidden"
    );

  }

}


function hideLoading() {

  const loading =
    document.getElementById(
      "loadingScreen"
    );

  const app =
    document.getElementById(
      "app"
    );


  if (loading) {

    loading.classList.add(
      "hidden"
    );

  }


  if (app) {

    app.classList.remove(
      "hidden"
    );

  }

}


// ========================================
// NAVIGAZIONE
// ========================================

function showPage(pageId) {

  const pages =
    document.querySelectorAll(
      ".page"
    );


  pages.forEach(function (page) {

    page.classList.remove(
      "active"
    );

  });


  const page =
    document.getElementById(pageId);


  if (page) {

    page.classList.add(
      "active"
    );

  }


  const navButtons =
    document.querySelectorAll(
      ".bottom-nav button"
    );


  navButtons.forEach(function (button) {

    button.classList.remove(
      "active"
    );


    if (
      button.dataset.page === pageId
    ) {

      button.classList.add(
        "active"
      );

    }

  });


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  if (
    pageId === "bookingsPage"
  ) {

    loadUserBookings();

  }


  if (
    pageId === "profilePage"
  ) {

    updateProfile();

  }


  if (
    pageId === "agendaPage"
  ) {

    loadAgenda();

  }

}


// ========================================
// SERVIZI
// ========================================

function renderServices() {

  const container =
    document.getElementById(
      "services"
    );


  if (!container) return;


  container.innerHTML = "";


  services.forEach(function (service) {

    const button =
      document.createElement(
        "button"
      );


    button.type = "button";


    button.className =
      "service-card";


    button.dataset.id =
      service.id;


    button.innerHTML =

      "<strong>" +

      service.name +

      "</strong>" +

      "<span>€ " +

      service.price +

      "</span>";


    button.addEventListener(
      "click",
      function () {

        selectService(
          service.id
        );

      }
    );


    container.appendChild(
      button
    );

  });

}


function selectService(serviceId) {

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


  selectedService = service;


  document
    .querySelectorAll(
      ".service-card"
    )
    .forEach(function (button) {

      button.classList.remove(
        "selected"
      );

    });


  const selected =
    document.querySelector(
      '[data-id="' +
      serviceId +
      '"]'
    );


  if (selected) {

    selected.classList.add(
      "selected"
    );

  }


  updateBookingSummary();

}


// ========================================
// DATA
// ========================================

function setupDate() {

  const input =
    document.getElementById(
      "bookingDate"
    );


  if (!input) return;


  const today =
    getTodayString();


  input.min = today;


  input.value = today;


  selectedDate = today;


  input.addEventListener(
    "change",
    function () {

      selectedDate =
        input.value;


      selectedTime = null;


      renderTimes();


      updateBookingSummary();

    }
  );


  updateBookingSummary();

}


function getTodayString() {

  const date =
    new Date();


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
// ORARI
// ========================================

function renderTimes() {

  const container =
    document.getElementById(
      "timeSlots"
    );


  if (!container) return;


  container.innerHTML = "";


  availableTimes.forEach(
    function (time) {

      const button =
        document.createElement(
          "button"
        );


      button.type = "button";


      button.className =
        "time-slot";


      button.textContent =
        time;


      if (
        selectedTime === time
      ) {

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


      container.appendChild(
        button
      );

    }
  );

}


function selectTime(time) {

  selectedTime = time;


  document
    .querySelectorAll(
      ".time-slot"
    )
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
// SUMMARY
// ========================================

function updateBookingSummary() {

  const service =
    document.getElementById(
      "summaryService"
    );

  const date =
    document.getElementById(
      "summaryDate"
    );

  const time =
    document.getElementById(
      "summaryTime"
    );

  const price =
    document.getElementById(
      "summaryPrice"
    );


  if (service) {

    service.textContent =
      selectedService
        ? selectedService.name
        : "Non selezionato";

  }


  if (date) {

    date.textContent =
      selectedDate
        ? formatDate(selectedDate)
        : "-";

  }


  if (time) {

    time.textContent =
      selectedTime || "-";

  }


  if (price) {

    price.textContent =
      selectedService
        ? "€ " + selectedService.price
        : "€ 0";

  }

}


// ========================================
// PRENOTAZIONE
// ========================================

async function createBooking() {

  if (!currentUser) {

    showToast(
      "Devi accedere prima di prenotare",
      "error"
    );


    openLogin();

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


  try {

    showToast(
      "Prenotazione in corso..."
    );


    if (!supabaseClient) {

      throw new Error(
        "Supabase non disponibile"
      );

    }


    const bookingData = {

      customer_id:
        currentUser.id,

      service_id:
        selectedService.id,

      service_name:
        selectedService.name,

      price:
        selectedService.price,

      booking_date:
        selectedDate,

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
        ]);


    if (result.error) {

      console.error(
        result.error
      );

      throw result.error;

    }


    showToast(
      "Prenotazione confermata!",
      "success"
    );


    selectedService = null;

    selectedTime = null;


    renderServices();

    renderTimes();

    updateBookingSummary();


    setTimeout(function () {

      showPage(
        "bookingsPage"
      );

    }, 700);


  } catch (error) {

    console.error(
      error
    );


    showToast(
      "Errore durante la prenotazione",
      "error"
    );

  }

}


// ========================================
// LOGIN MODAL
// ========================================

function openLogin() {

  const modal =
    document.getElementById(
      "authModal"
    );


  if (modal) {

    modal.classList.remove(
      "hidden"
    );

  }

}


function closeLogin() {

  const modal =
    document.getElementById(
      "authModal"
    );


  if (modal) {

    modal.classList.add(
      "hidden"
    );

  }

}


// ========================================
// LOGIN
// ========================================

document.addEventListener(
  "click",
  function (event) {

    if (
      event.target.id ===
      "loginButton"
    ) {

      loginUser();

    }

  }
);


async function loginUser() {

  const phoneInput =
    document.getElementById(
      "phoneInput"
    );

  const pinInput =
    document.getElementById(
      "pinInput"
    );


  if (
    !phoneInput ||
    !pinInput
  ) {

    return;

  }


  const phone =
    phoneInput.value.trim();

  const pin =
    pinInput.value.trim();


  if (!phone || !pin) {

    showToast(
      "Inserisci telefono e PIN",
      "error"
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


    closeLogin();


    updateProfile();


    showToast(
      "Bentornato " +
      currentUser.name,
      "success"
    );


  } catch (error) {

    console.error(
      error
    );


    showToast(
      "Errore durante l'accesso",
      "error"
    );

  }

}


// ========================================
// REGISTRAZIONE
// ========================================

function openRegister() {

  closeLogin();


  const modal =
    document.getElementById(
      "registerModal"
    );


  if (modal) {

    modal.classList.remove(
      "hidden"
    );

  }

}


function closeRegister() {

  const modal =
    document.getElementById(
      "registerModal"
    );


  if (modal) {

    modal.classList.add(
      "hidden"
    );

  }

}


document.addEventListener(
  "click",
  function (event) {

    if (
      event.target.id ===
      "registerButton"
    ) {

      registerUser();

    }

  }
);


async function registerUser() {

  const name =
    document
      .getElementById(
        "registerName"
      )
      .value
      .trim();


  const phone =
    document
      .getElementById(
        "registerPhone"
      )
      .value
      .trim();


  const pin =
    document
      .getElementById(
        "registerPin"
      )
      .value
      .trim();


  if (
    !name ||
    !phone ||
    !pin
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

      return;

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


    closeRegister();


    updateProfile();


    showToast(
      "Account creato con successo!",
      "success"
    );


  } catch (error) {

    console.error(
      error
    );


    showToast(
      "Errore durante la registrazione",
      "error"
    );

  }

}


// ========================================
// SESSIONE
// ========================================

async function restoreSession() {

  try {

    const saved =
      localStorage.getItem(
        "grimaldiUser"
      );


    if (!saved) return;


    currentUser =
      JSON.parse(saved);


  } catch (error) {

    currentUser = null;

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


  updateProfile();


  showToast(
    "Hai effettuato il logout",
    "success"
  );


  showPage(
    "homePage"
  );

}


// ========================================
// PROFILO
// ========================================

function updateProfile() {

  const container =
    document.getElementById(
      "profileContent"
    );


  if (!container) return;


  if (!currentUser) {

    container.innerHTML =

      '<div class="profile-name">' +

      "Ospite" +

      "</div>" +

      '<div class="profile-phone">' +

      "Accedi per gestire il tuo account" +

      "</div>" +

      '<button class="main-gold-button" style="margin-top:20px" onclick="openLogin()">' +

      "ACCEDI" +

      "</button>";


    return;

  }


  container.innerHTML =

    '<div class="profile-name">' +

    escapeHtml(
      currentUser.name ||
      "Cliente"
    ) +

    "</div>" +

    '<div class="profile-phone">' +

    escapeHtml(
      currentUser.phone ||
      ""
    ) +

    "</div>";

}


// ========================================
// PRENOTAZIONI
// ========================================

async function loadUserBookings() {

  const container =
    document.getElementById(
      "bookingsList"
    );


  if (!container) return;


  if (!currentUser) {

    container.innerHTML =
      "<p>Accedi per vedere le tue prenotazioni.</p>";

    return;

  }


  container.innerHTML =
    "<p>Caricamento...</p>";


  try {

    const result =
      await supabaseClient
        .from("bookings")
        .select("*")
        .eq(
          "customer_id",
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
        "<p>Nessuna prenotazione presente.</p>";

      return;

    }


    container.innerHTML = "";


    bookings.forEach(
      function (booking) {

        const card =
          document.createElement(
            "div"
          );


        card.className =
          "booking-card";


        card.innerHTML =

          '<div class="booking-info">' +

          "<strong>" +

          escapeHtml(
            booking.service_name
          ) +

          "</strong>" +

          '<div class="booking-detail">' +

          formatDate(
            booking.booking_date
          ) +

          "</div>" +

          '<div class="booking-detail">' +

          booking.booking_time +

          "</div>" +

          '<div class="booking-price">' +

          "€ " +

          booking.price +

          "</div>" +

          "</div>" +

          '<button class="cancel-booking">' +

          "Annulla" +

          "</button>";


        const cancel =
          card.querySelector(
            ".cancel-booking"
          );


        cancel.addEventListener(
          "click",
          function () {

            cancelBooking(
              booking.id
            );

          }
        );


        container.appendChild(
          card
        );

      }
    );


  } catch (error) {

    console.error(error);


    container.innerHTML =
      "<p>Errore nel caricamento.</p>";

  }

}


// ========================================
// CANCELLA BOOKING
// ========================================

async function cancelBooking(id) {

  if (
    !confirm(
      "Vuoi annullare la prenotazione?"
    )
  ) {

    return;

  }


  try {

    const result =
      await supabaseClient
        .from("bookings")
        .delete()
        .eq(
          "id",
          id
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

    showToast(
      "Errore annullamento",
      "error"
    );

  }

}


// ========================================
// AGENDA
// ========================================

async function loadAgenda() {

  const container =
    document.getElementById(
      "agendaSlots"
    );


  if (!container) return;


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
        );


    const bookings =
      result.data || [];


    document.getElementById(
      "agendaCount"
    ).textContent =
      bookings.length;


    let revenue = 0;


    bookings.forEach(
      booking => {

        revenue +=
          Number(
            booking.price || 0
          );

      }
    );


    document.getElementById(
      "agendaRevenue"
    ).textContent =
      "€ " + revenue;


    if (
      bookings.length === 0
    ) {

      container.innerHTML =
        "Nessun appuntamento.";

      return;

    }


    container.innerHTML = "";


    bookings.forEach(
      booking => {

        const div =
          document.createElement(
            "div"
          );


        div.className =
          "booking-card";


        div.innerHTML =

          "<div>" +

          "<strong>" +

          escapeHtml(
            booking.service_name
          ) +

          "</strong>" +

          '<div class="booking-detail">' +

          booking.booking_date +

          " • " +

          booking.booking_time +

          "</div>" +

          "</div>" +

          "<strong>€ " +

          booking.price +

          "</strong>";


        container.appendChild(
          div
        );

      }
    );


  } catch (error) {

    console.error(error);

  }

}


// ========================================
// MODAL ADMIN
// ========================================

function openAddClient() {

  const modal =
    document.getElementById(
      "addModal"
    );


  if (modal) {

    modal.classList.remove(
      "hidden"
    );

  }


  const serviceSelect =
    document.getElementById(
      "adminService"
    );


  const timeSelect =
    document.getElementById(
      "adminTime"
    );


  if (serviceSelect) {

    serviceSelect.innerHTML = "";


    services.forEach(
      service => {

        serviceSelect.innerHTML +=

          '<option value="' +

          service.id +

          '">' +

          service.name +

          " - €" +

          service.price +

          "</option>";

      }
    );

  }


  if (timeSelect) {

    timeSelect.innerHTML = "";


    availableTimes.forEach(
      time => {

        timeSelect.innerHTML +=

          "<option>" +

          time +

          "</option>";

      }
    );

  }

}


function openBlock() {

  showToast(
    "Funzione blocco disponibilità in configurazione"
  );

}


function closeModal(id) {

  const modal =
    document.getElementById(id);


  if (modal) {

    modal.classList.add(
      "hidden"
    );

  }

}


// ========================================
// INSTALL
// ========================================

function showInstall() {

  const modal =
    document.getElementById(
      "installModal"
    );


  if (modal) {

    modal.classList.remove(
      "hidden"
    );

  }

}


// ========================================
// NOTIFICHE
// ========================================

function requestNotifications() {

  if (
    "Notification" in window
  ) {

    Notification
      .requestPermission()
      .then(function (permission) {

        if (
          permission === "granted"
        ) {

          showToast(
            "Notifiche attivate!",
            "success"
          );

        } else {

          showToast(
            "Notifiche non autorizzate"
          );

        }

      });

  } else {

    showToast(
      "Questo dispositivo non supporta le notifiche"
    );

  }

}


// ========================================
// TOAST
// ========================================

function showToast(
  message,
  type = ""
) {

  const toast =
    document.getElementById(
      "toast"
    );


  if (!toast) return;


  toast.textContent =
    message;


  toast.className =
    "toast";


  if (type) {

    toast.classList.add(
      type
    );

  }


  requestAnimationFrame(
    function () {

      toast.classList.add(
        "show"
      );

    }
  );


  clearTimeout(
    toastTimeout
  );


  toastTimeout =
    setTimeout(
      function () {

        toast.classList.remove(
          "show"
        );

      },
      2800
    );

}


// ========================================
// FORMAT DATE
// ========================================

function formatDate(dateString) {

  if (!dateString) return "-";


  const date =
    new Date(
      dateString +
      "T12:00:00"
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


// ========================================
// ESCAPE HTML
// ========================================

function escapeHtml(value) {

  return String(value || "")

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
// GLOBAL FUNCTIONS
// ========================================

window.showPage =
  showPage;

window.openLogin =
  openLogin;

window.openRegister =
  openRegister;

window.closeRegister =
  closeRegister;

window.closeModal =
  closeModal;

window.createBooking =
  createBooking;

window.logoutUser =
  logoutUser;

window.openAddClient =
  openAddClient;

window.openBlock =
  openBlock;

window.showInstall =
  showInstall;

window.requestNotifications =
  requestNotifications;

window.cancelBooking =
  cancelBooking;

window.loginUser =
  loginUser;


// ========================================
// FINE FILE
// ========================================
