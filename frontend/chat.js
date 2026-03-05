/* ══════════════════════════════════════════════
   Nimbus — Chat Page Logic
   ══════════════════════════════════════════════ */

const msgStream = document.getElementById('messages');
const uInput    = document.getElementById('userInput');
const sBtn      = document.getElementById('sendBtn');
const fnLogEl   = document.getElementById('fnLog');

/* sidebar chips */
document.querySelectorAll('.sb-chip').forEach(b =>
  b.addEventListener('click', () => { uInput.value = b.dataset.q; sendMessage(); })
);

/* clear chat */
document.getElementById('clearChat')?.addEventListener('click', () => {
  msgStream.innerHTML = '';
  if(fnLogEl) fnLogEl.innerHTML = '<div class="fn-empty">Function calls appear here in real-time as the AI uses them.</div>';
});

function autoResize(el){ el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,90)+'px'; }
function inject(t){ uInput.value = t; uInput.focus(); }
function handleKey(e){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendMessage(); } }

/* ── append helpers ── */
function appendUser(txt){
  const r = document.createElement('div');
  r.className = 'msg-row msg-r';
  r.innerHTML = `<div class="bubble b-usr"><p>${esc(txt)}</p><span class="msg-ts">${fmtTime()}</span></div><div class="msg-av av-usr">🧑</div>`;
  msgStream.appendChild(r); scrollBot();
}

function showTyping(){
  const r = document.createElement('div'); r.className='typing-row'; r.id='typing';
  r.innerHTML = `<div class="msg-av av-ai">🤖</div><div class="typing-bub"><div class="tdot"></div><div class="tdot"></div><div class="tdot"></div></div>`;
  msgStream.appendChild(r); scrollBot();
}
function hideTyping(){ document.getElementById('typing')?.remove(); }

function buildWCard(d){
  const em = wxEmoji(d.condition, d.description);
  return `<div class="w-card">
    <div class="wc-ico">${em}</div>
    <div class="wc-city">${esc(d.city)}${d.country?', '+esc(d.country):''}</div>
    <div class="wc-temp">${d.temp}°C</div>
    <div class="wc-desc">${esc(d.description||d.condition)}</div>
    <div class="wc-meta">
      <span>🌡️ Feels ${d.feels_like}°C</span>
      <span>💧 ${d.humidity}%</span>
      <span>💨 ${d.wind_speed} m/s</span>
      <span>⬇️ ${d.temp_min}° ⬆️ ${d.temp_max}°</span>
    </div>
  </div>`;
}

function appendAI(txt, wx=null){
  const r = document.createElement('div'); r.className='msg-row msg-l';
  r.innerHTML = `<div class="msg-av av-ai">🤖</div><div class="bubble b-ai"><p>${fmtText(txt)}</p>${wx?buildWCard(wx):''}<span class="msg-ts">${fmtTime()}</span></div>`;
  msgStream.appendChild(r); scrollBot();
}
function appendErr(msg){
  const r = document.createElement('div'); r.className='msg-row msg-l';
  r.innerHTML = `<div class="msg-av av-ai">🤖</div><div class="bubble b-ai"><div class="err-row">⚠️ ${esc(msg)}</div><span class="msg-ts">${fmtTime()}</span></div>`;
  msgStream.appendChild(r); scrollBot();
}

function logFn(name, args){
  if(!fnLogEl) return;
  fnLogEl.querySelector('.fn-empty')?.remove();
  const el = document.createElement('div'); el.className='fn-entry';
  el.innerHTML = `<div class="fn-name">⚡ ${esc(name)}</div><div class="fn-args">${esc(JSON.stringify(args))}</div>`;
  fnLogEl.prepend(el);
}

function scrollBot(){ msgStream.scrollTo({top:msgStream.scrollHeight,behavior:'smooth'}); }

/* ── SEND ── */
async function sendMessage(){
  const txt = uInput.value.trim();
  if(!txt) return;
  uInput.value=''; autoResize(uInput);
  sBtn.disabled=true; uInput.disabled=true;
  appendUser(txt); showTyping();
  try{
    const res  = await fetch(`${API}/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:txt})});
    const data = await res.json();
    hideTyping();
    if(!res.ok){ appendErr(data.error||'Server error.'); }
    else{
      if(data.weather)  logFn('get_current_weather',  {city:data.weather.city});
      if(data.forecast) logFn('get_weather_forecast', {city:data.forecast.city});
      appendAI(data.reply, data.weather||null);
    }
  }catch(e){
    hideTyping();
    appendErr('Cannot reach the server. Make sure Flask is running at http://127.0.0.1:5000');
  }finally{
    sBtn.disabled=false; uInput.disabled=false; uInput.focus();
  }
}

uInput?.focus();
