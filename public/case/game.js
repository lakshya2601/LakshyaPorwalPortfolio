// THE RAIN DOESN'T STOP — first-person case at the detective's desk.
// Asha Mehra brought everything she found where her husband Rakesh's phone last pinged.
// Find where the kidnappers are keeping him before sunrise.
export function initGame(ctx) {
  const { THREE, S, cam, gsap, sfx, ac, master, ev, rain, lamp } = ctx;
  const $ = (id) => document.getElementById(id);
  const el = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
  const P = './assets/props/';

  /* ---------------- UI shell ---------------- */
  const ui = el(`<div id="gm">
    <div class="gm-obj"><div class="gm-h">CASE NOTES · 3:12 AM</div><ol></ol></div>
    <aside class="gm-info"><div class="gm-k"></div><h3></h3><p class="gm-d"></p><p class="gm-v"></p><div class="gm-tip">click to inspect</div></aside>
    <div class="gm-sub"></div>
    <div class="gm-toast"></div>
    <div class="gm-btns"><button class="gm-board">LOOK AT THE BOARD</button><button class="gm-map" disabled>MARK THE MAP</button></div>
    <div class="gm-inspect"><div class="gm-card"></div><div class="gm-ibtns"><button class="gm-flip">FLIP OVER</button><button class="gm-close">PUT IT DOWN</button></div></div>
    <div class="gm-rec"></div>
    <div class="gm-pin"></div>
    <div class="gm-end"></div>
    <div class="gm-guide"><i></i><span></span></div>
  </div>`);
  document.body.appendChild(ui);
  const objList = ui.querySelector('.gm-obj ol'), info = ui.querySelector('.gm-info'), sub = ui.querySelector('.gm-sub'), toastEl = ui.querySelector('.gm-toast');
  const inspect = ui.querySelector('.gm-inspect'), card = ui.querySelector('.gm-card'), rec = ui.querySelector('.gm-rec'), pinUI = ui.querySelector('.gm-pin'), endUI = ui.querySelector('.gm-end');
  const btnBoard = ui.querySelector('.gm-board'), btnMap = ui.querySelector('.gm-map');

  const OBJ = [
    { id: 'listen', t: 'Listen to the ransom call on Asha\'s phone' },
    { id: 'search', t: 'Go through what Asha brought (4 items)' },
    { id: 'call', t: 'Work out the godown\'s number and call it' },
    { id: 'map', t: 'Mark on the map where Rakesh is being held' },
  ];
  const done = new Set();
  function renderObj() { objList.innerHTML = OBJ.map((o) => `<li class="${done.has(o.id) ? 'ok' : ''}">${o.t}</li>`).join(''); }
  function complete(id) { if (done.has(id)) return; done.add(id); renderObj(); sfx.tick(1200, .08, .12, 'triangle'); if (id === 'call') { btnMap.disabled = false; toast('Now mark the map: where is Rakesh?'); } }
  function toast(t, ms = 3200) { toastEl.textContent = t; gsap.killTweensOf(toastEl); gsap.fromTo(toastEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .35 }); gsap.to(toastEl, { opacity: 0, delay: ms / 1000, duration: .6 }); }
  let subT; function say(who, text, ms = 5200) {
    sub.innerHTML = `<b>${who}</b> ${text}`; gsap.killTweensOf(sub); gsap.to(sub, { opacity: 1, duration: .3 }); clearTimeout(subT); subT = setTimeout(() => gsap.to(sub, { opacity: 0, duration: .5 }), ms);
  }

  /* ---------------- the evidence board (findings appear as pinned cards with string) ---------------- */
  const OZ = -7.5, BZ = OZ + .12;
  const board = new THREE.Group(); board.visible = false; S.add(board);
  const cardTex = (title, body, accent) => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 360; const x = c.getContext('2d');
    x.fillStyle = '#efe5cd'; x.fillRect(0, 0, 512, 360); for (let i = 0; i < 1600; i++) { x.fillStyle = `rgba(80,60,30,${Math.random() * .06})`; x.fillRect(Math.random() * 512, Math.random() * 360, 2, 2); }
    x.fillStyle = accent; x.fillRect(0, 0, 512, 10); x.fillStyle = '#1d1813';
    let fs = 36; do { x.font = `bold ${fs}px "Special Elite", "Courier New"`; fs -= 2; } while (x.measureText(title).width > 464 && fs > 18); x.fillText(title, 24, 84);
    x.font = '27px "Special Elite", "Courier New"'; x.fillStyle = '#2b241c';
    const words = body.split(' '); let line = '', y = 136; for (const w of words) { if (x.measureText(line + w).width > 460) { x.fillText(line, 24, y); line = ''; y += 38; } line += w + ' '; } x.fillText(line, 24, y);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  };
  const center = new THREE.Mesh(new THREE.PlaneGeometry(.4, .3), new THREE.MeshBasicMaterial({ map: cardTex('RAKESH MEHRA', 'Reporter, Indore Evening Post. Missing since 11:47 PM.', '#1d1813'), color: 0xc9c0ae }));
  center.position.set(1.6, 2.2, BZ + .003); board.add(center);
  const SLOTS = [[.8, 2.45], [2.4, 2.45], [.8, 1.72], [2.4, 1.72], [1.6, 1.62], [1.6, 2.72], [1.12, 2.08], [2.08, 2.08]];
  const pinned = [];
  function pinFinding(title, body, accent = '#a3231d') {
    if (pinned.find((p) => p.title === title)) return;
    const [x, y] = SLOTS[pinned.length % SLOTS.length];
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.42, .3), new THREE.MeshBasicMaterial({ map: cardTex(title, body, accent), color: 0xc9c0ae, transparent: true }));
    m.position.set(x, y, BZ + .004 + pinned.length * .0015); m.rotation.z = (Math.random() - .5) * .12; board.add(m);
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(1.6, 2.3, BZ + .02), new THREE.Vector3(x, y + .12, BZ + .02)]);
    const s = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xc0392b })); board.add(s);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(.016, 10, 8), new THREE.MeshBasicMaterial({ color: 0xc0392b })); pin.position.set(x, y + .12, BZ + .022); board.add(pin);
    pinned.push({ title, m });
    toast(`Pinned to the board: ${title}`);
  }

  /* ---------------- items: what you learn from each ---------------- */
  const ITEMS = {
    asha: { k: 'ASHA\'S PHONE', t: 'The ransom call', d: 'Asha recorded the call that came at 2:15 AM. Her phone records every call automatically.', v: 'GUT: "Listen past the voice. Kidnappers forget the world behind them."', open: () => openRecording() },
    watch: { k: 'EVIDENCE', t: 'Rakesh\'s wristwatch', d: 'Found by Asha on the road near Chhoti Gwaltoli, where his phone last pinged. The glass is cracked. It stopped at 11:47.', v: 'LOGIC: "11:47 PM. That\'s when they took him."', img: 'watch', pin: ['TAKEN AT 11:47 PM', 'His watch broke in the struggle near Chhoti Gwaltoli, his last location.'] },
    story: { k: 'RAKESH\'S DRAFT', t: '"Sawdust in your poha"', d: 'His unpublished story: fake jeeravan masala, cut with sawdust and colour, packed at night in a godown near the railway line.', v: 'LOGIC: "Motive. Somebody did not want this printed."', img: 'story.jpg', pin: ['MOTIVE', 'Fake jeeravan packed at night in a godown near the railway line. Swad Masala Udyog.'] },
    notebook: { k: 'RAKESH\'S NOTEBOOK', t: 'Last notes', d: 'Three places he meant to check. And a line about the godown phone: "ext. 14 · 21".', v: 'GUT: "He circled number three twice."', img: 'notebook.jpg', pin: ['THREE PLACES', 'Platform 1 waiting room, Sarwate stand, or behind Platform 4. Godown line: ext. 14 · 21.'] },
    bizcard: { k: 'BUSINESS CARD', t: 'Swad Masala Udyog', d: 'Soaked in the rain. The godown\'s 24-hour line is printed, but the middle digits are washed out: 1987 · ▢▢ · ▢▢ · 60.', v: 'LOGIC: "Four digits missing. His notebook had two pairs of numbers."', img: 'bizcard.jpg', pin: ['GODOWN PHONE', '1987 · ?? · ?? · 60. Middle digits washed out by rain.'] },
    ticket: { k: 'BUS TICKET', t: 'Route 21', d: 'Rajwada to Sarwate Bus Stand, 10:58 PM. Sarwate is right next to Indore Junction railway station.', v: 'LOGIC: "He was heading for the station."', img: 'ticket.jpg', pin: ['HEADING TO THE STATION', 'Bus 21, Rajwada to Sarwate stand, 10:58 PM.'] },
    receipt: { k: 'RECEIPT', t: 'Chai Thikana, 9:12 PM', d: 'Two cutting chai and a bun maska. He met someone before he left. Probably his informant.', v: 'CHAI: "Two cups. He wasn\'t alone. Also, I want a bun maska."', img: 'receipt.jpg' },
    pressid: { k: 'PRESS ID', t: 'Rakesh Mehra, Indore Evening Post', d: 'The photo is water-damaged. Something is written on the back.', v: 'GUT: "Turn it over."', img: 'pressid.jpg', back: 'pressid_back.jpg' },
    packet: { k: 'EVIDENCE', t: 'Fake jeeravan packet', d: 'Jeeravan is Indore\'s signature spice mix (roasted cumin, fennel, black salt and more), sprinkled on poha. This one is misspelt "JEERAVN" and smells of nothing.', v: 'CHAI: "Real jeeravan you smell from the doorway. This is sawdust in a nice dress."', img: 'packet.jpg', pin: ['THE FAKE', 'Misspelt "JEERAVN" packet. No packer, no batch number.'] },
    map: { k: 'YOUR MAP', t: 'Indore city map', d: 'Your own markings: a circle around Indore Junction, a cross behind Platform 4, Bus 21 in blue.', v: 'LOGIC: "When you know where, mark it."', img: 'map.jpg', mapPin: true },
    phone: { k: 'OFFICE PHONE', t: 'Rotary phone', d: 'Your office line. It still works, rain or no rain.', v: 'GUT: "Some numbers are worth dialling."', dial: true },
  };
  const SEARCH = ['story', 'notebook', 'bizcard', 'watch', 'ticket', 'packet', 'pressid', 'receipt'];
  const seen = new Set();

  /* ---------------- camera & picking ---------------- */
  const HOME = { px: -.2, py: 1.6, pz: -3.5, lx: -.2, ly: .84, lz: -4.58 };
  const BOARD = { px: 1.6, py: 2.12, pz: -4.75, lx: 1.6, ly: 2.12, lz: -7.5 };
  const view = { ...HOME }; let mode = 'off', mx = 0, my = 0, sx = 0, sy = 0, hovered = null;
  addEventListener('pointermove', (e) => {
    if (mode === 'off') return; mx = e.clientX / innerWidth * 2 - 1; my = -(e.clientY / innerHeight * 2 - 1);
    if (mode !== 'desk' || e.target.tagName !== 'CANVAS') { if (hovered) { hovered = null; showInfo(null); document.body.style.cursor = ''; } return; }
    const id = pick(e); if (id !== hovered) { hovered = id; showInfo(id); }
    document.body.style.cursor = id ? 'zoom-in' : '';
  });
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(e) {
    ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)); ray.setFromCamera(ndc, cam);
    const hit = ray.intersectObjects(ev.group.children, true)[0]; if (!hit) return null;
    let o = hit.object; while (o && !o.userData.id) o = o.parent; return o?.userData.id || null;
  }
  function showInfo(id) {
    if (!id) { gsap.to(info, { opacity: 0, x: 20, duration: .25, overwrite: true }); return; }
    const it = ITEMS[id]; info.querySelector('.gm-k').textContent = it.k; info.querySelector('h3').textContent = it.t;
    info.querySelector('.gm-d').textContent = it.d; info.querySelector('.gm-v').textContent = it.v;
    gsap.to(info, { opacity: 1, x: 0, duration: .3, overwrite: true }); sfx.tick(1500, .02, .04);
  }
  addEventListener('click', (e) => {
    if (mode !== 'desk' || e.target.tagName !== 'CANVAS') return;
    const id = pick(e); if (!id) return; open(id);
  });

  /* ---------------- inspect ---------------- */
  let flipped = false, curItem = null;
  function open(id) {
    const it = ITEMS[id]; curItem = id; showInfo(null);
    if (it.open) return it.open();
    if (it.dial) return openDial();
    if (it.mapPin) return openMap();
    mode = 'inspect'; flipped = false; sfx.paper?.();
    const src = it.img === 'watch' ? null : P + it.img;
    card.className = 'gm-card' + (id === 'watch' ? ' watch' : '') + (['story', 'notebook', 'map'].includes(id) ? ' tall' : '');
    card.innerHTML = id === 'watch'
      ? `<div class="wt"><img src="${P}watch_dial.png" alt=""><i class="h" style="transform:rotate(${(11 + 47 / 60) * 30}deg)"></i><i class="m" style="transform:rotate(${47 * 6}deg)"></i><img class="cr" src="${P}watch_crack.png" alt=""></div>`
      : `<img src="${src}" alt="${it.t}">`;
    ui.querySelector('.gm-flip').style.display = it.back ? '' : 'none';
    inspect.classList.add('on'); gsap.fromTo(card, { y: 60, rotate: -6, opacity: 0, scale: .9 }, { y: 0, rotate: -1.5, opacity: 1, scale: 1, duration: .6, ease: 'power3.out' });
    say(it.v.split(':')[0] + ':', it.v.split(':').slice(1).join(':').trim(), 6000);
    if (!seen.has(id)) {
      seen.add(id); if (it.pin) setTimeout(() => pinFinding(...it.pin), 900);
      const n = SEARCH.filter((s) => seen.has(s)).length; if (n >= 4) complete('search');
    }
  }
  ui.querySelector('.gm-flip').onclick = () => {
    const it = ITEMS[curItem]; flipped = !flipped; sfx.paper?.();
    gsap.to(card, { rotateY: 90, duration: .2, onComplete: () => { card.querySelector('img').src = P + (flipped ? it.back : it.img); gsap.fromTo(card, { rotateY: -90 }, { rotateY: 0, duration: .25 }); } });
    if (flipped && curItem === 'pressid') { say('GUT:', '"Follow the masala." He knew exactly who was after him.'); pinFinding('FOLLOW THE MASALA', 'Back of his press ID: "If I go missing, tell Asha: follow the masala."', '#1f4e79'); }
  };
  ui.querySelector('.gm-close').onclick = closeInspect;
  function closeInspect() { inspect.classList.remove('on'); mode = 'desk'; }
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && mode === 'inspect') closeInspect(); });

  /* ---------------- Asha's recording with a tape mixer ---------------- */
  const CUES = [
    { t: .6, voice: 'We have the reporter.' }, { t: 3.6, voice: 'Bring every paper he gave you. No police.' }, { t: 7.4, voice: 'We call again at sunrise. One mistake and…' },
    { t: 2.2, bg: 'horn', cap: 'a TRAIN HORN, close by' }, { t: 5.4, bg: 'chime', cap: 'the railway chime: "…yatri kripya dhyan dein… platform number 4…"' },
    { t: 8.8, bg: 'chai', cap: 'a vendor: "chai… garam chai…"' }, { t: 0, bg: 'rain', cap: 'rain drumming on a tin roof' },
  ];
  const heard = new Set(); let recPlaying = false;
  function openRecording() {
    mode = 'inspect';
    rec.innerHTML = `<div class="gm-phone">
      <div class="gp-top">Call recordings</div>
      <div class="gp-card"><div class="gp-who"><b>Unknown number</b><span>Incoming · Today, 2:15 AM · 0:11</span></div>
      <div class="gp-wave">${Array.from({ length: 56 }, (_, i) => `<i style="height:${18 + Math.abs(Math.sin(i * .37)) * 60 + Math.random() * 20}%"></i>`).join('')}</div>
      <button class="gp-play">▶  PLAY</button></div>
      <div class="gp-mix"><div><label>VOICE</label><input type="range" min="0" max="100" value="90" class="mv"></div><div><label>BACKGROUND</label><input type="range" min="0" max="100" value="15" class="mb"></div></div>
      <div class="gp-cap"></div>
      <div class="gp-heard"></div>
      <button class="gp-close">GIVE THE PHONE BACK TO THE DESK</button></div>`;
    rec.classList.add('on'); gsap.fromTo(rec.firstElementChild, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: .5 });
    say('GUT:', '"Turn the voice down. Turn the world up."', 6000);
    rec.querySelector('.gp-play').onclick = playRecording;
    rec.querySelector('.gp-close').onclick = () => { rec.classList.remove('on'); mode = 'desk'; recPlaying = false; };
    renderHeard();
  }
  function renderHeard() {
    const h = rec.querySelector('.gp-heard'); if (!h) return;
    const names = { horn: 'Train horn', chime: 'Platform 4 announcement', chai: 'Chai vendor', rain: 'Tin roof in the rain' };
    h.innerHTML = Object.keys(names).map((k) => `<span class="${heard.has(k) ? 'on' : ''}">${heard.has(k) ? '✓ ' : '… '}${names[k]}</span>`).join('');
  }
  function playRecording() {
    if (recPlaying) return; recPlaying = true; const cap = rec.querySelector('.gp-cap'); const bars = rec.querySelectorAll('.gp-wave i');
    const mv = () => +rec.querySelector('.mv').value / 100, mb = () => +rec.querySelector('.mb').value / 100;
    const start = performance.now(); const A = ac(); const out = A ? A.createGain() : null; if (out) { out.connect(master()); }
    // rain bed on tin: filtered noise with tick rattle
    let bed; if (A) { const n = A.createBuffer(1, A.sampleRate * 11, A.sampleRate), d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (Math.random() < .002 ? 4 : .6); bed = A.createBufferSource(); bed.buffer = n; const f = A.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3200; f.Q.value = .7; const g = A.createGain(); g.gain.value = .0; bed.connect(f).connect(g).connect(out); bed.start(); bed.g = g; }
    const fired = new Set();
    const tick = () => {
      if (!recPlaying) { bed?.stop(); return; }
      const t = (performance.now() - start) / 1000, p = Math.min(1, t / 11);
      bars.forEach((b, i) => b.classList.toggle('on', i / bars.length < p));
      if (bed) bed.g.gain.value = .25 * mb();
      for (const c of CUES) {
        if (t >= c.t && !fired.has(c)) {
          fired.add(c);
          if (c.voice) { if (A) muffledVoice(A, out, mv()); cap.innerHTML = mv() > .35 ? `<em>Muffled voice:</em> "${c.voice}"` : '<em>Voice turned down.</em>'; }
          else {
            if (A) bgSound(A, out, c.bg, mb());
            const clear = mb() > .6 && mv() < .5;
            if (clear) { heard.add(c.bg); cap.innerHTML = `<em>In the background:</em> ${c.cap}`; renderHeard(); }
            else if (c.bg !== 'rain') cap.innerHTML += ' <span class="dim">[something behind the voice…]</span>';
          }
        }
      }
      if (t < 11.2) requestAnimationFrame(tick);
      else {
        recPlaying = false; bed?.stop(); const pb = rec.querySelector('.gp-play'); if (pb) pb.textContent = '↺  PLAY AGAIN';
        if (heard.has('horn') && heard.has('chime')) {
          complete('listen'); pinFinding('NEAR INDORE JUNCTION', 'Ransom call background: train horn and the Platform 4 announcement.', '#1f4e79');
          say('LOGIC:', '"A train horn and a Platform 4 announcement. They are holding him right by Indore Junction. But where exactly?"', 7500);
        } else if (mb() < .6 || mv() > .5) say('GUT:', '"Too much voice. Pull the voice fader down, push the background up, then play it again."', 6000);
      }
    };
    requestAnimationFrame(tick);
  }
  function muffledVoice(A, out, vol) {
    const o = A.createOscillator(), o2 = A.createOscillator(), f = A.createBiquadFilter(), g = A.createGain(); o.type = 'sawtooth'; o2.type = 'square';
    o.frequency.value = 95; o2.frequency.value = 97; f.type = 'lowpass'; f.frequency.value = 520; g.gain.value = 0;
    const T = A.currentTime; for (let i = 0; i < 9; i++) { g.gain.setValueAtTime(.12 * vol, T + i * .28); g.gain.setValueAtTime(.02 * vol, T + i * .28 + .18); o.frequency.setValueAtTime(85 + Math.random() * 35, T + i * .28); }
    g.gain.setValueAtTime(0, T + 2.6); o.connect(f); o2.connect(f); f.connect(g).connect(out); o.start(); o2.start(); o.stop(T + 2.7); o2.stop(T + 2.7);
  }
  function bgSound(A, out, kind, vol) {
    const T = A.currentTime, g = A.createGain(); g.connect(out);
    if (kind === 'horn') { [311, 392].forEach((fq) => { const o = A.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fq; const f = A.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400; o.connect(f).connect(g); o.start(T); o.stop(T + 1.6); }); g.gain.setValueAtTime(0, T); g.gain.linearRampToValueAtTime(.12 * vol, T + .15); g.gain.setValueAtTime(.12 * vol, T + 1.3); g.gain.linearRampToValueAtTime(0, T + 1.6); }
    if (kind === 'chime') { [659, 784, 523].forEach((fq, i) => { const o = A.createOscillator(); o.type = 'sine'; o.frequency.value = fq; const gg = A.createGain(); gg.gain.setValueAtTime(0, T + i * .35); gg.gain.linearRampToValueAtTime(.18 * vol, T + i * .35 + .02); gg.gain.exponentialRampToValueAtTime(.001, T + i * .35 + .9); o.connect(gg).connect(g); o.start(T + i * .35); o.stop(T + i * .35 + 1); }); g.gain.value = 1; }
    if (kind === 'chai') { [0, .5].forEach((d) => { const o = A.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(420, T + d); o.frequency.linearRampToValueAtTime(330, T + d + .35); const gg = A.createGain(); gg.gain.setValueAtTime(.09 * vol, T + d); gg.gain.linearRampToValueAtTime(0, T + d + .4); o.connect(gg).connect(g); o.start(T + d); o.stop(T + d + .45); }); g.gain.value = 1; }
  }

  /* ---------------- dialing the godown ---------------- */
  function openDial() {
    mode = 'inspect';
    rain.openPhone((who) => {
      if (who === 'godown') {
        complete('call'); pinFinding('GODOWN LINE = RANSOM CALL', 'Same train horn, same Platform 4 announcement behind the man who answered.', '#1f4e79');
        setTimeout(() => say('LOGIC:', '"Same horn. Same platform. The godown is where they are keeping him."', 7000), 600);
      }
    }, {
      number: '1987142160',
      right: '<em>A gruff voice:</em> "Haan? Who is this… it\'s three in the morning." Behind him, clear as day: <em>a train horn</em>, then the chime: <em>"…platform number 4…"</em>. He hangs up.',
      who: 'godown',
    });
    const closeBtn = document.querySelector('#rg-phone .close'); const prev = closeBtn.onclick;
    closeBtn.onclick = () => { prev?.(); mode = 'desk'; };
  }

  /* ---------------- marking the map ---------------- */
  const SPOTS = [
    { id: 'pl1', x: 49.8, y: 51.9, t: 'Platform 1 waiting room' },
    { id: 'sarwate', x: 46.3, y: 42.4, t: 'Sarwate Bus Stand' },
    { id: 'chai', x: 56, y: 64.7, t: 'Chai Thikana' },
    { id: 'godown', x: 55.4, y: 53.9, t: 'The godown behind Platform 4' },
  ];
  function openMap() {
    if (!done.has('call')) { mode = 'inspect'; ITEMS.map.img = 'map.jpg'; card.className = 'gm-card wide'; card.innerHTML = `<img src="${P}map.jpg" alt="Indore map">`; ui.querySelector('.gm-flip').style.display = 'none'; inspect.classList.add('on'); say('LOGIC:', '"Not yet. Hear the call, go through his things, and check that godown line first."'); return; }
    mode = 'inspect';
    pinUI.innerHTML = `<div class="gm-mapwrap"><img src="${P}map.jpg" alt="Indore map">${SPOTS.map((s) => `<button class="spot" data-id="${s.id}" style="left:${s.x}%;top:${s.y}%"><i></i><span>${s.t}</span></button>`).join('')}</div>
      <div class="gm-maphint">Where are they holding Rakesh? Push a pin into the map.</div><button class="gm-mapclose">NOT YET</button>`;
    pinUI.classList.add('on'); gsap.fromTo(pinUI.firstElementChild, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .5 });
    pinUI.querySelectorAll('.spot').forEach((b) => b.onclick = () => choose(b.dataset.id, b));
    pinUI.querySelector('.gm-mapclose').onclick = () => { pinUI.classList.remove('on'); mode = 'desk'; };
  }
  let wrong = 0;
  function choose(id, btn) {
    sfx.thud(); btn.classList.add('pinned');
    if (id === 'godown') { complete('map'); setTimeout(ending, 900); return; }
    wrong++; btn.classList.add('wrong');
    const why = { pl1: '"A waiting room full of people at 3 AM? Nobody hides a man there."', sarwate: '"The bus brought him there. That is where he started, not where he is."', chai: '"Two chai at 9 PM. That was his informant, not his kidnappers."' }[id];
    say('LOGIC:', why + ' Look at the board again.', 7000);
  }

  /* ---------------- ending ---------------- */
  function ending() {
    pinUI.classList.remove('on'); mode = 'end';
    const secs = Math.round((performance.now() - t0) / 1000), mm = Math.floor(secs / 60), ss = String(secs % 60).padStart(2, '0');
    say('YOU:', 'Inspector? It\'s me. The Swad Masala godown behind Platform 4. Go now.', 5000);
    setTimeout(() => {
      ctx.dawn?.();
      endUI.innerHTML = `<div class="gm-paper"><div class="np-mast">INDORE EVENING POST</div><div class="np-date">${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()} · SPECIAL DAWN EDITION</div>
        <h1>FAKE JEERAVAN RACKET BUSTED NEAR INDORE JUNCTION</h1><h2>Kidnapped reporter Rakesh Mehra rescued at dawn from a godown behind Platform 4</h2>
        <p>Police raided the Swad Masala Udyog godown at 5:40 AM after a tip from a private detective. Thousands of fake packets were seized. Mr. Mehra was found unharmed. "My wife never gave up," he said.</p>
        <div class="np-case"><b>CASE CLOSED</b> in ${mm}:${ss} · ${pinned.length} findings on the board · ${wrong ? wrong + ' wrong pin' + (wrong > 1 ? 's' : '') : 'first pin, right pin'}</div>
        <div class="np-btns"><button class="again">PLAY AGAIN</button><button class="tour">TAKE THE TOUR</button></div></div>`;
      endUI.classList.add('on'); gsap.fromTo(endUI.firstElementChild, { y: 80, rotate: -6, opacity: 0, scale: .9 }, { y: 0, rotate: -1, opacity: 1, scale: 1, duration: 1, ease: 'power3.out' });
      endUI.querySelector('.again').onclick = () => { stop(); ctx.again(); };
      endUI.querySelector('.tour').onclick = () => { stop(); ctx.toTour(); };
    }, 3200);
  }

  /* ---------------- guide: a soft ring drifts to the next thing worth a look ---------------- */
  const guide = ui.querySelector('.gm-guide'); let lastAct = performance.now(); const gv = new THREE.Vector3();
  addEventListener('pointerdown', () => { lastAct = performance.now(); });
  function nextTarget() {
    if (!done.has('listen')) return ['asha', 'Start with the ransom call'];
    const n = SEARCH.find((s) => !seen.has(s)); if (!done.has('search') && n) return [n, 'Take a look'];
    if (!done.has('call')) return seen.has('bizcard') && seen.has('notebook') ? ['phone', 'Try the number'] : [seen.has('bizcard') ? 'notebook' : 'bizcard', 'The number is in here'];
    return ['map', 'Mark the map'];
  }
  function updateGuide() {
    const idle = performance.now() - lastAct > 7000;
    if (mode !== 'desk' || !idle) { guide.classList.remove('on'); return; }
    const [id, label] = nextTarget(); const o = ev.items[id]; if (!o) return;
    o.getWorldPosition(gv); gv.project(cam);
    guide.style.transform = `translate(${(gv.x * .5 + .5) * innerWidth}px,${(-gv.y * .5 + .5) * innerHeight}px)`;
    guide.querySelector('span').textContent = label; guide.classList.add('on');
  }

  /* ---------------- start / stop ---------------- */
  let t0 = 0;
  function start() {
    [endUI, inspect, rec, pinUI].forEach((n) => n.classList.remove('on')); ui.classList.remove('board'); btnBoard.textContent = 'LOOK AT THE BOARD';
    mode = 'desk'; ui.classList.add('on'); ev.show(true); done.clear(); seen.clear(); heard.clear(); wrong = 0; renderObj(); btnMap.disabled = true;
    pinned.splice(0).forEach(() => {}); while (board.children.length > 1) board.remove(board.children[1]); board.visible = true;
    Object.assign(view, HOME); t0 = performance.now();
    say('YOU:', 'Asha left twenty minutes ago. She brought everything she found where Rakesh\'s phone last pinged, and her phone with the ransom call. Sunrise is at 6:41.', 8000);
    setTimeout(() => toast('Hover anything on the desk. Click to pick it up.'), 8500);
  }
  function stop() { mode = 'off'; ui.classList.remove('on'); endUI.classList.remove('on'); inspect.classList.remove('on'); rec.classList.remove('on'); pinUI.classList.remove('on'); board.visible = false; document.body.style.cursor = ''; }
  btnBoard.onclick = () => {
    if (mode === 'board') { mode = 'desk'; ui.classList.remove('board'); btnBoard.textContent = 'LOOK AT THE BOARD'; gsap.to(view, { ...HOME, duration: 1.4, ease: 'power2.inOut' }); return; }
    mode = 'board'; btnBoard.textContent = 'BACK TO THE DESK'; ui.classList.add('board'); showInfo(null); gsap.to(view, { ...BOARD, duration: 1.6, ease: 'power2.inOut' });
  };
  btnMap.onclick = () => openMap();

  return {
    start, stop, open, get active() { return mode !== 'off'; },
    camera() {
      updateGuide();
      const k = mode === 'board' ? .25 : 1;
      sx += (mx - sx) * .06; sy += (my - sy) * .06;
      cam.position.set(view.px + sx * .05 * k, view.py + sy * .03 * k, view.pz);
      cam.lookAt(view.lx + sx * .16 * k, view.ly + sy * .08 * k, view.lz);
    },
  };
}
