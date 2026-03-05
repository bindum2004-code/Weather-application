/* ══════════════════════════════════════════════
   Nimbus — Forecast Page Logic
   ══════════════════════════════════════════════ */

async function loadForecast(){
  const cityEl = document.getElementById('fcCity');
  const btn    = document.getElementById('fcBtn');
  const city   = cityEl.value.trim();
  if(!city){ cityEl.focus(); return; }

  btn.textContent='⏳'; btn.disabled=true;
  try{
    const [cr,fr] = await Promise.all([
      fetch(`${API}/weather?city=${encodeURIComponent(city)}`),
      fetch(`${API}/forecast?city=${encodeURIComponent(city)}&days=5`),
    ]);
    const cur = await cr.json();
    const fct = await fr.json();
    if(cur.error){ toast('❌ '+cur.error, true); return; }

    renderCurrent(cur);
    if(!fct.error){
      renderFcast(fct);
      renderHourly(fct);
      renderTips(cur);
    }
    toast(`✅ Forecast loaded for ${cur.city}`);
  }catch(e){
    toast('❌ Cannot reach server. Is Flask running?', true);
  }finally{
    btn.textContent='Search'; btn.disabled=false;
  }
}

function qf(c){ document.getElementById('fcCity').value=c; loadForecast(); }

function renderCurrent(d){
  document.getElementById('curBand').style.display='flex';
  document.getElementById('cbIcon').textContent = wxEmoji(d.condition, d.description);
  document.getElementById('cbCity').textContent = `📍 ${d.city}, ${d.country}`;
  document.getElementById('cbTemp').textContent = `${d.temp}°C`;
  document.getElementById('cbDesc').textContent = d.description || d.condition;
}

function renderFcast(data){
  const g    = document.getElementById('fcastGrid');
  const days = data.forecast || [];
  if(!days.length) return;
  g.innerHTML = days.map((day,i) => {
    const dt  = new Date(day.date);
    const lbl = i===0 ? 'Today' : dt.toLocaleDateString('en-US',{weekday:'short'});
    const dts = dt.toLocaleDateString('en-US',{month:'short',day:'numeric'});
    return `
      <div class="fday ${i===0?'is-today':''}" style="animation-delay:${i*.09}s">
        <div class="fd-day">${lbl}</div>
        <div class="fd-date">${dts}</div>
        <span class="fd-icon">${wxEmoji('',day.description)}</span>
        <div class="fd-temps">
          <span class="fd-hi">${day.temp_max}°</span>
          <span class="fd-lo">${day.temp_min}°</span>
        </div>
        <div class="fd-desc">${day.description}</div>
      </div>`;
  }).join('');
}

function renderHourly(data){
  const blk   = document.getElementById('hourlyBlock');
  const track = document.getElementById('hourlyTrack');
  const days  = data.forecast || [];
  if(!days.length) return;
  blk.style.display = 'block';

  const hours = [];
  for(let h=0;h<24;h+=3){
    const d     = days[Math.min(h<12?0:1, days.length-1)];
    const ratio = Math.sin((h/24)*Math.PI);
    const temp  = Math.round(d.temp_min + (d.temp_max-d.temp_min)*ratio);
    hours.push({h, temp, desc:d.description});
  }
  track.innerHTML = hours.map((h,i) => {
    const lbl = h.h===0?'12 AM':h.h<12?`${h.h} AM`:h.h===12?'12 PM':`${h.h-12} PM`;
    return `
      <div class="htick" style="animation-delay:${i*.04}s">
        <div class="ht-time">${lbl}</div>
        <div class="ht-icon">${wxEmoji('',h.desc)}</div>
        <div class="ht-temp">${h.temp}°</div>
      </div>`;
  }).join('');
}

function renderTips(d){
  const blk = document.getElementById('tipsBlock');
  const g   = document.getElementById('tipsGrid');
  blk.style.display = 'block';
  const c = (d.condition+' '+(d.description||'')).toLowerCase();
  const tips = [];

  if(c.includes('rain')||c.includes('drizzle'))
    tips.push({i:'☂️',t:'Carry an umbrella',b:"Rain expected. Don't leave home without protection."});
  if(c.includes('snow'))
    tips.push({i:'🧥',t:'Dress in layers',b:'Snow conditions — waterproof and insulated clothing recommended.'});
  if(c.includes('clear')||c.includes('sunny'))
    tips.push({i:'🕶️',t:'Apply sunscreen',b:'Clear skies — wear SPF 30+ and sunglasses if heading outside.'});
  if(d.temp>32)
    tips.push({i:'💧',t:'Stay hydrated',b:`Very hot at ${d.temp}°C. Drink extra water and avoid midday sun.`});
  if(d.temp<5)
    tips.push({i:'🧣',t:'Bundle up',b:`Cold at ${d.temp}°C. Hat, scarf, and a warm coat are essential.`});
  if(d.wind_speed>8)
    tips.push({i:'💨',t:'Strong winds',b:`Winds at ${d.wind_speed} m/s. Secure outdoor furniture and drive carefully.`});
  if(d.humidity>80)
    tips.push({i:'🌫️',t:'High humidity',b:`Humidity is ${d.humidity}%. Light, breathable clothing recommended.`});
  if(c.includes('thunder')||c.includes('storm'))
    tips.push({i:'⚡',t:'Storm warning',b:'Thunderstorms possible. Stay indoors and avoid elevated areas.'});
  if(!tips.length)
    tips.push({i:'✅',t:'Great conditions',b:'Weather looks pleasant today. Perfect for outdoor activities!'});

  g.innerHTML = tips.slice(0,6).map(t => `
    <div class="tip">
      <div class="tip-ico">${t.i}</div>
      <div><div class="tip-title">${t.t}</div><div class="tip-body">${t.b}</div></div>
    </div>`).join('');
}
