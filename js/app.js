const SUPABASE_URL="https://wxcdmtajcasnlohqkgmk.supabase.co";
const SUPABASE_KEY="sb_publishable_bwjP-ihASijevvu7d6r5Ew_6JaWKSDP";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

const SERVICES=[
{id:"shampoo_taglio",name:"Shampoo + Taglio",price:20},
{id:"barba_5",name:"Barba",price:5},
{id:"barba_10",name:"Barba",price:10},
{id:"colore",name:"Colore",price:20},
{id:"colore_barba",name:"Colore Barba",price:10},
{id:"fiala",name:"Fiala",price:5}
];
const TIMES=["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00"];
let user=null, profile=null, selectedService=null, selectedDate=null, selectedTime=null;
let bookingMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);
let agendaMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);
let agendaDate=today();
let busyTimes=new Set();

function today(){return new Date().toISOString().slice(0,10)}
function phoneDigits(v){return String(v||"").replace(/\D/g,"")}
function authEmail(phone){return phoneDigits(phone)+"@igrimaldi.app"}
function fmtDate(d){return new Date(d+"T12:00:00").toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");clearTimeout(window._tt);window._tt=setTimeout(()=>t.classList.remove("show"),2800)}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

document.addEventListener("DOMContentLoaded",init);
async function init(){
 renderHomeServices();renderServices();renderBookingCalendar();fillAdminSelects();
 const {data:{session}}=await db.auth.getSession();
 if(session){user=session.user;await loadProfile()}
 document.getElementById("loadingScreen").classList.add("hidden");
 document.getElementById("app").classList.remove("hidden");
 if(!user) document.getElementById("authModal").classList.remove("hidden");
 updateUI();
}

function renderHomeServices(){document.getElementById("homeServices").innerHTML=SERVICES.map(s=>`<div class="price-row"><div><b>${s.name}</b></div><b>€${s.price}</b></div>`).join("")}
function renderServices(){document.getElementById("services").innerHTML=SERVICES.map(s=>`<button class="service-btn ${selectedService?.id===s.id?"selected":""}" onclick="selectService('${s.id}')"><div><b>${s.name}</b><small>Appuntamento dedicato</small></div><b>€${s.price}</b></button>`).join("")}
function selectService(id){selectedService=SERVICES.find(s=>s.id===id);renderServices();updateSummary()}
function updateSummary(){document.getElementById("summaryService").textContent=selectedService?selectedService.name:"Non selezionato";document.getElementById("summaryWhen").textContent=selectedDate&&selectedTime?fmtDate(selectedDate)+" · "+selectedTime:"—";document.getElementById("summaryPrice").textContent=selectedService?"€"+selectedService.price:"€0"}

function renderCalendar(target,month,titleId,chosen,onClick){
 document.getElementById(titleId).textContent=month.toLocaleDateString("it-IT",{month:"long",year:"numeric"});
 const first=(new Date(month.getFullYear(),month.getMonth(),1).getDay()+6)%7, days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
 let html="";for(let i=0;i<first;i++)html+='<button class="calendar-day empty"></button>';
 for(let d=1;d<=days;d++){let ds=`${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;let past=ds<today();html+=`<button ${past?"disabled":""} class="calendar-day ${ds===today()?"today":""} ${ds===chosen?"selected":""}" onclick="${onClick}('${ds}')">${d}</button>`}
 document.getElementById(target).innerHTML=html;
}
function renderBookingCalendar(){renderCalendar("bookingCalendar",bookingMonth,"bookingMonthTitle",selectedDate,"chooseDate")}
function changeBookingMonth(n){bookingMonth=new Date(bookingMonth.getFullYear(),bookingMonth.getMonth()+n,1);if(bookingMonth<new Date(new Date().getFullYear(),new Date().getMonth(),1))bookingMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);renderBookingCalendar()}
async function chooseDate(ds){selectedDate=ds;selectedTime=null;renderBookingCalendar();document.getElementById("selectedBookingDateLabel").textContent=fmtDate(ds);updateSummary();await loadBusyTimes()}
async function loadBusyTimes(){busyTimes=new Set();document.getElementById("bookingTimes").innerHTML='<div style="color:#999">Caricamento orari...</div>';if(!selectedDate)return;let q=await db.from("appointments").select("start_time").eq("appointment_date",selectedDate).neq("status","cancelled");if(!q.error)(q.data||[]).forEach(x=>busyTimes.add(String(x.start_time).slice(0,5)));let b=await db.from("blocked_slots").select("start_time,all_day").eq("blocked_date",selectedDate);if(!b.error)(b.data||[]).forEach(x=>{if(x.all_day)TIMES.forEach(t=>busyTimes.add(t));else busyTimes.add(String(x.start_time).slice(0,5))});renderTimes()}
function renderTimes(){document.getElementById("bookingTimes").innerHTML=TIMES.map(t=>`<button ${busyTimes.has(t)?"disabled":""} class="time-btn ${busyTimes.has(t)?"busy":""} ${selectedTime===t?"selected":""}" onclick="chooseTime('${t}')">${t}</button>`).join("")}
function chooseTime(t){selectedTime=t;renderTimes();updateSummary()}

async function register(){
 const name=regName.value.trim(),surname=regSurname.value.trim(),phone=phoneDigits(regPhone.value),pin=regPin.value.trim(),pin2=regPin2.value.trim(),err=document.getElementById("registerError");err.textContent="";
 if(!name||!surname||!phone||!pin||!pin2){err.textContent="Compila tutti i campi.";return}
 if(phone.length<8){err.textContent="Inserisci un numero di telefono valido.";return}
 if(!/^\d{4,12}$/.test(pin)){err.textContent="Il PIN deve contenere da 4 a 12 cifre.";return}
 if(pin!==pin2){err.textContent="I due PIN non coincidono.";return}
 try{
  const {data,error}=await db.auth.signUp({email:authEmail(phone),password:pin,options:{data:{first_name:name,last_name:surname,phone:phone}}});
  if(error)throw error;
  if(!data.user)throw new Error("Registrazione non completata.");
  const uid=data.user.id;
  const {error:pe}=await db.from("profiles").upsert({id:uid,customer_name:name,customer_surname:surname,customer_phone:phone,role:"customer"},{onConflict:"id"});
  if(pe && !String(pe.message).includes("row-level security")) console.warn(pe);
  user=data.user;await loadProfile();closeModal("registerModal");closeModal("authModal");updateUI();toast("Account creato con successo!");
 }catch(e){console.error(e);err.textContent=translateError(e.message)}
}
async function login(){
 const phone=phoneDigits(loginPhone.value),pin=loginPin.value.trim(),err=document.getElementById("loginError");err.textContent="";
 if(!phone||!pin){err.textContent="Inserisci numero di telefono e PIN.";return}
 const {data,error}=await db.auth.signInWithPassword({email:authEmail(phone),password:pin});
 if(error){err.textContent="Numero di telefono o PIN non corretti.";return}
 user=data.user;await loadProfile();closeModal("authModal");updateUI();toast("Bentornato!");showPage("homePage");
}
function translateError(m){if(String(m).toLowerCase().includes("already registered"))return"Questo numero è già registrato.";if(String(m).toLowerCase().includes("email not confirmed"))return"Account creato: in Supabase devi disattivare la conferma email per questa app.";return m||"Si è verificato un errore durante la registrazione."}
async function loadProfile(){if(!user)return;let {data,error}=await db.from("profiles").select("*").eq("id",user.id).maybeSingle();if(!data){const md=user.user_metadata||{};await db.from("profiles").upsert({id:user.id,customer_name:md.first_name||"",customer_surname:md.last_name||"",customer_phone:md.phone||phoneDigits(user.email||""),role:"customer"},{onConflict:"id"});let r=await db.from("profiles").select("*").eq("id",user.id).maybeSingle();data=r.data}if(data && phoneDigits(data.customer_phone||"").endsWith("3791415355") && data.role!=="admin"){
   await db.from("profiles").update({role:"admin"}).eq("id",user.id);
   data.role="admin";
 }
 profile=data||{customer_name:"Cliente",role:"customer"}}
function isAdmin(){
 const adminPhone="3791415355";
 const p=phoneDigits(profile?.customer_phone||"");
 return profile?.role==="admin" || p===adminPhone || p.endsWith(adminPhone);
}
function updateUI(){
 const p=document.getElementById("profileContent");if(p)p.innerHTML=user?`<div class="profile-name">${escapeHtml(profile?.customer_name||"Cliente")} ${escapeHtml(profile?.customer_surname||"")}</div><div class="profile-phone">${escapeHtml(profile?.customer_phone||"")}</div>`:`<div class="profile-name">Ospite</div><div class="profile-phone">Accedi per gestire il tuo profilo</div>`;
 document.getElementById("adminEntry").classList.toggle("hidden",!isAdmin());

 const third=document.getElementById("thirdNav");
 const thirdLabel=document.getElementById("thirdLabel");
 if(third && thirdLabel){
   if(isAdmin()){
     third.dataset.nav="agendaPage";
     third.setAttribute("onclick","showPage('agendaPage')");
     thirdLabel.textContent="Agenda";
   }else{
     third.dataset.nav="appointmentsPage";
     third.setAttribute("onclick","showPage('appointmentsPage')");
     thirdLabel.textContent="Prenotazioni";
   }
 }
}
async function createBooking(){
 if(!user){document.getElementById("authModal").classList.remove("hidden");return}
 if(!selectedService||!selectedDate||!selectedTime){toast("Completa servizio, data e orario.");return}
 if(busyTimes.has(selectedTime)){toast("Questo orario non è più disponibile.");return}
 const payload={customer_id:user.id,customer_name:(profile?.customer_name||"")+" "+(profile?.customer_surname||""),customer_phone:profile?.customer_phone||"",service_id:selectedService.id,service_name:selectedService.name,price:selectedService.price,appointment_date:selectedDate,start_time:selectedTime,end_time:add30(selectedTime),status:"confirmed"};
 const {error}=await db.from("appointments").insert(payload);
 if(error){console.error(error);toast("Errore prenotazione: "+error.message);return}
 toast("Prenotazione confermata!");selectedService=null;selectedTime=null;renderServices();updateSummary();await loadBusyTimes();showPage("appointmentsPage")
}
function add30(t){let [h,m]=t.split(":").map(Number);m+=30;if(m>=60){h++;m-=60}return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")}
async function loadAppointments(){const box=document.getElementById("myAppointments");if(!user){box.innerHTML="";return}box.innerHTML='<div class="appointment-card">Caricamento...</div>';const {data,error}=await db.from("appointments").select("*").eq("customer_id",user.id).order("appointment_date",{ascending:true});if(error){
 console.error("Errore Supabase appointments:",error);
 box.innerHTML='<div class="appointment-card"><b>Errore caricamento</b><br><small>'+escapeHtml(error.message||"Controlla database.sql su Supabase.")+'</small></div>';
 return
}box.innerHTML=(data||[]).length?(data||[]).map(a=>`<div class="appointment-card"><div class="row"><b>${escapeHtml(a.service_name)}</b><b style="color:#e5c676">€${a.price}</b></div><small>${fmtDate(a.appointment_date)} · ${String(a.start_time).slice(0,5)}</small>${a.status!=="cancelled"?`<button class="cancel-btn" onclick="cancelBooking('${a.id}')">Annulla appuntamento</button>`:"<small>Annullato</small>"}</div>`).join(""):'<div class="appointment-card">Non hai ancora appuntamenti.</div>'}
async function cancelBooking(id){if(!confirm("Vuoi annullare questo appuntamento?"))return;const {error}=await db.from("appointments").update({status:"cancelled"}).eq("id",id);if(error){toast("Errore durante l'annullamento.");return}toast("Appuntamento annullato.");loadAppointments()}

function showPage(id){if(id==="agendaPage"&&!isAdmin()){toast("Area riservata all'amministratore.");return}document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));document.getElementById(id).classList.add("active");document.querySelectorAll(".bottom-nav button").forEach(x=>x.classList.toggle("nav-active",x.dataset.nav===id));window.scrollTo({top:0,behavior:"smooth"});if(id==="appointmentsPage")loadAppointments();if(id==="agendaPage")loadAgenda()}
async function logout(){await db.auth.signOut();user=null;profile=null;document.getElementById("authModal").classList.remove("hidden");updateUI();showPage("homePage")}
function openRegister(){document.getElementById("authModal").classList.add("hidden");document.getElementById("registerModal").classList.remove("hidden")}
function closeModal(id){document.getElementById(id).classList.add("hidden")}
function requestNotifications(){document.getElementById("notificationModal").classList.remove("hidden")}
async function enableNotifications(){if("Notification"in window){let p=await Notification.requestPermission();toast(p==="granted"?"Notifiche attivate!":"Notifiche non autorizzate.")}closeModal("notificationModal")}
function showInstall(){document.getElementById("installModal").classList.remove("hidden")}

function fillAdminSelects(){adminService.innerHTML=SERVICES.map(s=>`<option value="${s.id}">${s.name} · €${s.price}</option>`).join("");adminTime.innerHTML=TIMES.map(t=>`<option>${t}</option>`).join("");blockTime.innerHTML='<option value="ALL">Intera giornata</option>'+TIMES.map(t=>`<option>${t}</option>`).join("")}
function openAddClient(){if(!isAdmin())return;adminDate.value=agendaDate;document.getElementById("addModal").classList.remove("hidden")}
function openBlock(){if(!isAdmin())return;blockDate.value=agendaDate;document.getElementById("blockModal").classList.remove("hidden")}
async function adminAddBooking(){const s=SERVICES.find(x=>x.id===adminService.value);if(!adminName.value.trim()||!adminDate.value||!s){toast("Compila tutti i campi.");return}const payload={customer_id:null,customer_name:adminName.value.trim(),customer_phone:adminPhone.value.trim(),service_id:s.id,service_name:s.name,price:s.price,appointment_date:adminDate.value,start_time:adminTime.value,end_time:add30(adminTime.value),status:"confirmed"};const {error}=await db.from("appointments").insert(payload);if(error){toast(error.message);return}closeModal("addModal");toast("Appuntamento aggiunto.");loadAgenda()}
async function saveBlock(){const all=blockTime.value==="ALL";const payload={blocked_date:blockDate.value,start_time:all?null:blockTime.value,all_day:all,created_by:user.id};const {error}=await db.from("blocked_slots").insert(payload);if(error){toast(error.message);return}closeModal("blockModal");toast("Disponibilità bloccata.");loadAgenda()}
function renderAgendaCalendar(){renderCalendar("agendaCalendar",agendaMonth,"agendaMonthTitle",agendaDate,"chooseAgendaDate")}
function changeAgendaMonth(n){agendaMonth=new Date(agendaMonth.getFullYear(),agendaMonth.getMonth()+n,1);renderAgendaCalendar()}
async function chooseAgendaDate(ds){agendaDate=ds;renderAgendaCalendar();await loadAgendaSlots()}
async function loadAgenda(){renderAgendaCalendar();await loadAgendaSlots()}
async function loadAgendaSlots(){document.getElementById("agendaSelectedDate").textContent=fmtDate(agendaDate);const {data,error}=await db.from("appointments").select("*").eq("appointment_date",agendaDate).neq("status","cancelled").order("start_time");const list=data||[];agendaCount.textContent=list.length;agendaRevenue.textContent="€"+list.reduce((n,a)=>n+Number(a.price||0),0);const box=document.getElementById("agendaSlots");
 const map=new Map(list.map(a=>[String(a.start_time).slice(0,5),a]));
 box.innerHTML=TIMES.map(t=>{
   const a=map.get(t);
   if(a)return `<div class="appointment-card agenda-slot booked"><div class="row"><b>${t} · ${escapeHtml(a.customer_name||"Cliente")}</b><b style="color:#e5c676">€${a.price}</b></div><small>${escapeHtml(a.service_name||"")}${a.customer_phone?" · "+escapeHtml(a.customer_phone):""}</small></div>`;
   return `<div class="appointment-card agenda-slot free"><div class="row"><b>${t}</b><small>Libero</small></div></div>`;
 }).join("")}

window.showPage=showPage;window.selectService=selectService;window.changeBookingMonth=changeBookingMonth;window.chooseDate=chooseDate;window.chooseTime=chooseTime;window.createBooking=createBooking;window.login=login;window.register=register;window.openRegister=openRegister;window.closeModal=closeModal;window.logout=logout;window.requestNotifications=requestNotifications;window.enableNotifications=enableNotifications;window.showInstall=showInstall;window.changeAgendaMonth=changeAgendaMonth;window.chooseAgendaDate=chooseAgendaDate;window.openAddClient=openAddClient;window.openBlock=openBlock;window.adminAddBooking=adminAddBooking;window.saveBlock=saveBlock;