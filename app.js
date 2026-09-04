// I GRIMALDI E.S.G. - FINAL MOBILE BUILD
// IMPORTANTE: questa versione dichiara ogni costante una sola volta.

const SUPABASE_URL = "https://wxcdmtajcasnlohqkgmk.supabase.co";
const SUPABASE_KEY = "sb_publishable_bwjP-ihASijevvu7d6r5Ew_6JaWKSDP";
const ADMIN_PHONE = "3791415355";

const SERVICES = [
  { id:"shampoo_taglio", name:"Shampoo + Taglio", price:20 },
  { id:"barba_5", name:"Barba", price:5 },
  { id:"barba_10", name:"Barba", price:10 },
  { id:"colore", name:"Colore", price:20 },
  { id:"colore_barba", name:"Colore Barba", price:10 },
  { id:"fiala", name:"Fiala", price:5 }
];

const TIMES = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00"];

const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
let currentUser = null;
let selectedService = null;
let selectedTime = null;
let selectedDate = null;
let toastTimer = null;

// Avvio robusto: lo splash viene sempre chiuso anche se una singola funzione fallisce.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp, { once: true });
} else {
  initApp();
}

async function initApp() {
  try {
    bindNavigation();
    bindButtons();
    renderServices();
    setupDates();
    restoreSession();
  } catch (error) {
    console.error("Errore inizializzazione app:", error);
  } finally {
    // Lo splash non deve mai bloccare i pulsanti.
    setTimeout(hideLoadingScreen, 1100);
    setTimeout(hideLoadingScreen, 2200); // sicurezza extra
  }
}

function hideLoadingScreen() {
  const loading = document.getElementById("loadingScreen");
  if (!loading) return;
  loading.classList.add("loading-hidden");
  loading.setAttribute("aria-hidden", "true");
  setTimeout(() => {
    loading.style.display = "none";
    loading.style.pointerEvents = "none";
  }, 450);
}

function bindNavigation() {
  document.querySelectorAll("[data-page]").forEach(btn => {
    btn.addEventListener("click", () => {
      showPage(btn.dataset.page);
      closeMenu();
    });
  });
  document.getElementById("menuBtn").onclick = openMenu;
  document.getElementById("closeMenu").onclick = closeMenu;
  document.getElementById("menuOverlay").onclick = closeMenu;
}

function bindButtons() {
  document.getElementById("confirmBooking").onclick = createBooking;
  document.getElementById("loginButton").onclick = loginUser;
  document.getElementById("registerButton").onclick = registerUser;
  document.getElementById("logoutButton").onclick = logoutUser;
  document.getElementById("adminRefresh").onclick = loadAdminAgenda;
  document.getElementById("enableNotifications").onclick = enableNotifications;
  document.getElementById("notificationBtn").onclick = () => showToast("🔔 Le notifiche sono gestibili dalla sezione Contatti.");
}

function openMenu(){ document.getElementById("sideMenu").classList.add("open"); document.getElementById("menuOverlay").classList.add("show"); }
function closeMenu(){ document.getElementById("sideMenu").classList.remove("open"); document.getElementById("menuOverlay").classList.remove("show"); }

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const page = document.getElementById(id);
  if (page) page.classList.add("active");
  window.scrollTo({top:0, behavior:"smooth"});
  if (id === "bookingsPage") loadUserBookings();
  if (id === "adminPage") checkAdminPage();
}

function renderServices() {
  const box = document.getElementById("serviceList");
  box.innerHTML = "";
  SERVICES.forEach(service => {
    const button = document.createElement("button");
    button.className = "service-item";
    button.innerHTML = `<span class="service-name">${service.name}</span><span class="service-price">€ ${service.price}</span>`;
    button.onclick = () => {
      selectedService = service;
      document.querySelectorAll(".service-item").forEach(x => x.classList.remove("selected"));
      button.classList.add("selected");
      updateSummary();
    };
    box.appendChild(button);
  });
}

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function setupDates() {
  const bookingDate = document.getElementById("bookingDate");
  const adminDate = document.getElementById("adminDate");
  bookingDate.min = todayString();
  bookingDate.value = todayString();
  adminDate.value = todayString();
  selectedDate = bookingDate.value;
  bookingDate.onchange = async () => {
    selectedDate = bookingDate.value;
    selectedTime = null;
    updateSummary();
    await loadAvailableTimes();
  };
  loadAvailableTimes();
}

async function loadAvailableTimes() {
  const box = document.getElementById("timeSlots");
  box.innerHTML = "Caricamento...";
  let busy = [];
  try {
    if (supabaseClient) {
      const {data,error} = await supabaseClient.from("bookings").select("booking_time,status").eq("booking_date", selectedDate).neq("status","cancelled");
      if (!error) busy = (data || []).map(x => x.booking_time);
    }
  } catch(e) { console.warn(e); }
  box.innerHTML = "";
  TIMES.forEach(time => {
    const btn = document.createElement("button");
    btn.className = "time-slot";
    btn.textContent = time;
    if (busy.includes(time)) btn.classList.add("busy");
    if (selectedTime === time) btn.classList.add("selected");
    btn.onclick = () => {
      selectedTime = time;
      document.querySelectorAll(".time-slot").forEach(x => x.classList.remove("selected"));
      btn.classList.add("selected");
      updateSummary();
    };
    box.appendChild(btn);
  });
}

function updateSummary() {
  document.getElementById("summaryService").textContent = selectedService ? selectedService.name : "Non selezionato";
  document.getElementById("summaryDate").textContent = selectedDate ? formatDate(selectedDate) : "-";
  document.getElementById("summaryTime").textContent = selectedTime || "-";
  document.getElementById("summaryPrice").textContent = selectedService ? `€ ${selectedService.price}` : "€ 0";
}

async function createBooking() {
  if (!currentUser) { showToast("Accedi prima di prenotare","error"); return showPage("loginPage"); }
  if (!selectedService || !selectedDate || !selectedTime) return showToast("Completa tutti i dati della prenotazione","error");
  if (!supabaseClient) return showToast("Supabase non disponibile","error");
  const payload = {
    user_id: currentUser.id,
    service_id: selectedService.id,
    service_name: selectedService.name,
    price: selectedService.price,
    booking_date: selectedDate,
    booking_time: selectedTime,
    status: "confirmed"
  };
  const {error} = await supabaseClient.from("bookings").insert([payload]);
  if (error) { console.error(error); return showToast(error.message || "Errore prenotazione","error"); }
  showToast("Prenotazione confermata!","success");
  selectedService = null; selectedTime = null;
  renderServices(); updateSummary(); loadAvailableTimes();
  setTimeout(() => showPage("bookingsPage"), 500);
}

async function loadUserBookings() {
  const box = document.getElementById("bookingsList");
  if (!currentUser) { box.innerHTML = `<div class="card">Accedi per vedere le tue prenotazioni.</div>`; return; }
  if (!supabaseClient) return;
  box.innerHTML = `<div class="card">Caricamento...</div>`;
  const {data,error} = await supabaseClient.from("bookings").select("*").eq("user_id",currentUser.id).order("booking_date",{ascending:true}).order("booking_time",{ascending:true});
  if (error) { box.innerHTML = `<div class="card">Errore: ${escapeHtml(error.message)}</div>`; return; }
  if (!data || !data.length) { box.innerHTML = `<div class="card">Non hai ancora prenotazioni.</div>`; return; }
  box.innerHTML = "";
  data.forEach(b => {
    const card = document.createElement("div");
    card.className = "booking-card";
    card.innerHTML = `<div class="booking-row"><div><strong>${escapeHtml(b.service_name)}</strong><div class="booking-detail">${formatDate(b.booking_date)} · ${escapeHtml(b.booking_time)}</div><div class="booking-detail">€ ${b.price}</div></div><button class="cancel-booking">Annulla</button></div>`;
    card.querySelector("button").onclick = () => cancelBooking(b.id);
    box.appendChild(card);
  });
}

async function cancelBooking(id) {
  if (!confirm("Vuoi annullare questa prenotazione?")) return;
  const {error} = await supabaseClient.from("bookings").delete().eq("id",id);
  if (error) return showToast(error.message,"error");
  showToast("Prenotazione annullata","success");
  loadUserBookings();
}

async function loginUser() {
  const phone = normalizePhone(document.getElementById("phoneInput").value);
  const pin = document.getElementById("pinInput").value.trim();
  if (!phone || !pin) return showToast("Inserisci numero e PIN","error");
  const {data,error} = await supabaseClient.from("users").select("*").eq("phone",phone).eq("pin",pin).maybeSingle();
  if (error) return showToast(error.message,"error");
  if (!data) return showToast("Numero o PIN non corretti","error");
  currentUser = data;
  localStorage.setItem("grimaldiUser",JSON.stringify(data));
  updateUserUI();
  showToast(`Bentornato ${data.name || ""}`,"success");
  showPage("homePage");
}

async function registerUser() {
  const name = document.getElementById("registerName").value.trim();
  const phone = normalizePhone(document.getElementById("registerPhone").value);
  const pin = document.getElementById("registerPin").value.trim();
  if (!name || !phone || !pin) return showToast("Compila tutti i campi","error");
  if (pin.length < 4) return showToast("Il PIN deve avere almeno 4 caratteri","error");
  const existing = await supabaseClient.from("users").select("id").eq("phone",phone).maybeSingle();
  if (existing.data) return showToast("Questo numero è già registrato","error");
  if (existing.error && existing.error.code !== "PGRST116") console.warn(existing.error);
  const {data,error} = await supabaseClient.from("users").insert([{name,phone,pin}]).select().single();
  if (error) { console.error(error); return showToast(error.message || "Errore registrazione","error"); }
  currentUser = data;
  localStorage.setItem("grimaldiUser",JSON.stringify(data));
  updateUserUI();
  showToast("Registrazione completata!","success");
  showPage("homePage");
}

function restoreSession() {
  try { currentUser = JSON.parse(localStorage.getItem("grimaldiUser") || "null"); } catch(e) { currentUser = null; }
  updateUserUI();
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem("grimaldiUser");
  updateUserUI();
  showPage("homePage");
  showToast("Logout effettuato","success");
}

function isAdmin() {
  return currentUser && normalizePhone(currentUser.phone) === ADMIN_PHONE;
}

function updateUserUI() {
  document.getElementById("menuUser").textContent = currentUser ? `Benvenuto, ${currentUser.name || "Cliente"}` : "Benvenuto, Ospite";
  document.getElementById("homeWelcome").textContent = currentUser ? `Ciao ${currentUser.name || "Cliente"}, pronto per il tuo appuntamento?` : "Il tuo appuntamento, il tuo momento.";
  document.getElementById("menuLoginBtn").classList.toggle("hidden",!!currentUser);
  document.getElementById("menuRegisterBtn").classList.toggle("hidden",!!currentUser);
  document.getElementById("logoutButton").classList.toggle("hidden",!currentUser);
  document.querySelectorAll(".admin-only").forEach(x => x.classList.toggle("hidden",!isAdmin()));
}

async function checkAdminPage() {
  const denied = document.getElementById("adminDenied");
  const content = document.getElementById("adminContent");
  if (!isAdmin()) { denied.classList.remove("hidden"); content.classList.add("hidden"); return; }
  denied.classList.add("hidden"); content.classList.remove("hidden");
  await loadAdminAgenda();
}

async function loadAdminAgenda() {
  if (!isAdmin()) return;
  const date = document.getElementById("adminDate").value;
  const box = document.getElementById("adminAgenda");
  const stats = document.getElementById("adminStats");
  box.innerHTML = `<div class="card">Caricamento agenda...</div>`;
  const {data,error} = await supabaseClient.from("bookings").select("*").eq("booking_date",date).order("booking_time",{ascending:true});
  if (error) { box.innerHTML = `<div class="card">Errore: ${escapeHtml(error.message)}</div>`; return; }
  const rows = data || [];
  const total = rows.reduce((sum,x) => sum + Number(x.price || 0),0);
  stats.innerHTML = `<div class="stat"><b>${rows.length}</b><small>Prenotazioni</small></div><div class="stat"><b>€ ${total}</b><small>Totale giornata</small></div>`;
  if (!rows.length) { box.innerHTML = `<div class="card">Nessuna prenotazione per questa data.</div>`; return; }
  box.innerHTML = "";
  rows.forEach(b => {
    const card = document.createElement("div");
    card.className = "booking-card";
    card.innerHTML = `<div class="booking-row"><div><strong>${escapeHtml(b.booking_time)} · ${escapeHtml(b.service_name)}</strong><div class="booking-detail">Cliente ID: ${escapeHtml(String(b.user_id || "-"))}</div><div class="booking-detail">€ ${escapeHtml(String(b.price || 0))}</div></div><span>${b.status === "confirmed" ? "✓" : "•"}</span></div>`;
    box.appendChild(card);
  });
}

async function enableNotifications() {
  if (!("Notification" in window)) return showToast("Notifiche non supportate","error");
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    showToast("🔔 Notifiche attivate!","success");
    new Notification("I GRIMALDI E.S.G.",{body:"Le notifiche sono attive."});
  } else showToast("Permesso notifiche non concesso","error");
}

function normalizePhone(value){ return String(value || "").replace(/\D/g,""); }
function formatDate(value){ if(!value) return "-"; const d = new Date(`${value}T12:00:00`); return d.toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long",year:"numeric"}); }
function escapeHtml(value){ return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
function showToast(message,type="default"){ const t=document.getElementById("toast"); t.textContent=message;t.className=`toast ${type}`;requestAnimationFrame(()=>t.classList.add("show"));clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2800); }

window.showPage = showPage;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      registration.update().catch(() => {});
    } catch (error) {
      console.warn('Service worker non registrato:', error);
    }
  });
}
