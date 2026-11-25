// Detective mode: the visitor is the detective's partner. First person: look around with the mouse
// (drag on touch), walk by clicking the glowing footprints, choose by clicking glowing objects.
// Five beats, each choice scores a method (Evidence / Instinct / Speed) and a focus (sYstems / People / Business).
export function initPlay(ctx) {
  const { THREE, S, cam, gsap, sfx, chapters } = ctx;
  const $ = (id) => document.getElementById(id);
  const sub = $('subtitle'), tip = $('ptip'), end = $('pend'), hud = $('phud');
  const s2 = chapters.s2;

  /* ---------- glow sprite ---------- */
  const gc = document.createElement('canvas'); gc.width = gc.height = 128; const gx = gc.getContext('2d');
  const gr = gx.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,200,120,1)'); gr.addColorStop(.25, 'rgba(255,170,80,.55)'); gr.addColorStop(1, 'rgba(255,150,60,0)');
  gx.fillStyle = gr; gx.fillRect(0, 0, 128, 128); const glowT = new THREE.CanvasTexture(gc);

  /* ---------- extra props used by the story ---------- */
  const props = new THREE.Group(); props.visible = false; S.add(props);
  const label = (txt, bg, fg = '#1a1612') => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 192; const x = c.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, 256, 192); x.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 600; i++) x.fillRect(Math.random() * 256, Math.random() * 192, 2, 2);
    x.fillStyle = fg; x.textAlign = 'center'; x.font = 'bold 30px "Special Elite", Courier New';
    txt.split('\n').forEach((l, i, a) => x.fillText(l, 128, 96 + (i - (a.length - 1) / 2) * 36));
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const photo = (txt, x) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.42, .32), new THREE.MeshBasicMaterial({ map: label(txt, '#d9d1c0'), color: 0xbdb5a4 })); m.position.set(x, 1.95, -7.36); m.rotation.z = (Math.random() - .5) * .12; props.add(m); return m; };
  const pServer = photo('EXHIBIT 1\nTHE DATA', 1.0), pUsers = photo('EXHIBIT 2\nTHE USERS', 1.6), pSales = photo('EXHIBIT 3\nTHE BUSINESS', 2.2);
  const folder = (txt, x, y) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.15, .115), new THREE.MeshBasicMaterial({ map: label(txt, '#d1a868'), color: 0xd8c8a8, side: THREE.DoubleSide })); m.position.set(x, y, -6.84); m.rotation.x = -.35; props.add(m); return m; };
  const fCited = folder('CITED\nSOURCES', -3.08, 1.33), fNotes = folder('SUPPORT\nNOTES', -2.9, 1.39), fQuick = folder('QUICK\nFIXES', -2.72, 1.33);
  // radio + rollback lever on the surveillance cart (world positions near cart at 2.6, -1.4)
  const radio = new THREE.Mesh(new THREE.BoxGeometry(.26, .16, .12), new THREE.MeshStandardMaterial({ color: 0x4a2e1c, roughness: .5 })); radio.position.set(2.05, .86, -1.7); radio.rotation.y = -.8; props.add(radio);
  const lever = new THREE.Group(); lever.position.set(2.15, .81, -1.05); props.add(lever);
  lever.add(new THREE.Mesh(new THREE.BoxGeometry(.14, .05, .14), new THREE.MeshStandardMaterial({ color: 0x222, roughness: .4, metalness: .6 })));
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .22, 8), new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 1, roughness: .3 })); arm.position.y = .11; const leverArm = new THREE.Group(); leverArm.add(arm); lever.add(leverArm);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.035, 16, 12), new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: .3 })); knob.position.y = .22; leverArm.add(knob);
  props.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
  const propLight = new THREE.PointLight(0xffd0a0, 0, 4, 1.6); S.add(propLight);

  /* ---------- the story ---------- */
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const BEATS = [
    {
      at: v(.25, 1.6, -3.05), look: v(-.4, 1.0, -4.8), light: v(-.5, 2.2, -3.6),
      say: 'Partner, you made it. A client just called: their AI started lying overnight. Where do we start?',
      hint: 'Look around. Three things are glowing.',
      opts: [
        { hit: v(-.75, .93, -4.85), size: .35, name: 'Call the client back', k: 'IP', react: 'Smart. Listen first. The client says the bot is inventing refund policies.', act: () => { sfx.ring(); } },
        { hit: v(-2.9, .9, -6.8), size: .7, name: 'Pull the logs', k: 'EY', react: 'The logs never lie. The answers changed at 11:02 PM, right after a deploy.', act: () => { chapters.openDrawer(true); setTimeout(() => chapters.openDrawer(false), 2200); sfx.slide(); } },
        { hit: v(3.3, 1.5, -.75), size: .6, name: 'Grab the coat and go', k: 'SB', react: 'Bold. On the way there, the client mentions a new product launched yesterday.', act: () => { sfx.door(); } },
      ],
    },
    {
      at: v(1.6, 1.65, -5.45), look: v(1.6, 1.95, -7.4), light: v(1.6, 2.6, -6.3),
      say: 'Three suspects on the board. Which string do we pull?',
      opts: [
        { hit: pServer, name: 'The data changed', k: 'EY', react: 'New documents went live and nobody re-indexed them. The model was reading an old archive.' },
        { hit: pUsers, name: 'The users changed', k: 'IP', react: 'People started asking about the new product. The model had never heard of it.' },
        { hit: pSales, name: 'The business changed', k: 'SB', react: 'A launch, a new refund policy, and an AI still quoting the old one. Classic.' },
      ],
    },
    {
      at: v(-2.55, 1.68, -6.05), look: v(-2.9, 1.2, -6.85), light: v(-2.7, 2.0, -6.2), drawer: true,
      say: 'The model needs evidence before it answers. Which file do we trust?',
      opts: [
        { hit: fCited, size: .14, name: 'Only cited sources', k: 'EY', react: 'Retrieve, then answer, with citations. No evidence, no claim. That is RAG done right.' },
        { hit: fNotes, size: .14, name: 'The support team\'s notes', k: 'IP', react: 'The people closest to customers know where it hurts. Their notes go into the archive.' },
        { hit: fQuick, size: .14, name: 'Whatever works tonight', k: 'SB', react: 'A guardrail tonight, a proper fix tomorrow. Customers stop getting wrong answers now.' },
      ],
    },
    {
      at: v(1.25, 1.58, -2.55), look: v(2.5, 1.15, -1.45), light: v(1.8, 2.3, -2.0), mon: true,
      say: '3:12 AM. A monitor just went red: drift detected. Your move?',
      opts: [
        { hit: v(2.24, 1.03, -1.3), size: .3, name: 'Study the red graph', k: 'EY', react: 'Root cause first: the new product pages changed the questions. We retrain on fresh data.' },
        { hit: radio, size: .22, name: 'Wake the team', k: 'IP', react: 'Nobody solves a 3 AM case alone. The team is online in five minutes.', act: () => sfx.tick(520, .4, .12, 'square') },
        { hit: lever, size: .22, name: 'Pull the rollback lever', k: 'SB', react: 'Rolled back in one move. MLflow versioning makes this boring, and boring is good.', act: () => { gsap.to(leverArm.rotation, { x: .9, duration: .35, ease: 'back.out(2)' }); sfx.thud(); } },
      ],
    },
    {
      at: v(-.35, 1.6, -3.2), look: v(.2, 1.0, -4.6), light: v(.3, 2.2, -3.8),
      say: 'The model tells the truth again. How do we close the case?',
      opts: [
        { hit: v(.1, .98, -4.62), size: .4, name: 'Type up the report', k: 'EY', react: 'Cause, fix, prevention. The next detective will thank us.', act: () => { for (let i = 0; i < 8; i++) setTimeout(() => sfx.tick(2300 + Math.random() * 400, .02, .06), i * 70); } },
        { hit: v(.62, .93, -4.3), size: .3, name: 'Chai with the client', k: 'IP', react: 'A kulhad from Chai Thikana. Trust gets rebuilt one sip at a time.', act: () => chapters.steam(4000) },
        { hit: v(3.3, 1.5, -.75), size: .6, name: 'On to the next case', k: 'SB', react: 'Shipped, solved, next. Monitoring stays on so this case never reopens.', act: () => sfx.door() },
      ],
    },
  ];
  const PROFILES = {
    EY: ['The Archivist', 'You trust nothing you can\'t cite. Systems first, proof always.', 'Case #02, the news summarizer that only says what its sources say.'],
    EP: ['The Interrogator', 'You find the truth by asking people the right questions, then checking every answer.', 'Case #01, text-to-SQL: anyone can question the data.'],
    EB: ['The Auditor', 'You follow the numbers until they confess.', 'Case #03, the platform install cut by 40%.'],
    IY: ['The Bloodhound', 'You smell a broken pipeline before the dashboard turns red.', 'The surveillance room: drift alarms and retraining.'],
    IP: ['The Diplomat', 'You solve cases by keeping everyone on the same side.', 'The classroom: teaching MLOps to new engineers.'],
    IB: ['The Strategist', 'You see the business move before the model does.', 'Case #01: plain-English questions for business teams.'],
    SY: ['The Fixer', 'Rollback first, root cause second, sleep third.', 'The surveillance room: CI/CD that makes rollbacks boring.'],
    SP: ['The Night Watch', 'When the alarm rings at 3 AM, you are already online.', 'Case #02: monitoring health, errors and cost.'],
    SB: ['The Closer', 'Shipped, solved, next case. Open tickets keep you up at night.', 'Case #03: offline installs that just work.'],
    E: ['Sherlock', 'Five moves, five pieces of evidence. Elementary.', 'All of them. You would read the whole archive.'],
    I: ['The Oracle', 'Pure instinct, and somehow right every time.', 'The evidence board: you saw the strings before they were pinned.'],
    S: ['The Flash', 'Five decisions, five shortcuts, zero regrets.', 'The surveillance room: you would pull the lever first.'],
  };
  const METHOD = { E: 'evidence', I: 'instinct', S: 'speed' }, FOCUS = { Y: 'systems', P: 'people', B: 'business' };

  /* ---------- state ---------- */
  let active = false, beat = -1, picks = [], hot = [], canPick = false, walking = false;
  const pos = v(0, 1.6, -1.6), base = { yaw: Math.PI, pitch: 0 }, look = { yaw: 0, pitch: 0 }, cur = { yaw: Math.PI, pitch: 0 };
  let mx = 0, my = 0, drag = null;
  addEventListener('pointermove', (e) => {
    if (!active) return;
    if (e.pointerType === 'mouse') { mx = e.clientX / innerWidth * 2 - 1; my = -(e.clientY / innerHeight * 2 - 1); }
    else if (drag) { mx = Math.max(-1.6, Math.min(1.6, drag.mx + (drag.x - e.clientX) / innerWidth * -3)); my = Math.max(-1, Math.min(1, drag.my - (drag.y - e.clientY) / innerHeight * 2)); }
    hover(e);
  });
  addEventListener('pointerdown', (e) => { if (active && e.pointerType !== 'mouse') drag = { x: e.clientX, y: e.clientY, mx, my }; });
  addEventListener('pointerup', () => { drag = null; });
  const yawFrom = (from, to) => Math.atan2(-(to.x - from.x), -(to.z - from.z));
  const pitchFrom = (from, to) => Math.atan2(to.y - from.y, Math.hypot(to.x - from.x, to.z - from.z));

  // footprints marker
  const ringM = new THREE.MeshBasicMaterial({ color: 0xffb060, transparent: true, opacity: .8, depthWrite: false, blending: THREE.AdditiveBlending });
  const marker = new THREE.Mesh(new THREE.RingGeometry(.16, .22, 40), ringM); marker.rotation.x = -Math.PI / 2; marker.visible = false; S.add(marker);
  const markerHit = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .1, 12), new THREE.MeshBasicMaterial({ visible: false })); S.add(markerHit);

  function say(text, cls = '') {
    sub.className = 'ui ' + cls; sub.textContent = ''; gsap.to(sub, { opacity: 1, duration: .3 });
    let i = 0; clearInterval(say.t); say.t = setInterval(() => { sub.textContent = text.slice(0, ++i); if (i % 3 === 0) sfx.tick(2400 + Math.random() * 300, .015, .03); if (i >= text.length) clearInterval(say.t); }, 22);
  }
  function clearHot() { hot.forEach((h) => { S.remove(h.glow); S.remove(h.hitM); }); hot = []; }
  function setupBeat(i) {
    const B = BEATS[i]; clearHot(); canPick = false;
    propLight.position.copy(B.light); gsap.to(propLight, { intensity: 3, duration: .8 });
    if (B.drawer) chapters.openDrawer(true); if (B.mon) { s2.setAlarm(1); sfx.tick(880, .15, .15, 'square'); }
    s2.monGlow.intensity = B.mon ? 3 : 0; s2.forceMon = !!B.mon;
    say('DETECTIVE: ' + B.say);
    hud.textContent = `CASE OF THE LYING MODEL · ${i + 1}/5`;
    setTimeout(() => {
      B.opts.forEach((o) => {
        const p = o.hit.isVector3 ? o.hit.clone() : o.hit.getWorldPosition(v(0, 0, 0));
        const size = o.size || .38;
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true, opacity: 0 }));
        glow.position.copy(p); glow.scale.setScalar(size * 1.4); S.add(glow);
        const hitM = new THREE.Mesh(new THREE.SphereGeometry(size * .6, 10, 8), new THREE.MeshBasicMaterial({ visible: false })); hitM.position.copy(p); S.add(hitM);
        gsap.to(glow.material, { opacity: .45, duration: .8 });
        hot.push({ o, glow, hitM, size });
      });
      canPick = true;
      if (B.hint) setTimeout(() => { if (canPick && beat === i) tip.textContent = B.hint, gsap.to(tip, { opacity: 1, duration: .4 }), tip.style.transform = 'translate(-50%,0)', tip.style.left = '50%', tip.style.top = '14vh'; }, 2500);
    }, 1200);
  }
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let hov = null;
  function hover(e) {
    if (!canPick && !marker.visible) return;
    ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)); ray.setFromCamera(ndc, cam);
    let h = null;
    if (canPick) { const hit = ray.intersectObjects(hot.map((x) => x.hitM))[0]; h = hit ? hot.find((x) => x.hitM === hit.object) : null; }
    const onMarker = marker.visible && ray.intersectObject(markerHit).length > 0;
    document.body.style.cursor = h || onMarker ? 'pointer' : '';
    if (h !== hov) { hov = h; if (h) sfx.tick(1500, .02, .04); }
    if (h || onMarker) { tip.textContent = h ? h.o.name : 'Walk here'; tip.style.left = e.clientX + 'px'; tip.style.top = (e.clientY - 44) + 'px'; tip.style.transform = 'translate(-50%,0)'; tip.style.opacity = 1; }
    else if (tip.textContent !== BEATS[beat]?.hint) tip.style.opacity = 0;
  }
  addEventListener('click', (e) => {
    if (!active || e.target.closest('.ui')) return;
    ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)); ray.setFromCamera(ndc, cam);
    if (marker.visible && ray.intersectObject(markerHit).length) { walkTo(beat + 1); return; }
    if (!canPick) return;
    const hit = ray.intersectObjects(hot.map((x) => x.hitM))[0]; if (!hit) return;
    pick(hot.find((x) => x.hitM === hit.object));
  });
  addEventListener('keydown', (e) => { if (active && marker.visible && (e.key === 'Enter' || e.key === ' ')) walkTo(beat + 1); });
  function pick(h) {
    canPick = false; tip.style.opacity = 0; picks.push(h.o.k); sfx.tick(900, .06, .2, 'triangle');
    hot.forEach((x) => gsap.to(x.glow.material, { opacity: x === h ? 1 : 0, duration: .4 }));
    gsap.to(h.glow.scale, { x: h.size * 2.4, y: h.size * 2.4, duration: .5, yoyo: true, repeat: 1 });
    h.o.act?.();
    // look at the chosen thing
    const p = h.glowPos || h.glow.position; gsap.to(base, { yaw: yawFrom(pos, p), pitch: pitchFrom(pos, p), duration: .8, ease: 'power2.out' });
    setTimeout(() => say('DETECTIVE: ' + h.o.react, 'react'), 500);
    setTimeout(() => {
      clearHot(); const B = BEATS[beat]; if (B.drawer) chapters.openDrawer(false); if (B.mon) { s2.setAlarm(-1); }
      if (beat === BEATS.length - 1) { finish(); return; }
      const nb = BEATS[beat + 1]; marker.position.set(nb.at.x, .02, nb.at.z); markerHit.position.set(nb.at.x, .05, nb.at.z); marker.visible = true;
      gsap.to(base, { yaw: yawFrom(pos, nb.at), pitch: -.35, duration: 1.2, ease: 'power2.inOut' });
      tip.textContent = 'Click the glowing footprints to walk'; tip.style.left = '50%'; tip.style.top = '14vh'; tip.style.transform = 'translate(-50%,0)'; gsap.to(tip, { opacity: 1, duration: .4 });
      setTimeout(() => { if (marker.visible && active) walkTo(beat + 1); }, 9000);
    }, 4200);
  }
  function walkTo(i) {
    if (walking || i >= BEATS.length) return; walking = true; marker.visible = false; tip.style.opacity = 0; mx = my = 0;
    const B = BEATS[i], from = pos.clone(), dist = from.distanceTo(B.at), dur = Math.max(1.4, dist * .7);
    gsap.to(base, { yaw: yawFrom(from, B.at), pitch: 0, duration: .5 });
    const st = { t: 0 };
    gsap.to(st, { t: 1, duration: dur, ease: 'power1.inOut', onUpdate: () => {
      pos.lerpVectors(from, B.at, st.t); pos.y = B.at.y + Math.abs(Math.sin(st.t * dist * 4.2)) * .035 - .02;
      const step = Math.floor(st.t * dist * 2.1); if (step !== walkTo.s) { walkTo.s = step; sfx.step(); }
    }, onComplete: () => {
      gsap.to(base, { yaw: yawFrom(B.at, B.look), pitch: pitchFrom(B.at, B.look), duration: .9, ease: 'power2.out' });
      walking = false; beat = i; setupBeat(i);
    } });
  }
  function finish() {
    const cm = {}, cf = {};
    picks.forEach((k) => { cm[k[0]] = (cm[k[0]] || 0) + 1; cf[k[1]] = (cf[k[1]] || 0) + 1; });
    const tm = Object.entries(cm).sort((a, b) => b[1] - a[1])[0], tf = Object.entries(cf).sort((a, b) => b[1] - a[1])[0];
    const key = tm[1] >= 5 ? tm[0] : tm[0] + tf[0]; const P = PROFILES[key];
    say('DETECTIVE: Partner, I have been watching how you work. Here is my report.');
    gsap.to(base, { yaw: yawFrom(pos, v(0, 1.3, -5.4)), pitch: pitchFrom(pos, v(0, 1.3, -5.4)), duration: 1.2 });
    setTimeout(() => {
      end.querySelector('h2').textContent = P[0];
      end.querySelector('.pdesc').textContent = P[1];
      end.querySelector('.pmeta').innerHTML = `<b>Method:</b> ${METHOD[tm[0]]} · <b>Focus:</b> ${FOCUS[tf[0]]}`;
      end.querySelector('.pcase').textContent = P[2];
      end.dataset.profile = P[0];
      end.style.display = 'flex'; gsap.fromTo(end.firstElementChild, { y: 40, opacity: 0, rotate: -3 }, { y: 0, opacity: 1, rotate: -1, duration: .9, ease: 'power3.out' });
      const st = end.querySelector('.pstamp'); gsap.fromTo(st, { opacity: 0, scale: 2.4 }, { opacity: 1, scale: 1, duration: .28, delay: 1, ease: 'power4.in', onComplete: sfx.thud });
      gsap.to([sub, hud], { opacity: 0, duration: .5 });
    }, 2600);
  }
  end.querySelector('.phire').onclick = () => { stop(); ctx.toTour(true); };
  end.querySelector('.ptour').onclick = () => { stop(); ctx.toTour(false); };
  end.querySelector('.pshare').onclick = async () => {
    const text = `I played detective with Lakshya Porwal and got "${end.dataset.profile}". Which partner are you?`;
    try { if (navigator.share) await navigator.share({ title: 'Case Files', text, url: location.href }); else { await navigator.clipboard.writeText(text + ' ' + location.href); end.querySelector('.pshare').textContent = 'COPIED'; } } catch (e) { /* cancelled */ }
  };
  function stop() {
    active = false; clearHot(); s2.forceMon = false; marker.visible = false; props.visible = false; end.style.display = 'none'; tip.style.opacity = 0;
    gsap.to([sub, hud], { opacity: 0, duration: .4 }); gsap.to(propLight, { intensity: 0, duration: .5 }); document.body.style.cursor = ''; leverArm.rotation.x = 0;
  }
  return {
    get active() { return active; },
    start() {
      active = true; beat = -1; picks = []; props.visible = true; pos.set(.1, 1.55, -1.6); base.yaw = Math.PI; base.pitch = -.05; cur.yaw = base.yaw; cur.pitch = base.pitch;
      gsap.to(hud, { opacity: 1, duration: .6 }); walkTo(0);
    },
    stop, _pick: (j) => canPick && hot[j] && pick(hot[j]), _walk: () => walkTo(beat + 1), get beat() { return beat; },
    camera(dt) {
      const tyaw = base.yaw - mx * .85, tp = base.pitch + my * .32;
      cur.yaw += (tyaw - cur.yaw) * Math.min(1, dt * 4); cur.pitch += (tp - cur.pitch) * Math.min(1, dt * 4);
      cam.position.copy(pos);
      const d = v(-Math.sin(cur.yaw) * Math.cos(cur.pitch), Math.sin(cur.pitch), -Math.cos(cur.yaw) * Math.cos(cur.pitch));
      cam.lookAt(pos.x + d.x, pos.y + d.y, pos.z + d.z);
      marker.scale.setScalar(1 + Math.sin(performance.now() * .005) * .12);
      for (const h of hot) if (canPick) h.glow.material.opacity = .35 + Math.sin(performance.now() * .004 + h.size * 10) * .15 + (hov === h ? .35 : 0);
    },
  };
}
