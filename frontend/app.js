/* ══════════════════════════════════════════════
   Nimbus — Shared App Logic
   ══════════════════════════════════════════════ */
const API = '';   

/* ── THEME ─────────────────────────────────── */
const HTML = document.documentElement;
let isDark = localStorage.getItem('nim-theme') !== 'light';
function applyTheme(){
  HTML.setAttribute('data-theme', isDark ? 'dark' : 'light');
  const ic = document.getElementById('themeIcon');
  if(ic) ic.textContent = isDark ? '☀️' : '🌙';
}
applyTheme();
document.getElementById('themeToggle')?.addEventListener('click', () => {
  isDark = !isDark;
  localStorage.setItem('nim-theme', isDark ? 'dark' : 'light');
  applyTheme();
});

/* ── MOBILE MENU ────────────────────────────── */
document.getElementById('hamburger')?.addEventListener('click', () =>
  document.getElementById('mobMenu')?.classList.toggle('open')
);

/* ── CUSTOM CURSOR ──────────────────────────── */
const dot  = document.querySelector('.c-dot');
const ring = document.querySelector('.c-ring');
if(dot && ring){
  let mx=0, my=0, rx=0, ry=0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  (function moveCursor(){
    rx += (mx - rx) * .18; ry += (my - ry) * .18;
    dot.style.left  = mx + 'px'; dot.style.top  = my + 'px';
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(moveCursor);
  })();
  document.querySelectorAll('a,button,.sb-chip,.pill,.wc-card,.qchip,.is-btn').forEach(el => {
    el.addEventListener('mouseenter', () => { ring.style.width='48px'; ring.style.height='48px'; ring.style.borderColor='rgba(245,166,35,.8)'; });
    el.addEventListener('mouseleave', () => { ring.style.width='28px'; ring.style.height='28px'; ring.style.borderColor='rgba(245,166,35,.5)'; });
  });
}

/* ── WEATHER EMOJI ──────────────────────────── */
function wxEmoji(cond='', desc=''){
  const c = (cond+' '+desc).toLowerCase();
  if(c.includes('thunder')||c.includes('storm'))  return '⛈️';
  if(c.includes('snow')||c.includes('blizzard'))  return '❄️';
  if(c.includes('sleet')||c.includes('hail'))     return '🌨️';
  if(c.includes('drizzle'))                        return '🌦️';
  if(c.includes('rain'))                           return '🌧️';
  if(c.includes('fog')||c.includes('mist')||c.includes('haze')) return '🌫️';
  if(c.includes('overcast'))                       return '☁️';
  if(c.includes('broken clouds'))                  return '🌥️';
  if(c.includes('scattered'))                      return '⛅';
  if(c.includes('few clouds'))                     return '🌤️';
  if(c.includes('cloud'))                          return '☁️';
  if(c.includes('clear')||c.includes('sunny'))     return '☀️';
  return '🌤️';
}

/* ── TOAST ──────────────────────────────────── */
function toast(msg, err=false){
  let t = document.getElementById('toast');
  if(!t){ t = document.createElement('div'); t.id='toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.style.borderColor = err ? 'rgba(224,96,96,.3)' : 'rgba(245,166,35,.25)';
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ── UTILS ──────────────────────────────────── */
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const fmtTime = () => new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
function fmtText(s){
  return esc(s)
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/`(.*?)`/g,`<code style="font-family:var(--f-mono);background:var(--amber-dim);border-radius:2px;padding:1px 5px;font-size:.84em;color:var(--amber)">$1</code>`)
    .replace(/\n/g,'<br>');
}

/* ── TICKER TIME ────────────────────────────── */
const tickerTime = document.getElementById('tickerTime');
if(tickerTime){
  setInterval(() => { tickerTime.textContent = new Date().toUTCString().slice(17,22)+' UTC'; }, 1000);
}
