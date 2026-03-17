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

  const targetX = elLeft - (vw / 2) + (elW / 2);
  const targetY = elTop  - (vh / 2) + (elH / 2);

  if (instant) {
    world.style.transition = 'none';
    requestAnimationFrame(() => {
      world.style.transform = `translate(${-targetX}px, ${-targetY}px)`;
      requestAnimationFrame(() => {
        world.style.transition = 'transform 850ms cubic-bezier(0.22, 1, 0.36, 1)';
      });
    });
  } else {
    world.style.transition = 'transform 850ms cubic-bezier(0.22, 1, 0.36, 1)';
    world.style.transform = `translate(${-targetX}px, ${-targetY}px)`;
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

function getTranslate() {
  const style = window.getComputedStyle(world);
  const matrix = new DOMMatrix(style.transform);
  return { x: matrix.m41, y: matrix.m42 };
}

viewport.addEventListener('mousedown', e => {
  if (e.target.closest('button, a')) return;
  isDragging = true;
  dragStart = { x: e.clientX, y: e.clientY };
  worldPos = getTranslate();
  document.body.classList.add('dragging');
  world.style.transition = 'none';
});

window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;
  world.style.transform = `translate(${worldPos.x + dx}px, ${worldPos.y + dy}px)`;
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
  worldPos = getTranslate();
  world.style.transition = 'none';
}, { passive: true });

window.addEventListener('touchmove', e => {
  if (!isDragging) return;
  const t = e.touches[0];
  const dx = t.clientX - dragStart.x;
  const dy = t.clientY - dragStart.y;
  world.style.transform = `translate(${worldPos.x + dx}px, ${worldPos.y + dy}px)`;
}, { passive: true });

window.addEventListener('touchend', () => {
  isDragging = false;
  world.style.transition = 'transform 850ms cubic-bezier(0.22, 1, 0.36, 1)';
});

// Re-center on resize
window.addEventListener('resize', () => panTo(currentSection, true));

// --- INIT ---
// Start all sections dimmed except about
document.querySelectorAll('.section').forEach(s => s.classList.add('dim'));
panTo('about', true);
