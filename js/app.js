/* =====================================================
   I GRIMALDI E.S.G. - APP.JS
   PATCH STABILE
===================================================== */

"use strict";

/* =====================================================
   CONFIGURAZIONE SERVIZI
===================================================== */

const SERVICES = [
  {
    id: "shampoo-taglio",
    name: "Shampoo + Taglio",
    price: 20,
    duration: 30
  },
  {
    id: "barba-5",
    name: "Barba",
    price: 5,
    duration: 30
  },
  {
    id: "barba-10",
    name: "Barba Premium",
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
    id: "colore-barba",
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


/* =====================================================
   STATO APP
===================================================== */

let selectedService = null;
let selectedDate = null;
let selectedTime = null;


/* =====================================================
   AVVIO APP
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

  console.log("I GRIMALDI app avviata");

  renderServices();

  setupButtons();

  setupDate();

});


/* =====================================================
   RENDER SERVIZI
===================================================== */

function renderServices() {

  const container =
    document.getElementById("servicesContainer") ||
    document.getElementById("services") ||
    document.querySelector(".services-container");

  if (!container) {

    console.warn(
      "Container servizi non trovato. Nessun errore bloccante."
    );

    return;
  }

  container.innerHTML = "";

  SERVICES.forEach(function (service) {

    const card = document.createElement("button");

    card.type = "button";

    card.className = "service-card";

    card.dataset.serviceId = service.id;

    card.innerHTML = `
      <div class="service-info">
        <div class="service-name">
          ${service.name}
        </div>

        <div class="service-price">
          €${service.price}
        </div>
      </div>
    `;

    card.addEventListener("click", function () {

      document
        .querySelectorAll(".service-card")
        .forEach(function (item) {
          item.classList.remove("selected");
        });

      card.classList.add("selected");

      selectedService = service;

      console.log(
        "Servizio selezionato:",
        selectedService
      );

      updateBookingSummary();

    });

    container.appendChild(card);

  });

}


/* =====================================================
   BOTTONI
===================================================== */

function setupButtons() {

  const loginButton =
    document.getElementById("loginBtn") ||
    document.querySelector("[data-action='login']");

  const registerButton =
    document.getElementById("registerBtn") ||
    document.querySelector("[data-action='register']");

  const bookingButton =
    document.getElementById("bookingBtn") ||
    document.querySelector("[data-action='booking']");

  if (loginButton) {

    loginButton.addEventListener("click", function (event) {

      event.preventDefault();

      openLoginModal();

    });

  }

  if (registerButton) {

    registerButton.addEventListener("click", function (event) {

      event.preventDefault();

      openRegisterModal();

    });

  }

  if (bookingButton) {

    bookingButton.addEventListener("click", function (event) {

      event.preventDefault();

      openBooking();

    });

  }

}


/* =====================================================
   LOGIN
===================================================== */

function openLoginModal() {

  const modal =
    document.getElementById("loginModal");

  if (modal) {

    modal.classList.add("active");

    modal.style.display = "flex";

    return;
  }

  console.warn("loginModal non trovato");

}


/* =====================================================
   REGISTRAZIONE
===================================================== */

function openRegisterModal() {

  const modal =
    document.getElementById("registerModal");

  if (modal) {

    modal.classList.add("active");

    modal.style.display = "flex";

    return;
  }

  console.warn("registerModal non trovato");

}


/* =====================================================
   PRENOTAZIONE
===================================================== */

function openBooking() {

  const section =
    document.getElementById("booking") ||
    document.getElementById("bookingSection");

  if (section) {

    section.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }

}


/* =====================================================
   DATA
===================================================== */

function setupDate() {

  const dateInput =
    document.getElementById("bookingDate") ||
    document.querySelector("input[type='date']");

  if (!dateInput) return;

  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  const minDate =
    `${year}-${month}-${day}`;

  dateInput.min = minDate;

  dateInput.addEventListener("change", function () {

    selectedDate = this.value;

    updateBookingSummary();

  });

}


/* =====================================================
   ORARI
===================================================== */

function selectTime(time) {

  selectedTime = time;

  document
    .querySelectorAll(".time-slot")
    .forEach(function (slot) {

      slot.classList.remove("selected");

    });

  const activeSlot =
    document.querySelector(
      `[data-time="${time}"]`
    );

  if (activeSlot) {

    activeSlot.classList.add("selected");

  }

  updateBookingSummary();

}


/* =====================================================
   RIEPILOGO PRENOTAZIONE
===================================================== */

function updateBookingSummary() {

  const serviceElement =
    document.getElementById("summaryService");

  const priceElement =
    document.getElementById("summaryPrice");

  const dateElement =
    document.getElementById("summaryDate");

  const timeElement =
    document.getElementById("summaryTime");

  if (
    serviceElement &&
    selectedService
  ) {

    serviceElement.textContent =
      selectedService.name;

  }

  if (
    priceElement &&
    selectedService
  ) {

    priceElement.textContent =
      `€${selectedService.price}`;

  }

  if (
    dateElement &&
    selectedDate
  ) {

    dateElement.textContent =
      formatDate(selectedDate);

  }

  if (
    timeElement &&
    selectedTime
  ) {

    timeElement.textContent =
      selectedTime;

  }

}


/* =====================================================
   FORMAT DATA
===================================================== */

function formatDate(dateString) {

  if (!dateString) return "";

  const parts = dateString.split("-");

  if (parts.length !== 3) {

    return dateString;

  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;

}


/* =====================================================
   CHIUSURA MODAL
===================================================== */

document.addEventListener("click", function (event) {

  if (
    event.target.classList.contains("modal")
  ) {

    event.target.classList.remove("active");

    event.target.style.display = "none";

  }

});


/* =====================================================
   ESPOSIZIONE FUNZIONI GLOBALI
===================================================== */

window.renderServices = renderServices;

window.openLoginModal = openLoginModal;

window.openRegisterModal = openRegisterModal;

window.openBooking = openBooking;

window.selectTime = selectTime;

window.updateBookingSummary =
  updateBookingSummary;
