const world = document.getElementById('world');
const viewport = document.getElementById('viewport');

// Section positions (center on these)
const sections = {
  about:          { el: null },
  cybersecurity:  { el: null },
  data:           { el: null },
  gamedev:        { el: null },
  skills:         { el: null },
  other:          { el: null },
  resume:         { el: null },
  contact:        { el: null },
  easteregg:      { el: null },
};

// Populate refs
Object.keys(sections).forEach(id => {
  sections[id].el = document.getElementById(id);
});

// --- PAN TO SECTION ---
function panTo(id, instant = false) {
  const el = sections[id]?.el;
  if (!el) return;

  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;

  const elLeft = parseInt(el.style.left);
  const elTop  = parseInt(el.style.top);
  const elW    = el.offsetWidth;
  const elH    = el.offsetHeight;

  // Center the section in viewport, accounting for scale
  const targetX = elLeft * scale - vw / 2 + (elW * scale) / 2;
  const targetY = elTop  * scale - vh / 2 + (elH * scale) / 2;

  if (instant) {
    requestAnimationFrame(() => {
      setTransform(-targetX, -targetY, scale);
      requestAnimationFrame(() => {
        world.style.transition = 'transform 850ms cubic-bezier(0.22, 1, 0.36, 1)';
      });
    });
  } else {
    setTransform(-targetX, -targetY, scale, 'transform 850ms cubic-bezier(0.22, 1, 0.36, 1)');
  }

  // Update active states
  document.querySelectorAll('.section').forEach(s => {
    s.classList.remove('active');
    s.classList.add('dim');
  });
  el.classList.add('active');
  el.classList.remove('dim');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === id);
  });

  currentSection = id;
}

let currentSection = 'about';

// --- NAV BUTTONS ---
document.querySelectorAll('[data-target]').forEach(btn => {
  btn.addEventListener('click', () => panTo(btn.dataset.target));
});

// --- DRAG TO PAN ---
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let worldPos  = { x: 0, y: 0 };
let tx = 0, ty = 0; // track translation separately

function getTranslate() {
  return { x: tx, y: ty };
}

function setTransform(x, y, s, transition = 'none') {
  tx = x; ty = y;
  world.style.transition = transition;
  world.style.transformOrigin = '0 0';
  world.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
}

viewport.addEventListener('mousedown', e => {
  if (e.target.closest('button, a')) return;
  isDragging = true;
  dragStart = { x: e.clientX, y: e.clientY };
  worldPos = { x: tx, y: ty };
  document.body.classList.add('dragging');
  world.style.transition = 'none';
});

window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;
  setTransform(worldPos.x + dx, worldPos.y + dy, scale);
});

window.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  document.body.classList.remove('dragging');
  world.style.transition = 'transform 850ms cubic-bezier(0.22, 1, 0.36, 1)';
});

// Touch drag
viewport.addEventListener('touchstart', e => {
  if (e.target.closest('button, a')) return;
  const t = e.touches[0];
  isDragging = true;
  dragStart = { x: t.clientX, y: t.clientY };
  worldPos = { x: tx, y: ty };
  world.style.transition = 'none';
}, { passive: true });

window.addEventListener('touchmove', e => {
  if (!isDragging) return;
  const t = e.touches[0];
  const dx = t.clientX - dragStart.x;
  const dy = t.clientY - dragStart.y;
  setTransform(worldPos.x + dx, worldPos.y + dy, scale);
}, { passive: true });

window.addEventListener('touchend', () => {
  isDragging = false;
  world.style.transition = 'transform 850ms cubic-bezier(0.22, 1, 0.36, 1)';
});

// Re-center on resize
window.addEventListener('resize', () => panTo(currentSection, true));

// --- CLICK DIMMED SECTION TO NAVIGATE ---
document.querySelectorAll('.section').forEach(s => {
  s.addEventListener('click', e => {
    if (e.target.closest('button, a')) return;
    if (!s.classList.contains('active')) {
      panTo(s.id);
    }
  });
});

// --- ZOOM ---
let scale = 1;
const MIN_SCALE = 0.4;
const MAX_SCALE = 1.6;

viewport.addEventListener('wheel', e => {
  e.preventDefault();
  const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
  scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * zoomFactor));
  panTo(currentSection, true);
}, { passive: false });

// --- INIT ---
// Start all sections dimmed except about
document.querySelectorAll('.section').forEach(s => s.classList.add('dim'));
panTo('about', true);
