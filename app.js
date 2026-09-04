const SUPABASE_URL="https://wxcdmtajcasnlohqkgmk.supabase.co";
const SUPABASE_KEY="sb_publishable_bwjP-ihASijevvu7d6r5Ew_6JaWKSDP";
const ADMIN_PHONE="3791415355";
const SERVICES=[
{id:"shampoo_taglio",name:"Shampoo + Taglio",price:20},
{id:"barba_5",name:"Barba",price:5},
{id:"barba_10",name:"Barba",price:10},
{id:"colore",name:"Colore",price:20},
{id:"colore_barba",name:"Colore Barba",price:10},
{id:"fiala",name:"Fiala",price:5}
];
const TIMES=["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00"];
let supabaseClient=null,currentUser=null,selectedService=null,selectedTime=null,selectedDate=null,toastTimer=null;
let adminSelectedDate=new Date(),adminMonth=new Date();

try{if(window.supabase&&window.supabase.createClient)supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);}catch(e){console.error(e);}

document.addEventListener("DOMContentLoaded",initApp);

async function initApp(){
  bindNavigation(); bindButtons(); renderServices(); setupDates(); restoreSession(); updateUserUI();
  setTimeout(()=>hideLoadingScreen(),1100);
  setTimeout(()=>{ if(!currentUser) openLoginModal(); },1500);
}
function hideLoadingScreen(){const x=document.getElementById("loadingScreen");if(!x)return;x.classList.add("loading-hidden");x.style.pointerEvents="none";setTimeout(()=>x.style.display="none",500);}
function bindNavigation(){
 document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{showPage(b.dataset.page);closeMenu();});
 const a=document.getElementById("menuBtn"),b=document.getElementById("closeMenu"),c=document.getElementById("menuOverlay");
 if(a)a.onclick=openMenu;if(b)b.onclick=closeMenu;if(c)c.onclick=closeMenu;
}
function bindButtons(){
 const q=(id,fn)=>{const e=document.getElementById(id);if(e)e.onclick=fn;};
 q("confirmBooking",createBooking);q("loginButton",loginUser);q("registerButton",registerUser);q("logoutButton",logoutUser);
 q("enableNotifications",enableNotifications);
}
function openMenu(){document.getElementById("sideMenu").classList.add("open");document.getElementById("menuOverlay").classList.add("show");}
function closeMenu(){document.getElementById("sideMenu").classList.remove("open");document.getElementById("menuOverlay").classList.remove("show");}
function showPage(id){
 document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
 const p=document.getElementById(id);if(p)p.classList.add("active");window.scrollTo({top:0,behavior:"smooth"});
 if(id==="bookingsPage")loadUserBookings();if(id==="adminPage")checkAdminPage();updateUserUI();
}
function todayString(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function normalizePhone(v){return String(v||"").replace(/\D/g,"");}
function formatDate(v){if(!v)return"-";return new Date(v+"T12:00:00").toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long",year:"numeric"});}
function escapeHtml(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}

function renderServices(){const box=document.getElementById("serviceList");if(!box)return;box.innerHTML="";SERVICES.forEach(s=>{const b=document.createElement("button");b.className="service-item";b.innerHTML=`<span>${s.name}</span><b>€ ${s.price}</b>`;b.onclick=()=>{selectedService=s;document.querySelectorAll(".service-item").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");updateSummary();};box.appendChild(b);});}
function setupDates(){const d=document.getElementById("bookingDate");if(!d)return;d.min=todayString();d.value=todayString();selectedDate=d.value;d.onchange=()=>{selectedDate=d.value;selectedTime=null;loadAvailableTimes();updateSummary();};loadAvailableTimes();}
async function loadAvailableTimes(){
 const box=document.getElementById("timeSlots");if(!box)return;let busy=[];
 if(supabaseClient&&selectedDate){const {data}=await supabaseClient.from("bookings").select("booking_time,status").eq("booking_date",selectedDate).neq("status","cancelled");busy=(data||[]).map(x=>x.booking_time);}
 const blocked=getBlocks(selectedDate);box.innerHTML="";
 TIMES.forEach(t=>{const b=document.createElement("button");b.className="time-slot";b.textContent=t;if(busy.includes(t)||blocked==="ALL"||blocked.includes(t)){b.classList.add("busy");b.disabled=true;}if(selectedTime===t)b.classList.add("selected");b.onclick=()=>{selectedTime=t;document.querySelectorAll(".time-slot").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");updateSummary();};box.appendChild(b);});
}
function updateSummary(){const a=document.getElementById("summaryService"),b=document.getElementById("summaryDate"),c=document.getElementById("summaryTime"),d=document.getElementById("summaryPrice");if(a)a.textContent=selectedService?selectedService.name:"Non selezionato";if(b)b.textContent=selectedDate?formatDate(selectedDate):"-";if(c)c.textContent=selectedTime||"-";if(d)d.textContent=selectedService?`€ ${selectedService.price}`:"€ 0";}
async function createBooking(){
 if(!currentUser){showToast("Accedi prima di prenotare","error");return openLoginModal();}
 if(!selectedService||!selectedDate||!selectedTime)return showToast("Completa tutti i dati","error");
 if(!supabaseClient)return showToast("Connessione al database non disponibile","error");
 const {error}=await supabaseClient.from("bookings").insert([{user_id:currentUser.id,service_id:selectedService.id,service_name:selectedService.name,price:selectedService.price,booking_date:selectedDate,booking_time:selectedTime,status:"confirmed"}]);
 if(error)return showToast(error.message||"Errore prenotazione","error");
 showToast("Prenotazione confermata!","success");selectedService=null;selectedTime=null;renderServices();updateSummary();loadAvailableTimes();setTimeout(()=>showPage("bookingsPage"),500);
}
async function loadUserBookings(){
 const box=document.getElementById("bookingsList");if(!box)return;if(!currentUser){box.innerHTML='<div class="card">Accedi per vedere le tue prenotazioni.</div>';return;}if(!supabaseClient)return;
 box.innerHTML='<div class="card">Caricamento...</div>';const {data,error}=await supabaseClient.from("bookings").select("*").eq("user_id",currentUser.id).order("booking_date",{ascending:true}).order("booking_time",{ascending:true});
 if(error){box.innerHTML='<div class="card">Impossibile caricare le prenotazioni.</div>';console.error(error);return;}
 if(!data?.length){box.innerHTML='<div class="card">Non hai ancora prenotazioni.</div>';return;}
 box.innerHTML="";data.forEach(x=>{const c=document.createElement("div");c.className="booking-card";c.innerHTML=`<div><strong>${escapeHtml(x.service_name)}</strong><div>${formatDate(x.booking_date)} · ${escapeHtml(x.booking_time)}</div><div>€ ${x.price}</div></div><button class="cancel-booking">Annulla</button>`;c.querySelector("button").onclick=()=>cancelBooking(x.id);box.appendChild(c);});
}
async function cancelBooking(id){if(!confirm("Vuoi annullare questa prenotazione?"))return;const {error}=await supabaseClient.from("bookings").delete().eq("id",id);if(error)return showToast(error.message,"error");showToast("Prenotazione annullata","success");loadUserBookings();}

async function loginUser(){
 if(!supabaseClient)return showToast("Connessione al database non disponibile","error");
 const phone=normalizePhone(document.getElementById("phoneInput")?.value),pin=document.getElementById("pinInput")?.value.trim();
 if(!phone||!pin)return showToast("Inserisci numero e PIN","error");
 const {data,error}=await supabaseClient.from("users").select("*").eq("phone",phone).eq("pin",pin).maybeSingle();
 if(error)return showToast(error.message,"error");if(!data)return showToast("Numero o PIN non corretti","error");
 currentUser=data;localStorage.setItem("grimaldiUser",JSON.stringify(data));updateUserUI();closeAuthModals();showToast(`Bentornato ${data.name||""}`,"success");showPage("homePage");
}
async function registerUser(){
 if(!supabaseClient)return showToast("Connessione al database non disponibile","error");
 const name=document.getElementById("registerName")?.value.trim(),phone=normalizePhone(document.getElementById("registerPhone")?.value),pin=document.getElementById("registerPin")?.value.trim();
 if(!name||!phone||!pin)return showToast("Compila tutti i campi","error");if(pin.length<4)return showToast("Il PIN deve avere almeno 4 caratteri","error");
 const existing=await supabaseClient.from("users").select("id").eq("phone",phone).maybeSingle();if(existing.data)return showToast("Questo numero è già registrato","error");
 const {data,error}=await supabaseClient.from("users").insert([{name,phone,pin}]).select().single();
 if(error){console.error(error);return showToast(error.message||"Errore registrazione","error");}
 currentUser=data;localStorage.setItem("grimaldiUser",JSON.stringify(data));updateUserUI();closeAuthModals();showToast("Registrazione completata!","success");showPage("homePage");
}
function restoreSession(){try{currentUser=JSON.parse(localStorage.getItem("grimaldiUser")||"null");}catch(e){currentUser=null;}}
function logoutUser(){currentUser=null;localStorage.removeItem("grimaldiUser");updateUserUI();showPage("homePage");showToast("Logout effettuato","success");}
function isAdmin(){return currentUser&&normalizePhone(currentUser.phone)===ADMIN_PHONE;}
function updateUserUI(){
 const name=currentUser?.name||"Ospite",phone=currentUser?.phone||"Accedi per gestire il tuo profilo.";
 const m=document.getElementById("menuUser");if(m)m.textContent=`Benvenuto, ${name}`;
 const hw=document.getElementById("homeWelcome");if(hw)hw.textContent=currentUser?`Ciao ${name}, pronto per il tuo appuntamento?`:"Il tuo appuntamento, il tuo momento.";
 const pn=document.getElementById("profileName"),pp=document.getElementById("profilePhone");if(pn)pn.textContent=name;if(pp)pp.textContent=phone;
 ["menuLoginBtn","menuRegisterBtn"].forEach(id=>document.getElementById(id)?.classList.toggle("hidden",!!currentUser));document.getElementById("logoutButton")?.classList.toggle("hidden",!currentUser);
 const third=document.getElementById("thirdNavBtn"),label=document.getElementById("thirdNavLabel");if(third&&label){third.dataset.page=isAdmin()?"adminPage":"bookingsPage";label.textContent=isAdmin()?"Agenda":"Prenotazioni";}
 document.getElementById("adminMenuButton")?.classList.toggle("hidden",!isAdmin());
}
async function checkAdminPage(){const d=document.getElementById("adminDenied"),c=document.getElementById("adminContent");if(!isAdmin()){d.classList.remove("hidden");c.classList.add("hidden");return;}d.classList.add("hidden");c.classList.remove("hidden");renderAdminCalendar();await loadAdminAgenda();}
function monthName(d){return d.toLocaleDateString("it-IT",{month:"long",year:"numeric"}).replace(/^./,x=>x.toUpperCase());}
function renderAdminCalendar(){
 const title=document.getElementById("adminMonthTitle"),grid=document.getElementById("adminCalendarGrid");if(!title||!grid)return;title.textContent=monthName(adminMonth);grid.innerHTML="";
 const y=adminMonth.getFullYear(),m=adminMonth.getMonth(),first=new Date(y,m,1),offset=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate();
 for(let i=0;i<offset;i++)grid.appendChild(document.createElement("span"));
 for(let d=1;d<=days;d++){const b=document.createElement("button"),dt=new Date(y,m,d),iso=todayString(dt);b.textContent=d;if(iso===todayString(adminSelectedDate))b.classList.add("selected-day");if(iso===todayString())b.classList.add("today");b.onclick=()=>{adminSelectedDate=dt;renderAdminCalendar();loadAdminAgenda();};grid.appendChild(b);}
}
function changeAdminMonth(delta){adminMonth=new Date(adminMonth.getFullYear(),adminMonth.getMonth()+delta,1);renderAdminCalendar();}
async function loadAdminAgenda(){
 if(!isAdmin()||!supabaseClient)return;const date=todayString(adminSelectedDate),box=document.getElementById("adminAgenda");document.getElementById("adminSelectedDateTitle").textContent=formatDate(date);
 let data=[];const r=await supabaseClient.from("bookings").select("*").eq("booking_date",date).order("booking_time",{ascending:true});if(r.error){console.error(r.error);showToast("Errore caricamento agenda","error");return;}data=r.data||[];
 document.getElementById("agendaCount").textContent=data.length;document.getElementById("agendaRevenue").textContent=`€ ${data.reduce((s,x)=>s+Number(x.price||0),0)}`;
 const map=Object.fromEntries(data.map(x=>[x.booking_time,x])),blocked=getBlocks(date);box.innerHTML="";
 TIMES.forEach(t=>{const b=map[t],row=document.createElement("div");row.className="agenda-row";if(b){row.classList.add("occupied");row.innerHTML=`<b>${t}</b><div><strong>${escapeHtml(b.service_name||"Servizio")}</strong><small>€ ${b.price||0} · Cliente ${escapeHtml(String(b.user_id||""))}</small></div><span>✓</span>`;}else if(blocked==="ALL"||blocked.includes(t)){row.classList.add("blocked");row.innerHTML=`<b>${t}</b><div><strong>Bloccato</strong><small>Non disponibile</small></div><span>—</span>`;}else row.innerHTML=`<b>${t}</b><div><strong>Libero</strong><small>Disponibile</small></div><span>+</span>`;box.appendChild(row);});
}
function openAdminAdd(){if(!isAdmin())return;const m=document.getElementById("adminAddModal"),s=document.getElementById("adminServiceSelect"),t=document.getElementById("adminAddTime");s.innerHTML=SERVICES.map(x=>`<option value="${x.id}">${x.name} - € ${x.price}</option>`).join("");t.innerHTML=TIMES.map(x=>`<option value="${x}">${x}</option>`).join("");document.getElementById("adminAddDate").value=todayString(adminSelectedDate);m.classList.remove("hidden");}
async function adminAddBooking(){const sid=document.getElementById("adminServiceSelect").value,service=SERVICES.find(x=>x.id===sid),date=document.getElementById("adminAddDate").value,time=document.getElementById("adminAddTime").value;if(!service||!date||!time)return showToast("Compila tutti i dati","error");const exists=await supabaseClient.from("bookings").select("id").eq("booking_date",date).eq("booking_time",time).maybeSingle();if(exists.data)return showToast("Orario già occupato","error");const {error}=await supabaseClient.from("bookings").insert([{user_id:currentUser.id,service_id:service.id,service_name:service.name,price:service.price,booking_date:date,booking_time:time,status:"confirmed"}]);if(error)return showToast(error.message||"Errore salvataggio","error");closeAdminModal("adminAddModal");showToast("Appuntamento aggiunto","success");adminSelectedDate=new Date(date+"T12:00:00");adminMonth=new Date(adminSelectedDate);renderAdminCalendar();loadAdminAgenda();}
function openAdminBlock(){if(!isAdmin())return;document.getElementById("adminBlockDate").value=todayString(adminSelectedDate);const s=document.getElementById("adminBlockTime");s.innerHTML='<option value="ALL">Intera giornata</option>'+TIMES.map(x=>`<option value="${x}">${x}</option>`).join("");document.getElementById("adminBlockModal").classList.remove("hidden");}
function getBlocks(date){try{return JSON.parse(localStorage.getItem("grimaldiBlocks")||"{}")[date]||[];}catch(e){return[];}}
function saveAdminBlock(){const date=document.getElementById("adminBlockDate").value,time=document.getElementById("adminBlockTime").value;let all={};try{all=JSON.parse(localStorage.getItem("grimaldiBlocks")||"{}");}catch(e){}all[date]=time==="ALL"?"ALL":[...(Array.isArray(all[date])?all[date]:[]),time];localStorage.setItem("grimaldiBlocks",JSON.stringify(all));closeAdminModal("adminBlockModal");showToast("Disponibilità bloccata","success");adminSelectedDate=new Date(date+"T12:00:00");renderAdminCalendar();loadAdminAgenda();loadAvailableTimes();}
function closeAdminModal(id){document.getElementById(id)?.classList.add("hidden");}
async function enableNotifications(){if(!("Notification"in window))return showToast("Notifiche non supportate","error");const p=await Notification.requestPermission();showToast(p==="granted"?"Notifiche attivate!":"Permesso non concesso",p==="granted"?"success":"error");}
function showToast(msg,type="default"){const t=document.getElementById("toast");if(!t)return;t.textContent=msg;t.className=`toast ${type}`;requestAnimationFrame(()=>t.classList.add("show"));clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2800);}

window.openLoginModal=()=>document.getElementById("loginModal")?.classList.remove("hidden");
window.openRegisterModal=()=>document.getElementById("registerModal")?.classList.remove("hidden");
window.closeAuthModals=()=>["loginModal","registerModal"].forEach(id=>document.getElementById(id)?.classList.add("hidden"));
window.switchToRegister=()=>{closeAuthModals();openRegisterModal();};
window.switchToLogin=()=>{closeAuthModals();openLoginModal();};
window.modalLogin=async()=>{document.getElementById("phoneInput").value=document.getElementById("modalPhone").value;document.getElementById("pinInput").value=document.getElementById("modalPin").value;await loginUser();};
window.modalRegister=async()=>{document.getElementById("registerName").value=document.getElementById("modalRegName").value;document.getElementById("registerPhone").value=document.getElementById("modalRegPhone").value;document.getElementById("registerPin").value=document.getElementById("modalRegPin").value;await registerUser();};
window.showPage=showPage;window.logoutUser=logoutUser;window.changeAdminMonth=changeAdminMonth;window.openAdminAdd=openAdminAdd;window.openAdminBlock=openAdminBlock;window.closeAdminModal=closeAdminModal;window.adminAddBooking=adminAddBooking;window.saveAdminBlock=saveAdminBlock;
