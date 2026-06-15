// PROJECTS DATA
// To add a project: add an object to this array with name, desc, tags (array), and link (url string or '').
const PROJECTS = [
  {name:'Spotify Listening Analytics Dashboard', desc:'Processed 8+ years of Spotify streaming history, removed passive listening, and built dashboard-ready datasets for Power BI.', tags:['Python','Pandas','Power BI'], link:'projects/spotify-listening-analytics-dashboard.html'},
  {name:'Letterboxd Rater Analysis', desc:'Analyzed 10.4M movie ratings with SQL to compare heavy and casual users, consensus ratings, and score variance.', tags:['SQL','MySQL','Analysis'], link:'projects/letterboxd-rater-analysis.html'},
  {name:'Steam Review Sentiment Classification', desc:'Built a sentiment classifier on 50,000 Steam reviews using TF-IDF and compared Naive Bayes, KNN, and Decision Tree models.', tags:['Python','Scikit-learn','NLP'], link:'projects/steam-review-sentiment-classification.html'},
  {name:'Pokemon Showdown Meta Analysis', desc:'Parsed Smogon usage data into Pandas DataFrames and identified meta-dominant competitive trends.', tags:['Python','Pandas','Data Viz'], link:'projects/pokemon-showdown-meta-analysis.html'},
  {name:'Wikipedia Knowledge Graph', desc:'Built a linked-topic graph from Wikipedia pages with NetworkX and visualized centrality and clustering structure.', tags:['Python','NetworkX','Gephi'], link:'projects/wikipedia-knowledge-graph.html'},
  {name:'CocktailMixer', desc:'Built a recipe web app with stored drinks, saved recipes, and a clean React interface.', tags:['React','TypeScript','Supabase'], link:'projects/cocktailmixer.html'},
];

const PER_PAGE = 4;
let projPage_ = 0;

function renderProjects() {
  const grid = document.getElementById('proj-grid');
  const counter = document.getElementById('proj-counter');
  if (!grid || !counter) return;
  const pages = Math.ceil(PROJECTS.length / PER_PAGE);
  counter.textContent = (projPage_+1) + ' / ' + pages;
  const slice = PROJECTS.slice(projPage_*PER_PAGE, projPage_*PER_PAGE+PER_PAGE);
  grid.innerHTML = slice.map(p => `
    <div class="proj-card">
      <div class="proj-card-name">${p.name}</div>
      <div class="proj-card-desc">${p.desc}</div>
      <div class="proj-card-footer">
        <div class="proj-card-tags">${p.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>
        ${p.link ? `<a class="proj-link" href="${p.link}">View</a>` : ''}
      </div>
    </div>`).join('');
}
function projPage(dir) {
  const pages = Math.ceil(PROJECTS.length / PER_PAGE);
  projPage_ = (projPage_+dir+pages) % pages;
  renderProjects();
}
renderProjects();

// PHOTO UPLOAD
const photoInput = document.getElementById('photo-input');
if (photoInput) photoInput.addEventListener('change', e => {
  const f = e.target.files[0]; if(!f) return;
  const img = document.getElementById('photo-img');
  img.src = URL.createObjectURL(f);
  img.style.display = 'block';
  document.getElementById('photo-hint').style.display = 'none';
});

// SCROLL & NAV
const map = document.getElementById('map');
const NAVH = () => document.getElementById('nav').offsetHeight;
const WH = () => window.innerHeight - NAVH();
const WW = () => window.innerWidth;
const SECTION_IDS = ['about','projects','skills','hobbies','contact'];
let scrollY = 0;

function applyScroll() {
  const max = map.scrollHeight - WH();
  scrollY = Math.max(0, Math.min(max, scrollY));
  map.style.transform = `translateY(${-scrollY}px)`;
  updateNav();
}
function updateNav() {
  let cur = 'top';
  SECTION_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.offsetTop - scrollY < WH()/2) cur = id;
  });
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.textContent.trim().toLowerCase() === cur);
  });
}
function navTo(id, e) {
  const el = document.getElementById(id); if(!el) return;
  const target = el.offsetTop, start = scrollY, dist = target - start;
  const dur = 450; let t0 = null;
  (function step(t){ if(!t0)t0=t; const p=Math.min(1,(t-t0)/dur); const ease=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2; scrollY=start+dist*ease; applyScroll(); if(p<1)requestAnimationFrame(step); })(performance.now());
  if(e && e.target){ document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active')); e.target.classList.add('active'); }
}
window.addEventListener('wheel', e=>{ scrollY+=e.deltaY; applyScroll(); },{passive:true});
window.addEventListener('load', () => {
  const id = location.hash.replace('#', '');
  if (SECTION_IDS.includes(id)) requestAnimationFrame(() => navTo(id));
});

// PLAYER
const playerEl = document.getElementById('player');
let px = 72, py = 140;
let keys = {};
const SPD = 4;
const PSIZE = 9; // collision radius

playerEl.style.left = px+'px';
playerEl.style.top  = (py+NAVH())+'px';

window.addEventListener('resize', () => {
  px = Math.max(PSIZE, Math.min(WW()-PSIZE, px));
  py = Math.max(PSIZE, Math.min(WH()-PSIZE, py));
  playerEl.style.left = px+'px';
  playerEl.style.top = (py+NAVH())+'px';
  applyScroll();
});

// OBSTACLE RECTS
// Returns array of {x,y,w,h} in viewport coords for all content blocks + HUD
function getObstacles() {
  const obs = [];
  // content sections on map
  document.querySelectorAll('.section').forEach(el => {
    const rect = el.getBoundingClientRect();
    obs.push({x:rect.left,y:rect.top,w:rect.width,h:rect.height, solid:false});
  });
  // HUD panels are fixed, always same position
  document.getElementById('hud').querySelectorAll('#scoreboard,#mode-toggle,#ctrl-box').forEach(el=>{
    const r=el.getBoundingClientRect();
    obs.push({x:r.left,y:r.top,w:r.width,h:r.height,solid:true});
  });
  return obs;
}

function circleRect(cx,cy,cr,rx,ry,rw,rh){
  const nx=Math.max(rx,Math.min(rx+rw,cx));
  const ny=Math.max(ry,Math.min(ry+rh,cy));
  return Math.hypot(cx-nx,cy-ny)<cr;
}

// COMBAT STATE
let combatOn = false;
let kills = 0;
const MOB_START_SPEED = 1.2;
const MOB_SPEED_INCREMENT = 0.1;
const MOB_MAX_SPEED = 2.5;
let mobSpeed = MOB_START_SPEED;
let mobs = [];     // {el, x, y, hp}
let bullets = [];  // {el, x, y, vx, vy}
let mobsToSpawn = 1;
const gameLayer = document.getElementById('game-layer');

function clearCombatEntities() {
  mobs.forEach(m => m.el.remove());
  bullets.forEach(b => b.el.remove());
  mobs = [];
  bullets = [];
  gameLayer.innerHTML = '';
}

function resetCombatState() {
  clearCombatEntities();
  kills = 0;
  mobSpeed = MOB_START_SPEED;
  mobsToSpawn = 1;
  document.getElementById('kill-count').textContent = kills;
}

function setCombatMode(on) {
  combatOn = on;
  document.getElementById('toggle-track').classList.toggle('on', combatOn);
  document.body.classList.toggle('combat', combatOn);
}

function startCombat() {
  resetCombatState();
  setCombatMode(true);
  spawnWave(mobsToSpawn);
}

function stopCombat() {
  setCombatMode(false);
  clearCombatEntities();
}

function toggleCombat() {
  if (combatOn) stopCombat();
  else startCombat();
}

function spawnWave(n) {
  for(let i=0;i<n;i++) spawnMob();
}

function spawnMob() {
  const el = document.createElement('div');
  el.className = 'mob';
  // spawn at random screen edge
  let x,y;
  const side = Math.floor(Math.random()*4);
  if(side===0){x=Math.random()*WW();y=0;}
  else if(side===1){x=WW();y=Math.random()*WH();}
  else if(side===2){x=Math.random()*WW();y=WH();}
  else{x=0;y=Math.random()*WH();}
  el.style.left=x+'px'; el.style.top=y+'px';
  gameLayer.appendChild(el);
  mobs.push({el,x,y});
}

// shoot on click
document.addEventListener('click', e => {
  if(!combatOn) return;
  if(e.target.closest('#hud')||e.target.closest('#nav')) return;
  // all coords in viewport space (0,0 = top-left of full window)
  const tx = e.clientX, ty = e.clientY;
  const bx = px, by = py + NAVH(); // player is in game-layer; convert to viewport
  const dist = Math.hypot(tx-bx, ty-by);
  if(dist<1) return;
  const vx = (tx-bx)/dist*5, vy = (ty-by)/dist*5;
  const el = document.createElement('div');
  el.style.cssText='position:fixed;width:7px;height:7px;background:#2a3e28;border-radius:50%;pointer-events:none;z-index:250;left:'+bx+'px;top:'+by+'px';
  document.body.appendChild(el);
  bullets.push({el,x:bx,y:by,vx,vy});
});

function updateGame() {
  if(!combatOn) return;

  // move bullets in viewport coords, position:fixed
  bullets = bullets.filter(b => {
    b.x+=b.vx; b.y+=b.vy;
    b.el.style.left=b.x+'px'; b.el.style.top=b.y+'px';
    // remove if off screen
    if(b.x<0||b.x>WW()||b.y<0||b.y>window.innerHeight){ b.el.remove(); return false; }
    // hit mob: mob x,y in game-layer coords, add nav height to get viewport
    for(let i=mobs.length-1;i>=0;i--){
      const m=mobs[i];
      if(Math.hypot(b.x-m.x, b.y-(m.y+NAVH()))<14){
        m.el.remove(); mobs.splice(i,1);
        b.el.remove();
        kills++;
        document.getElementById('kill-count').textContent=kills;
        mobSpeed=Math.min(MOB_MAX_SPEED, Math.round((mobSpeed+MOB_SPEED_INCREMENT)*10)/10);
        mobsToSpawn++;
        setTimeout(()=>{ if(combatOn && mobs.length<5) spawnWave(Math.min(mobsToSpawn, 5-mobs.length)); },800);
        return false;
      }
    }
    return true;
  });

  // move mobs toward player
  for (const m of mobs) {
    const dx=px-m.x, dy=py-m.y, dist=Math.hypot(dx,dy);
    if(dist<1) continue;
    m.x+=dx/dist*mobSpeed;
    m.y+=dy/dist*mobSpeed;
    m.el.style.left=m.x+'px'; m.el.style.top=m.y+'px';
    // enemy touches player: end combat and clear the screen
    if(Math.hypot(m.x-px,m.y-py)<14){
      stopCombat();
      return;
    }
  }
}

// MAIN LOOP
function loop() {
  let dx=0,dy=0;
  if(keys['w']||keys['arrowup'])   dy-=SPD;
  if(keys['s']||keys['arrowdown']) dy+=SPD;
  if(keys['a']||keys['arrowleft']) dx-=SPD;
  if(keys['d']||keys['arrowright'])dx+=SPD;
  if(dx&&dy){dx*=.707;dy*=.707;}

  if(dx||dy){
    const margin=80;
    const npx=Math.max(PSIZE,Math.min(WW()-PSIZE,px+dx));
    let npy=py+dy;
    // scroll when near edge
    if(npy<margin){scrollY+=npy-margin;npy=margin;}
    else if(npy>WH()-margin){scrollY+=npy-(WH()-margin);npy=WH()-margin;}
    npy=Math.max(PSIZE,Math.min(WH()-PSIZE,npy));

    px=npx;py=npy;
    applyScroll();
    playerEl.style.left=px+'px';
    playerEl.style.top=(py+NAVH())+'px';
  }

  updateGame();
  requestAnimationFrame(loop);
}

document.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase(); keys[k]=true;
  const km={w:'k-w',a:'k-a',s:'k-s',d:'k-d'};
  if(km[k]) document.getElementById(km[k])?.classList.add('pressed');
  if(['arrowup','arrowdown',' '].includes(k)) e.preventDefault();
});
document.addEventListener('keyup',e=>{
  const k=e.key.toLowerCase(); keys[k]=false;
  const km={w:'k-w',a:'k-a',s:'k-s',d:'k-d'};
  if(km[k]) document.getElementById(km[k])?.classList.remove('pressed');
});

loop();
