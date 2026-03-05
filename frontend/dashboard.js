/* ══════════════════════════════════════════════
   Nimbus — Dashboard Logic
   ══════════════════════════════════════════════ */

async function loadDash(){
  const cityEl = document.getElementById('dashCity');
  const btn    = document.getElementById('dashBtn');
  const city   = cityEl.value.trim();
  if(!city){ cityEl.focus(); return; }

  btn.textContent = '⏳'; btn.disabled = true;
  try{
    const res = await fetch(`${API}/weather?city=${encodeURIComponent(city)}`);
    const d   = await res.json();
    if(d.error){ toast('❌ '+d.error, true); return; }

    document.getElementById('wxCity').textContent  = `📍 ${d.city}, ${d.country}`;
    document.getElementById('wxTemp').textContent  = `${d.temp}°C`;
    document.getElementById('wxCond').textContent  = d.description || d.condition;
    document.getElementById('wxIcon').textContent  = wxEmoji(d.condition, d.description);
    document.getElementById('wxFeels').textContent = `Feels like ${d.feels_like}°C`;
    document.getElementById('wxDate').textContent  = new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

    document.getElementById('mHumid').textContent = `${d.humidity}%`;
    document.getElementById('mWind').textContent  = `${d.wind_speed} m/s`;
    document.getElementById('mVis').textContent   = `${d.visibility ?? '—'} km`;
    document.getElementById('mPres').textContent  = `${d.pressure} hPa`;
    document.getElementById('mMin').textContent   = `${d.temp_min}°C`;
    document.getElementById('mMax').textContent   = `${d.temp_max}°C`;

    setTimeout(()=>{
      document.getElementById('mHumidBar').style.width = `${d.humidity}%`;
      document.getElementById('mWindBar').style.width  = `${Math.min(d.wind_speed*5,100)}%`;
      document.getElementById('mVisBar').style.width   = `${Math.min((d.visibility??5)*10,100)}%`;
      document.getElementById('mPresBar').style.width  = `${Math.min(((d.pressure-950)/100)*100,100)}%`;
    }, 120);

    toast(`✅ Loaded: ${d.city}, ${d.country}`);
  }catch(e){
    toast('❌ Cannot reach server. Is Flask running?', true);
  }finally{
    btn.textContent='Search'; btn.disabled=false;
  }
}

function ql(c){ document.getElementById('dashCity').value=c; loadDash(); }

/* ── WORLD CITIES ── */
const CITIES = [
  {name:'London',   flag:'🇬🇧'},
  {name:'New York', flag:'🇺🇸'},
  {name:'Tokyo',    flag:'🇯🇵'},
  {name:'Mumbai',   flag:'🇮🇳'},
  {name:'Dubai',    flag:'🇦🇪'},
  {name:'Sydney',   flag:'🇦🇺'},
  {name:'Paris',    flag:'🇫🇷'},
  {name:'Berlin',   flag:'🇩🇪'},
];

async function loadWorldCities(){
  const g = document.getElementById('worldGrid');
  g.innerHTML = CITIES.map(({name,flag}) => `
    <div class="wc-card" id="wcc-${name.replace(/\s/g,'-')}" onclick="ql('${name}')">
      <div class="wcc-icon">${flag}</div>
      <div class="wcc-name">${name}</div>
      <div class="wcc-temp" style="font-size:.8rem;color:var(--text3)">—</div>
      <div class="wcc-desc">Loading…</div>
    </div>`).join('');

  for(const {name} of CITIES){
    try{
      const res = await fetch(`${API}/weather?city=${encodeURIComponent(name)}`);
      const d   = await res.json();
      const el  = document.getElementById(`wcc-${name.replace(/\s/g,'-')}`);
      if(el && !d.error){
        el.querySelector('.wcc-icon').textContent = wxEmoji(d.condition, d.description);
        el.querySelector('.wcc-temp').textContent = `${d.temp}°C`;
        el.querySelector('.wcc-temp').style.color = '';
        el.querySelector('.wcc-temp').style.fontSize = '';
        el.querySelector('.wcc-desc').textContent = d.description || d.condition;
      }
    }catch(e){ /* skip */ }
    await new Promise(r=>setTimeout(r,240));
  }
}
loadWorldCities();
