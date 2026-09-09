async function adminCancelBooking(bookingId) {

  if (!currentUser || currentUser.role !== "admin") {

    showToast(
      "Accesso non autorizzato",
      "error"
    );

    return;

  }


  const confirmed = confirm(
    "Vuoi annullare questo appuntamento?"
  );


  if (!confirmed) return;


  try {

    const {
      data: booking,
      error: bookingError
    } = await supabaseClient
      .from("appointments")
      .select("*")
      .eq("id", bookingId)
      .single();


    if (bookingError) {
      throw bookingError;
    }


    const {
      error
    } = await supabaseClient
      .from("appointments")
      .update({
        status: "cancelled_by_admin"
      })
      .eq("id", bookingId);


    if (error) {
      throw error;
    }


    await sendBookingNotification(

      booking.customer_id,

      booking.customer_phone,

      "Appuntamento annullato ❌",

      `Il tuo appuntamento del ${formatDate(
        booking.appointment_date
      )} alle ${String(
        booking.start_time
      ).slice(0, 5)} è stato annullato dallo staff.`,

      "booking_cancelled_by_admin"

    );


    showToast(
      "Appuntamento annullato",
      "success"
    );


    await loadUserBookings();


  } catch (error) {

    console.error(
      "Errore annullamento admin:",
      error
    );


    showToast(
      "Errore durante l'annullamento",
      "error"
    );

  }

}
/* =========================================================
   AGENDA ADMIN
========================================================= */

let adminAgendaDate = new Date();


function isAdmin() {

  return Boolean(
    currentUser &&
    String(currentUser.role || "").toLowerCase() === "admin"
  );

}


/* =========================================================
   APERTURA AGENDA ADMIN
========================================================= */

function openAdminAgenda() {

  if (!isAdmin()) {

    showToast(
      "Area riservata all'amministratore",
      "error"
    );

    return;

  }


  let adminPage = q("adminAgendaPage");


  if (!adminPage) {

    createAdminAgendaPage();

    adminPage = q("adminAgendaPage");

  }


  showPage("adminAgendaPage");

  loadAdminAgenda();

}


/* =========================================================
   CREA PAGINA AGENDA
========================================================= */

function createAdminAgendaPage() {

  const mainContent =
    document.querySelector(".main-content");


  if (!mainContent) return;


  const section =
    document.createElement("section");


  section.id = "adminAgendaPage";

  section.className = "page";


  section.innerHTML = `

    <div class="page-heading">

      <span>
        AREA AMMINISTRATORE
      </span>

      <h2>
        Agenda
      </h2>

      <p>
        Gestisci tutti gli appuntamenti.
      </p>

    </div>


    <div class="booking-card">

      <div class="booking-month-nav">

        <button
          type="button"
          onclick="changeAdminAgendaDay(-1)"
        >
          ‹
        </button>


        <h3 id="adminAgendaDateTitle">
          Agenda
        </h3>


        <button
          type="button"
          onclick="changeAdminAgendaDay(1)"
        >
          ›
        </button>

      </div>


      <div
        id="adminAgendaDatePicker"
        style="
          margin-top:15px;
          display:flex;
          gap:10px;
          align-items:center;
          justify-content:center;
        "
      >

        <input
          type="date"
          id="adminAgendaDateInput"
          style="
            padding:12px;
            border-radius:10px;
            width:100%;
          "
        >

      </div>

    </div>


    <div
      id="adminAgendaList"
      class="appointments-list"
    >

      <div class="empty-state">

        Caricamento agenda...

      </div>

    </div>

  `;


  mainContent.appendChild(section);


  const dateInput =
    q("adminAgendaDateInput");


  if (dateInput) {

    dateInput.value =
      localDateString(adminAgendaDate);


    dateInput.addEventListener(
      "change",
      async function () {

        if (!this.value) return;


        adminAgendaDate =
          new Date(
            this.value + "T12:00:00"
          );


        await loadAdminAgenda();

      }
    );

  }

}


/* =========================================================
   CAMBIO GIORNO AGENDA
========================================================= */

async function changeAdminAgendaDay(days) {

  adminAgendaDate.setDate(
    adminAgendaDate.getDate() + days
  );


  const input =
    q("adminAgendaDateInput");


  if (input) {

    input.value =
      localDateString(adminAgendaDate);

  }


  await loadAdminAgenda();

}


/* =========================================================
   CARICA AGENDA ADMIN
========================================================= */

async function loadAdminAgenda() {

  if (!isAdmin()) return;


  const container =
    q("adminAgendaList");


  const title =
    q("adminAgendaDateTitle");


  if (!container) return;


  const selectedDate =
    localDateString(adminAgendaDate);


  if (title) {

    title.textContent =
      formatDate(selectedDate);

  }


  container.innerHTML = `

    <div class="empty-state">

      Caricamento appuntamenti...

    </div>

  `;


  try {

    const {
      data: appointments,
      error
    } = await supabaseClient
      .from("appointments")
      .select("*")
      .eq(
        "appointment_date",
        selectedDate
      )
      .order(
        "start_time",
        {
          ascending: true
        }
      );


    if (error) {

      throw error;

    }


    if (
      !appointments ||
      appointments.length === 0
    ) {

      container.innerHTML = `

        <div class="empty-state">

          <h3>
            Nessun appuntamento
          </h3>

          <p>
            Non ci sono prenotazioni per questo giorno.
          </p>

        </div>

      `;

      return;

    }


    container.innerHTML =
      appointments
        .map(booking => {

          const time =
            String(
              booking.start_time || ""
            ).slice(0, 5);


          const endTime =
            String(
              booking.end_time || ""
            ).slice(0, 5);


          const isCancelled =
            booking.status === "cancelled" ||
            booking.status === "cancelled_by_admin";


          return `

            <div class="appointment-card">

              <div class="appointment-date">

                <span>
                  ${time}
                  ${endTime ? " - " + endTime : ""}
                </span>

                <strong>
                  ${escapeHtml(
                    booking.customer_name ||
                    "Cliente"
                  )}
                </strong>

              </div>


              <div class="appointment-info">

                <h3>
                  ${escapeHtml(
                    booking.service_name ||
                    "Servizio"
                  )}
                </h3>


                <p>

                  ${
                    escapeHtml(
                      booking.customer_phone ||
                      ""
                    )
                  }

                </p>


                <p>

                  €${booking.service_price || 0}

                </p>


                <span class="appointment-status
                  ${
                    isCancelled
                      ? "cancelled"
                      : "confirmed"
                  }
                ">

                  ${
                    isCancelled
                      ? "Annullato"
                      : "Confermato"
                  }

                </span>

              </div>


              ${
                !isCancelled
                  ? `

                    <button
                      class="danger-button"
                      onclick="adminCancelBooking('${booking.id}')"
                    >

                      ANNULLA

                    </button>

                  `
                  : ""
              }

            </div>

          `;

        })
        .join("");


  } catch (error) {

    console.error(
      "Errore agenda admin:",
      error
    );


    container.innerHTML = `

      <div class="empty-state">

        <h3>
          Errore caricamento agenda
        </h3>

        <p>
          ${
            escapeHtml(
              error.message ||
              "Impossibile caricare gli appuntamenti."
            )
          }
        </p>

      </div>

    `;

  }

}


/* =========================================================
   ANNULLAMENTO ADMIN
========================================================= */

async function adminCancelBooking(bookingId) {

  if (!isAdmin()) return;


  const confirmed =
    confirm(
      "Vuoi annullare questo appuntamento?"
    );


  if (!confirmed) return;


  try {

    const {
      data: booking,
      error: bookingError
    } = await supabaseClient
      .from("appointments")
      .select("*")
      .eq("id", bookingId)
      .single();


    if (bookingError) {

      throw bookingError;

    }


    const {
      error
    } = await supabaseClient
      .from("appointments")
      .update({
        status: "cancelled_by_admin"
      })
      .eq("id", bookingId);


    if (error) {

      throw error;

    }


    await sendBookingNotification(

      booking.customer_id,

      booking.customer_phone,

      "Appuntamento annullato",

      `Il tuo appuntamento del ${formatDate(
        booking.appointment_date
      )} alle ${String(
        booking.start_time
      ).slice(0, 5)} è stato annullato dal salone.`,

      "booking_cancelled_by_admin"

    );


    showToast(
      "Appuntamento annullato",
      "success"
    );


    await loadAdminAgenda();


  } catch (error) {

    console.error(
      "Errore annullamento admin:",
      error
    );


    showToast(
      "Errore durante l'annullamento",
      "error"
    );

  }

}


/* =========================================================
   AGGIUNGI PULSANTE AGENDA NEL PROFILO ADMIN
========================================================= */

const originalUpdateUserInterface =
  updateUserInterface;


updateUserInterface =
  function () {

    originalUpdateUserInterface();


    let adminButton =
      q("adminAgendaButton");


    if (isAdmin()) {

      if (!adminButton) {

        const profilePage =
          q("profilePage");


        if (profilePage) {

          adminButton =
            document.createElement("button");


          adminButton.id =
            "adminAgendaButton";


          adminButton.className =
            "profile-row";


          adminButton.innerHTML = `

            <span>
              📅
            </span>

            <div>

              <b>
                Agenda amministratore
              </b>

              <small>
                Visualizza tutte le prenotazioni
              </small>

            </div>

            <i>
              ›
            </i>

          `;


          adminButton.addEventListener(
            "click",
            openAdminAgenda
          );


          const logoutButton =
            q("logoutButton");


          if (logoutButton) {

            profilePage.insertBefore(
              adminButton,
              logoutButton
            );

          } else {

            profilePage.appendChild(
              adminButton
            );

          }

        }

      }


      if (adminButton) {

        adminButton.classList.remove(
          "hidden"
        );

      }


    } else {

      if (adminButton) {

        adminButton.remove();

      }

    }

  };


/* =========================================================
   ESPOSIZIONE FUNZIONI AGENDA ADMIN
========================================================= */

window.openAdminAgenda =
  openAdminAgenda;

window.loadAdminAgenda =
  loadAdminAgenda;

window.changeAdminAgendaDay =
  changeAdminAgendaDay;

window.adminCancelBooking =
  adminCancelBooking;
