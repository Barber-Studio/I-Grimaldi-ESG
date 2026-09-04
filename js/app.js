// =============================================
// I GRIMALDI E.S.G.
// APP.JS DEFINITIVO
// =============================================


// =============================================
// SUPABASE
// =============================================

const SUPABASE_URL =
    "https://wxcdmtajcasnlohqkgmk.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_bwjP-ihASijevvu7d6r5Ew_6JaWKSDP";


const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =============================================
// CONFIGURAZIONE ADMIN
// =============================================

// INSERISCI QUI IL TUO NUMERO DI TELEFONO ADMIN

const ADMIN_PHONES = [
    ""
];


// =============================================
// SERVIZI
// =============================================

const services = [

    {
        id: "shampoo_taglio",
        name: "Shampoo + Taglio",
        price: 20
    },

    {
        id: "barba_5",
        name: "Barba 5€",
        price: 5
    },

    {
        id: "barba_10",
        name: "Barba 10€",
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


// =============================================
// ORARI
// =============================================

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

    "19:00"

];


// =============================================
// STATO
// =============================================

let currentUser = null;

let selectedService = null;

let selectedDate = null;

let selectedTime = null;

let bookingMonth = new Date();

let agendaMonth = new Date();

let agendaSelectedDate = new Date();

let busyTimes = [];

let blockedTimes = [];

let toastTimer = null;


// =============================================
// AVVIO
// =============================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initialize();

    }
);


async function initialize() {

    renderServices();

    setupAdminForms();

    restoreUser();

    setTimeout(() => {

        hideLoading();

    }, 1300);


    selectedDate = new Date();

    renderBookingCalendar();

    updateSelectedDateLabel();

    await loadBusyTimes();

}


// =============================================
// LOADING
// =============================================

function hideLoading() {

    const loader =
        document.getElementById("loadingScreen");

    if (!loader) return;


    loader.style.opacity = "0";


    setTimeout(() => {

        loader.style.display = "none";

    }, 600);

}


// =============================================
// UTENTE
// =============================================

function restoreUser() {

    const saved =
        localStorage.getItem("igrimaldi_user");


    if (!saved) {

        updateProfile();

        return;

    }


    try {

        currentUser =
            JSON.parse(saved);

    } catch {

        currentUser = null;

    }


    updateProfile();

}


function saveUser() {

    if (!currentUser) {

        localStorage.removeItem(
            "igrimaldi_user"
        );

        return;

    }


    localStorage.setItem(
        "igrimaldi_user",
        JSON.stringify(currentUser)
    );

}


function isAdmin() {

    if (!currentUser) return false;


    const phone =
        normalizePhone(
            currentUser.phone
        );


    return ADMIN_PHONES
        .map(normalizePhone)
        .includes(phone);

}


function normalizePhone(phone) {

    return String(phone || "")
        .replace(/\D/g, "")
        .replace(/^39/, "");

}


// =============================================
// NAVIGAZIONE
// =============================================

function showPage(pageId) {

    if (
        pageId === "appointmentsPage" &&
        !currentUser
    ) {

        openLogin();

        return;

    }


    if (
        pageId === "agendaPage" &&
        !isAdmin()
    ) {

        showToast(
            "Area riservata all'amministratore",
            "error"
        );

        return;

    }


    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove("active");

        });


    const page =
        document.getElementById(pageId);


    if (page) {

        page.classList.add("active");

    }


    document
        .querySelectorAll(".nav-button")
        .forEach(button => {

            button.classList.remove("active");

        });


    const nav =
        document.querySelector(
            `[data-page="${pageId}"]`
        );


    if (nav) {

        nav.classList.add("active");

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    if (pageId === "appointmentsPage") {

        loadMyAppointments();

    }


    if (pageId === "agendaPage") {

        loadAgenda();

    }


    if (pageId === "profilePage") {

        updateProfile();

    }

}


// =============================================
// TERZO PULSANTE NAV
// =============================================

function thirdNav() {

    if (!currentUser) {

        openLogin();

        return;

    }


    if (isAdmin()) {

        showPage("agendaPage");

    } else {

        showPage("appointmentsPage");

    }

}


// =============================================
// LOGIN MODAL
// =============================================

function openLogin() {

    document
        .getElementById("authModal")
        .classList.remove("hidden");

}


function closeLogin() {

    document
        .getElementById("authModal")
        .classList.add("hidden");

}


// =============================================
// REGISTER MODAL
// =============================================

function openRegister() {

    closeLogin();

    document
        .getElementById("registerModal")
        .classList.remove("hidden");

}


function closeRegister() {

    document
        .getElementById("registerModal")
        .classList.add("hidden");

}


// =============================================
// REGISTRAZIONE
// =============================================

async function register() {

    const firstName =
        document
            .getElementById("regName")
            .value
            .trim();


    const lastName =
        document
            .getElementById("regSurname")
            .value
            .trim();


    const phone =
        document
            .getElementById("regPhone")
            .value
            .trim();


    const pin =
        document
            .getElementById("regPin")
            .value
            .trim();


    const pin2 =
        document
            .getElementById("regPin2")
            .value
            .trim();


    if (
        !firstName ||
        !lastName ||
        !phone ||
        !pin ||
        !pin2
    ) {

        showToast(
            "Compila tutti i campi",
            "error"
        );

        return;

    }


    if (!/^\d{4,6}$/.test(pin)) {

        showToast(
            "Il PIN deve contenere da 4 a 6 numeri",
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


    const cleanPhone =
        normalizePhone(phone);


    try {

        showToast(
            "Registrazione in corso..."
        );


        const { data: existing, error: searchError } =
            await db
                .from("customers")
                .select("id")
                .eq("phone", cleanPhone)
                .maybeSingle();


        if (searchError) {

            throw searchError;

        }


        if (existing) {

            showToast(
                "Questo numero è già registrato",
                "error"
            );

            return;

        }


        const { data, error } =
            await db
                .from("customers")
                .insert({

                    first_name: firstName,

                    last_name: lastName,

                    phone: cleanPhone,

                    pin: pin

                })
                .select()
                .single();


        if (error) {

            throw error;

        }


        currentUser = data;

        saveUser();

        closeRegister();

        updateProfile();


        showToast(
            "Registrazione completata!",
            "success"
        );


        setTimeout(() => {

            showPage("homePage");

        }, 500);


    } catch (error) {

        console.error(error);


        showToast(
            error.message ||
            "Errore durante la registrazione",
            "error"
        );

    }

}


// =============================================
// LOGIN
// =============================================

async function login() {

    const phone =
        document
            .getElementById("loginPhone")
            .value
            .trim();


    const pin =
        document
            .getElementById("loginPin")
            .value
            .trim();


    const errorBox =
        document.getElementById("loginError");


    errorBox.textContent = "";


    if (!phone || !pin) {

        errorBox.textContent =
            "Inserisci numero e PIN.";

        return;

    }


    try {

        const cleanPhone =
            normalizePhone(phone);


        const { data, error } =
            await db
                .from("customers")
                .select("*")
                .eq("phone", cleanPhone)
                .eq("pin", pin)
                .maybeSingle();


        if (error) {

            throw error;

        }


        if (!data) {

            errorBox.textContent =
                "Numero di telefono o PIN non corretti.";

            return;

        }


        currentUser = data;

        saveUser();

        closeLogin();

        updateProfile();


        showToast(
            `Bentornato ${data.first_name}!`,
            "success"
        );


        showPage("homePage");


    } catch (error) {

        console.error(error);


        errorBox.textContent =
            "Errore durante l'accesso.";

    }

}


// =============================================
// LOGOUT
// =============================================

function logout() {

    currentUser = null;

    saveUser();

    updateProfile();

    showPage("homePage");

    showToast(
        "Hai effettuato il logout",
        "success"
    );

}


// =============================================
// PROFILO
// =============================================

function updateProfile() {

    const profile =
        document.getElementById("profileContent");


    if (!profile) return;


    const adminButton =
        document.getElementById(
            "adminAgendaButton"
        );


    const thirdLabel =
        document.getElementById(
            "thirdLabel"
        );


    if (!currentUser) {

        profile.innerHTML = `

            <div class="profile-name">
                Benvenuto
            </div>

            <div class="profile-phone">
                Accedi o registrati per gestire
                i tuoi appuntamenti.
            </div>

            <button
            class="main-button"
            onclick="openLogin()">

                ACCEDI

            </button>

        `;


        adminButton?.classList.add("hidden");


        if (thirdLabel) {

            thirdLabel.textContent =
                "Accedi";

        }


        return;

    }


    profile.innerHTML = `

        <div class="profile-name">

            ${escapeHtml(
                currentUser.first_name
            )}

            ${escapeHtml(
                currentUser.last_name
            )}

        </div>

        <div class="profile-phone">

            ${escapeHtml(
                currentUser.phone
            )}

        </div>

    `;


    if (isAdmin()) {

        adminButton?.classList.remove("hidden");

        if (thirdLabel) {

            thirdLabel.textContent =
                "Agenda";

        }

    } else {

        adminButton?.classList.add("hidden");

        if (thirdLabel) {

            thirdLabel.textContent =
                "Appuntamenti";

        }

    }

}


// =============================================
// SERVIZI
// =============================================

function renderServices() {

    const container =
        document.getElementById("services");


    if (!container) return;


    container.innerHTML = "";


    services.forEach(service => {

        const button =
            document.createElement("button");


        button.className =
            "service-card";


        button.innerHTML = `

            <span class="service-card-name">

                ${service.name}

            </span>

            <span class="service-card-price">

                €${service.price}

            </span>

        `;


        button.onclick = () => {

            selectService(service);

        };


        container.appendChild(button);

    });

}


function selectService(service) {

    selectedService = service;


    document
        .querySelectorAll(".service-card")
        .forEach(button => {

            button.classList.remove("selected");

        });


    const index =
        services.findIndex(
            item => item.id === service.id
        );


    const buttons =
        document.querySelectorAll(
            ".service-card"
        );


    if (buttons[index]) {

        buttons[index].classList.add(
            "selected"
        );

    }


    updateSummary();

}


// =============================================
// CALENDARIO PRENOTAZIONE
// =============================================

function renderBookingCalendar() {

    const title =
        document.getElementById(
            "bookingMonthTitle"
        );


    const grid =
        document.getElementById(
            "bookingCalendar"
        );


    if (!title || !grid) return;


    title.textContent =
        bookingMonth.toLocaleDateString(
            "it-IT",
            {
                month: "long",
                year: "numeric"
            }
        );


    grid.innerHTML = "";


    const year =
        bookingMonth.getFullYear();


    const month =
        bookingMonth.getMonth();


    const firstDay =
        new Date(year, month, 1);


    let start =
        firstDay.getDay() - 1;


    if (start < 0) start = 6;


    const days =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const today =
        startOfDay(new Date());


    for (
        let i = 0;
        i < start;
        i++
    ) {

        const empty =
            document.createElement("div");


        grid.appendChild(empty);

    }


    for (
        let day = 1;
        day <= days;
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );


        const button =
            document.createElement("button");


        button.className =
            "calendar-day";


        button.textContent = day;


        if (
            startOfDay(date) <
            today
        ) {

            button.classList.add(
                "disabled"
            );

        }


        if (
            sameDate(
                date,
                new Date()
            )
        ) {

            button.classList.add(
                "today"
            );

        }


        if (
            selectedDate &&
            sameDate(
                date,
                selectedDate
            )
        ) {

            button.classList.add(
                "selected"
            );

        }


        button.onclick =
            async () => {

                selectedDate = date;

                selectedTime = null;

                renderBookingCalendar();

                updateSelectedDateLabel();

                await loadBusyTimes();

                updateSummary();

            };


        grid.appendChild(button);

    }

}


function changeBookingMonth(direction) {

    bookingMonth.setMonth(
        bookingMonth.getMonth() + direction
    );


    const now = new Date();


    if (
        bookingMonth.getFullYear() <
        now.getFullYear()
    ) {

        bookingMonth = new Date();

    }


    renderBookingCalendar();

}


// =============================================
// DATA SELEZIONATA
// =============================================

function updateSelectedDateLabel() {

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
        formatDate(selectedDate);

}


// =============================================
// CARICA ORARI OCCUPATI
// =============================================

async function loadBusyTimes() {

    if (!selectedDate) return;


    const date =
        dateToDatabase(selectedDate);


    busyTimes = [];

    blockedTimes = [];


    try {

        const {
            data: appointments,
            error
        } = await db
            .from("appointments")
            .select("start_time")
            .eq(
                "appointment_date",
                date
            )
            .eq(
                "status",
                "confirmed"
            );


        if (error) throw error;


        busyTimes =
            (appointments || [])
                .map(item =>
                    String(item.start_time)
                        .substring(0, 5)
                );


        const {
            data: blocks,
            error: blockError
        } = await db
            .from("blocked_slots")
            .select("*")
            .eq(
                "blocked_date",
                date
            );


        if (blockError) throw blockError;


        blockedTimes =
            blocks || [];


        renderTimes();


    } catch (error) {

        console.error(
            "Errore orari:",
            error
        );


        renderTimes();

    }

}


// =============================================
// RENDER ORARI
// =============================================

function renderTimes() {

    const container =
        document.getElementById(
            "bookingTimesElegant"
        );


    if (!container) return;


    container.innerHTML = "";


    const allDayBlocked =
        blockedTimes.some(
            block =>
                !block.blocked_time
        );


    TIMES.forEach(time => {

        const button =
            document.createElement("button");


        button.className =
            "time-button";


        button.textContent = time;


        const isBusy =
            busyTimes.includes(time);


        const isBlocked =
            allDayBlocked ||
            blockedTimes.some(block => {

                if (!block.blocked_time) {

                    return false;

                }


                return String(
                    block.blocked_time
                ).substring(0, 5) === time;

            });


        if (isBusy) {

            button.classList.add("busy");

        }


        if (isBlocked) {

            button.classList.add("blocked");

        }


        if (selectedTime === time) {

            button.classList.add("selected");

        }


        if (
            !isBusy &&
            !isBlocked
        ) {

            button.onclick = () => {

                selectedTime = time;

                renderTimes();

                updateSummary();

            };

        }


        container.appendChild(button);

    });

}


// =============================================
// SUMMARY
// =============================================

function updateSummary() {

    const summary =
        document.getElementById(
            "bookingSummary"
        );


    if (
        !selectedService &&
        !selectedTime
    ) {

        summary?.classList.add("hidden");

        return;

    }


    summary?.classList.remove("hidden");


    document.getElementById(
        "summaryService"
    ).textContent =
        selectedService
            ? selectedService.name
            : "-";


    document.getElementById(
        "summaryDate"
    ).textContent =
        selectedDate
            ? formatDate(selectedDate)
            : "-";


    document.getElementById(
        "summaryTime"
    ).textContent =
        selectedTime || "-";


    document.getElementById(
        "summaryPrice"
    ).textContent =
        selectedService
            ? `€${selectedService.price}`
            : "€0";

}


// =============================================
// CREA PRENOTAZIONE
// =============================================

async function createBooking() {

    if (!currentUser) {

        openLogin();

        showToast(
            "Accedi prima di prenotare",
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


    try {

        const appointmentDate =
            dateToDatabase(selectedDate);


        const endTime =
            addMinutes(
                selectedTime,
                30
            );


        const {
            error
        } = await db
            .from("appointments")
            .insert({

                customer_id:
                    currentUser.id,

                customer_name:
                    `${currentUser.first_name} ${currentUser.last_name}`,

                customer_phone:
                    currentUser.phone,

                service_id:
                    selectedService.id,

                service_name:
                    selectedService.name,

                price:
                    selectedService.price,

                appointment_date:
                    appointmentDate,

                start_time:
                    selectedTime,

                end_time:
                    endTime,

                status:
                    "confirmed"

            });


        if (error) {

            if (
                error.code === "23505"
            ) {

                throw new Error(
                    "Questo orario è stato appena prenotato da un altro cliente."
                );

            }


            throw error;

        }


        showToast(
            "Prenotazione confermata!",
            "success"
        );


        selectedService = null;

        selectedTime = null;


        renderServices();

        updateSummary();

        await loadBusyTimes();


        setTimeout(() => {

            showPage(
                "appointmentsPage"
            );

        }, 500);


    } catch (error) {

        console.error(error);


        showToast(
            error.message ||
            "Errore durante la prenotazione",
            "error"
        );

    }

}


// =============================================
// APPUNTAMENTI CLIENTE
// =============================================

async function loadMyAppointments() {

    const container =
        document.getElementById(
            "myAppointments"
        );


    if (!currentUser) return;


    container.innerHTML =
        "Caricamento...";


    try {

        const {
            data,
            error
        } = await db
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
            );


        if (error) throw error;


        if (!data?.length) {

            container.innerHTML = `

                <div class="empty-state">

                    <h3>Nessun appuntamento</h3>

                    <p>
                        Non hai ancora prenotazioni.
                    </p>

                </div>

            `;

            return;

        }


        container.innerHTML = "";


        data.forEach(item => {

            const card =
                document.createElement("div");


            card.className =
                "appointment-card";


            card.innerHTML = `

                <div class="appointment-top">

                    <h3>
                        ${escapeHtml(
                            item.service_name
                        )}
                    </h3>

                    <span class="appointment-price">

                        €${item.price}

                    </span>

                </div>


                <div class="appointment-details">

                    📅
                    ${formatDatabaseDate(
                        item.appointment_date
                    )}

                    <br>

                    ◷
                    ${String(
                        item.start_time
                    ).substring(0, 5)}

                </div>


                <button
                class="cancel-button">

                    ANNULLA APPUNTAMENTO

                </button>

            `;


            card
                .querySelector(".cancel-button")
                .onclick = () => {

                    cancelAppointment(
                        item.id
                    );

                };


            container.appendChild(card);

        });


    } catch (error) {

        console.error(error);

        container.innerHTML = `

            <div class="empty-state">

                <h3>Errore</h3>

                <p>
                    Impossibile caricare gli appuntamenti.
                </p>

            </div>

        `;

    }

}


// =============================================
// CANCELLA
// =============================================

async function cancelAppointment(id) {

    const confirmDelete =
        confirm(
            "Vuoi annullare questo appuntamento?"
        );


    if (!confirmDelete) return;


    try {

        const { error } =
            await db
                .from("appointments")
                .delete()
                .eq("id", id);


        if (error) throw error;


        showToast(
            "Appuntamento annullato",
            "success"
        );


        loadMyAppointments();


    } catch (error) {

        console.error(error);

        showToast(
            "Errore durante l'annullamento",
            "error"
        );

    }

}


// =============================================
// AGENDA
// =============================================

async function loadAgenda() {

    renderAgendaCalendar();

    await loadAgendaDay();

}


function renderAgendaCalendar() {

    const title =
        document.getElementById("monthTitle");


    const grid =
        document.getElementById("calendarGrid");


    if (!title || !grid) return;


    title.textContent =
        agendaMonth.toLocaleDateString(
            "it-IT",
            {
                month: "long",
                year: "numeric"
            }
        );


    grid.innerHTML = "";


    const year =
        agendaMonth.getFullYear();

    const month =
        agendaMonth.getMonth();


    const first =
        new Date(year, month, 1);


    let start =
        first.getDay() - 1;


    if (start < 0) start = 6;


    const totalDays =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    for (
        let i = 0;
        i < start;
        i++
    ) {

        grid.appendChild(
            document.createElement("div")
        );

    }


    for (
        let day = 1;
        day <= totalDays;
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );


        const button =
            document.createElement("button");


        button.className =
            "calendar-day";


        button.textContent = day;


        if (
            sameDate(
                date,
                agendaSelectedDate
            )
        ) {

            button.classList.add("selected");

        }


        button.onclick =
            async () => {

                agendaSelectedDate = date;

                renderAgendaCalendar();

                await loadAgendaDay();

            };


        grid.appendChild(button);

    }

}


function changeMonth(direction) {

    agendaMonth.setMonth(
        agendaMonth.getMonth() + direction
    );


    renderAgendaCalendar();

}


// =============================================
// GIORNO AGENDA
// =============================================

async function loadAgendaDay() {

    const date =
        dateToDatabase(
            agendaSelectedDate
        );


    document.getElementById(
        "selectedDateTitle"
    ).textContent =
        formatDate(
            agendaSelectedDate
        );


    const container =
        document.getElementById(
            "agendaSlots"
        );


    try {

        const {
            data,
            error
        } = await db
            .from("appointments")
            .select("*")
            .eq(
                "appointment_date",
                date
            )
            .eq(
                "status",
                "confirmed"
            )
            .order(
                "start_time"
            );


        if (error) throw error;


        const count =
            data?.length || 0;


        const revenue =
            (data || [])
                .reduce(
                    (total, item) =>
                        total +
                        Number(item.price || 0),
                    0
                );


        document.getElementById(
            "agendaCount"
        ).textContent = count;


        document.getElementById(
            "agendaRevenue"
        ).textContent =
            `€${revenue}`;


        if (!data?.length) {

            container.innerHTML = `

                <div class="empty-state">

                    <h3>Agenda libera</h3>

                    <p>
                        Nessun appuntamento per questo giorno.
                    </p>

                </div>

            `;

            return;

        }


        container.innerHTML = "";


        data.forEach(item => {

            const row =
                document.createElement("div");


            row.className =
                "agenda-slot";


            row.innerHTML = `

                <div class="slot-time">

                    ${String(
                        item.start_time
                    ).substring(0,5)}

                </div>


                <div class="slot-info">

                    <b>

                        ${escapeHtml(
                            item.customer_name
                        )}

                    </b>

                    <span>

                        ${escapeHtml(
                            item.service_name
                        )}

                    </span>

                </div>


                <div class="slot-price">

                    €${item.price}

                </div>

            `;


            container.appendChild(row);

        });


    } catch (error) {

        console.error(error);

    }

}


// =============================================
// ADMIN FORM
// =============================================

function setupAdminForms() {

    const serviceSelect =
        document.getElementById(
            "adminService"
        );


    const timeSelect =
        document.getElementById(
            "adminTime"
        );


    const blockSelect =
        document.getElementById(
            "blockTime"
        );


    if (serviceSelect) {

        services.forEach(service => {

            const option =
                document.createElement("option");


            option.value = service.id;

            option.textContent =
                `${service.name} - €${service.price}`;


            serviceSelect.appendChild(option);

        });

    }


    if (timeSelect) {

        TIMES.forEach(time => {

            const option =
                document.createElement("option");


            option.value = time;

            option.textContent = time;


            timeSelect.appendChild(option);

        });

    }


    if (blockSelect) {

        TIMES.forEach(time => {

            const option =
                document.createElement("option");


            option.value = time;

            option.textContent = time;


            blockSelect.appendChild(option);

        });

    }

}


// =============================================
// ADD CLIENT
// =============================================

function openAddClient() {

    document
        .getElementById("adminDate")
        .value =
            dateToDatabase(
                agendaSelectedDate
            );


    document
        .getElementById("addModal")
        .classList.remove("hidden");

}


async function adminAddBooking() {

    const name =
        document
            .getElementById("adminName")
            .value
            .trim();


    const phone =
        document
            .getElementById("adminPhone")
            .value
            .trim();


    const serviceId =
        document
            .getElementById("adminService")
            .value;


    const date =
        document
            .getElementById("adminDate")
            .value;


    const time =
        document
            .getElementById("adminTime")
            .value;


    if (!name || !date || !time) {

        showToast(
            "Compila i campi obbligatori",
            "error"
        );

        return;

    }


    const service =
        services.find(
            item =>
                item.id === serviceId
        );


    try {

        const { error } =
            await db
                .from("appointments")
                .insert({

                    customer_id: null,

                    customer_name: name,

                    customer_phone: phone,

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
                        addMinutes(time, 30),

                    status:
                        "confirmed"

                });


        if (error) {

            if (
                error.code === "23505"
            ) {

                throw new Error(
                    "Questo orario è già occupato."
                );

            }

            throw error;

        }


        closeModal("addModal");

        showToast(
            "Appuntamento aggiunto!",
            "success"
        );


        loadAgendaDay();


    } catch (error) {

        console.error(error);

        showToast(
            error.message,
            "error"
        );

    }

}


// =============================================
// BLOCK
// =============================================

function openBlock() {

    document
        .getElementById("blockDate")
        .value =
            dateToDatabase(
                agendaSelectedDate
            );


    document
        .getElementById("blockModal")
        .classList.remove("hidden");

}


async function saveBlock() {

    const date =
        document
            .getElementById("blockDate")
            .value;


    const time =
        document
            .getElementById("blockTime")
            .value;


    if (!date) {

        showToast(
            "Seleziona una data",
            "error"
        );

        return;

    }


    try {

        const blockTime =
            time === "ALL"
                ? null
                : time;


        const { error } =
            await db
                .from("blocked_slots")
                .insert({

                    blocked_date:
                        date,

                    blocked_time:
                        blockTime

                });


        if (error) throw error;


        closeModal("blockModal");


        showToast(
            "Disponibilità bloccata",
            "success"
        );


        loadAgendaDay();


    } catch (error) {

        console.error(error);

        showToast(
            "Errore durante il blocco",
            "error"
        );

    }

}


// =============================================
// MODAL GENERICA
// =============================================

function closeModal(id) {

    document
        .getElementById(id)
        ?.classList.add("hidden");

}


// =============================================
// NOTIFICHE
// =============================================

async function requestNotifications() {

    if (!("Notification" in window)) {

        showToast(
            "Le notifiche non sono supportate",
            "error"
        );

        return;

    }


    const permission =
        await Notification.requestPermission();


    if (permission === "granted") {

        showToast(
            "Notifiche attivate!",
            "success"
        );

    } else {

        showToast(
            "Notifiche non autorizzate",
            "error"
        );

    }

}


// =============================================
// INSTALL
// =============================================

function showInstall() {

    document
        .getElementById("installModal")
        .classList.remove("hidden");

}


// =============================================
// UTILITIES
// =============================================

function addMinutes(time, minutes) {

    const [hours, mins] =
        time.split(":").map(Number);


    const date =
        new Date();


    date.setHours(hours, mins + minutes);


    return `${String(
        date.getHours()
    ).padStart(2,"0")}:${String(
        date.getMinutes()
    ).padStart(2,"0")}`;

}


function startOfDay(date) {

    const newDate =
        new Date(date);


    newDate.setHours(0,0,0,0);


    return newDate;

}


function sameDate(a, b) {

    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );

}


function dateToDatabase(date) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2,"0");


    const day =
        String(
            date.getDate()
        ).padStart(2,"0");


    return `${year}-${month}-${day}`;

}


function formatDate(date) {

    return new Date(
        date
    ).toLocaleDateString(
        "it-IT",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}


function formatDatabaseDate(dateString) {

    const parts =
        String(dateString)
            .split("-");


    if (parts.length !== 3) {

        return dateString;

    }


    return new Date(
        parts[0],
        Number(parts[1]) - 1,
        parts[2]
    ).toLocaleDateString(
        "it-IT",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}


function escapeHtml(value) {

    return String(value || "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");

}


// =============================================
// TOAST
// =============================================

function showToast(
    message,
    type = "default"
) {

    const toast =
        document.getElementById("toast");


    if (!toast) return;


    toast.textContent = message;


    toast.className = "";


    if (type === "success") {

        toast.classList.add("success");

    }


    if (type === "error") {

        toast.classList.add("error");

    }


    toast.classList.add("show");


    clearTimeout(toastTimer);


    toastTimer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 3000);

}


// =============================================
// FUNZIONI GLOBALI
// =============================================

window.showPage = showPage;

window.thirdNav = thirdNav;

window.openLogin = openLogin;

window.openRegister = openRegister;

window.closeRegister = closeRegister;

window.closeLogin = closeLogin;

window.login = login;

window.register = register;

window.logout = logout;

window.selectService = selectService;

window.changeBookingMonth = changeBookingMonth;

window.createBooking = createBooking;

window.changeMonth = changeMonth;

window.openAddClient = openAddClient;

window.adminAddBooking = adminAddBooking;

window.openBlock = openBlock;

window.saveBlock = saveBlock;

window.closeModal = closeModal;

window.requestNotifications = requestNotifications;

window.showInstall = showInstall;

window.cancelAppointment = cancelAppointment;
