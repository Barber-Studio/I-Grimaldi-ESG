/* =========================================================
   I GRIMALDI - GESTIONALE ADMIN
   Caricato dopo app.js. Usa supabaseClient, isAdmin(), TIMES,
   localDateString(), normalizeTime(), normalizePhone(), escapeHtml().
   Non modifica Supabase, OneSignal o la grafica del sito cliente.
========================================================= */

const admIsActive = a =>
  a.status !== "cancelled" && a.status !== "cancelled_by_admin";

const admEuro = n =>
  "€" + Number(n || 0).toLocaleString("it-IT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

const admPrice = a => Number(a.service_price) || 0;

/* true se l'appuntamento è già iniziato/passato (incasso "maturato") */
function admIsDone(a) {
  const today = localDateString(new Date());
  if (a.appointment_date < today) return true;
  if (a.appointment_date > today) return false;
  const now = new Date();
  const hhmm =
    String(now.getHours()).padStart(2, "0") + ":" +
    String(now.getMinutes()).padStart(2, "0");
  return normalizeTime(a.start_time) <= hhmm;
}

/* Supabase restituisce max 1000 righe per richiesta: paginiamo */
async function admFetchAll(buildQuery) {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await buildQuery()
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (error) throw error;
    all.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return all;
}

const admLoading = '<div class="admin-loading"><div class="admin-spinner"></div><span>Caricamento...</span></div>';

function admWhatsappUrl(phone) {
  let n = normalizePhone(phone);
  if (n.length === 10 && n.startsWith("3")) n = "39" + n;
  return "https://wa.me/" + n;
}

/* ---------------------------------------------------------
   AGENDA DEL GIORNO
--------------------------------------------------------- */
function adminDayHeaderHtml(active, date, freeSlots) {
  const total = active.reduce((sum, a) => sum + admPrice(a), 0);
  const earned = active.filter(admIsDone).reduce((sum, a) => sum + admPrice(a), 0);
  const closedNote = isOpenDay(date)
    ? ""
    : '<div class="adm-note">Giorno di chiusura (weekend)</div>';

  return `
    ${closedNote}
    <div class="adm-kpis">
      <div class="adm-kpi accent">
        <span>INCASSO PREVISTO</span>
        <strong>${admEuro(total)}</strong>
      </div>
      <div class="adm-kpi">
        <span>APPUNTAMENTI</span>
        <strong>${active.length}</strong>
      </div>
      <div class="adm-kpi">
        <span>GIÀ MATURATO</span>
        <strong>${admEuro(earned)}</strong>
      </div>
      <div class="adm-kpi">
        <span>ORARI LIBERI</span>
        <strong>${freeSlots}</strong>
      </div>
    </div>`;
}

function adminContactButtons(a) {
  const phone = normalizePhone(a.customer_phone);
  if (phone.length < 6) return "";
  return `
    <div class="adm-contact">
      <a href="tel:${phone}">CHIAMA</a>
      <a href="${admWhatsappUrl(phone)}" target="_blank" rel="noopener">WHATSAPP</a>
    </div>`;
}

/* ---------------------------------------------------------
   CALENDARIO: numero appuntamenti per giorno + totale mese
--------------------------------------------------------- */
async function adminPaintMonthBadges(year, month) {
  if (!isAdmin()) return;
  const from = localDateString(new Date(year, month, 1));
  const to = localDateString(new Date(year, month + 1, 0));

  try {
    const rows = await admFetchAll(() =>
      supabaseClient
        .from("appointments")
        .select("appointment_date,status,service_price")
        .gte("appointment_date", from)
        .lte("appointment_date", to)
    );

    const active = rows.filter(admIsActive);
    const perDay = {};
    active.forEach(a => {
      perDay[a.appointment_date] = (perDay[a.appointment_date] || 0) + 1;
    });

    document.querySelectorAll("#adminCalendar [data-admin-date]").forEach(btn => {
      btn.querySelector("em")?.remove();
      const n = perDay[btn.dataset.adminDate];
      if (n) btn.insertAdjacentHTML("beforeend", `<em>${n}</em>`);
    });

    let strip = q("adminMonthStrip");
    if (!strip) {
      strip = document.createElement("div");
      strip.id = "adminMonthStrip";
      strip.className = "adm-month-strip";
      q("adminCalendar")?.parentNode.insertBefore(strip, q("adminCalendar"));
    }
    strip.classList.toggle("hidden", admTab !== "agenda");
    const total = active.reduce((sum, a) => sum + admPrice(a), 0);
    strip.innerHTML = `
      <span>${active.length} appuntamenti nel mese</span>
      <b>Incasso previsto ${admEuro(total)}</b>`;
  } catch (error) {
    console.warn("Statistiche mese non disponibili:", error);
  }
}

/* ---------------------------------------------------------
   TAB GESTIONALE: Agenda / Riepilogo / Clienti
--------------------------------------------------------- */
let admTab = "agenda";
let admReportMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let admClients = [];

function adminInitTabs() {
  const page = q("adminAgendaPage");
  if (!page || q("adminTabs")) return;

  const heading = page.querySelector(".page-heading");
  if (heading) {
    heading.querySelector("h2").textContent = "Gestionale";
    heading.querySelector("p").textContent =
      "Agenda, incassi e clienti del salone.";
  }

  ["admin-agenda-toolbar", "admin-calendar", "admin-day-header", "admin-agenda-day"]
    .forEach(cls =>
      page.querySelectorAll("." + cls).forEach(el => el.classList.add("adm-agenda-only"))
    );

  const tabs = document.createElement("div");
  tabs.id = "adminTabs";
  tabs.className = "adm-tabs";
  tabs.innerHTML = `
    <button type="button" data-tab="agenda" class="active">AGENDA</button>
    <button type="button" data-tab="report">RIEPILOGO</button>
    <button type="button" data-tab="clients">CLIENTI</button>`;
  heading.after(tabs);

  ["adminReportView", "adminClientsView"].forEach(id => {
    const view = document.createElement("div");
    view.id = id;
    view.className = "adm-view hidden";
    page.appendChild(view);
  });

  tabs.querySelectorAll("button").forEach(btn =>
    btn.addEventListener("click", () => adminSwitchTab(btn.dataset.tab))
  );
}

function adminSwitchTab(tab) {
  admTab = tab;
  document.querySelectorAll("#adminTabs button").forEach(b =>
    b.classList.toggle("active", b.dataset.tab === tab)
  );
  document.querySelectorAll(".adm-agenda-only").forEach(el =>
    el.classList.toggle("hidden", tab !== "agenda")
  );
  q("adminMonthStrip")?.classList.toggle("hidden", tab !== "agenda");
  q("adminReportView")?.classList.toggle("hidden", tab !== "report");
  q("adminClientsView")?.classList.toggle("hidden", tab !== "clients");
  adminRefreshActiveTab();
}

function adminRefreshActiveTab() {
  if (!isAdmin()) return;
  if (admTab === "report") adminRenderReport();
  if (admTab === "clients") adminRenderClients();
}

/* ---------------------------------------------------------
   RIEPILOGO MENSILE
--------------------------------------------------------- */
async function adminRenderReport() {
  const box = q("adminReportView");
  if (!box || !isAdmin()) return;
  box.innerHTML = admLoading;

  const y = admReportMonth.getFullYear();
  const m = admReportMonth.getMonth();
  const from = localDateString(new Date(y, m, 1));
  const to = localDateString(new Date(y, m + 1, 0));
  const monthName = new Intl.DateTimeFormat("it-IT", {
    month: "long", year: "numeric"
  }).format(admReportMonth);

  try {
    const rows = await admFetchAll(() =>
      supabaseClient
        .from("appointments")
        .select("appointment_date,start_time,service_name,service_price,status,customer_phone")
        .gte("appointment_date", from)
        .lte("appointment_date", to)
    );

    const active = rows.filter(admIsActive);
    const cancelled = rows.length - active.length;
    const total = active.reduce((s, a) => s + admPrice(a), 0);
    const earned = active.filter(admIsDone).reduce((s, a) => s + admPrice(a), 0);
    const avg = active.length ? total / active.length : 0;
    const clients = new Set(active.map(a => normalizePhone(a.customer_phone))).size;

    let openDays = 0;
    for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) {
      if (isOpenDay(localDateString(new Date(y, m, d)))) openDays++;
    }
    const capacity = openDays * TIMES.length;
    const occupancy = capacity ? Math.round((active.length / capacity) * 100) : 0;

    const perDay = {};
    active.forEach(a => {
      perDay[a.appointment_date] = (perDay[a.appointment_date] || 0) + admPrice(a);
    });
    const dayEntries = Object.entries(perDay);
    const best = dayEntries.sort((a, b) => b[1] - a[1])[0];

    const perService = {};
    active.forEach(a => {
      const key = a.service_name || "Servizio";
      perService[key] = perService[key] || { n: 0, sum: 0 };
      perService[key].n++;
      perService[key].sum += admPrice(a);
    });
    const services = Object.entries(perService).sort((a, b) => b[1].sum - a[1].sum);
    const maxService = services.length ? services[0][1].sum || 1 : 1;

    const days = new Date(y, m + 1, 0).getDate();
    const maxDay = Math.max(1, ...Object.values(perDay));
    let bars = "";
    for (let d = 1; d <= days; d++) {
      const ds = localDateString(new Date(y, m, d));
      const v = perDay[ds] || 0;
      bars += `<div class="adm-bar ${isOpenDay(ds) ? "" : "off"}" title="${d}: ${admEuro(v)}">
        <i style="height:${Math.round((v / maxDay) * 100)}%"></i><small>${d}</small></div>`;
    }

    const bestText = best
      ? `${new Date(best[0] + "T12:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric" })} · ${admEuro(best[1])}`
      : "-";

    box.innerHTML = `
      <div class="admin-agenda-toolbar">
        <button type="button" id="admRepPrev" aria-label="Mese precedente">‹</button>
        <h3>${escapeHtml(monthName)}</h3>
        <button type="button" id="admRepNext" aria-label="Mese successivo">›</button>
      </div>

      <div class="adm-kpis">
        <div class="adm-kpi accent"><span>INCASSO PREVISTO</span><strong>${admEuro(total)}</strong></div>
        <div class="adm-kpi"><span>GIÀ MATURATO</span><strong>${admEuro(earned)}</strong></div>
        <div class="adm-kpi"><span>APPUNTAMENTI</span><strong>${active.length}</strong></div>
        <div class="adm-kpi"><span>SCONTRINO MEDIO</span><strong>${admEuro(avg)}</strong></div>
        <div class="adm-kpi"><span>OCCUPAZIONE</span><strong>${occupancy}%</strong></div>
        <div class="adm-kpi"><span>CLIENTI</span><strong>${clients}</strong></div>
        <div class="adm-kpi"><span>GIORNO MIGLIORE</span><strong class="small">${escapeHtml(bestText)}</strong></div>
        <div class="adm-kpi"><span>ANNULLATI</span><strong>${cancelled}</strong></div>
      </div>

      <div class="adm-card">
        <h4>Incasso per giorno</h4>
        <div class="adm-bars">${bars}</div>
      </div>

      <div class="adm-card">
        <h4>Servizi più richiesti</h4>
        ${services.length ? services.map(([name, v]) => `
          <div class="adm-service-row">
            <div class="adm-service-top">
              <span>${escapeHtml(name)} <small>× ${v.n}</small></span>
              <b>${admEuro(v.sum)}</b>
            </div>
            <div class="adm-progress"><i style="width:${Math.round((v.sum / maxService) * 100)}%"></i></div>
          </div>`).join("") : '<p class="adm-empty">Nessun appuntamento in questo mese.</p>'}
      </div>`;

    q("admRepPrev").onclick = () => {
      admReportMonth = new Date(y, m - 1, 1);
      adminRenderReport();
    };
    q("admRepNext").onclick = () => {
      admReportMonth = new Date(y, m + 1, 1);
      adminRenderReport();
    };
  } catch (error) {
    console.error("Errore riepilogo:", error);
    box.innerHTML = `<div class="empty-state"><h3>Errore caricamento riepilogo</h3><p>${escapeHtml(error.message || "Errore")}</p></div>`;
  }
}

/* ---------------------------------------------------------
   ANAGRAFICA CLIENTI (ricavata dagli appuntamenti)
--------------------------------------------------------- */
async function adminRenderClients() {
  const box = q("adminClientsView");
  if (!box || !isAdmin()) return;
  box.innerHTML = admLoading;

  try {
    const rows = await admFetchAll(() =>
      supabaseClient
        .from("appointments")
        .select("customer_name,customer_phone,appointment_date,start_time,service_price,status")
    );

    const today = localDateString(new Date());
    const map = new Map();

    rows.forEach(a => {
      const phone = normalizePhone(a.customer_phone);
      if (!phone) return;
      let c = map.get(phone);
      if (!c) {
        c = { phone, name: a.customer_name || "Cliente", visits: 0, spent: 0, cancelled: 0, last: "", next: "", lastSeen: "" };
        map.set(phone, c);
      }
      if (a.appointment_date >= c.lastSeen) {
        c.lastSeen = a.appointment_date;
        c.name = a.customer_name || c.name;
      }
      if (!admIsActive(a)) {
        c.cancelled++;
        return;
      }
      if (admIsDone(a)) {
        c.visits++;
        c.spent += admPrice(a);
        if (a.appointment_date > c.last) c.last = a.appointment_date;
      } else if (!c.next || a.appointment_date < c.next) {
        c.next = a.appointment_date;
      }
    });

    admClients = [...map.values()];

    box.innerHTML = `
      <div class="adm-clients-tools">
        <input id="admClientSearch" type="search" placeholder="Cerca nome o telefono" autocomplete="off">
        <select id="admClientSort">
          <option value="recent">Più recenti</option>
          <option value="spent">Più spesa</option>
          <option value="visits">Più visite</option>
          <option value="name">Nome A-Z</option>
        </select>
      </div>
      <div class="adm-clients-count" id="admClientCount"></div>
      <div id="admClientList"></div>`;

    q("admClientSearch").addEventListener("input", adminPaintClients);
    q("admClientSort").addEventListener("change", adminPaintClients);
    adminPaintClients();
  } catch (error) {
    console.error("Errore clienti:", error);
    box.innerHTML = `<div class="empty-state"><h3>Errore caricamento clienti</h3><p>${escapeHtml(error.message || "Errore")}</p></div>`;
  }
}

function adminPaintClients() {
  const list = q("admClientList");
  if (!list) return;

  const term = (q("admClientSearch")?.value || "").trim().toLowerCase();
  const digits = normalizePhone(term);
  const sort = q("admClientSort")?.value || "recent";

  let items = admClients.filter(c =>
    !term ||
    c.name.toLowerCase().includes(term) ||
    (digits && c.phone.includes(digits))
  );

  const sorters = {
    recent: (a, b) => (b.lastSeen || "").localeCompare(a.lastSeen || ""),
    spent: (a, b) => b.spent - a.spent,
    visits: (a, b) => b.visits - a.visits,
    name: (a, b) => a.name.localeCompare(b.name, "it")
  };
  items.sort(sorters[sort]);

  const fmt = d => d
    ? new Date(d + "T12:00:00").toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit" })
    : "-";

  q("admClientCount").textContent = `${items.length} clienti`;

  list.innerHTML = items.length ? items.map(c => `
    <div class="adm-client">
      <div class="adm-client-head">
        <div class="admin-client-avatar">${escapeHtml(c.name.charAt(0).toUpperCase())}</div>
        <div class="adm-client-id">
          <strong>${escapeHtml(c.name)}</strong>
          <span>${escapeHtml(c.phone)}</span>
        </div>
        <b class="adm-client-spent">${admEuro(c.spent)}</b>
      </div>
      <div class="adm-client-meta">
        <span>${c.visits} visite</span>
        <span>Ultima: ${fmt(c.last)}</span>
        <span>Prossima: ${fmt(c.next)}</span>
        ${c.cancelled ? `<span>${c.cancelled} annullati</span>` : ""}
      </div>
      <div class="adm-contact">
        <a href="tel:${c.phone}">CHIAMA</a>
        <a href="${admWhatsappUrl(c.phone)}" target="_blank" rel="noopener">WHATSAPP</a>
        <button type="button" data-book="${escapeHtml(c.phone)}">PRENOTA</button>
      </div>
    </div>`).join("")
    : '<p class="adm-empty">Nessun cliente trovato.</p>';

  list.querySelectorAll("[data-book]").forEach(btn =>
    btn.addEventListener("click", () => {
      const c = admClients.find(x => x.phone === btn.dataset.book);
      if (c) adminBookForClient(c.name, c.phone);
    })
  );
}

function adminBookForClient(fullName, phone) {
  adminSwitchTab("agenda");
  openAdminAddClient();
  const parts = String(fullName || "").trim().split(/\s+/);
  q("adminClientName").value = parts.shift() || "";
  q("adminClientSurname").value = parts.join(" ");
  q("adminClientPhone").value = phone;
}

/* ---------------------------------------------------------
   AVVIO
--------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", adminInitTabs);

window.adminPaintMonthBadges = adminPaintMonthBadges;
window.adminRefreshActiveTab = adminRefreshActiveTab;
