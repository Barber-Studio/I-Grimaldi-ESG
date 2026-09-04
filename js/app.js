const SUPABASE_URL="https://wxcdmtajcasnlohqkgmk.supabase.co";
const SUPABASE_KEY="sb_publishable_bwjP-ihASijevvu7d6r5Ew_6JaWKSDP";
let supabaseClient=null;
try{if(window.supabase) supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY)}catch(e){console.error(e)}

const services=[
{id:"shampoo_taglio",name:"Shampoo + Taglio",price:20,duration:30},
{id:"barba_5",name:"Barba",price:5,duration:30},
{id:"barba_10",name:"Barba",price:10,duration:30},
{id:"colore",name:"Colore",price:20,duration:30},
{id:"colore_barba",name:"Colore Barba",price:10,duration:30},
{id:"fiala",name:"Fiala",price:5,duration:30}
];
const TIMES=["09:00","09:30","10:00","10:30","11:00","11:30","12:00","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00"];
let currentUser=null,selectedService=null,selectedDate=null,selectedTime=null,toastTimer=null,bookingViewDate=new Date();

document.addEventListener("DOMContentLoaded",async()=>{
 renderServices();setupDate();setupEvents();await restoreSession();setTimeout(()=>{const l=document.getElementById("loadingScreen");if(l){l.style.opacity="0";setTimeout(()=>l.remove(),350)}},1200);
});

function setupEvents(){
 const confirm=document.getElementById("confirmBooking"); if(confirm) confirm.onclick=createBooking;
 const login=document.getElementById("loginButton"); if(login) login.onclick=loginUser;
 const reg=document.getElementById("registerButton"); if(reg) reg.onclick=handleRegistration;
 const prev=document.getElementById("prevBookingMonth"),next=document.getElementById("nextBookingMonth");
 if(prev) prev.onclick=()=>{bookingViewDate.setMonth(bookingViewDate.getMonth()-1);renderBookingCalendar()};
 if(next) next.onclick=()=>{bookingViewDate.setMonth(bookingViewDate.getMonth()+1);renderBookingCalendar()};
}

function localDateString(date){
 const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,"0"),d=String(date.getDate()).padStart(2,"0");
 return `${y}-${m}-${d}`;
}

function setupDate(){
 const today=new Date(); today.setHours(0,0,0,0);
 selectedDate=localDateString(today);
 bookingViewDate=new Date(today.getFullYear(),today.getMonth(),1);
 renderBookingCalendar();
 loadAvailableTimes();
}

function renderBookingCalendar(){
 const grid=document.getElementById("bookingCalendar"),title=document.getElementById("bookingMonthTitle");
 if(!grid||!title)return;
 const year=bookingViewDate.getFullYear(),month=bookingViewDate.getMonth();
 title.textContent=new Intl.DateTimeFormat("it-IT",{month:"long",year:"numeric"}).format(bookingViewDate);
 const first=new Date(year,month,1);
 const offset=(first.getDay()+6)%7;
 const days=new Date(year,month+1,0).getDate();
 const today=localDateString(new Date());
 let html="";
 for(let i=0;i<offset;i++) html+='<span class="calendar-empty"></span>';
 for(let day=1;day<=days;day++){
   const date=new Date(year,month,day),value=localDateString(date);
   const past=value<today,selected=value===selectedDate,isToday=value===today;
   html+=`<button type="button" class="calendar-day ${past?"past":""} ${selected?"selected":""} ${isToday?"today":""}" data-date="${value}" ${past?"disabled":""}>${day}</button>`;
 }
 grid.innerHTML=html;
 grid.querySelectorAll(".calendar-day:not(.past)").forEach(btn=>btn.onclick=async()=>{
   selectedDate=btn.dataset.date; selectedTime=null; renderBookingCalendar(); await loadAvailableTimes(); updateSummary();
 });
}
async function loadAvailableTimes(){
 const box=document.getElementById("timeSlots");box.innerHTML=TIMES.map(t=>`<button class="time-slot" data-time="${t}">${t}</button>`).join("");
 let busy=[];
 if(supabaseClient&&selectedDate){
   try{
    const {data,error}=await supabaseClient.from("appointments").select("*").eq("appointment_date",selectedDate);
    if(!error&&data) busy=data.map(x=>String(x.appointment_time||x.start_time||"").slice(0,5));
   }catch(e){console.warn("Disponibilità non caricata",e)}
 }
 box.querySelectorAll(".time-slot").forEach(b=>{
   const t=b.dataset.time;
   if(busy.includes(t))b.classList.add("busy");
   b.onclick=()=>{selectedTime=t;box.querySelectorAll(".time-slot").forEach(x=>x.classList.toggle("selected",x===b));updateSummary()};
 });
}

function updateSummary(){
 document.getElementById("summaryService").textContent=selectedService?selectedService.name:"Non selezionato";
 document.getElementById("summaryDate").textContent=selectedDate?new Date(selectedDate+"T12:00:00").toLocaleDateString("it-IT",{day:"numeric",month:"short"}):"-";
 document.getElementById("summaryTime").textContent=selectedTime||"-";
 document.getElementById("summaryPrice").textContent=selectedService?`€${selectedService.price}`:"€0";
}

function showPage(id){
 document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));
 document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
 window.scrollTo({top:0,behavior:"smooth"});
 if(id==="appointmentsPage")loadUserBookings();
 if(id==="profilePage")updateUserInterface();
}

async function createBooking(){
 if(!currentUser){showToast("Accedi prima di prenotare","error");openAuth();return}
 if(!selectedService){showToast("Seleziona un servizio","error");return}
 if(!selectedDate){showToast("Seleziona una data","error");return}
 if(!selectedTime){showToast("Seleziona un orario","error");return}
 if(!supabaseClient){showToast("Supabase non disponibile","error");return}
 const data={
  client_id:currentUser.id,
  client_name:currentUser.customer_name,
  client_phone:currentUser.customer_phone,
  appointment_date:selectedDate,
  appointment_time:selectedTime,
  service:selectedService.name,
  price:selectedService.price,
  status:"confirmed"
 };
 try{
   const {error}=await supabaseClient.from("appointments").insert([data]);
   if(error)throw error;
   showToast("Prenotazione confermata!","success");
   selectedService=null;selectedTime=null;renderServices();updateSummary();await loadAvailableTimes();
   setTimeout(()=>showPage("appointmentsPage"),500);
 }catch(e){console.error(e);showToast("Errore prenotazione: controlla le colonne Supabase","error")}
}

async function loadUserBookings(){
 const box=document.getElementById("bookingsList");
 if(!currentUser){box.innerHTML='<div class="empty-state"><h3>Non hai effettuato l’accesso</h3><p>Accedi per vedere le tue prenotazioni.</p></div>';return}
 box.innerHTML='<div class="empty-state">Caricamento appuntamenti...</div>';
 try{
  const {data,error}=await supabaseClient.from("appointments").select("*").eq("client_id",currentUser.id).order("appointment_date",{ascending:true});
  if(error)throw error;
  if(!data||!data.length){box.innerHTML='<div class="empty-state"><h3>Nessuna prenotazione</h3><p>Non hai ancora appuntamenti.</p></div>';return}
  box.innerHTML=data.map(a=>`<div class="booking-item"><div class="booking-item-top"><div><h3>${escapeHtml(a.service||"Servizio")}</h3><p>${formatDate(a.appointment_date)} · ${escapeHtml(String(a.appointment_time||a.start_time||"").slice(0,5))}</p><p>€${a.price||0}</p></div><span>✓</span></div><button class="cancel-booking" onclick="cancelBooking('${a.id}')">Annulla appuntamento</button></div>`).join("");
 }catch(e){console.error(e);box.innerHTML='<div class="empty-state"><h3>Errore</h3><p>Impossibile caricare gli appuntamenti.</p></div>'}
}

async function cancelBooking(id){
 if(!confirm("Vuoi davvero annullare questa prenotazione?"))return;
 try{const {error}=await supabaseClient.from("appointments").delete().eq("id",id);if(error)throw error;showToast("Prenotazione annullata","success");loadUserBookings()}catch(e){showToast("Errore durante l'annullamento","error")}
}

function openAuth(){document.getElementById("authModal").classList.remove("hidden")}
function closeAuth(){document.getElementById("authModal").classList.add("hidden")}
function openRegister(){closeAuth();document.getElementById("registerModal").classList.remove("hidden")}
function closeRegister(){document.getElementById("registerModal").classList.add("hidden")}

async function loginUser(){
 const phone=normalizePhone(document.getElementById("phoneInput").value),pin=document.getElementById("pinInput").value.trim();
 if(!phone||!pin){showToast("Inserisci numero e PIN","error");return}
 try{
  const {data,error}=await supabaseClient.from("profiles").select("*").eq("customer_phone",phone).eq("customer_pin",pin).maybeSingle();
  if(error)throw error;if(!data){showToast("Numero o PIN non corretto","error");return}
  currentUser=data;localStorage.setItem("grimaldiUser",JSON.stringify(data));closeAuth();updateUserInterface();showToast(`Bentornato ${data.customer_name||""}`,"success");
 }catch(e){console.error(e);showToast("Errore durante il login","error")}
}

function normalizePhone(value){
 return String(value||"").replace(/[^0-9]/g,"");
}

async function handleRegistration(){
 const button=document.getElementById("registerButton");
 const name=document.getElementById("registerName").value.trim();
 const surname=document.getElementById("registerSurname").value.trim();
 const phone=normalizePhone(document.getElementById("registerPhone").value);
 const pin=document.getElementById("registerPin").value.trim();
 const pin2=document.getElementById("registerPin2").value.trim();

 if(!supabaseClient){showToast("Supabase non è collegato","error");return}
 if(!name||!surname||!phone||!pin||!pin2){showToast("Compila tutti i campi","error");return}
 if(phone.length<8){showToast("Inserisci un numero di telefono valido","error");return}
 if(!/^[0-9]+$/.test(pin)||pin.length<4){showToast("Il PIN deve avere almeno 4 cifre","error");return}
 if(pin!==pin2){showToast("I PIN non coincidono","error");return}

 button.disabled=true;
 const original=button.textContent;
 button.textContent="REGISTRAZIONE IN CORSO...";

 try{
  const fullName=`${name} ${surname}`;
  const {data,error}=await supabaseClient
   .from("profiles")
   .insert([{customer_name:fullName,customer_phone:phone,customer_pin:pin,role:"customer"}])
   .select()
   .single();

  if(error){
   if(error.code==="23505") throw new Error("Questo numero è già registrato");
   throw new Error(error.message||"Errore database");
  }

  currentUser=data;
  localStorage.setItem("grimaldiUser",JSON.stringify(data));
  closeRegister();
  updateUserInterface();
  showToast("Registrazione completata!","success");
 }catch(e){
  console.error("REGISTRAZIONE:",e);
  showToast(e.message||"Errore durante la registrazione","error");
 }finally{
  button.disabled=false;
  button.textContent=original;
 }
}

async function restoreSession(){
 try{const saved=localStorage.getItem("grimaldiUser");if(saved)currentUser=JSON.parse(saved);updateUserInterface()}catch(e){localStorage.removeItem("grimaldiUser")}
}

function logoutUser(){currentUser=null;localStorage.removeItem("grimaldiUser");updateUserInterface();showPage("homePage");showToast("Hai effettuato il logout","success")}

function updateUserInterface(){
 const loginBtn=document.getElementById("loginProfileButton"),logoutBtn=document.getElementById("logoutButton");
 const name=document.getElementById("profileName"),phone=document.getElementById("profilePhone"),initial=document.getElementById("profileInitial");
 if(currentUser){name.textContent=currentUser.customer_name||"Cliente";phone.textContent=currentUser.customer_phone||"";initial.textContent=(currentUser.customer_name||"C").charAt(0).toUpperCase();loginBtn.classList.add("hidden");logoutBtn.classList.remove("hidden")}
 else{name.textContent="Ospite";phone.textContent="Accedi per gestire il tuo profilo";initial.textContent="G";loginBtn.classList.remove("hidden");logoutBtn.classList.add("hidden")}
}

function requestNotifications(){if("Notification"in window){Notification.requestPermission().then(p=>showToast(p==="granted"?"Notifiche attivate":"Notifiche non attivate",p==="granted"?"success":"error"))}else showToast("Notifiche non supportate","error")}
function showInstall(){document.getElementById("installModal").classList.remove("hidden")}
function closeInstall(){document.getElementById("installModal").classList.add("hidden")}
function formatDate(d){if(!d)return"-";return new Date(d+"T12:00:00").toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
function showToast(message,type="default"){const t=document.getElementById("toast");t.textContent=message;t.className="";t.classList.add(type);requestAnimationFrame(()=>t.classList.add("show"));clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2800)}
function escapeHtml(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}
window.showPage=showPage;window.openAuth=openAuth;window.closeAuth=closeAuth;window.openRegister=openRegister;window.closeRegister=closeRegister;window.cancelBooking=cancelBooking;window.logoutUser=logoutUser;window.requestNotifications=requestNotifications;window.showInstall=showInstall;window.closeInstall=closeInstall;