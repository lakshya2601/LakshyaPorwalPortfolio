// "The Rain Doesn't Stop" — briefing dossier, rotary phone and vault keypad.
export const CASE = {
  city: 'Indore', number: '1987142160', press: '0731254611', pin: '1147',
  missing: 'Mr. Mehra', wife: 'Asha', daughter: 'Pooja', stall: 'Chai Thikana',
};

export function initRain({ sfx, ac, snapshot }) {
  const el = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = './rain.css'; document.head.appendChild(css);
  const font = document.createElement('link'); font.rel = 'stylesheet'; font.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@500&family=Share+Tech+Mono&display=swap'; document.head.appendChild(font);

  /* ---------------- briefing ---------------- */
  const brief = el(`<div class="rg-layer" id="rg-brief"><div class="rg-folder rg-paper">
    <div class="tab">CASE FILE #001</div>
    <div class="rg-left rg-paper">
      <div class="rg-clip"></div>
      <div class="rg-polaroid"><img alt="The street outside the office, raining"><div class="cap">outside the office · 3:07 am</div></div>
      <div class="rg-note">"Nobody looks inside a safe that's behind a map."</div>
      <div class="rg-ring"></div>
    </div>
    <div class="rg-right rg-paper">
      <div class="rg-stamp">CONFIDENTIAL</div>
      <div class="rg-meta"><span>INDORE · M.P.</span><span>${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span></div>
      <h1>The Rain Doesn't Stop</h1>
      <p>3:07 AM. It has been raining in Indore for nine days straight.</p>
      <p>You are a detective. You just woke up at your desk with a bump on your head and <b>no memory</b> of the last few hours.</p>
      <p>A man called <b>${CASE.missing}</b> is missing. Someone is looking for him. Someone is going to lie to you tonight.</p>
      <p><b>Your goal: find ${CASE.missing} before they do.</b></p>
      <div class="rg-how">
        <div><i>◎</i>LOOK<br>move your mouse</div>
        <div><i>⌕</i>INSPECT<br>click what catches your eye</div>
        <div><i>♪</i>LISTEN<br>the voices notice things</div>
        <div><i>◐</i>RISK<br>some moves need a coin flip</div>
        <div><i>☎</i>DIAL<br>the old phone works</div>
      </div>
      <button class="rg-take">TAKE THE CASE</button>
      <div class="rg-sub">best with headphones · about 4 minutes</div>
    </div></div></div>`);
  document.body.appendChild(brief);

  function showBriefing(onTake) {
    try { const src = snapshot?.(); if (src) brief.querySelector('img').src = src; } catch (e) { /* no snapshot */ }
    brief.classList.add('on'); sfx.paper?.();
    gsap.fromTo(brief.querySelector('.rg-folder'), { y: 60, rotate: -6, opacity: 0 }, { y: 0, rotate: -.8, opacity: 1, duration: 1, ease: 'power3.out' });
    gsap.fromTo(brief.querySelector('.rg-stamp'), { scale: 2.6, opacity: 0 }, { scale: 1, opacity: .82, duration: .3, delay: 1.1, ease: 'power4.in', onComplete: sfx.thud });
    brief.querySelector('.rg-take').onclick = () => {
      sfx.paper?.();
      gsap.to(brief.querySelector('.rg-folder'), { y: -40, opacity: 0, rotate: 3, duration: .6, ease: 'power2.in', onComplete: () => { brief.classList.remove('on'); onTake?.(); } });
    };
  }

  /* ---------------- rotary phone (photo-real Blender renders, layered) ---------------- */
  const STOP = 62; // finger stop, degrees clockwise from 3 o'clock
  const holeAngle = (k) => STOP - 30 * (k + 1.15); // k: 1..10 (10 = zero)
  const phone = el(`<div class="rg-layer" id="rg-phone"><div class="rg-phone">
    <div class="rg-strip rg-paper"><small>YOU DIALED</small><span class="num">—</span></div>
    <div class="rg-dial2" aria-label="Rotary phone dial">
      <img class="base" src="./assets/props/dial_base.png" alt="">
      <img class="wheel" src="./assets/props/dial_wheel.png" alt="">
      <img class="cap" src="./assets/props/dial_cap.png" alt="">
    </div>
    <div class="rg-said"></div>
    <div class="rg-btns"><button class="hang">HANG UP</button><button class="close">PUT THE PHONE DOWN</button></div>
  </div></div>`);
  document.body.appendChild(phone);
  const dialBox = phone.querySelector('.rg-dial2');
  dialBox.addEventListener('pointerdown', (e) => {
    const b = dialBox.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5;
    const r = Math.hypot(x, y) / (1 / 1.12); // normalise to image size (image is 1/1.12 of the box)
    if (r < .23 || r > .4) return;
    let ang = Math.atan2(y, x) * 180 / Math.PI; let best = 0, bd = 1e9;
    for (let k = 1; k <= 10; k++) { let d = Math.abs(((ang - holeAngle(k)) % 360 + 540) % 360 - 180); if (d < bd) { bd = d; best = k; } }
    if (bd < 14) { e.preventDefault(); dial(best); }
  });
  const wheel = phone.querySelector('.wheel'), numEl = phone.querySelector('.num'), said = phone.querySelector('.rg-said');
  let dialed = '', spinning = false, onCall = null, callLock = false; const queue = [];
  const WRONG = [
    'A sleepy voice: "Hello? This is Sarafa Sweets. We are closed, bhaiya. Try at 9."',
    'An auntie: "Arre, wrong number. And why are you calling at 3 in the morning?"',
    'A recorded voice: "The number you have dialed does not exist. Please check the number."',
    'Loud music, then: "Hello? Rajwada wedding band, bookings only!" Click.',
  ];
  function clickSound() { if (!ac()) return; sfx.tick(1600 + Math.random() * 200, .012, .12, 'square'); }
  function ringTone(n, done) { let i = 0; const r = () => { if (i++ >= n) return done(); for (let j = 0; j < 14; j++) setTimeout(() => sfx.tick(j % 2 ? 420 : 460, .05, .07, 'sine'), j * 50); setTimeout(r, 1500); }; r(); }
  function dial(k) {
    if (callLock || dialed.length + queue.length >= 10 && spinning) return;
    if (spinning) { queue.push(k); return; } spinning = true;
    const travel = 30 * (k + 1.15); // degrees to the finger stop
    sfx.tick(300, .03, .06, 'triangle');
    gsap.to(wheel, { rotation: travel, duration: travel / 420, ease: 'power1.out', onComplete: () => {
      const ticks = k; let t = 0;
      gsap.to(wheel, { rotation: 0, duration: travel / 300, ease: 'none', onUpdate() { const nt = Math.floor((1 - this.progress()) * -ticks + ticks); if (nt > t) { t = nt; clickSound(); } } , onComplete: () => {
        spinning = false; dialed += String(k % 10); numEl.textContent = dialed.replace(/(\d{4})(\d{0,2})(\d{0,2})(\d{0,2})/, (m, a, b, c, d) => [a, b, c, d].filter(Boolean).join(' '));
        if (dialed.length === 10) { queue.length = 0; connect(); } else if (queue.length) dial(queue.shift());
      } });
    } });
  }
  function connect() {
    callLock = true; said.innerHTML = '<em>ringing…</em>';
    ringTone(2, () => {
      let line, who;
      if (dialed === CASE.number) { who = 'mehra'; line = `<em>A frightened whisper:</em> "Detective? Thank God, it's me, Mehra. Listen carefully. The woman calling you is NOT my daughter. The proof is in your safe, behind the map. The PIN is the time they broke in. Look at your clock."`; }
      else if (dialed === CASE.press) { who = 'press'; line = `<em>A woman's voice, the same one that called you:</em> "Sharma Printing Press… hello? …Hello?" She hangs up.`; }
      else { who = 'wrong'; line = WRONG[Math.floor(Math.random() * WRONG.length)]; }
      said.innerHTML = line; sfx.tick(900, .04, .1);
      onCall?.(who, dialed);
      setTimeout(() => { callLock = false; }, 600);
    });
  }
  function resetDial() { dialed = ''; queue.length = 0; numEl.textContent = '—'; }
  addEventListener('keydown', (e) => { if (phone.classList.contains('on') && /^[0-9]$/.test(e.key)) dial(e.key === '0' ? 10 : +e.key); });
  phone.querySelector('.hang').onclick = () => { if (spinning) return; sfx.tick(200, .1, .2, 'triangle'); resetDial(); said.textContent = ''; callLock = false; };
  phone.querySelector('.close').onclick = () => { phone.classList.remove('on'); resetDial(); said.textContent = ''; };
  function openPhone(cb) {
    onCall = cb; resetDial(); said.innerHTML = 'Click a number on the dial (or type it). The dial turns and clicks back, like the real thing.';
    phone.classList.add('on'); sfx.tick(260, .12, .25, 'triangle');
    gsap.fromTo(phone.querySelector('.rg-dial2'), { scale: .85, opacity: 0 }, { scale: 1, opacity: 1, duration: .6, ease: 'back.out(1.6)' });
  }

  /* ---------------- vault keypad ---------------- */
  const vault = el(`<div class="rg-layer" id="rg-vault"><div><div class="rg-vault">
    <div class="rg-brand">INDORE SAFE CO. · EST. 1962</div>
    <div class="rg-lcd"><span class="code">----</span><i class="rg-led"></i></div>
    <div class="rg-keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-n="${n}">${n}</button>`).join('')}<button class="fn" data-n="c">CLEAR</button><button data-n="0">0</button><button class="fn" data-n="e">ENTER</button></div>
    <div class="rg-vhint"></div></div>
    <div class="rg-btns" style="justify-content:center;margin-top:16px"><button class="close">STEP BACK</button></div></div></div>`);
  document.body.appendChild(vault);
  const code = vault.querySelector('.code'), led = vault.querySelector('.rg-led'), vhint = vault.querySelector('.rg-vhint');
  let pin = '', tries = 0, onOpen = null;
  const beep = (f = 2200) => sfx.tick(f, .07, .12, 'square');
  function press(n) {
    if (led.classList.contains('green')) return;
    if (n === 'c') { pin = ''; beep(900); }
    else if (n === 'e') return check();
    else if (pin.length < 4) { pin += n; beep(); }
    code.textContent = (pin + '----').slice(0, 4).replace(/\d/g, (d, i) => (i < pin.length - 1 ? '•' : d));
    if (pin.length === 4) setTimeout(check, 250);
  }
  function check() {
    if (pin === CASE.pin) {
      led.className = 'rg-led green'; code.textContent = 'OPEN'; [0, 120, 240].forEach((d, i) => setTimeout(() => beep(1800 + i * 400), d));
      setTimeout(() => { sfx.thud(); onOpen?.(); }, 700);
    } else {
      tries++; led.className = 'rg-led red'; code.textContent = 'ERR'; sfx.tick(140, .4, .25, 'sawtooth');
      const v = vault.querySelector('.rg-vault'); v.classList.remove('rg-shake'); void v.offsetWidth; v.classList.add('rg-shake');
      if (tries >= 3) vhint.textContent = 'GUT: "Something in this room stopped tonight."';
      setTimeout(() => { pin = ''; led.className = 'rg-led'; code.textContent = '----'; }, 900);
    }
  }
  vault.querySelectorAll('.rg-keys button').forEach((b) => b.addEventListener('pointerdown', () => press(b.dataset.n)));
  addEventListener('keydown', (e) => {
    if (!vault.classList.contains('on')) return;
    if (/^[0-9]$/.test(e.key)) press(e.key); if (e.key === 'Enter') press('e'); if (e.key === 'Backspace') press('c');
  });
  vault.querySelector('.close').onclick = () => vault.classList.remove('on');
  function openVault(cb) {
    onOpen = cb; pin = ''; tries = 0; led.className = 'rg-led'; code.textContent = '----'; vhint.textContent = '';
    vault.classList.add('on'); sfx.tick(180, .2, .3, 'triangle');
    gsap.fromTo(vault.querySelector('.rg-vault'), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .6, ease: 'power3.out' });
  }

  return { showBriefing, openPhone, openVault, CASE };
}
