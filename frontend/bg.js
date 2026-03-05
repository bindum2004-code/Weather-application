/* ══════════════════════════════════════════════
   Nimbus BG — Rain grid + meteor streaks
   + floating weather glyphs + amber pulses
   ══════════════════════════════════════════════ */
(function(){
  const cv = document.getElementById('bgCanvas');
  if(!cv) return;
  const cx = cv.getContext('2d');
  let W, H, dark = document.documentElement.getAttribute('data-theme') !== 'light';

  const resize = () => { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize);

  /* ── GRID DOTS ── */
  const COLS = 28, ROWS = 18;
  const dots = [];
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++)
    dots.push({ c, r, phase: Math.random()*Math.PI*2, speed: .008+Math.random()*.012, lit: Math.random()<.06 });

  /* ── METEORS ── */
  class Meteor {
    constructor(){ this.reset(true); }
    reset(init=false){
      this.x  = Math.random()*W*1.4;
      this.y  = init ? Math.random()*H : -20;
      this.vx = -2 - Math.random()*4;
      this.vy = 3  + Math.random()*6;
      this.len = 60 + Math.random()*120;
      this.a   = .5 + Math.random()*.5;
      this.w   = .5 + Math.random()*1.2;
    }
    tick(){
      this.x += this.vx; this.y += this.vy;
      if(this.y > H+40) this.reset();
    }
    draw(){
      const ang = Math.atan2(this.vy,this.vx);
      const tx = this.x - Math.cos(ang)*this.len;
      const ty = this.y - Math.sin(ang)*this.len;
      const g  = cx.createLinearGradient(tx,ty,this.x,this.y);
      g.addColorStop(0,'rgba(245,166,35,0)');
      g.addColorStop(.7,`rgba(245,166,35,${this.a*.35})`);
      g.addColorStop(1,`rgba(255,220,140,${this.a})`);
      cx.beginPath(); cx.moveTo(tx,ty); cx.lineTo(this.x,this.y);
      cx.strokeStyle=g; cx.lineWidth=this.w; cx.lineCap='round'; cx.stroke();
      const hg=cx.createRadialGradient(this.x,this.y,0,this.x,this.y,5);
      hg.addColorStop(0,`rgba(255,220,140,${this.a})`);
      hg.addColorStop(1,'rgba(245,166,35,0)');
      cx.beginPath(); cx.arc(this.x,this.y,5,0,Math.PI*2);
      cx.fillStyle=hg; cx.fill();
    }
  }
  const meteors = Array.from({length:10},()=>new Meteor());

  /* ── AMBER PULSES ── */
  class Pulse {
    constructor(){ this.reset(); }
    reset(){
      this.x = Math.random()*W;
      this.y = Math.random()*H;
      this.r = 0; this.maxR = 40+Math.random()*80;
      this.a = .3+Math.random()*.3;
      this.speed = .4+Math.random()*.5;
      this.delay = Math.random()*200;
    }
    tick(){
      if(this.delay>0){this.delay--;return;}
      this.r += this.speed; if(this.r>this.maxR) this.reset();
    }
    draw(){
      if(this.delay>0||this.r<=0) return;
      const alpha = this.a*(1-this.r/this.maxR);
      cx.beginPath(); cx.arc(this.x,this.y,this.r,0,Math.PI*2);
      cx.strokeStyle=`rgba(245,166,35,${alpha*.5})`; cx.lineWidth=1; cx.stroke();
    }
  }
  const pulses = Array.from({length:8},()=>new Pulse());

  /* ── WEATHER GLYPHS ── */
  const GLYPHS = ['⛅','☁️','🌧️','❄️','☀️','⛈️','🌫️','🌤️','🌪️'];
  class Glyph {
    constructor(){ this.reset(); }
    reset(){
      this.e = GLYPHS[Math.floor(Math.random()*GLYPHS.length)];
      this.x = Math.random()*W; this.y = H+50;
      this.s = 12+Math.random()*20;
      this.vy = -.2-.4*Math.random();
      this.vx = (Math.random()-.5)*.3;
      this.a  = .03+Math.random()*.05;
      this.wb = Math.random()*Math.PI*2;
    }
    tick(){
      this.wb+=.018; this.x+=this.vx+Math.sin(this.wb)*.25; this.y+=this.vy;
      if(this.y<-50) this.reset();
    }
    draw(){
      cx.save(); cx.globalAlpha=this.a;
      cx.font=`${this.s}px serif`; cx.textAlign='center'; cx.textBaseline='middle';
      cx.fillText(this.e,this.x,this.y); cx.restore();
    }
  }
  const glyphs = Array.from({length:16},()=>{ const g=new Glyph(); g.y=Math.random()*H; return g; });

  /* ── MAIN LOOP ── */
  let t = 0;
  function loop(){
    t++;
    cx.clearRect(0,0,W,H);
    const alpha = dark ? 1 : 1;

    /* grid dots */
    const cw = W/COLS, rh = H/ROWS;
    dots.forEach(d=>{
      d.phase+=d.speed;
      const fade = .5+.5*Math.sin(d.phase);
      const base = dark ? `rgba(58,58,69,${fade*.4})` : `rgba(176,165,144,${fade*.3})`;
      const lit  = dark ? `rgba(245,166,35,${fade*.8})` : `rgba(180,100,0,${fade*.6})`;
      cx.beginPath();
      cx.arc(d.c*cw+cw/2, d.r*rh+rh/2, d.lit?1.8:.9, 0, Math.PI*2);
      cx.fillStyle = d.lit ? lit : base;
      cx.fill();
    });

    /* grid lines (very faint) */
    if(dark){
      cx.strokeStyle='rgba(42,42,50,0.25)'; cx.lineWidth=.4;
      for(let c=0;c<=COLS;c++){
        cx.beginPath(); cx.moveTo(c*cw,0); cx.lineTo(c*cw,H); cx.stroke();
      }
      for(let r=0;r<=ROWS;r++){
        cx.beginPath(); cx.moveTo(0,r*rh); cx.lineTo(W,r*rh); cx.stroke();
      }
    }

    /* pulses */
    if(dark) pulses.forEach(p=>{ p.tick(); p.draw(); });

    /* meteors */
    if(dark) meteors.forEach(m=>{ m.tick(); m.draw(); });

    /* glyphs */
    cx.globalAlpha=1;
    glyphs.forEach(g=>{ g.tick(); g.draw(); });
    cx.globalAlpha=1;

    requestAnimationFrame(loop);
  }
  loop();

  /* theme watch */
  new MutationObserver(()=>{ dark = document.documentElement.getAttribute('data-theme') !== 'light'; })
    .observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();
