// UPDATES
let TRACK;
const LEFT_BTN_SELECTOR = '.nav-btn.left';
const RIGHT_BTN_SELECTOR = '.nav-btn.right';

let LEFT_BTN, RIGHT_BTN;
let updates = [];
let activeIndex = 0;

const GAP = 20;

async function init() {
  TRACK = document.getElementById('updates-track');
  LEFT_BTN = document.querySelector(LEFT_BTN_SELECTOR);
  RIGHT_BTN = document.querySelector(RIGHT_BTN_SELECTOR);

  if (!TRACK) {
    console.error('updates-track element not found.');
    return;
  }
  if (!LEFT_BTN || !RIGHT_BTN) {
    console.error('Navigation buttons not found.');
    return;
  }

  const resp = await fetch('updates.json');
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  updates = await resp.json();

  renderCards();
  activeIndex = 0;

  requestAnimationFrame(() => updatePosition(0));
  attachListeners();

  // Review section
  const scrollSpeed = 1;
  let scrollInterval;

  function setupCarousels(containerSelector, direction = 1) {
    const containers = document.querySelectorAll(containerSelector);
    return Array.from(containers).map(container => {
      const carousel = container.querySelector('.carousel');
      carousel.innerHTML += carousel.innerHTML;
      const halfWidth = carousel.scrollWidth / 2;
      if (direction === -1) {
        container.scrollLeft = halfWidth;
      }
      return { container, halfWidth, direction };
    });
  }

  function startAutoScroll() {
    const rightCarousels = setupCarousels('.lazy-scrolling-container.right', 1);
    const leftCarousels  = setupCarousels('.lazy-scrolling-container.left', -1);

    scrollInterval = setInterval(() => {
      rightCarousels.forEach(c => {
        c.container.scrollLeft += scrollSpeed;
        if (c.container.scrollLeft >= c.halfWidth) {
          c.container.scrollLeft = 0;
        }
      });
      leftCarousels.forEach(c => {
        c.container.scrollLeft -= scrollSpeed;
        if (c.container.scrollLeft <= 0) {
          c.container.scrollLeft = c.halfWidth;
        }
      });
    }, 16);
  }

  startAutoScroll();
}

function renderCards() {
  TRACK.innerHTML = '';
  updates.forEach((u, i) => {
    const card = document.createElement('article');
    const importance = u.importance;
    let colorClass = '';

    if (importance === 1) colorClass = 'importance-1';
    else if (importance === 2) colorClass = 'importance-2';
    else if (importance === 3) colorClass = 'importance-3';

    card.className = `update-card ${colorClass}`;
    card.setAttribute('role', 'listitem');
    card.dataset.index = i;

    const imgDiv = document.createElement('div');
    imgDiv.className = 'thumb';

    const img = document.createElement('img');
    img.src = u.image;
    img.alt = u.title || `Update ${i + 1}`;
    img.loading = 'lazy';
    imgDiv.appendChild(img);

    const meta = document.createElement('div');
    meta.className = 'meta';

    const h3 = document.createElement('h3');
    h3.textContent = u.title;

    const p = document.createElement('p');
    p.textContent = u.description;

    const time = document.createElement('time');
    time.textContent = new Date(u.date).toLocaleDateString();

    meta.appendChild(h3);
    meta.appendChild(p);
    meta.appendChild(time);

    card.appendChild(imgDiv);
    card.appendChild(meta);

    TRACK.appendChild(card);

    img.addEventListener('error', () => {
      imgDiv.style.backgroundColor = 'rgba(255,255,255,0.02)';
      img.remove();
    });
  });

  requestAnimationFrame(() => {
    TRACK.style.paddingLeft = '0px';
    TRACK.style.paddingRight = '0px';
    setCenterClass();
  });
}

function cardDimensions() {
  const card = TRACK.querySelector('.update-card');
  if (!card) return { w: 320, gap: GAP };
  const w = Math.round(card.getBoundingClientRect().width);
  const gap = GAP;
  return { w, gap };
}

function updatePosition(animate = true) {
  const { w, gap } = cardDimensions();
  const step = w + gap;

  const mask = TRACK.closest('.updates-mask');
  if (!mask) return;

  const maskWidth = mask.getBoundingClientRect().width;
  const centerX = maskWidth / 2;

  const translateX = Math.round(
    centerX - w / 2 - activeIndex * step
  );

  if (!animate) {
    TRACK.style.transition = 'none';
    TRACK.style.transform = `translateX(${translateX}px)`;
    void TRACK.offsetWidth;
    TRACK.style.transition = '';
  } else {
    TRACK.style.transform = `translateX(${translateX}px)`;
  }

  setCenterClass();
}

function setCenterClass() {
  const cards = Array.from(TRACK.querySelectorAll('.update-card'));
  cards.forEach(c => c.classList.remove('center'));

  const centerCard = TRACK.querySelector(
    `.update-card[data-index="${activeIndex}"]`
  );

  if (centerCard) centerCard.classList.add('center');
}

function attachListeners() {
  LEFT_BTN.addEventListener('click', () => {
    if (activeIndex > 0) {
      activeIndex -= 1;
      updatePosition(true);
    }
  });

  RIGHT_BTN.addEventListener('click', () => {
    if (activeIndex < updates.length - 1) {
      activeIndex += 1;
      updatePosition(true);
    }
  });

  setupDrag();

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') LEFT_BTN.click();
    if (e.key === 'ArrowRight') RIGHT_BTN.click();
  });
}

function setupDrag() {
  let startX = 0;
  let dragging = false;
  let startTranslate = 0;
  const mask = TRACK.parentElement;

  mask.addEventListener('pointerdown', e => {
    dragging = true;
    startX = e.clientX;

    TRACK.style.transition = 'none';

    const style = window.getComputedStyle(TRACK);
    const matrix = new DOMMatrixReadOnly(style.transform);
    startTranslate = matrix.m41 || 0;

    mask.setPointerCapture?.(e.pointerId);
  });

  mask.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    TRACK.style.transform = `translateX(${Math.round(startTranslate + dx)}px)`;
  });

  mask.addEventListener('pointerup', e => {
    if (!dragging) return;
    dragging = false;

    TRACK.style.transition = '';

    const dx = e.clientX - startX;
    const { w, gap } = cardDimensions();
    const step = w + gap;

    const deltaIndex = Math.round(-dx / step);
    activeIndex = Math.max(
      0,
      Math.min(updates.length - 1, activeIndex + deltaIndex)
    );

    updatePosition(true);
  });

  mask.addEventListener('pointercancel', () => {
    dragging = false;
    updatePosition(true);
  });
}

window.addEventListener('resize', () => updatePosition(false));

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}


// CONFETTI FOR COUNTDOWN
const Colours = ["#f74667","#fcd846","#52eca9","#49b1fb","#9c51f8","#f94fb5","#48f9e2","#eed740"];

function CreateConfetti() {
  const durationMs = 20000;
  const particleCount = 260;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.style.position = "fixed";
  canvas.style.left = "0";
  canvas.style.top = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  canvas.setAttribute("aria-hidden", "true");

  document.body.appendChild(canvas);

  let width = 0;
  let height = 0;

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * window.devicePixelRatio);
    canvas.height = Math.floor(height * window.devicePixelRatio);
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  };

  resize();
  window.addEventListener("resize", resize);

  const centerX = () => width * 0.5;
  const centerY = () => height * 0.3;

  const spawn = (side) => {
    const fromLeft = side === "left";
    const x = fromLeft ? -40 : width + 40;
    const y = height + 30;

    const targetX = centerX();
    const targetY = centerY();
    const angleToCenter = Math.atan2(targetY - y, targetX - x);
    const angleSpread = Math.PI * 0.22;
    const angle = angleToCenter + (Math.random() - 0.5) * angleSpread;

    const speed = 7 + Math.random() * 7;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - Math.random() * 2.4;

    return {
      x,y,vx,vy,
      size: 6 + Math.random() * 6,
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      color: Colours[Math.floor(Math.random() * Colours.length)],
      life: 1,
      decay: 0.002 + Math.random() * 0.002,
      age: 0,
      burstMs: 600 + Math.random() * 600,
      driftX: (Math.random() - 0.5) * 0.35,
      driftY: 0.08 + Math.random() * 0.18,
      wobble: Math.random() * Math.PI * 2
    };
  };

  const particles = [];
  for (let i = 0; i < particleCount; i += 1) {
    particles.push(spawn(i % 2 === 0 ? "left" : "right"));
  }

  const gravity = 0.12;
  const drag = 0.992;
  const endAt = performance.now() + durationMs;

  let rafId = 0;
  let lastTime = performance.now();

  const draw = () => {
    const now = performance.now();
    const deltaMs = now - lastTime;
    const dt = Math.max(0.5, Math.min(2, deltaMs / 16.67));
    lastTime = now;
    ctx.clearRect(0, 0, width, height);

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.age += deltaMs;

      if (p.age < p.burstMs) {
        p.vx *= Math.pow(drag, dt);
        p.vy = p.vy * Math.pow(drag, dt) + gravity * dt;
      } else {
        p.vx += p.driftX * dt;
        p.vy += p.driftY * dt;
        p.vx *= 0.985;
        p.vy *= 0.985;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotationSpeed;
      p.life -= p.decay;

      if (p.life <= 0 || p.y > height + 60) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      const sway = Math.sin((p.age / 180) + p.wobble) * 0.6;
      ctx.translate(p.x + sway, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(p.life, 0.15);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    if (performance.now() < endAt && particles.length) {
      rafId = requestAnimationFrame(draw);
    } else {
      cleanup();
    }
  };

  const cleanup = () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resize);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };

  draw();
}

window.CreateConfetti = CreateConfetti;



// COUNTDOWN
document.addEventListener("DOMContentLoaded", () => {

  const targetDate = new Date("2026-02-07T09:15:00").getTime();
  let lastValues = {};
  let liveTriggeredTime = null;

  function UpdateCountdown() {
    const now = Date.now();
    let diff = targetDate - now;
    const endDate = targetDate + 86400000;
    const diffFromEnd = now - endDate;

    if (diffFromEnd >= 0) {
      if (!liveTriggeredTime) {
        liveTriggeredTime = Date.now();
        showEndedState();
      }
      return;
    }

    if (diff <= 0) {
      if (!liveTriggeredTime) {
        liveTriggeredTime = Date.now();
        showLiveState();
      }
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const days = Math.floor(totalSeconds / 86400);

    SetValue("days", days);
    SetValue("hours", hours);
    SetValue("minutes", minutes);
    SetValue("seconds", seconds);

    const countdownEl = document.getElementById("countdown");

  if (diff <= 86400000) {
    countdownEl?.classList.add("final-glow");
  } else {
    countdownEl?.classList.remove("final-glow");
  }

  }

  function SetValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;

    const formatted = String(value).padStart(2, "0");

    if (lastValues[id] !== formatted) {
      el.textContent = formatted;
      el.classList.remove("flip");
      void el.offsetWidth;
      el.classList.add("flip");
      lastValues[id] = formatted;
    }
  }

  function showLiveState() {
    const section = document.getElementById("countdown-section");
    if (!section) return;

    const countdownEl = document.getElementById("countdown");
    if (countdownEl) {
      countdownEl.classList.add("countdown-fade-out");
    }

    setTimeout(() => {
      CreateConfetti();
      section.innerHTML = `
        <div class="live-container">
          <h1>OAKRIDGE CODEFEST 2026 IS LIVE!</h1>
          <p>Let The Hacking Begin!</p>
        </div>
      `;
      const liveEl = section.querySelector('.live-container');
      if (liveEl) {
        setTimeout(() => {
          liveEl.classList.add('live-fade-in');
        }, 50);
      }
    }, 700); 
  }

  function showEndedState() {
    const section = document.getElementById("countdown-section");
    if (!section) return;

    const liveEl = section.querySelector('.live-container');
    if (liveEl) {
      liveEl.classList.remove('live-fade-in');
      liveEl.classList.add('countdown-fade-out');
    }

    setTimeout(() => {
      section.innerHTML = `
        <div class="live-container ended-container">
          <h1>CODEFEST HAS ENDED</h1>
          <p>Thanks for participating in Oakridge Codefest 2026!</p>
        </div>
      `;
      const endedEl = section.querySelector('.ended-container');
      if (endedEl) {
        setTimeout(() => {
          endedEl.classList.add('live-fade-in');
        }, 50);
      }
    }, 700);
  }

  UpdateCountdown();
  setInterval(UpdateCountdown, 1000);
});
