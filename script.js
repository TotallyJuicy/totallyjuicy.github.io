const world = document.getElementById('world');
const viewport = document.getElementById('viewport');

// --- STATE ---
let tx = 0, ty = 0, scale = 1;
let currentSection = 'about';
const MIN_SCALE = 0.4;
const MAX_SCALE = 1.6;

// Section elements
const sections = {
  about: null, cybersecurity: null, data: null, gamedev: null,
  skills: null, other: null, resume: null, contact: null, easteregg: null,
};
Object.keys(sections).forEach(id => {
  sections[id] = document.getElementById(id);
});

// --- TRANSFORM ---
function applyTransform(x, y, s, animated = false) {
  tx = x; ty = y; scale = s;
  world.style.transition = animated ? 'transform 850ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
  world.style.transformOrigin = '0 0';
  world.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
}

// --- PAN TO SECTION ---
function panTo(id, animated = true) {
  const el = sections[id];
  if (!el) return;

  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const elLeft = parseInt(el.style.left);
  const elTop  = parseInt(el.style.top);
  const elW    = el.offsetWidth;
  const elH    = el.offsetHeight;

  const newTx = vw / 2 - elLeft * scale - (elW * scale) / 2;
  const newTy = vh / 2 - elTop  * scale - (elH * scale) / 2;

  applyTransform(newTx, newTy, scale, animated);

  document.querySelectorAll('.section').forEach(s => {
    s.classList.add('dim');
    s.classList.remove('active');
  });
  el.classList.remove('dim');
  el.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === id);
  });

  currentSection = id;
}

// --- NAV BUTTONS ---
document.querySelectorAll('[data-target]').forEach(btn => {
  btn.addEventListener('click', () => panTo(btn.dataset.target, true));
});

// --- DRAG ---
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let dragOrigin = { x: 0, y: 0 };

viewport.addEventListener('mousedown', e => {
  if (e.target.closest('button, a')) return;
  isDragging = true;
  dragStart = { x: e.clientX, y: e.clientY };
  dragOrigin = { x: tx, y: ty };
  document.body.classList.add('dragging');
});

window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  applyTransform(dragOrigin.x + e.clientX - dragStart.x, dragOrigin.y + e.clientY - dragStart.y, scale);
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  document.body.classList.remove('dragging');
});

// Touch drag
viewport.addEventListener('touchstart', e => {
  if (e.target.closest('button, a')) return;
  const t = e.touches[0];
  isDragging = true;
  dragStart = { x: t.clientX, y: t.clientY };
  dragOrigin = { x: tx, y: ty };
}, { passive: true });

window.addEventListener('touchmove', e => {
  if (!isDragging) return;
  const t = e.touches[0];
  applyTransform(dragOrigin.x + t.clientX - dragStart.x, dragOrigin.y + t.clientY - dragStart.y, scale);
}, { passive: true });

window.addEventListener('touchend', () => { isDragging = false; });

// --- ZOOM (centered on current section) ---
viewport.addEventListener('wheel', e => {
  e.preventDefault();
  const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * (e.deltaY > 0 ? 0.92 : 1.08)));
  scale = newScale;
  panTo(currentSection, false);
}, { passive: false });

// --- CLICK DIMMED SECTION ---
document.querySelectorAll('.section').forEach(s => {
  s.addEventListener('click', e => {
    if (e.target.closest('button, a')) return;
    if (!s.classList.contains('active')) panTo(s.id, true);
  });
});

// --- RESIZE ---
window.addEventListener('resize', () => panTo(currentSection, false));

// --- INIT ---
document.querySelectorAll('.section').forEach(s => s.classList.add('dim'));
panTo('about', false);
