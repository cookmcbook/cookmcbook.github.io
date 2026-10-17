// Decorative cat that wanders along the bottom of the site header.
// Sprite rows and frame order come from scripts/build-cat-sprites.py.
(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const W = 64; // display size; sheet cells are 2x for sharp high-DPI rendering
  const H = 51;
  const STORE = 'header-cat';
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const ANIMATIONS = {
    sleep: { row: 0, frames: [0, 1, 2, 3, 2, 1], ms: 550, loop: true },
    lieDown: { row: 0, frames: [7, 6, 4, 3], ms: 200 },
    wake: { row: 0, frames: [4, 6, 7], ms: 180 },
    meow: { row: 1, frames: [0, 1, 2, 3, 3, 4], ms: 140 },
    walk: { row: 2, frames: range(0, 7), ms: 90, loop: true, speed: 55 },
    run: { row: 3, frames: range(0, 5), ms: 65, loop: true, speed: 170 },
    skid: { row: 3, frames: [6, 7], ms: 110 },
    swipe: { row: 4, frames: [0, 1, 2, 3, 2, 3, 4], ms: 110 },
  };
  const SIT_POSES = [...range(0, 8).map((c) => [5, c]), ...range(5, 8).map((c) => [4, c])];
  const SOUNDS = ['meow', 'mrrp?', 'mew', 'prrt'];

  const cat = document.createElement('div');
  cat.className = 'header-cat';
  cat.setAttribute('aria-hidden', 'true');
  cat.innerHTML = '<span class="header-cat-bubble"></span><span class="header-cat-sprite"></span>';
  const bubble = cat.firstElementChild;
  const sprite = cat.lastElementChild;
  header.append(cat);

  const now = () => performance.now();
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  let minX = 0;
  const maxX = () => Math.max(minX, header.clientWidth - W);
  const clampX = (v) => Math.min(Math.max(v, minX), maxX());

  // Wide layouts: walk along the header's bottom edge. When the nav wraps
  // below the wordmark, stand level with the wordmark in the space beside it.
  function layout() {
    const wordmark = header.querySelector('.wordmark');
    const nav = header.querySelector('nav');
    const top = header.getBoundingClientRect().top + header.clientTop;
    const mark = wordmark && wordmark.getBoundingClientRect();
    const stacked = mark && nav && nav.getBoundingClientRect().top >= mark.bottom - 2;
    const floor = stacked ? mark.bottom - top + 2 : header.clientHeight;
    cat.style.bottom = `${header.clientHeight - floor}px`;
    minX = stacked ? mark.right - header.getBoundingClientRect().left - header.clientLeft + 12 : 0;
    return stacked;
  }

  let x = 0;
  let facing = 1;
  let mode = 'idle'; // idle | move | busy | asleep
  let anim = null;
  let frame = 0;
  let frameAt = 0;
  let onDone = null;
  let pose = SIT_POSES[0];
  let poseUntil = 0;
  let nextDecision = 0;
  let target = 0;
  let arrival = null;
  let pointer = null;
  let chaseCooldown = 0;
  let bubbleTimer = 0;

  function draw() {
    const [row, col] = anim ? [anim.row, anim.frames[frame]] : pose;
    sprite.style.backgroundPosition = `${-col * W}px ${-row * H}px`;
    sprite.style.transform = facing < 0 ? 'scaleX(-1)' : '';
    cat.style.transform = `translateX(${Math.round(x)}px)`;
    bubble.classList.toggle('is-left', x > maxX() - 48);
  }

  function play(name, done) {
    anim = ANIMATIONS[name];
    frame = 0;
    frameAt = now();
    onDone = done || null;
  }

  function say() {
    bubble.textContent = pick(SOUNDS);
    bubble.classList.add('is-visible');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove('is-visible'), 1400);
  }

  // Horizontal gaps in the header not covered by the wordmark or nav links.
  function freeZones() {
    const left = header.getBoundingClientRect().left + header.clientLeft;
    const taken = [...header.querySelectorAll('.wordmark, nav a')]
      .map((el) => el.getBoundingClientRect())
      .map((r) => [r.left - left, r.right - left])
      .sort((a, b) => a[0] - b[0]);
    const zones = [];
    let start = 0;
    for (const [a, b] of taken) {
      if (a - start >= W + 16) zones.push([start + 8, a - 8]);
      start = Math.max(start, b);
    }
    if (header.clientWidth - start >= W + 16) zones.push([start + 8, header.clientWidth - 8]);
    return zones;
  }

  function restSpot() {
    if (layout()) return rand(minX, maxX());
    const zones = freeZones();
    if (zones.length && Math.random() < 0.8) {
      const [a, b] = pick(zones);
      return rand(a, b - W);
    }
    return rand(0, maxX());
  }

  function sit(duration) {
    mode = 'idle';
    anim = null;
    pose = pick(SIT_POSES);
    poseUntil = now() + rand(700, 1800);
    nextDecision = now() + duration;
  }

  function walkTo(tx, gait = 'walk', arrive = () => sit(rand(2500, 6000))) {
    target = clampX(tx);
    if (Math.abs(target - x) < 4) {
      arrive();
      return;
    }
    facing = target > x ? 1 : -1;
    mode = 'move';
    arrival = arrive;
    play(gait);
  }

  function meow() {
    mode = 'busy';
    say();
    play('meow', () => sit(rand(2000, 4000)));
  }

  function sleep() {
    mode = 'busy';
    play('lieDown', () => {
      mode = 'asleep';
      nextDecision = now() + rand(15000, 30000);
      play('sleep');
    });
  }

  function wake(then = () => sit(rand(1500, 3000))) {
    mode = 'busy';
    play('wake', then);
  }

  function swipe() {
    mode = 'busy';
    play('swipe', () => sit(rand(2500, 5000)));
  }

  // Walk or run to just beside the pointer, then bat at it.
  function chase() {
    const side = pointer.x > x + W / 2 ? 1 : -1;
    const stop = pointer.x - W / 2 - side * W * 0.45;
    const gait = Math.abs(stop - x) > 160 ? 'run' : 'walk';
    pointer.chased = true;
    chaseCooldown = now() + 3000;
    walkTo(stop, gait, () => {
      facing = side;
      if (gait === 'run') play('skid', swipe);
      else swipe();
      mode = 'busy';
    });
  }

  function decide() {
    const roll = Math.random();
    if (roll < 0.5) walkTo(restSpot());
    else if (roll < 0.65) meow();
    else if (roll < 0.8) walkTo(restSpot(), 'walk', sleep);
    else sit(rand(2000, 5000));
  }

  let last = now();
  function tick(t) {
    const dt = Math.min(t - last, 100) / 1000;
    last = t;
    if (anim && t - frameAt >= anim.ms) {
      frameAt = t;
      if (frame + 1 < anim.frames.length) frame += 1;
      else if (anim.loop) frame = 0;
      else if (onDone) {
        const done = onDone;
        onDone = null;
        done();
      }
    }
    if (mode === 'move') {
      const step = anim.speed * dt;
      if (Math.abs(target - x) <= step) {
        x = target;
        arrival();
      } else {
        x += Math.sign(target - x) * step;
      }
    } else if (mode === 'idle') {
      if (pointer && !pointer.chased && t >= chaseCooldown && t - pointer.since > 500) chase();
      else if (t >= nextDecision) decide();
      else if (t >= poseUntil) {
        pose = pick(SIT_POSES);
        poseUntil = t + rand(700, 1800);
      }
    } else if (mode === 'asleep' && t >= nextDecision) {
      wake();
    }
    draw();
    requestAnimationFrame(tick);
  }

  function pointerX(event) {
    return event.clientX - header.getBoundingClientRect().left - header.clientLeft;
  }

  // Restore position across page loads in this tab.
  let saved = null;
  try {
    saved = JSON.parse(sessionStorage.getItem(STORE));
  } catch {}
  window.addEventListener('pagehide', () => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify({ x, facing, asleep: mode === 'asleep' }));
    } catch {}
  });

  layout();
  x = clampX(saved ? saved.x : restSpot());
  facing = saved && saved.facing < 0 ? -1 : 1;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    pose = [5, 0];
    draw();
    cat.addEventListener('click', say);
    return;
  }

  // Clicks interrupt anything except meowing or getting up/lying down.
  const UNINTERRUPTIBLE = [ANIMATIONS.meow, ANIMATIONS.wake, ANIMATIONS.lieDown];
  cat.addEventListener('click', () => {
    if (mode === 'asleep') wake(meow);
    else if (!UNINTERRUPTIBLE.includes(anim)) meow();
  });
  header.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    const px = pointerX(event);
    if (!pointer || Math.abs(px - pointer.x) > 30) pointer = { x: px, since: now() };
  });
  header.addEventListener('pointerleave', () => {
    pointer = null;
  });
  header.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' || event.target.closest('a, .header-cat')) return;
    if (mode !== 'idle' && mode !== 'move') return;
    pointer = { x: pointerX(event), since: 0 };
    chase();
    pointer = null;
  });
  window.addEventListener('resize', () => {
    layout();
    x = clampX(x);
    target = clampX(target);
  });

  if (saved && saved.asleep) {
    mode = 'asleep';
    nextDecision = now() + rand(8000, 20000);
    play('sleep');
  } else {
    sit(rand(1500, 4000));
  }
  draw();
  requestAnimationFrame(tick);
})();
