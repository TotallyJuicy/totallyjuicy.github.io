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

// --- EDGE PAN ---
const EDGE_PAN_ZONE = 72;
const MAX_EDGE_PAN_SPEED = 18;
let pointer = { x: 0, y: 0 };
let edgePanFrame = null;
let isPointerInViewport = false;

function getEdgePanVelocity() {
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  let directionX = 0;
  let directionY = 0;

  if (pointer.x < EDGE_PAN_ZONE) {
    directionX = (EDGE_PAN_ZONE - pointer.x) / EDGE_PAN_ZONE;
  } else if (pointer.x > vw - EDGE_PAN_ZONE) {
    directionX = -(pointer.x - (vw - EDGE_PAN_ZONE)) / EDGE_PAN_ZONE;
  }

  if (pointer.y < EDGE_PAN_ZONE) {
    directionY = (EDGE_PAN_ZONE - pointer.y) / EDGE_PAN_ZONE;
  } else if (pointer.y > vh - EDGE_PAN_ZONE) {
    directionY = -(pointer.y - (vh - EDGE_PAN_ZONE)) / EDGE_PAN_ZONE;
  }

  const length = Math.hypot(directionX, directionY);
  if (length === 0) {
    return { x: 0, y: 0 };
  }

  const intensity = Math.max(Math.abs(directionX), Math.abs(directionY));
  const speed = intensity * intensity * MAX_EDGE_PAN_SPEED;

  return {
    x: (directionX / length) * speed,
    y: (directionY / length) * speed,
  };
}

function edgePanTick() {
  if (!isPointerInViewport) {
    edgePanFrame = null;
    return;
  }

  const velocity = getEdgePanVelocity();
  if (velocity.x === 0 && velocity.y === 0) {
    edgePanFrame = null;
    return;
  }

  applyTransform(tx + velocity.x, ty + velocity.y, scale);
  edgePanFrame = requestAnimationFrame(edgePanTick);
}

function startEdgePan() {
  if (edgePanFrame === null) {
    edgePanFrame = requestAnimationFrame(edgePanTick);
  }
}

viewport.addEventListener('mousemove', e => {
  if (e.target.closest('button, a')) {
    isPointerInViewport = false;
    return;
  }
  pointer = { x: e.clientX, y: e.clientY };
  isPointerInViewport = true;
  startEdgePan();
});

viewport.addEventListener('mouseleave', () => {
  isPointerInViewport = false;
});

window.addEventListener('blur', () => {
  isPointerInViewport = false;
});

// Touch drag
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let dragOrigin = { x: 0, y: 0 };

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

// --- ZOOM (centered on viewport center) ---
viewport.addEventListener('wheel', e => {
  e.preventDefault();
  const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * (e.deltaY > 0 ? 0.92 : 1.08)));

  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;

  // Keep viewport center pinned during zoom
  const worldCenterX = (vw / 2 - tx) / scale;
  const worldCenterY = (vh / 2 - ty) / scale;

  const newTx = vw / 2 - worldCenterX * newScale;
  const newTy = vh / 2 - worldCenterY * newScale;

  scale = newScale;
  applyTransform(newTx, newTy, scale, false);
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
