// ========================================
// I GRIMALDI E.S.G. PARRUCCHIERI
// APP.JS - VERSIONE COMPATIBILE
// ========================================


// ========================================
// SUPABASE
// ========================================

const SUPABASE_URL = "https://wxcdmtajcasnlohqkgmk.supabase.co";

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

  console.error("Errore Supabase:", error);

}


// ========================================
// STATO APP
// ========================================

let currentUser = null;

let selectedService = null;

let selectedDate = null;

let selectedTime = null;

let bookingViewDate = new Date();

let agendaViewDate = new Date();

let agendaSelectedDate = new Date();

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


async function initializeApp() {

  showLoading();

  renderServices();

  renderBookingCalendar();

  renderBookingTimes();

  await restoreSession();

  setTimeout(function () {

    hideLoading();

  }, 1600);

}


// ========================================
// LOADING
// ========================================

function showLoading() {

  const loading =
    document.getElementById("loadingScreen");

  const app =
    document.getElementById("app");

  if (loading) {

    loading.classList.remove("hidden");

    loading.style.display = "flex";

  }

  if (app) {

    app.classList.remove("hidden");

  }

}


function hideLoading() {

  const loading =
    document.getElementById("loadingScreen");

  if (loading) {

    loading.classList.add("hidden");

    setTimeout(function () {

      loading.style.display = "none";

    }, 500);

  }

}


// ========================================
// NAVIGAZIONE
// ========================================

function showPage(pageId) {

  const pages =
    document.querySelectorAll(".page");

  pages.forEach(function (page) {

    page.classList.remove("active");

  });

  const target =
    document.getElementById(pageId);

  if (target) {

    target.classList.add("active");

  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  if (pageId === "appointmentsPage") {

    loadMyAppointments();

  }


  if (pageId === "agendaPage") {

    renderAgenda();

  }


  if (pageId === "profilePage") {

    renderProfile();

  }

}


// ========================================
// SERVIZI
// ========================================

function renderServices() {

  const container =
    document.getElementById("services");

  if (!container) return;

  container.innerHTML = "";


  services.forEach(function (service) {

    const button =
      document.createElement("button");

    button.type = "button";

    button.className = "service-card";

    if (
      selectedService &&
      selectedService.id === service.id
    ) {

      button.classList.add("selected");

    }


    button.innerHTML =

      '<span class="service-name">' +
      service.name +
      '</span>' +

      '<span class="service-price">' +
      "€" + service.price +
      '</span>';


    button.onclick = function () {

      selectedService = service;

      renderServices();

      showToast(
        service.name + " selezionato"
      );

    };


    container.appendChild(button);

  });

}


// ========================================
// CALENDARIO PRENOTAZIONE
// ========================================

function renderBookingCalendar() {

  const container =
    document.getElementById("bookingCalendar");

  const title =
    document.getElementById("bookingMonthTitle");

  if (!container) return;


  const year =
    bookingViewDate.getFullYear();

  const month =
    bookingViewDate.getMonth();


  if (title) {

    title.textContent =
      bookingViewDate.toLocaleDateString(
        "it-IT",
        {
          month: "long",
          year: "numeric"
        }
      );

  }


  container.innerHTML = "";


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


  for (
    let i = 0;
    i < startDay;
    i++
  ) {

    const empty =
      document.createElement("span");

    empty.className = "calendar-empty";

    container.appendChild(empty);

  }


  const today = new Date();

  today.setHours(0, 0, 0, 0);


  for (
    let day = 1;
    day <= lastDay.getDate();
    day++
  ) {

    const date =
      new Date(year, month, day);

    date.setHours(0, 0, 0, 0);


    const button =
      document.createElement("button");

    button.type = "button";

    button.textContent = day;


    if (date < today) {

      button.disabled = true;

      button.classList.add("disabled");

    }


    if (
      selectedDate &&
      sameDate(
        selectedDate,
        date
      )
    ) {

      button.classList.add("selected");

    }


    if (
      sameDate(
        today,
        date
      )
    ) {

      button.classList.add("today");

    }


    button.onclick = function () {

      if (date < today) return;

      selectedDate = date;

      selectedTime = null;

      renderBookingCalendar();

      renderBookingTimes();

      updateBookingDateLabel();

    };


    container.appendChild(button);

  }

}


function changeBookingMonth(direction) {

  bookingViewDate.setMonth(
    bookingViewDate.getMonth() + direction
  );

  renderBookingCalendar();

}


// ========================================
// LABEL DATA
// ========================================

function updateBookingDateLabel() {

  const label =
    document.getElementById(
      "selectedBookingDateLabel"
    );

  if (!label) return;


  if (!selectedDate) {

    label.textContent =
      "Prima scegli una data";

    return;

  }


  label.textContent =
    selectedDate.toLocaleDateString(
      "it-IT",
      {
        weekday: "long",
        day: "numeric",
        month: "long"
      }
    );

}


// ========================================
// ORARI PRENOTAZIONE
// ========================================

function renderBookingTimes() {

  const container =
    document.getElementById(
      "bookingTimesElegant"
    );

  if (!container) return;

  container.innerHTML = "";


  availableTimes.forEach(function (time) {

    const button =
      document.createElement("button");

    button.type = "button";

    button.className = "booking-time";

    button.textContent = time;


    if (
      selectedTime === time
    ) {

      button.classList.add("selected");

    }


    button.onclick = function () {

      if (!selectedDate) {

        showToast(
          "Prima scegli una data",
          "error"
        );

        return;

      }


      selectedTime = time;

      renderBookingTimes();

    };


    container.appendChild(button);

  });

}


// ========================================
// CREA PRENOTAZIONE
// ========================================

async function createBooking() {

  if (!currentUser) {

    openAuth();

    showToast(
      "Accedi per continuare",
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


  if (!supabaseClient) {

    showToast(
      "Connessione database non disponibile",
      "error"
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

    booking_time: selectedTime,

    status: "confirmed"

  };


  try {

    showToast(
      "Conferma in corso..."
    );


    const result =
      await supabaseClient
        .from("bookings")
        .insert([bookingData])
        .select();


    if (result.error) {

      throw result.error;

    }


    showToast(
      "Prenotazione confermata!",
      "success"
    );


    selectedService = null;

    selectedDate = null;

    selectedTime = null;


    renderServices();

    renderBookingCalendar();

    renderBookingTimes();

    updateBookingDateLabel();


    setTimeout(function () {

      showPage("appointmentsPage");

    }, 700);


  } catch (error) {

    console.error(error);

    showToast(
      "Errore durante la prenotazione",
      "error"
    );

  }

}


// ========================================
// MIE PRENOTAZIONI
// ========================================

async function loadMyAppointments() {

  const container =
    document.getElementById(
      "myAppointments"
    );

  if (!container) return;


  if (!currentUser) {

    container.innerHTML =
      '<div class="empty-state">' +
      "<h3>Accedi al tuo account</h3>" +
      "<p>Potrai vedere tutti i tuoi appuntamenti.</p>" +
      "</div>";

    return;

  }


  container.innerHTML =
    "<p>Caricamento...</p>";


  try {

    const result =
      await supabaseClient
        .from("bookings")
        .select("*")
        .eq("user_id", currentUser.id)
        .order(
          "booking_date",
          { ascending: true }
        );


    if (result.error) {

      throw result.error;

    }


    const bookings =
      result.data || [];


    if (bookings.length === 0) {

      container.innerHTML =
        '<div class="empty-state">' +
        "<h3>Nessun appuntamento</h3>" +
        "<p>Non hai ancora appuntamenti prenotati.</p>" +
        "</div>";

      return;

    }


    container.innerHTML = "";


    bookings.forEach(function (booking) {

      const card =
        document.createElement("div");

      card.className =
        "card appointment-card";


      const date =
        new Date(
          booking.booking_date +
          "T12:00:00"
        );


      card.innerHTML =

        "<div>" +

        "<h3>" +
        escapeHtml(
          booking.service_name
        ) +
        "</h3>" +

        "<p>" +
        formatDate(date) +
        "</p>" +

        "<strong>" +
        booking.booking_time +
        " · €" +
        booking.price +
        "</strong>" +

        "</div>" +

        '<button type="button">' +
        "Annulla" +
        "</button>";


      const cancelButton =
        card.querySelector("button");


      cancelButton.onclick =
        function () {

          cancelBooking(
            booking.id
          );

        };


      container.appendChild(card);

    });


  } catch (error) {

    console.error(error);

    container.innerHTML =
      "<p>Impossibile caricare gli appuntamenti.</p>";

  }

}


// ========================================
// ANNULLA PRENOTAZIONE
// ========================================

async function cancelBooking(id) {

  const confirmed =
    confirm(
      "Vuoi annullare questo appuntamento?"
    );

  if (!confirmed) return;


  try {

    const result =
      await supabaseClient
        .from("bookings")
        .delete()
        .eq("id", id);


    if (result.error) {

      throw result.error;

    }


    showToast(
      "Appuntamento annullato",
      "success"
    );


    loadMyAppointments();


  } catch (error) {

    showToast(
      "Errore annullamento",
      "error"
    );

  }

}


// ========================================
// LOGIN MODAL
// ========================================

function openAuth() {

  const modal =
    document.getElementById(
      "authModal"
    );

  if (modal) {

    modal.classList.remove("hidden");

  }

}


async function login() {

  const phoneInput =
    document.getElementById(
      "loginPhone"
    );

  const pinInput =
    document.getElementById(
      "loginPin"
    );

  const errorElement =
    document.getElementById(
      "loginError"
    );


  if (errorElement) {

    errorElement.textContent = "";

  }


  if (!phoneInput || !pinInput) {

    return;

  }


  const phone =
    phoneInput.value.trim();

  const pin =
    pinInput.value.trim();


  if (!phone || !pin) {

    if (errorElement) {

      errorElement.textContent =
        "Inserisci numero e PIN";

    }

    return;

  }


  try {

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

      if (errorElement) {

        errorElement.textContent =
          "Numero o PIN non corretti";

      }

      return;

    }


    currentUser = result.data;


    localStorage.setItem(
      "grimaldiUser",
      JSON.stringify(currentUser)
    );


    closeAuth();

    updateNavigation();

    showToast(
      "Bentornato " +
      currentUser.name,
      "success"
    );


    showPage("homePage");


  } catch (error) {

    console.error(error);

    if (errorElement) {

      errorElement.textContent =
        "Errore durante l'accesso";

    }

  }

}


function closeAuth() {

  const modal =
    document.getElementById(
      "authModal"
    );

  if (modal) {

    modal.classList.add("hidden");

  }

}


// ========================================
// REGISTRAZIONE
// ========================================

function openRegister() {

  closeAuth();

  document
    .getElementById("registerModal")
    .classList.remove("hidden");

}


function closeRegister() {

  document
    .getElementById("registerModal")
    .classList.add("hidden");

}


async function register() {

  const name =
    document.getElementById(
      "regName"
    ).value.trim();

  const surname =
    document.getElementById(
      "regSurname"
    ).value.trim();

  const phone =
    document.getElementById(
      "regPhone"
    ).value.trim();

  const pin =
    document.getElementById(
      "regPin"
    ).value.trim();

  const pin2 =
    document.getElementById(
      "regPin2"
    ).value.trim();


  if (
    !name ||
    !surname ||
    !phone ||
    !pin
  ) {

    showToast(
      "Compila tutti i campi",
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


  const fullName =
    name + " " + surname;


  try {

    const result =
      await supabaseClient
        .from("users")
        .insert([{

          name: fullName,

          phone: phone,

          pin: pin

        }])
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


    closeRegister();

    updateNavigation();

    showToast(
      "Account creato con successo!",
      "success"
    );


    showPage("homePage");


  } catch (error) {

    console.error(error);

    showToast(
      "Numero già registrato o errore",
      "error"
    );

  }

}


// ========================================
// LOGOUT
// ========================================

function logout() {

  currentUser = null;

  localStorage.removeItem(
    "grimaldiUser"
  );


  updateNavigation();


  showToast(
    "Logout effettuato"
  );


  showPage("homePage");

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


    if (!saved) {

     
