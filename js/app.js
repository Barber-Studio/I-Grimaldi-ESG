const services=[['Shampoo Taglio',20],['Barba',5],['Barba Premium',10],['Colore',20],['Colore Barba',10],['Fiala',5]];
const times=['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00'];
let currentUser=null, selectedDate=new Date().toISOString().slice(0,10), calendarDate=new Date();
let bookingDate=new Date().toISOString().slice(0,10), bookingTime='', bookingCalendarDate=new Date();
const $=id=>document.getElementById(id);
const get=(k,d)=>JSON.parse(localStorage.getItem(k)||JSON.stringify(d));
const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function users(){return get('grimaldi_users',[{name:'Amministratore',surname:'I Grimaldi',phone:'ADMIN',pin:'1234',admin:true}])}
function bookings(){return get('grimaldi_bookings',[])} function blocks(){return get('grimaldi_blocks',[])}
function money(v){return '€'+Number(v||0).toFixed(0)}
function serviceOptions(){return services.map(s=>`<option value="${s[0]}">${s[0]} - €${s[1]}</option>`).join('')}
function showPage(id){if(id==='agendaPage'&&!currentUser?.admin)id='appointmentsPage';document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));$(id).classList.add('active');if(id==='bookingPage')renderBookingPicker();if(id==='agendaPage')renderAgenda();if(id==='appointmentsPage')renderMyAppointments();if(id==='profilePage')renderProfile()}
function thirdNav(){showPage(currentUser?.admin?'agendaPage':'appointmentsPage')}
function init(){ $('services').innerHTML=services.map((s,i)=>`<div class="card ${i===0?'selected':''}" data-service="${s[0]}"><b>${s[0]}</b><div class="muted">${money(s[1])}</div></div>`).join(''); $('adminTime').innerHTML=times.map(t=>`<option>${t}</option>`).join(''); $('blockTime').innerHTML+times.map(t=>`<option>${t}</option>`).join(''); $('adminService').innerHTML=serviceOptions(); $('adminDate').value=selectedDate; $('blockDate').value=selectedDate; renderBookingPicker(); }
setTimeout(()=>{$('splash').classList.add('hidden');if(currentUser){showApp()}else{$('authModal').classList.remove('hidden')}},2200);
$('loginPin').addEventListener('input',()=>{if($('loginPhone').value.trim()&&$('loginPin').value.length>=4)login()});
function login(){async function login(){
  const phone = $("loginPhone").value.trim();
  const pin = $("loginPin").value.trim();

  if(!phone || !pin){
    $("loginError").textContent = "Inserisci numero e PIN";
    return;
  }

  const { data, error } = await supabaseClient
    .from("customers")
    .select("*")
    .eq("phone", phone)
    .eq("pin", pin)
    .maybeSingle();

  if(error){
    console.error(error);
    $("loginError").textContent = "Errore di connessione";
    return;
  }

  if(!data){
    $("loginError").textContent = "Numero o PIN non corretto";
    return;
  }

  currentUser = {
    id: data.id,
    name: data.name,
    surname: data.surname,
    phone: data.phone,
    admin: data.is_admin === true
  };

  sessionStorage.setItem(
    "grimaldi_user",
    JSON.stringify(currentUser)
  );

  $("authModal").classList.add("hidden");
  showApp();
}
function openRegister(){$('authModal').classList.add('hidden');$('registerModal').classList.remove('hidden')}
function closeRegister(){$('registerModal').classList.add('hidden');$('authModal').classList.remove('hidden')}
function register(){async function register(){
  const name = $("regName").value.trim();
  const surname = $("regSurname").value.trim();
  const phone = $("regPhone").value.trim();
  const pin = $("regPin").value.trim();

  if(!name || !surname || !phone || !pin){
    alert("Compila tutti i campi");
    return;
  }

  if(pin.length < 4){
    alert("Il PIN deve avere almeno 4 cifre");
    return;
  }

  const { data: existingUser, error: checkError } = await supabaseClient
    .from("customers")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if(checkError){
    console.error(checkError);
    alert("Errore di connessione");
    return;
  }

  if(existingUser){
    alert("Questo numero è già registrato. Accedi.");
    closeRegister();
    return;
  }

  const { data, error } = await supabaseClient
    .from("customers")
    .insert({
      name: name,
      surname: surname,
      phone: phone,
      pin: pin,
      is_admin: false
    })
    .select()
    .single();

  if(error){
    console.error(error);
    alert("Errore durante la registrazione: " + error.message);
    return;
  }

  currentUser = {
    id: data.id,
    name: data.name,
    surname: data.surname,
    phone: data.phone,
    admin: data.is_admin === true
  };

  sessionStorage.setItem(
    "grimaldi_user",
    JSON.stringify(currentUser)
  );

  closeRegister();
  showApp();

  alert("Registrazione completata!");
}
 async function createBooking(){
  if(!currentUser) return;

  let service = $("services").querySelector(".selected")?.dataset.service || services[0][0];

  if(!bookingDate){
    alert("Seleziona una data");
    return;
  }

  if(!bookingTime){
    alert("Seleziona un orario");
    return;
  }

  let blocked = blocks().some(x =>
    x.date === bookingDate &&
    (x.time === bookingTime || x.time === "ALL")
  );

  let occupied = bookings().some(x =>
    x.date === bookingDate &&
    x.time === bookingTime
  );

  if(blocked || occupied){
    alert("Questo orario non è più disponibile");
    renderBookingPicker();
    return;
  }

  const serviceData = services.find(x => x[0] === service);
  const price = serviceData ? serviceData[1] : 0;

  const { data, error } = await supabaseClient
    .from("bookings")
    .insert({
      customer_name: currentUser.name,
      customer_surname: currentUser.surname || "",
      customer_phone: currentUser.phone,
      service: service,
      booking_date: bookingDate,
      booking_time: bookingTime,
      price: price,
      status: "confirmed"
    })
    .select()
    .single();

  if(error){
    console.error(error);
    alert("Errore nel salvataggio della prenotazione: " + error.message);
    return;
  }

  let b = bookings();

  b.push({
    id: data.id,
    user: currentUser.phone,
    name: currentUser.name + " " + (currentUser.surname || ""),
    phone: currentUser.phone,
    service: service,
    date: bookingDate,
    time: bookingTime,
    price: price,
    status: "confirmed"
  });

  set("bookings", b);

  alert("Prenotazione effettuata con successo!");

  bookingTime = "";
  renderBookingPicker();

  showPage(currentUser.admin ? "agendaPage" : "appointmentsPage");
}
}
function changeBookingMonth(n){bookingCalendarDate.setMonth(bookingCalendarDate.getMonth()+n);renderBookingPicker()}
function renderBookingPicker(){
 const title=$('bookingMonthTitle'), grid=$('bookingCalendar'), label=$('selectedBookingDateLabel'), timesBox=$('bookingTimesElegant');
 if(!title||!grid||!label||!timesBox)return;
 const today=new Date();today.setHours(0,0,0,0); const y=bookingCalendarDate.getFullYear(),m=bookingCalendarDate.getMonth();
 title.textContent=bookingCalendarDate.toLocaleDateString('it-IT',{month:'long',year:'numeric'});
 const first=new Date(y,m,1), off=(first.getDay()+6)%7, last=new Date(y,m+1,0).getDate(); let html='';
 for(let i=0;i<42;i++){let n=i-off+1,d=new Date(y,m,n),iso=d.toISOString().slice(0,10),inMonth=n>=1&&n<=last,isPast=d<today,isClosed=d.getDay()===1,selected=iso===bookingDate,todayClass=iso===today.toISOString().slice(0,10);html+=`<button class="${!inMonth?'other ':''}${selected?'selected ':''}${todayClass?'today ':''}${(isPast||isClosed)?'disabled':''}" ${isPast||isClosed?'disabled':''} onclick="selectBookingDate('${iso}')">${d.getDate()}</button>`}
 grid.innerHTML=html;
 label.textContent=new Date(bookingDate+'T12:00').toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'});
 const busy=bookings().filter(x=>x.date===bookingDate).map(x=>x.time), bl=blocks().filter(x=>x.date===bookingDate); const allDay=bl.some(x=>x.time==='ALL');
 timesBox.innerHTML=allDay?'<div class="time-placeholder">Questa giornata non è disponibile.</div>':times.map(t=>{let unavailable=busy.includes(t)||bl.some(x=>x.time===t);return `<button class="${unavailable?'blocked':'available'} ${bookingTime===t?'selected':''}" ${unavailable?'disabled':''} onclick="selectBookingTime('${t}')">${t}</button>`}).join('');
}
function selectBookingDate(d){bookingDate=d;bookingTime='';bookingCalendarDate=new Date(d+'T12:00');renderBookingPicker()}
function selectBookingTime(t){bookingTime=t;renderBookingPicker()}
$('services').addEventListener('click',e=>{let c=e.target.closest('.card');if(!c)return;document.querySelectorAll('#services .card').forEach(x=>x.classList.remove('selected'));c.classList.add('selected');c.dataset.service=c.querySelector('b').textContent});
function renderMyAppointments(){let b=bookings().filter(x=>x.user===currentUser.phone);$('myAppointments').innerHTML=b.length?b.map(x=>`<div class="card"><b>${x.service}</b><p>${x.date} · ${x.time}</p><button onclick="deleteBooking(${x.id})">Cancella</button></div>`).join(''):'<div class="card muted">Nessun appuntamento.</div>'}
function deleteBooking(id){set('grimaldi_bookings',bookings().filter(x=>x.id!==id));renderMyAppointments();renderAgenda()}
function changeMonth(n){calendarDate.setMonth(calendarDate.getMonth()+n);renderAgenda()}
function renderAgenda(){if(!currentUser?.admin)return;let b=bookings(), day=b.filter(x=>x.date===selectedDate), rev=day.reduce((a,x)=>a+Number(x.price||0),0);$('agendaCount').textContent=day.length;$('agendaRevenue').textContent=money(rev);$('monthTitle').textContent=calendarDate.toLocaleDateString('it-IT',{month:'long',year:'numeric'});let y=calendarDate.getFullYear(),m=calendarDate.getMonth(),first=new Date(y,m,1),off=(first.getDay()+6)%7,last=new Date(y,m+1,0).getDate();let html='';for(let i=0;i<42;i++){let n=i-off+1,d=new Date(y,m,n),iso=d.toISOString().slice(0,10),has=b.some(x=>x.date===iso);html+=`<button class="${n<1||n>last?'other ':''}${iso===selectedDate?'selected ':''}${has?'has-booking':''}" onclick="selectDate('${iso}')">${d.getDate()}</button>`}$('calendarGrid').innerHTML=html;$('selectedDateTitle').textContent=new Date(selectedDate+'T12:00').toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'});let bl=blocks().filter(x=>x.date===selectedDate);$('agendaSlots').innerHTML=times.map(t=>{let x=day.find(a=>a.time===t),block=bl.find(a=>a.time===t||a.time==='ALL');let content=x?`<div class="slot booked" onclick="editBooking(${x.id})"><div><b>${x.name}</b><small>${x.service} · ${x.phone}</small></div><b>${money(x.price)}</b></div>`:block?`<div class="slot blocked" onclick="removeBlock('${block.id}')"><div><b>NON DISPONIBILE</b><small>Tocca per sbloccare</small></div></div>`:`<div class="slot" onclick="openAddClient('${t}')"><div><b>Libero</b><small>Tocca per aggiungere cliente</small></div><b>＋</b></div>`;return `<div class="agenda-row"><div class="agenda-time">${t}</div>${content}</div>`}).join('')}
function selectDate(d){selectedDate=d;calendarDate=new Date(d+'T12:00');renderAgenda()}
function openAddClient(t=''){$('adminDate').value=selectedDate;$('adminTime').value=t||times[0];$('addModal').classList.remove('hidden')}
function adminAddBooking(){let b=bookings(),service=$('adminService').value,price=services.find(x=>x[0]===service)[1];b.push({id:Date.now(),user:'ADMIN_MANUAL',name:$('adminName').value||'Cliente',phone:$('adminPhone').value,service,date:$('adminDate').value,time:$('adminTime').value,price});set('grimaldi_bookings',b);closeModal('addModal');selectedDate=$('adminDate').value;renderAgenda()}
function editBooking(id){let x=bookings().find(a=>a.id===id);if(confirm(`Appuntamento: ${x.name}\nOK = elimina, Annulla = mantieni`))deleteBooking(id)}
function openBlock(){$('blockDate').value=selectedDate;$('blockModal').classList.remove('hidden')}
function saveBlock(){let a=blocks();a.push({id:'b'+Date.now(),date:$('blockDate').value,time:$('blockTime').value});set('grimaldi_blocks',a);selectedDate=$('blockDate').value;closeModal('blockModal');renderAgenda()}
function removeBlock(id){if(confirm('Sbloccare questo orario?')){set('grimaldi_blocks',blocks().filter(x=>x.id!==id));renderAgenda()}}
function closeModal(id){$(id).classList.add('hidden')}
function requestNotifications(){$('notificationModal').classList.remove('hidden')}
function enableNotifications(){localStorage.setItem('grimaldi_notifications','requested');$('notificationModal').classList.add('hidden');alert('Notifiche predisposte. OneSignal verrà collegato in GitHub/Supabase.')}
function closeNotifications(){$('notificationModal').classList.add('hidden')}
function showInstall(){$('installModal').classList.remove('hidden')}
function renderProfile(){$('profileContent').innerHTML=currentUser?`<b>${currentUser.name} ${currentUser.surname}</b><p class="muted">${currentUser.phone}</p>`:''}
document.addEventListener('DOMContentLoaded',()=>{currentUser=JSON.parse(sessionStorage.getItem('grimaldi_user')||'null');init();});
// ===============================
// SUPABASE DATABASE FUNCTIONS
// ===============================

async function loadCustomersFromSupabase() {
  const { data, error } = await supabaseClient
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Errore caricamento clienti:", error);
    return [];
  }

  return data || [];
}

async function loadBookingsFromSupabase() {
  const { data, error } = await supabaseClient
    .from("bookings")
    .select("*")
    .order("booking_date", { ascending: true });

  if (error) {
    console.error("Errore caricamento prenotazioni:", error);
    return [];
  }

  return data || [];
}

async function loadBlockedDaysFromSupabase() {
  const { data, error } = await supabaseClient
    .from("blocked_days")
    .select("*")
    .order("blocked_date", { ascending: true });

  if (error) {
    console.error("Errore caricamento giorni bloccati:", error);
    return [];
  }

  return data || [];
}

async function saveCustomerToSupabase(customer) {
  const { data, error } = await supabaseClient
    .from("customers")
    .upsert(
      {
        phone: customer.phone,
        name: customer.name,
        surname: customer.surname || "",
        pin: customer.pin,
        is_admin: customer.isAdmin || false
      },
      {
        onConflict: "phone"
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Errore salvataggio cliente:", error);
    return null;
  }

  return data;
}

async function saveBookingToSupabase(booking) {
  const { data, error } = await supabaseClient
    .from("bookings")
    .insert({
      customer_name: booking.name,
      customer_surname: booking.surname || "",
      customer_phone: booking.phone,
      service: booking.service,
      booking_date: booking.date,
      booking_time: booking.time,
      price: booking.price || 0,
      status: booking.status || "confirmed"
    })
    .select()
    .single();

  if (error) {
    console.error("Errore salvataggio prenotazione:", error);
    alert("Errore nel salvataggio della prenotazione");
    return null;
  }

  return data;
}

async function deleteBookingFromSupabase(id) {
  const { error } = await supabaseClient
    .from("bookings")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Errore eliminazione prenotazione:", error);
    return false;
  }

  return true;
}
