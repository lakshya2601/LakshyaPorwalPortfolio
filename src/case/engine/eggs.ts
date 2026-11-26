// Hidden extras (uncounted): Konami noir mode, typed words, lamp clicks, napping detective, console riddle.
export function initEggs(ctx) {
  const { THREE, cam, lamp, gsap, sfx, chapters, setHead, det, getState } = ctx;
  const $ = (id) => document.getElementById(id);
  const CLUES = { noir: 'Konami code: the film turns black and white', chai: 'Typed "chai"', hire: 'Typed "hire"', lamp: 'Clicked the lamp five times', nap: 'Caught the detective napping', elementary: 'Solved the console riddle' };
  const toast = (t) => { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); gsap.fromTo(d, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .4 }); gsap.to(d, { opacity: 0, delay: 3.2, duration: .6, onComplete: () => d.remove() }); };
  function clue(_k?: string) { /* hidden extras are uncounted now */ }
  /* typed words + konami */
  const K = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let ki = 0, buf = '';
  addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement).closest && (e.target as HTMLElement).closest('input,textarea,select')) return;
    ki = e.key === K[ki] || e.key.toLowerCase() === K[ki] ? ki + 1 : (e.key === K[0] ? 1 : 0);
    if (ki === K.length) { ki = 0; document.body.classList.toggle('noir'); clue('noir'); }
    if (e.key.length === 1) {
      buf = (buf + e.key.toLowerCase()).slice(-12);
      if (buf.endsWith('chai')) { clue('chai'); toast('Chai Thikana break. The detective takes a sip.'); ctx.steam(3500); }
      if (buf.endsWith('hire')) { clue('hire'); if (getState() === 'office') chapters.go(chapters.count() - 1); else toast('Enter the office first. The detective is inside.'); }
      if (buf.endsWith('elementary')) { clue('elementary'); toast('Elementary indeed.'); }
    }
  });

  /* lamp: five quick clicks blows the bulb, one more brings it back */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const lampHit = new THREE.Mesh(new THREE.SphereGeometry(.28, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  lampHit.position.set(.85, 1.1, -4.72); ctx.S.add(lampHit);
  let clicks = [], blown = false;
  addEventListener('click', (e) => {
    if (getState() !== 'office' || (e.target as HTMLElement).closest('.ui')) return;
    ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)); ray.setFromCamera(ndc, cam);
    if (!ray.intersectObject(lampHit).length) return;
    if (blown) { blown = false; gsap.to(lamp, { v: 1, duration: .4 }); sfx.tick(700, .07, .3); return; }
    const now = performance.now(); clicks = clicks.filter((t) => now - t < 2500); clicks.push(now);
    sfx.tick(700, .05, .25); lamp.v = lamp.v > .5 ? .15 : 1; setTimeout(() => { if (!blown) lamp.v = 1; }, 120);
    if (clicks.length >= 5) { blown = true; clicks = []; lamp.v = 0; sfx.tick(2400, .2, .3, 'sawtooth'); toast('Pop. The bulb blew. Click it again to fix it.'); clue('lamp'); }
  });

  /* idle: the detective dozes off */
  let last = performance.now(), napping = false; const zzz = $('zzz'); const hv = new THREE.Vector3();
  const wake = () => { last = performance.now(); if (napping) { napping = false; setHead(0); zzz.style.opacity = '0'; sfx.tick(300, .15, .3, 'triangle'); toast('He jumps awake. "I wasn\'t sleeping. I was thinking."'); clue('nap'); } };
  ['pointermove', 'keydown', 'wheel', 'touchstart'].forEach((ev) => addEventListener(ev, wake, { passive: true }));

  /* tab title */
  const T = document.title;
  document.addEventListener('visibilitychange', () => { document.title = document.hidden ? "Don't leave. The case isn't closed." : T; });

  /* console riddle */
  console.log('%cDetective\'s note', 'font: bold 16px Georgia; color: #c0392b');
  console.log('%cInspecting the evidence? Good instincts.\nRiddle: "When you have eliminated the impossible, whatever remains, however improbable, must be the truth." My dear Watson, it is ______.\nType the missing word anywhere on the page.', 'font: 13px Courier New; color: #555');

  /* birthday: 26 December */
  const d = new Date(); if (d.getDate() === 26 && d.getMonth() === 11) setTimeout(() => toast("It's the detective's birthday today. Cake's on the desk."), 9000);

  return {
    update() {
      if (getState() === 'office' && !napping && performance.now() - last > 25000) { napping = true; setHead(1.25); }
      zzz.style.opacity = napping && [0, 1, chapters.count() - 1].includes(chapters.index) ? '1' : '0';
      if (napping && det.ready) {
        det.bones.Head.getWorldPosition(hv); hv.y += .25; hv.project(cam);
        zzz.style.transform = `translate(${(hv.x * .5 + .5) * innerWidth}px, ${(-hv.y * .5 + .5) * innerHeight}px)`;
      }
    },
  };
}
