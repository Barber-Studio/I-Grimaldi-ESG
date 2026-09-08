const SUPABASE_URL="https://wxcdmtajcasnlohqkgmk.supabase.co";
const SUPABASE_KEY="sb_publishable_bwjP-ihASijevvu7d6r5Ew_6JaWKSDP";
let supabaseClient=null;
try{if(window.supabase) supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY)}catch(e){console.error(e)}

const services=[
{id:"shampoo_taglio",name:"Shampoo + Taglio",price:20,duration:30},
{id:"barba_5",name:"Barba 5€",price:5,duration:30},
{id:"barba_10",name:"Barba 10€",price:10,duration:30},
{id:"colore",name:"Colore",price:20,duration:30},
{id:"colore_barba",name:"Colore Barba",price:10,duration:30},
{id:"fiala",name:"Fiala",price:5,duration:30}
];
const TIMES=["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00"];
let currentUser=null,selectedService=null,selectedDate=null,selectedTime=null,toastTimer=null,bookingViewDate=new Date();
let agendaViewDate=new Date(),agendaSelectedDate=localDateString(new Date()),agendaAppointments=[],agendaBlocks=[];

document.addEventListener("DOMContentLoaded",async()=>{
 renderServices();setupDate();setupEvents();await restoreSession();
 setTimeout(()=>{const l=document.getElementById("loadingScreen");if(l){l.style.opacity="0";setTimeout(()=>l.remove(),350)}},1200);
});
function q(id){return document.getElementById(id)}
function localDateString(date){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,"0"),d=String(date.getDate()).padStart(2,"0");return `${y}-${m}-${d}`}
function normalizePhone(v){return String(v||"").replace(/[^0-9]/g,"")}
function isAdmin(){
  if(!currentUser)return false;
  const phones=[currentUser.customer_phone,currentUser.phone,currentUser.phone_number,currentUser.mobile,currentUser.numero].map(normalizePhone);
  return (currentUser.role||"").toLowerCase()==="admin" || phones.includes("3791415355");
}
function escapeHtml(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}
function formatDate(d){return d?new Date(d+"T12:00:00").toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long",year:"numeric"}):"-"}

function renderServices(){const box=q("services");if(!box)return;box.innerHTML=services.map(s=>`<button type="button" class="service-card ${selectedService?.id===s.id?"selected":""}" data-service="${s.id}"><span class="service-name">${s.name}</span><strong class="service-price">€${s.price}</strong></button>`).join("");box.querySelectorAll(".service-card").forEach(b=>b.onclick=()=>{selectedService=services.find(x=>x.id===b.dataset.service);renderServices();updateSummary()})}
function setupEvents(){q("confirmBooking")?.addEventListener("click",createBooking);q("loginButton")?.addEventListener("click",loginUser);q("registerButton")?.addEventListener("click",handleRegistration);q("prevBookingMonth")?.addEventListener("click",()=>{bookingViewDate.setMonth(bookingViewDate.getMonth()-1);renderBookingCalendar()});q("nextBookingMonth")?.addEventListener("click",()=>{bookingViewDate.setMonth(bookingViewDate.getMonth()+1);renderBookingCalendar()})}
function setupDate(){const t=new Date();t.setHours(0,0,0,0);selectedDate=localDateString(t);bookingViewDate=new Date(t.getFullYear(),t.getMonth(),1);renderBookingCalendar();loadAvailableTimes();updateSummary()}
function renderBookingCalendar(){const grid=q("bookingCalendar"),title=q("bookingMonthTitle");if(!grid||!title)return;const y=bookingViewDate.getFullYear(),m=bookingViewDate.getMonth(),first=new Date(y,m,1),offset=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate(),today=localDateString(new Date());title.textContent=new Intl.DateTimeFormat("it-IT",{month:"long",year:"numeric"}).format(bookingViewDate);let html="";for(let i=0;i<offset;i++)html+='<span class="calendar-empty"></span>';for(let d=1;d<=days;d++){const val=localDateString(new Date(y,m,d)),past=val<today;html+=`<button type="button" class="calendar-day ${past?"past":""} ${val===selectedDate?"selected":""} ${val===today?"today":""}" data-date="${val}" ${past?"disabled":""}>${d}</button>`}grid.innerHTML=html;grid.querySelectorAll(".calendar-day:not(.past)").forEach(b=>b.onclick=async()=>{selectedDate=b.dataset.date;selectedTime=null;renderBookingCalendar();await loadAvailableTimes();updateSummary()})}
async function loadAvailableTimes(){const box=q("timeSlots");if(!box)return;box.innerHTML=TIMES.map(t=>`<button class="time-slot" data-time="${t}">${t}</button>`).join("");let busy=[];if(supabaseClient&&selectedDate){try{const {data,error}=await supabaseClient.from("appointments").select("appointment_time,status").eq("appointment_date",selectedDate);if(!error)busy=(data||[]).filter(x=>x.status!=="cancelled").map(x=>String(x.appointment_time||"").slice(0,5));const bl=await supabaseClient.from("availability_blocks").select("block_time").eq("block_date",selectedDate);if(!bl.error){const times=(bl.data||[]).map(x=>x.block_time);if(times.includes("ALL"))busy=[...TIMES];else busy.push(...times)}}catch(e){console.warn(e)}}box.querySelectorAll(".time-slot").forEach(b=>{const t=b.dataset.time;if(busy.includes(t)){b.classList.add("busy");b.disabled=true}else b.onclick=()=>{selectedTime=t;box.querySelectorAll(".time-slot").forEach(x=>x.classList.toggle("selected",x===b));updateSummary()}})}
function updateSummary(){q("summaryService").textContent=selectedService?selectedService.name:"Non selezionato";q("summaryDate").textContent=selectedDate?new Date(selectedDate+"T12:00:00").toLocaleDateString("it-IT",{day:"numeric",month:"short"}):"-";q("summaryTime").textContent=selectedTime||"-";q("summaryPrice").textContent=selectedService?`€${selectedService.price}`:"€0"}

function showPage(id){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===id));window.scrollTo({top:0,behavior:"smooth"});if(id==="appointmentsPage")loadUserBookings();if(id==="profilePage")updateUserInterface();if(id==="agendaPage")loadAgenda()}
async function createBooking(){if(!currentUser){showToast("Accedi prima di prenotare","error");openAuth();return}if(!selectedService||!selectedDate||!selectedTime){showToast("Completa servizio, data e orario","error");return}if(!supabaseClient){showToast("Supabase non disponibile","error");return}const payload={client_id:currentUser.id,client_name:currentUser.customer_name,client_phone:currentUser.customer_phone,appointment_date:selectedDate,appointment_time:selectedTime,service:selectedService.name,price:selectedService.price,status:"confirmed"};try{const {error}=await supabaseClient.from("appointments").insert([payload]);if(error)throw error;showToast("Prenotazione confermata!","success");selectedService=null;selectedTime=null;renderServices();updateSummary();await loadAvailableTimes();setTimeout(()=>showPage("appointmentsPage"),450)}catch(e){console.error(e);showToast(e.code==="23505"?"Questo orario è già occupato":"Errore prenotazione: "+(e.message||"controlla Supabase"),"error")}}
async function loadUserBookings(){const box=q("bookingsList");if(!currentUser){box.innerHTML='<div class="empty-state"><h3>Non hai effettuato l’accesso</h3><p>Accedi per vedere le tue prenotazioni.</p></div>';return}box.innerHTML='<div class="empty-state">Caricamento appuntamenti...</div>';try{const {data,error}=await supabaseClient.from("appointments").select("*").eq("client_id",currentUser.id).order("appointment_date",{ascending:true});if(error)throw error;if(!data?.length){box.innerHTML='<div class="empty-state"><h3>Nessuna prenotazione</h3><p>Non hai ancora appuntamenti.</p></div>';return}box.innerHTML=data.map(a=>`<div class="booking-item"><div class="booking-item-top"><div><h3>${escapeHtml(a.service||"Servizio")}</h3><p>${formatDate(a.appointment_date)} · ${escapeHtml(String(a.appointment_time||"").slice(0,5))}</p><p>€${a.price||0}</p></div><span>✓</span></div><button class="cancel-booking" onclick="cancelBooking('${a.id}')">Annulla appuntamento</button></div>`).join("")}catch(e){console.error(e);box.innerHTML='<div class="empty-state"><h3>Errore</h3><p>Impossibile caricare gli appuntamenti.</p></div>'}}
async function cancelBooking(id){if(!confirm("Vuoi davvero annullare questa prenotazione?"))return;try{const {error}=await supabaseClient.from("appointments").delete().eq("id",id);if(error)throw error;showToast("Prenotazione annullata","success");loadUserBookings()}catch(e){showToast("Errore durante l'annullamento","error")}}

function openAuth(){q("authModal").classList.remove("hidden")}function closeAuth(){q("authModal").classList.add("hidden")}function openRegister(){closeAuth();q("registerModal").classList.remove("hidden")}function closeRegister(){q("registerModal").classList.add("hidden")}
// ONESIGNAL - SAFE IOS VERSION
const ONESIGNAL_APP_ID="864d0967-8a2d-4fe1-8a19-e95fe866b28b";

function withOneSignal(callback){
  window.OneSignalDeferred=window.OneSignalDeferred||[];
  window.OneSignalDeferred.push(callback);
}

async function setupOneSignalUser(){
  if(!currentUser||!currentUser.id)return;
  withOneSignal(async function(OneSignal){
    try{
      await OneSignal.login(String(currentUser.id));
    }catch(e){console.warn("OneSignal login:",e)}
  });
}

async function logoutOneSignalUser(){
  withOneSignal(async function(OneSignal){
    try{await OneSignal.logout()}catch(e){}
  });
}

async function requestOneSignalNotifications(){
  showToast("Richiesta notifiche...");
  withOneSignal(async function(OneSignal){
    try{
      const alreadyAllowed =
        OneSignal.Notifications.permission === true ||
        (OneSignal.User && OneSignal.User.PushSubscription &&
         OneSignal.User.PushSubscription.optedIn === true);

      if(!alreadyAllowed){
        await OneSignal.Notifications.requestPermission();
        await new Promise(r=>setTimeout(r,500));
      }

      const allowed =
        OneSignal.Notifications.permission === true ||
        (OneSignal.User && OneSignal.User.PushSubscription &&
         OneSignal.User.PushSubscription.optedIn === true);

      if(allowed){
        if(currentUser&&currentUser.id) await OneSignal.login(String(currentUser.id));
        showToast("Notifiche attivate correttamente!","success");
      }else{
        showToast("Notifiche non disponibili. Apri l'app dalla Home dell'iPhone.","error");
      }
    }catch(e){
      console.error("OneSignal:",e);
      showToast("Errore notifiche. Riprova tra qualche secondo.","error");
    }
  });
}

function requestNotifications(){requestOneSignalNotifications()}
function showInstall(){q("installModal").classList.remove("hidden")}function closeInstall(){q("installModal").classList.add("hidden")}
function showToast(message,type="default"){const t=q("toast");t.textContent=message;t.className="";t.classList.add(type);requestAnimationFrame(()=>t.classList.add("show"));clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),3000)}
Object.assign(window,{showPage,loadAgenda,openAuth,closeAuth,openRegister,closeRegister,cancelBooking,logoutUser,requestNotifications,showInstall,closeInstall,openManualBooking,closeAdminModal,saveManualBooking,openMoveBooking,saveMoveBooking,deleteAdminBooking,openBlockModal,saveBlockTime,blockTime,unblockTime});


// MOBILE TOUCH FIX
(function(){
  const style=document.createElement("style");
  style.id="mobile-touch-fix";
  style.textContent=`
    @media (max-width: 768px){
      button,a,[role="button"],.btn,.nav-item,.time-slot,.service-card,input,select,textarea{
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
      button,a,[role="button"],.btn,.nav-item,.time-slot,.service-card{
        cursor:pointer;
        pointer-events:auto !important;
      }
      .modal,.popup,.overlay,.auth-modal{
        -webkit-overflow-scrolling:touch;
      }
    }
  `;
  document.head.appendChild(style);

  document.addEventListener("touchstart",function(e){
    const el=e.target.closest("button,a,[role='button'],.btn,.nav-item,.time-slot,.service-card");
    if(el) el.classList.add("is-touching");
  },{passive:true});

  document.addEventListener("touchend",function(e){
    const el=e.target.closest("button,a,[role='button'],.btn,.nav-item,.time-slot,.service-card");
    if(el) setTimeout(()=>el.classList.remove("is-touching"),120);
  },{passive:true});
})();



// PWA UPDATE CHECK - SAFE VERSION
window.addEventListener("load",()=>{
  if("serviceWorker" in navigator){
    navigator.serviceWorker.getRegistrations()
      .then(regs=>regs.forEach(reg=>reg.update().catch(()=>{})))
      .catch(()=>{});
  }
});
