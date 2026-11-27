import { animate, stagger } from 'animejs';
// THE RAIN DOESN'T STOP: a first-person case at the detective's desk, in three acts.
// Act I   Where is he?  the ransom call, Rakesh's things, the godown line.
// Act II  Prove it.     the chai stall, Pappu's packet, the water test, godown A or B.
// Act III Who talked?   Rakesh's last messages, the night editor's lie, the call to the police.
export function initGame(ctx) {
  const { THREE, S, cam, gsap, sfx, ac, master, ev, rain } = ctx;
  const el = (h: string): HTMLElement => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild as HTMLElement; };
  const P = '/case/assets/props/', AU = '/case/assets/audio/';
  const NUM = { godown: '1987142160', chai: '0731258440', desk: '0731254611' };

  /* ================= UI shell ================= */
  const ui = el(`<div id="gm">
    <div class="gm-obj"><div class="gm-h"><span class="gm-act-l">ACT I · WHERE IS HE?</span><span class="gm-clock">3:12 AM</span></div><ol></ol><div class="gm-sun">sunrise 6:41 · truck leaves 5:00</div></div>
    <aside class="gm-info"><div class="gm-k"></div><h3></h3><p class="gm-d"></p><p class="gm-v"></p><div class="gm-tip">click to inspect</div></aside>
    <div class="gm-sub"></div>
    <div class="gm-toast"></div>
    <div class="gm-btns"><button class="gm-board">LOOK AT THE BOARD</button><button class="gm-map" disabled>MARK THE MAP</button><button class="gm-labbtn" style="display:none">TEST THE MASALA</button></div>
    <button class="gm-new">START OVER</button>
    <div class="gm-inspect"><div class="gm-card"></div><div class="gm-ibtns"><button class="gm-flip">FLIP OVER</button><button class="gm-close">PUT IT DOWN</button></div></div>
    <div class="gm-rec"></div>
    <div class="gm-pin"></div>
    <div class="gm-lab"></div>
    <div class="gm-actcard"></div>
    <div class="gm-end"></div>
    <div class="gm-guide"><i></i><span></span></div>
  </div>`);
  document.body.appendChild(ui);
  const q = (s) => ui.querySelector<HTMLElement>(s);
  const objList = q('.gm-obj ol'), info = q('.gm-info'), sub = q('.gm-sub'), toastEl = q('.gm-toast'), clockEl = q('.gm-clock'), actL = q('.gm-act-l');
  const inspect = q('.gm-inspect'), card = q('.gm-card'), rec = q('.gm-rec'), pinUI = q('.gm-pin'), endUI = q('.gm-end'), lab = q('.gm-lab'), actCard = q('.gm-actcard');
  const btnBoard = q('.gm-board'), btnMap = ui.querySelector<HTMLButtonElement>('.gm-map'), btnLab = q('.gm-labbtn');

  /* ================= state ================= */
  const ACTS = [
    null,
    { n: 'I', t: 'WHERE IS HE?', clock: 192, line: 'Asha left twenty minutes ago. Everything she found is on your desk, with her phone and the ransom call.',
      obj: [{ id: 'listen', t: 'Listen to the ransom call on Asha\'s phone' }, { id: 'search', t: 'Go through Rakesh\'s things (4 items)' }, { id: 'godown', t: 'Work out the godown\'s number and call it' }] },
    { n: 'II', t: 'PROVE IT', clock: 231, line: 'The police won\'t raid a godown on a hunch. Prove the masala is fake, and find out which godown he\'s in.',
      obj: [{ id: 'chai', t: 'Call the chai stall on the receipt' }, { id: 'test', t: 'Test the masala in water' }, { id: 'which', t: 'Godown A or B? Mark it on the map' }] },
    { n: 'III', t: 'WHO TALKED?', clock: 262, line: 'They knew exactly where Rakesh was at 11:47. Someone told them. Find out who, then call it in.',
      obj: [{ id: 'texts', t: 'Read Rakesh\'s last messages to Asha' }, { id: 'editor', t: 'Call the night desk (number on his press ID)' }, { id: 'police', t: 'Call the police: 112. Or confront the editor first?' }] },
  ];
  let act = 1, mins = 192, wrong = 0, confronted = false, t0 = 0, mode = 'off', ended = false;
  const done = new Set<string>(), seen = new Set<string>(), heard = new Set<string>();
  const KEY = 'rain-doesnt-stop-v2';
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ act, mins, wrong, confronted, done: [...done], seen: [...seen], heard: [...heard], pins: pinned.map((p) => p.title) })); } catch { /* storage may be blocked */ } };
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };

  const fmt = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')} AM`;
  function tick(add) { mins += add; clockEl.textContent = fmt(mins); animate(clockEl, { scale: [1.25, 1], duration: 500, ease: 'outBack' }); }
  function renderObj() {
    const A = ACTS[act]; actL.textContent = `ACT ${A.n} · ${A.t}`;
    objList.innerHTML = A.obj.map((o) => `<li class="${done.has(o.id) ? 'ok' : ''}">${o.t}</li>`).join('');
  }
  function complete(id) {
    if (done.has(id)) return; done.add(id);
    const i = ACTS[act].obj.findIndex((o) => o.id === id); renderObj();
    if (i >= 0) { animate(objList.children[i], { x: [0, 6, 0], duration: 500, ease: 'outElastic(1, .5)' }); sfx.tick(1200, .08, .12, 'triangle'); tick(6 + Math.round(Math.random() * 5)); }
    save(); setTimeout(checkAct, 3400);
  }
  function checkAct() {
    if (ended || mode === 'end' || mode === 'act') return;
    if (act < 3 && ACTS[act].obj.every((o) => done.has(o.id))) startAct(act + 1);
  }
  function startAct(n, quiet = false) {
    act = n; mins = Math.max(mins, ACTS[n].clock); clockEl.textContent = fmt(mins); renderObj();
    btnMap.disabled = act < 2; save();
    if (quiet) { carry(); return; }
    const A = ACTS[n]; mode = 'act'; [inspect, rec, pinUI, lab].forEach((x) => x.classList.remove('on')); stopClip?.(); recStop?.(); if (document.querySelector('#rg-phone.on')) rain.closePhone();
    actCard.innerHTML = `<div><small>ACT ${A.n}</small><h2>${A.t}</h2><p>${A.line}</p><span>${fmt(mins)}</span><button>CONTINUE</button></div>`;
    actCard.classList.add('on'); sfx.thud();
    animate(actCard.querySelectorAll('small, h2, p, span, button'), { opacity: [0, 1], y: [16, 0], delay: stagger(180), duration: 700, ease: 'outCubic' });
    actCard.querySelector('button').onclick = () => { actCard.classList.remove('on'); mode = 'desk'; carry(); setTimeout(checkAct, 400); if (n === 2) toast('New: the receipt has a number worth calling.'); if (n === 3) toast('New: check Asha\'s messages.'); };
  }
  // steps done early (e.g. reading the messages in Act I) count once their act begins
  function carry() {
    if (act >= 3 && seen.has('texts') && !done.has('texts')) { pinFinding('texts'); complete('texts'); }
    if (act >= 3 && seen.has('texts') && seen.has('editor_lie') && !done.has('editor')) { pinFinding('editor'); complete('editor'); }
  }

  function toast(t, ms = 3400) { toastEl.textContent = t; gsap.killTweensOf(toastEl); gsap.fromTo(toastEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .35 }); gsap.to(toastEl, { opacity: 0, delay: ms / 1000, duration: .6 }); }
  let subT; function say(who, text, ms = 5600) {
    sub.innerHTML = `<b>${who}</b> ${text}`; gsap.killTweensOf(sub); gsap.to(sub, { opacity: 1, duration: .3 }); clearTimeout(subT); subT = setTimeout(() => gsap.to(sub, { opacity: 0, duration: .5 }), ms);
  }

  /* ================= audio: voice clips ================= */
  const bufs = {};
  async function buf(name) {
    if (bufs[name]) return bufs[name]; const A = ac(); if (!A) return null;
    const r = await fetch(AU + name + '.mp3'); const b = await A.decodeAudioData(await r.arrayBuffer()); bufs[name] = b; return b;
  }
  let stopClip = null;
  async function playClip(name, subs, onEnd?, toPhone = true) {
    stopClip?.(); const A = ac(); const b = await buf(name);
    const show = (h) => (toPhone ? rain.setSaid(h) : say('', h, 6000));
    if (!A || !b) { subs.forEach((s, i) => setTimeout(() => show(s[1]), i * 3500)); setTimeout(() => onEnd?.(), subs.length * 3500 + 500); return; }
    const src = A.createBufferSource(); src.buffer = b; const g = A.createGain(); g.gain.value = 1.1; src.connect(g).connect(master()); src.start();
    const timers = subs.map(([t, h]) => setTimeout(() => show(h), t * 1000));
    let alive = true; src.onended = () => { if (!alive) return; alive = false; stopClip = null; onEnd?.(); };
    stopClip = () => { if (!alive) return; alive = false; timers.forEach(clearTimeout); try { src.stop(); } catch { /* already stopped */ } };
  }
  const H = (hi, en) => `“${hi}” <span class="en">${en}</span>`;

  /* ================= the evidence board ================= */
  const OZ = -7.5, BZ = OZ + .12;
  const board = new THREE.Group(); board.visible = false; S.add(board);
  const cardTex = (title, body, accent) => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 360; const x = c.getContext('2d');
    x.fillStyle = '#efe5cd'; x.fillRect(0, 0, 512, 360); for (let i = 0; i < 1600; i++) { x.fillStyle = `rgba(80,60,30,${Math.random() * .06})`; x.fillRect(Math.random() * 512, Math.random() * 360, 2, 2); }
    x.fillStyle = accent; x.fillRect(0, 0, 512, 12); x.fillStyle = '#1d1813';
    let fs = 40; do { x.font = `bold ${fs}px "Special Elite", "Courier New"`; fs -= 2; } while (x.measureText(title).width > 464 && fs > 20); x.fillText(title, 24, 84);
    x.font = '30px "Special Elite", "Courier New"'; x.fillStyle = '#2b241c';
    const words = body.split(' '); let line = '', y = 140; for (const w of words) { if (x.measureText(line + w).width > 460) { x.fillText(line, 24, y); line = ''; y += 42; } line += w + ' '; } x.fillText(line, 24, y);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  };
  const center = new THREE.Mesh(new THREE.PlaneGeometry(.4, .3), new THREE.MeshBasicMaterial({ map: cardTex('RAKESH MEHRA', 'Reporter, Indore Evening Post. Missing since 11:47 PM.', '#1d1813'), color: 0xc9c0ae }));
  center.position.set(1.6, 2.14, BZ + .003); board.add(center);
  const SLOTS = [[.62, 2.62], [2.58, 2.62], [1.1, 2.64], [2.1, 2.64], [.62, 2.12], [2.58, 2.12], [.62, 1.62], [2.58, 1.62], [1.1, 1.6], [2.1, 1.6], [1.6, 2.66], [1.6, 1.6], [1.1, 2.12], [2.1, 2.12]];
  const FINDINGS = {
    watch: ['TAKEN AT 11:47 PM', 'His watch broke in the struggle near Chhoti Gwaltoli, his last location.'],
    story: ['MOTIVE', 'Fake jeeravan packed at night in a godown near the railway line.'],
    notebook: ['THE GODOWN LINE', 'Swad office: call the godown line, ext. 14 · 21.'],
    bizcard: ['GODOWN PHONE', '1987 · ?? · ?? · 60. Middle digits washed out.'],
    packet: ['THE FAKE', 'Misspelt "JEERAVN". No packer, no batch number.'],
    pressid: ['FOLLOW THE MASALA', 'Back of his press ID: "If I go missing, tell Asha: follow the masala."'],
    listen: ['NEAR INDORE JUNCTION', 'Ransom call: train horn and the Platform 4 announcement.'],
    godown: ['GODOWN = RANSOM CALL', 'Same horn, same announcement behind the guard who answered.'],
    envelope: ['PAPPU\'S PACKET', 'A godown loader smuggled out a sample: "Godown B, lot 14".'],
    test: ['SAME FAKE', 'Rakesh\'s packet and the Godown B sample: sawdust and red dye.'],
    gen: ['A GENERATOR', 'Under the ransom call: a diesel generator. Only Godown B has one.'],
    which: ['GODOWN B', 'Behind Platform 4. Truck leaves at 5 AM.'],
    texts: ['EDITOR CALLED 11:41', 'Six minutes before he was taken, his editor asked where he was.'],
    editor: ['THE EDITOR LIED', 'Said he hadn\'t spoken to Rakesh since the evening meeting.'],
  };
  const BLUE = new Set(['listen', 'godown', 'gen', 'which', 'texts', 'editor']);
  const pinned = [];
  function pinFinding(key, quiet = false) {
    const f = FINDINGS[key]; if (!f || pinned.find((p) => p.title === f[0])) return;
    const [x, y] = SLOTS[pinned.length % SLOTS.length];
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.36, .25), new THREE.MeshBasicMaterial({ map: cardTex(f[0], f[1], BLUE.has(key) ? '#1f4e79' : '#a3231d'), color: 0xc9c0ae }));
    m.position.set(x, y, BZ + .004 + pinned.length * .0015); m.rotation.z = (Math.random() - .5) * .1; board.add(m);
    const s = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(1.6, 2.24, BZ + .03), new THREE.Vector3(x, y + .1, BZ + .03)]), new THREE.LineBasicMaterial({ color: 0xc0392b })); board.add(s);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(.014, 10, 8), new THREE.MeshBasicMaterial({ color: 0xc0392b })); pin.position.set(x, y + .1, BZ + .032); board.add(pin);
    pinned.push({ title: f[0], key }); if (!quiet) { toast(`Pinned to the board: ${f[0]}`); save(); }
  }
  function clearBoard() { pinned.length = 0; while (board.children.length > 1) board.remove(board.children[1]); }

  /* ================= desk items ================= */
  const ITEMS: Record<string, any> = {
    asha: { k: 'ASHA\'S PHONE', t: 'The ransom call', d: 'The kidnappers called Asha at 2:15 AM. Her phone records every call. Her messages from Rakesh are on it too.', v: 'GUT: "Listen past the voice. Kidnappers forget the world behind them."', open: () => openAsha() },
    watch: { k: 'EVIDENCE', t: 'Rakesh\'s wristwatch', d: 'Asha found it on the road near Chhoti Gwaltoli, where his phone last pinged. The glass is cracked. It stopped at 11:47.', v: 'LOGIC: "11:47 PM. That\'s when they took him."', img: 'watch' },
    story: { k: 'RAKESH\'S DRAFT', t: '"Sawdust in your poha"', d: 'His unpublished story: fake jeeravan masala, cut with sawdust and dye, packed at night in a godown near the railway line.', v: 'LOGIC: "Motive. Somebody did not want this printed."', img: 'story.jpg' },
    notebook: { k: 'RAKESH\'S NOTEBOOK', t: 'Last notes', d: 'Places he meant to check, and a line about the godown phone: "ext. 14 · 21".', v: 'GUT: "Two pairs of digits. Where else did I see a number with a hole in it?"', img: 'notebook.jpg' },
    bizcard: { k: 'BUSINESS CARD', t: 'Swad Masala Udyog', d: 'Soaked in the rain. The godown\'s 24-hour line is printed, but the middle is washed out: 1987 · ▢▢ · ▢▢ · 60.', v: 'LOGIC: "Four digits missing. His notebook had two pairs of numbers."', img: 'bizcard.jpg' },
    ticket: { k: 'BUS TICKET', t: 'Route 21', d: 'Rajwada to Sarwate Bus Stand, 10:58 PM. Sarwate is next to Indore Junction railway station.', v: 'LOGIC: "He was heading for the station."', img: 'ticket.jpg' },
    receipt: { k: 'RECEIPT', t: 'Chai Thikana, 9:12 PM', d: 'Two cutting chai and a bun maska. He met someone before he left. The stall\'s number is printed at the top: 0731 258 440.', v: 'CHAI: "Two cups. He wasn\'t alone. Somebody at that stall knows who."', img: 'receipt.jpg' },
    pressid: { k: 'PRESS ID', t: 'Rakesh Mehra, Indore Evening Post', d: 'Water-damaged photo. The paper\'s night desk number is on the front: 0731 254 611. Something is written on the back.', v: 'GUT: "Turn it over."', img: 'pressid.jpg', back: 'pressid_back.jpg' },
    packet: { k: 'EVIDENCE', t: 'Fake jeeravan packet', d: 'Jeeravan is Indore\'s own spice mix (roasted cumin, fennel, black salt and more), sprinkled on poha. This one is misspelt "JEERAVN" and smells of nothing.', v: 'CHAI: "Real jeeravan you smell from the doorway. This is sawdust in a nice dress."', img: 'packet.jpg' },
    map: { k: 'YOUR MAP', t: 'Indore city map', d: 'Your own markings: a circle around Indore Junction, two godowns behind Platform 4 (A and B), Bus 21 in blue.', v: 'LOGIC: "When I know exactly where, I mark it."', img: 'map.jpg', mapPin: true },
    phone: { k: 'OFFICE PHONE', t: 'Rotary phone', d: 'Your office line. Rain or no rain, it works.', v: 'GUT: "Every number on this desk is worth a call."', dial: true },
    envelope: { k: 'LEFT AT YOUR DOOR', t: 'A brown envelope', d: 'Pushed under your door while you were on the phone. "Detective sahab — Rakesh bhai ne bola tha aapko dena. — P."', v: 'GUT: "Pappu. The loader from the chai stall."', img: 'envelope.jpg', back: 'pappu', backLabel: 'OPEN IT' },
  };
  const SEARCH = ['story', 'notebook', 'bizcard', 'watch', 'ticket', 'packet', 'pressid', 'receipt'];

  /* ================= camera & picking ================= */
  const HOME = { px: -.2, py: 1.6, pz: -3.5, lx: -.2, ly: .84, lz: -4.58 };
  const BOARD = { px: 1.6, py: 2.12, pz: -4.75, lx: 1.6, ly: 2.12, lz: -7.5 };
  const view = { ...HOME }; let mx = 0, my = 0, sx = 0, sy = 0, hovered = null, lastAct = performance.now();
  const visible = (o) => { while (o) { if (!o.visible) return false; o = o.parent; } return true; };
  addEventListener('pointermove', (e) => {
    if (mode === 'off') return; mx = e.clientX / innerWidth * 2 - 1; my = -(e.clientY / innerHeight * 2 - 1);
    if (mode !== 'desk' || (e.target as HTMLElement).tagName !== 'CANVAS') { if (hovered) { hovered = null; showInfo(null); document.body.style.cursor = ''; } return; }
    const id = pick(e); if (id !== hovered) { hovered = id; showInfo(id); }
    document.body.style.cursor = id ? 'zoom-in' : '';
  });
  addEventListener('pointerdown', () => { lastAct = performance.now(); hinted = false; });
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(e) {
    ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)); ray.setFromCamera(ndc, cam);
    const hit = ray.intersectObjects(ev.group.children, true).find((h) => visible(h.object)); if (!hit) return null;
    let o = hit.object; while (o && !o.userData.id) o = o.parent; return o?.userData.id || null;
  }
  function showInfo(id) {
    if (!id) { gsap.to(info, { opacity: 0, x: 20, duration: .25, overwrite: true }); return; }
    const it = ITEMS[id]; if (!it) return; q('.gm-k').textContent = it.k; info.querySelector('h3').textContent = it.t;
    q('.gm-d').textContent = it.d; q('.gm-v').textContent = it.v;
    gsap.to(info, { opacity: 1, x: 0, duration: .3, overwrite: true }); sfx.tick(1500, .02, .04);
  }
  addEventListener('click', (e) => {
    if (mode !== 'desk' || (e.target as HTMLElement).tagName !== 'CANVAS') return;
    const id = pick(e); if (id) open(id);
  });

  /* ================= inspect ================= */
  let flipped = false, curItem = null;
  function open(id) {
    const it = ITEMS[id]; if (!it) return; curItem = id; showInfo(null);
    if (it.open) return it.open();
    if (it.dial) return openDial();
    if (it.mapPin && act >= 2) return openMap();
    mode = 'inspect'; flipped = false; sfx.paper?.();
    card.className = 'gm-card' + (id === 'watch' ? ' watch' : '') + (['story', 'notebook'].includes(id) ? ' tall' : '') + (id === 'map' ? ' wide' : '');
    card.innerHTML = id === 'watch'
      ? `<div class="wt"><img src="${P}watch_dial.png" alt=""><i class="h" style="transform:rotate(${(11 + 47 / 60) * 30}deg)"></i><i class="m" style="transform:rotate(${47 * 6}deg)"></i><img class="cr" src="${P}watch_crack.png" alt=""></div>`
      : `<img src="${P + it.img}" alt="${it.t}">`;
    const fb = q('.gm-flip'); fb.style.display = it.back ? '' : 'none'; fb.textContent = it.backLabel || 'FLIP OVER';
    inspect.classList.add('on'); gsap.fromTo(card, { y: 60, rotate: -6, opacity: 0, scale: .9 }, { y: 0, rotate: -1.5, opacity: 1, scale: 1, duration: .6, ease: 'power3.out' });
    const [who, ...rest] = it.v.split(':'); say(who + ':', rest.join(':').trim(), 6000);
    if (id === 'map' && act < 2) setTimeout(() => say('LOGIC:', '"Not yet. First I need to know he\'s by the station."'), 2500);
    if (!seen.has(id)) {
      seen.add(id); if (FINDINGS[id] && id !== 'pressid' && id !== 'envelope') setTimeout(() => pinFinding(id), 900);
      if (SEARCH.filter((s) => seen.has(s)).length >= 4) complete('search');
      save();
    }
  }
  q('.gm-flip').onclick = () => {
    const it = ITEMS[curItem]; flipped = !flipped; sfx.paper?.();
    if (curItem === 'envelope') {
      card.className = 'gm-card pair';
      card.innerHTML = `<img src="${P}pappu_note.jpg" alt="Pappu's note"><img class="sachet" src="${P}sachet.png" alt="A plastic sachet of red-brown powder labelled Godown B, lot 14">`;
      gsap.fromTo(card.children, { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: .15, duration: .5 });
      q('.gm-flip').style.display = 'none';
      say('LOGIC:', '"A sample straight out of Godown B. If it matches Rakesh\'s packet, that\'s my proof. Time for the water test."', 7000);
      pinFinding('envelope'); btnLab.style.display = ''; animate(btnLab, { scale: [1.3, 1], duration: 600, ease: 'outBack' });
      seen.add('envelope_open'); save(); return;
    }
    gsap.to(card, { rotateY: 90, duration: .2, onComplete: () => { card.querySelector('img').src = P + (flipped ? it.back : it.img); gsap.fromTo(card, { rotateY: -90 }, { rotateY: 0, duration: .25 }); } });
    if (flipped && curItem === 'pressid') { say('GUT:', '"Follow the masala." He knew exactly who was after him.'); pinFinding('pressid'); }
  };
  q('.gm-close').onclick = closeInspect;
  function closeInspect() { inspect.classList.remove('on'); mode = 'desk'; }
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && mode === 'inspect') closeInspect(); });

  /* ================= Asha's phone: recording + messages ================= */
  // when each sound happens in ransom_bg.mp3 (seconds) and what the voice says
  const RT = { len: 13.9, horn: [2.0, 4.4], chime: [4.6, 6.4], announce: [6.4, 10.4], chai: [1.0, 2.6] };
  const RV = [
    [.6, H('Reporter hamaare paas hai.', 'We have the reporter.')],
    [3.6, H('Uske saare kaagaz lekar aana. Police nahi.', 'Bring all his papers. No police.')],
    [8.26, H('Subah hote hi phir phone karenge. Ek galti, aur…', 'We call again at sunrise. One mistake, and…')],
  ];
  const BGNAMES = { horn: 'Train horn', announce: 'Platform 4 announcement', chai: 'Chai vendor', gen: 'A hum underneath' };
  let recStop = null;
  function openAsha(tab = act >= 3 ? 'msg' : 'rec') {
    mode = 'inspect';
    rec.innerHTML = `<div class="gm-phone">
      <div class="gp-tabs"><button data-t="rec">Recordings</button><button data-t="msg">Messages</button><button data-t="note">Voice note</button></div>
      <div class="gp-pane" data-p="rec">
        <div class="gp-card"><div class="gp-who"><b>Unknown number</b><span>Incoming · Today, 2:15 AM · 0:14</span></div>
        <div class="gp-wave">${Array.from({ length: 56 }, (_, i) => `<i style="height:${18 + Math.abs(Math.sin(i * .37)) * 60 + (i * 37 % 20)}%"></i>`).join('')}</div>
        <button class="gp-play">▶  PLAY</button></div>
        <div class="gp-mix"><div><label>VOICE</label><input type="range" min="0" max="100" value="90" class="mv"></div><div><label>BACKGROUND</label><input type="range" min="0" max="100" value="15" class="mb"></div><div><label>TONE <small>low · high</small></label><input type="range" min="0" max="100" value="60" class="mt"></div></div>
        <div class="gp-cap"></div><div class="gp-heard"></div>
      </div>
      <div class="gp-pane" data-p="msg"><div class="gp-chat">
        <div class="gp-day">Rakesh ❤ · last night</div>
        <p class="in">Met P. at Chai Thikana. He says he can get me a sample from inside the godown.<i>9:14 PM</i></p>
        <p class="in">On bus 21 to Sarwate. Don't wait up.<i>10:58 PM</i></p>
        <p class="out">Be careful. Text me when you're done.<i>11:02 PM</i></p>
        <p class="in">Vinod sir just called. Wanted to know exactly where I am right now. He never calls this late. Odd.<i>11:41 PM</i></p>
        <p class="in loc">📍 Live location · Chhoti Gwaltoli<i>11:44 PM</i></p>
        <p class="sys">Live location stopped · 11:47 PM</p>
        <p class="out">Rakesh?? Pick up<i>12:10 AM</i></p>
      </div></div>
      <div class="gp-pane" data-p="note"><div class="gp-card"><div class="gp-who"><b>Asha → Detective</b><span>Voice note · 2:52 AM · 0:07</span></div><button class="gp-asha">▶  PLAY ASHA'S NOTE</button><div class="gp-cap2"></div></div></div>
      <button class="gp-close">PUT THE PHONE BACK ON THE DESK</button></div>`;
    rec.classList.add('on'); gsap.fromTo(rec.firstElementChild, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: .5 });
    const setTab = (t) => {
      rec.querySelectorAll<HTMLElement>('.gp-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === t));
      rec.querySelectorAll<HTMLElement>('.gp-pane').forEach((p) => p.classList.toggle('on', p.dataset.p === t));
      if (t === 'msg') {
        animate(rec.querySelectorAll('.gp-chat > *'), { opacity: [0, 1], y: [8, 0], delay: stagger(120), duration: 400 });
        setTimeout(() => {
          if (!seen.has('texts')) { seen.add('texts'); save(); }
          if (act >= 3) { say('LOGIC:', '"11:41. Vinod sir, his editor, asked exactly where he was. Six minutes later he was gone."', 8000); pinFinding('texts'); complete('texts'); }
        }, 1800);
      }
    };
    rec.querySelectorAll<HTMLElement>('.gp-tabs button').forEach((b) => (b.onclick = () => setTab(b.dataset.t)));
    setTab(tab);
    if (tab === 'rec') say('GUT:', act >= 2 && !heard.has('gen') ? '"Turn the TONE down low. What hums under everything?"' : '"Turn the voice down. Turn the world up."', 6000);
    rec.querySelector<HTMLElement>('.gp-play').onclick = playRecording;
    rec.querySelector<HTMLElement>('.gp-asha').onclick = () => playClip('asha_note', [[.3, H('Maine sab aapke table pe rakh diya hai. Unka bag, ghadi, sab kuch. Please, unhe dhoondh lijiye.', 'I\'ve left everything on your desk. His bag, his watch, everything. Please find him.')]], null, false);
    rec.querySelector<HTMLElement>('.gp-close').onclick = () => { recStop?.(); stopClip?.(); rec.classList.remove('on'); mode = 'desk'; };
    renderHeard();
  }
  function renderHeard() {
    const h = rec.querySelector<HTMLElement>('.gp-heard'); if (!h) return;
    h.innerHTML = Object.keys(BGNAMES).filter((k) => k !== 'gen' || act >= 2 || heard.has('gen')).map((k) => `<span class="${heard.has(k) ? 'on' : ''}">${heard.has(k) ? '✓ ' : '… '}${k === 'gen' && heard.has('gen') ? 'Diesel generator' : BGNAMES[k]}</span>`).join('');
  }
  async function playRecording() {
    if (recStop) return;
    const A = ac(); const cap = rec.querySelector<HTMLElement>('.gp-cap'); const bars = rec.querySelectorAll<HTMLElement>('.gp-wave i');
    const mv = () => +rec.querySelector<HTMLInputElement>('.mv').value / 100, mb = () => +rec.querySelector<HTMLInputElement>('.mb').value / 100, mt = () => +rec.querySelector<HTMLInputElement>('.mt').value / 100;
    cap.innerHTML = '<em>loading…</em>';
    const [bv, bb, bg] = A ? await Promise.all([buf('ransom_voice'), buf('ransom_bg'), buf('ransom_gen')]) : [null, null, null];
    let nodes = null;
    if (A && bv) {
      const mk = (b) => { const s = A.createBufferSource(); s.buffer = b; const g = A.createGain(); return { s, g }; };
      const v = mk(bv), b = mk(bb), g = mk(bg); const lpf = A.createBiquadFilter(); lpf.type = 'lowpass';
      v.s.connect(v.g).connect(master()); b.s.connect(lpf).connect(b.g).connect(master()); g.s.connect(g.g).connect(master());
      const at = A.currentTime + .05; [v, b, g].forEach((n) => n.s.start(at)); nodes = { v, b, g, lpf, at };
    }
    cap.innerHTML = '';
    const start = performance.now(); const fired = new Set(); let genT = 0, last = start;
    let alive = true; recStop = () => { alive = false; recStop = null; if (nodes) [nodes.v, nodes.b, nodes.g].forEach((n) => { try { n.s.stop(); } catch { /* done */ } }); };
    const frame = () => {
      if (!alive) return;
      const now = performance.now(), t = (now - start) / 1000, dt = (now - last) / 1000; last = now; const p = Math.min(1, t / RT.len);
      bars.forEach((b, i) => b.classList.toggle('on', i / bars.length < p));
      const V = mv(), B = mb(), T = mt();
      if (nodes) {
        nodes.v.g.gain.value = V * 1.1; nodes.b.g.gain.value = B * 1.25; nodes.lpf.frequency.value = 250 + T * T * 7000;
        nodes.g.g.gain.value = B * Math.max(0, (.4 - T) / .4) * 1.6;
      }
      const clearBg = B > .55 && V < .5;
      for (const [tt, h] of RV as [number, string][]) if (t >= tt && !fired.has(tt)) { fired.add(tt); cap.innerHTML = V > .35 ? `<em>Voice:</em> ${h}` : '<em>(voice turned down)</em>'; }
      for (const k of ['horn', 'announce', 'chai']) {
        const [a, z] = RT[k];
        if (t >= a && t <= z && clearBg && T > .3 && !heard.has(k)) {
          heard.add(k); renderHeard(); sfx.tick(1400, .03, .06);
          cap.innerHTML = `<em>Behind the voice:</em> ${{ horn: 'a train horn, very close', announce: 'the station speaker: “Yatri kripya dhyan dein… platform number chaar…”', chai: 'a vendor calling “chai… garam chai…”' }[k]}`;
        }
      }
      if (clearBg && T < .3) { genT += dt; if (genT > 1.6 && !heard.has('gen')) { heard.add('gen'); renderHeard(); cap.innerHTML = '<em>Underneath everything:</em> a steady diesel thud. A generator, running right next to the phone.'; sfx.tick(900, .05, .08); } }
      if (t < RT.len) requestAnimationFrame(frame);
      else {
        recStop?.(); const pb = rec.querySelector<HTMLElement>('.gp-play'); if (pb) pb.textContent = '↺  PLAY AGAIN';
        if (heard.has('horn') && heard.has('announce') && !done.has('listen')) {
          pinFinding('listen'); complete('listen');
          say('LOGIC:', '"A train horn and a Platform 4 announcement. They\'re holding him right by Indore Junction. But where exactly?"', 7500);
        } else if (!done.has('listen')) say('GUT:', '"Too much voice. Pull VOICE down, push BACKGROUND up, then play it again."', 6000);
        if (heard.has('gen') && !pinned.find((x) => x.key === 'gen')) { pinFinding('gen'); say('LOGIC:', '"A generator. Godown A has been shut since June. Godown B has a genset room."', 7500); }
        save();
      }
    };
    requestAnimationFrame(frame);
  }

  /* ================= the office phone ================= */
  function openDial() {
    mode = 'inspect';
    const ROUTES = {
      [NUM.godown]: { who: 'godown', text: '<em>Someone picks up. Behind him, rain on a tin roof…</em>' },
      [NUM.chai]: { who: 'chai', text: '<em>A busy stall. Cups clinking.</em>' },
      [NUM.desk]: { who: 'desk', text: '<em>The newspaper\'s night desk. A tired voice.</em>' },
      '112': { who: 'police', text: '<em>Police control room, Indore.</em>' },
      '100': { who: 'police', text: '<em>Police control room, Indore.</em>' },
    };
    rain.openPhone((who) => {
      if (who === 'godown') playClip('call_godown', [
        [.5, `<em>A guard:</em> ${H('Haan? Kaun bol raha hai? Raat ke teen baje phone karta hai?', 'Yes? Who is this? Calling at three in the morning?')}`],
        [3.2, '<em>Behind him:</em> the same train horn. The same Platform 4 announcement. A generator. A dog.'],
        [5.2, H('Galat number hai. Rakho phone.', 'Wrong number. Put the phone down.')],
      ], () => {
        if (!done.has('godown')) { pinFinding('godown'); complete('godown'); say('LOGIC:', '"Same horn. Same platform. That godown is where they\'re keeping him."', 7000); }
      });
      else if (who === 'chai') playClip('call_chai', [
        [.5, `<em>The owner:</em> ${H('Haan saahab, Chai Thikana. Haan, Rakesh-ji aaye the, nau baje.', 'Yes sir, Chai Thikana. Yes, Rakesh-ji came, at nine.')}`],
        [5.1, H('Pappu ke saath baithe the, godown mein kaam karta hai. Ek packet diya tha usko.', 'He sat with Pappu, who works at the godown. He gave him a packet.')],
        [11.1, H('Pappu bola, woh packet aapke daftar ke darwaaze pe chhod aaya hai.', 'Pappu says he left that packet at your office door.')],
      ], () => {
        if (!ev.items.envelope?.visible) {
          sfx.thud(); setTimeout(() => sfx.thud(), 260);
          ev.items.envelope && (ev.items.envelope.visible = true);
          seen.add('chai_called'); complete('chai');
          say('YOU:', 'A knock. Nobody there when you open the door, just a brown envelope on the step. It\'s on your desk now.', 7000);
          save();
        }
      });
      else if (who === 'desk') {
        if (seen.has('texts') && seen.has('editor_lie') && act >= 3) {
          rain.setSaid('<em>You:</em> “You called him at 11:41, Vinod sir. You asked exactly where he was. Who did you tell?”');
          setTimeout(() => playClip('call_editor_confront', [[.5, `<em>The editor:</em> ${H('K… kya? Maine toh bas bataya tha ki woh kahaan ja raha hai. Unhone kaha tha kisi ko kuch nahi hoga!', 'W-what? I only told them where he was going. They said nobody would get hurt!')}`]], () => {
            confronted = true; save(); say('LOGIC:', '"There it is. Now call it in: 112."', 6000);
          }), 3200);
        } else playClip('call_editor', [[.5, `<em>The night editor:</em> ${H('Indore Evening Post. Rakesh? Nahi, shaam ki meeting ke baad se usse koi baat nahi hui.', 'Rakesh? No, I haven\'t spoken to him since the evening meeting.')}`]], () => {
          seen.add('editor_lie'); save();
          if (act >= 3) {
            if (seen.has('texts')) { pinFinding('editor'); complete('editor'); say('GUT:', '"He\'s lying. He called Rakesh at 11:41. Call the police now, or ring him back and make him say it?"', 9000); }
            else { complete('editor'); say('GUT:', '"He sounds rattled. What did Rakesh tell Asha last night?"', 6000); }
          }
        });
      } else if (who === 'police') {
        if (act < 3 || !done.has('which')) { rain.setSaid('<em>Control room:</em> “Kaunsa godown? Pakki jaankari ho toh call kariye.” <span class="en">Which godown? Call back when you know for sure.</span>'); return; }
        playClip(confronted ? 'call_police_editor' : 'call_police', [
          [.5, `<em>Inspector:</em> ${H('Haan, boliye. Platform chaar ke peeche wala godown? Theek hai, team nikal rahi hai.', 'Go ahead. The godown behind Platform 4? Right, the team is leaving now.')}`],
          ...(confronted ? [[6.4, H('Aur editor ka naam bhi note kar liya hai. Subah baat karenge usse.', 'And I\'ve noted the editor\'s name. We\'ll talk to him in the morning.')]] : []),
        ] as any, () => { complete('police'); setTimeout(() => { rain.closePhone(); ending(); }, 1200); });
      }
    }, { routes: ROUTES, onHang: () => stopClip?.(), onClose: () => { stopClip?.(); if (mode === 'inspect') mode = 'desk'; } });
  }

  /* ================= the water test ================= */
  const JARS = [
    { id: 'real', img: 'tin.png', t: 'Your kitchen tin', s: 'real jeeravan' },
    { id: 'rakesh', img: 'packet.jpg', t: 'Rakesh\'s packet', s: '"INDORI JEERAVN"' },
    { id: 'godown', img: 'sachet.png', t: 'Pappu\'s sample', s: 'Godown B, lot 14' },
  ];
  function openLab() {
    mode = 'inspect'; const dropped = new Set();
    lab.innerHTML = `<div class="lab-wrap"><h3>THE WATER TEST</h3><p class="lab-how">An old Indori trick. Real spice sinks and barely colours the water. Sawdust floats, and cheap dye bleeds red. Click each one to drop a pinch into its glass.</p>
      <div class="lab-row">${JARS.map((j) => `<div class="lab-col" data-id="${j.id}"><button class="lab-src"><img src="${P + j.img}" alt="${j.t}"></button><b>${j.t}</b><small>${j.s}</small><canvas width="180" height="240"></canvas><div class="lab-res"></div></div>`).join('')}</div>
      <div class="lab-verdict"></div><button class="lab-close">DONE</button></div>`;
    lab.classList.add('on'); gsap.fromTo(lab.firstElementChild, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .5 });
    lab.querySelectorAll<HTMLElement>('.lab-col').forEach((col) => {
      const id = col.dataset.id, cv = col.querySelector('canvas'), x = cv.getContext('2d');
      const parts = [], streaks = []; let tint = 0, t0 = 0;
      const fake = id !== 'real';
      const drawGlass = () => {
        x.clearRect(0, 0, 180, 240);
        const g = x.createLinearGradient(0, 40, 0, 230); g.addColorStop(0, fake ? `rgba(${180 + tint * 50},${205 - tint * 110},${215 - tint * 130},.45)` : `rgba(${185 + tint * 12},${205 - tint * 4},${210 - tint * 30},.42)`); g.addColorStop(1, fake ? `rgba(${170 + tint * 60},${170 - tint * 110},${175 - tint * 125},.6)` : `rgba(${175 + tint * 15},${190 - tint * 8},${195 - tint * 35},.5)`);
        x.fillStyle = g; x.beginPath(); x.moveTo(30, 60); x.lineTo(150, 60); x.lineTo(140, 225); x.lineTo(40, 225); x.closePath(); x.fill();
        for (const s of streaks) { x.strokeStyle = `rgba(190,20,20,${s.a})`; x.lineWidth = s.w; x.beginPath(); x.moveTo(s.x, 64); x.bezierCurveTo(s.x + s.d, 100 + s.l * .3, s.x - s.d, 140, s.x + s.d * .5, 64 + s.l); x.stroke(); }
        for (const p of parts) { x.fillStyle = p.c; x.fillRect(p.x, p.y, p.r, p.r); }
        x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 3; x.beginPath(); x.moveTo(24, 30); x.lineTo(38, 228); x.lineTo(142, 228); x.lineTo(156, 30); x.stroke();
        x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 6; x.beginPath(); x.moveTo(40, 50); x.lineTo(50, 210); x.stroke();
        x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(30, 58, 120, 3);
      };
      drawGlass();
      col.querySelector<HTMLElement>('.lab-src').onclick = () => {
        if (dropped.has(id)) return; dropped.add(id); sfx.tick(500, .05, .08, 'triangle'); t0 = performance.now();
        for (let i = 0; i < 90; i++) parts.push({ x: 80 + Math.random() * 22, y: 10 + Math.random() * 20, vy: 1 + Math.random() * 2, r: 1.5 + Math.random() * 2.5, c: fake ? (Math.random() < .55 ? '#c8a070' : '#a8321e') : (Math.random() < .5 ? '#6b4a22' : '#4a3318'), wood: fake && Math.random() < .75, sink: 150 + Math.random() * 70 });
        let lastT = 0;
        const run = () => {
          const T = (performance.now() - t0) / 1000, k = Math.min(30, (T - lastT) * 60); lastT = T;
          for (const p of parts) {
            if (p.y < 60) p.y = Math.min(61, p.y + p.vy * 2.4 * k);
            else if (p.wood) { p.y += (62 + Math.random() * 4 - p.y) * Math.min(1, .2 * k); p.x += (Math.random() - .5) * .8; }
            else if (p.y < p.sink) { p.y = Math.min(p.sink, p.y + p.vy * .5 * k); p.x += Math.sin(T * 3 + p.r) * .3; }
            p.x = Math.max(38, Math.min(140, p.x));
          }
          if (fake && T > .8 && streaks.length < 7 && Math.random() < .08 * k) streaks.push({ x: 60 + Math.random() * 60, d: (Math.random() - .5) * 40, l: 0, a: .0, w: 2 + Math.random() * 4 });
          for (const s of streaks) { s.l = Math.min(150, s.l + .9 * k); s.a = Math.min(.35, s.a + .006 * k); }
          tint = Math.min(1, T / 4.5); drawGlass();
          if (T < 5.2) requestAnimationFrame(run);
          else {
            const r = col.querySelector<HTMLElement>('.lab-res');
            r.innerHTML = fake ? '<b class="bad">FLOATS · BLEEDS RED</b>' : '<b class="good">SINKS · BARELY COLOURS</b>';
            animate(r, { opacity: [0, 1], scale: [1.4, 1], duration: 400, ease: 'outBack' });
            if (dropped.size === 3) verdict();
          }
        };
        requestAnimationFrame(run);
      };
    });
    const verdict = () => {
      const v = lab.querySelector<HTMLElement>('.lab-verdict');
      v.innerHTML = '<b>MATCH.</b> Rakesh\'s packet and the Godown B sample are the same fake: sawdust and red dye. The racket runs out of Godown B.';
      animate(v, { opacity: [0, 1], y: [10, 0], duration: 600 }); sfx.thud();
      pinFinding('test'); complete('test');
    };
    lab.querySelector<HTMLElement>('.lab-close').onclick = () => { lab.classList.remove('on'); mode = 'desk'; };
  }
  btnLab.onclick = openLab;

  /* ================= marking the map ================= */
  const SPOTS = [
    { id: 'pl1', x: 49.8, y: 51.9, t: 'Platform 1 waiting room' },
    { id: 'sarwate', x: 46.3, y: 42.4, t: 'Sarwate Bus Stand' },
    { id: 'chai', x: 56, y: 64.7, t: 'Chai Thikana' },
    { id: 'A', x: 53.8, y: 51.4, t: 'Godown A (cold store)' },
    { id: 'B', x: 57.3, y: 56.7, t: 'Godown B (genset room)' },
  ];
  function openMap() {
    mode = 'inspect';
    pinUI.innerHTML = `<div class="gm-mapwrap"><img src="${P}map.jpg" alt="Indore map">${SPOTS.map((s) => `<button class="spot${done.has('which') && s.id === 'B' ? ' pinned' : ''}" data-id="${s.id}" style="left:${s.x}%;top:${s.y}%"><i></i><span>${s.t}</span></button>`).join('')}</div>
      <div class="gm-maphint">${done.has('which') ? 'Godown B. Pinned.' : 'Where exactly are they holding Rakesh? Push a pin into the map.'}</div><button class="gm-mapclose">PUT THE MAP DOWN</button>`;
    pinUI.classList.add('on'); gsap.fromTo(pinUI.firstElementChild, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .5 });
    if (!done.has('which')) pinUI.querySelectorAll<HTMLElement>('.spot').forEach((b) => (b.onclick = () => choose(b.dataset.id, b)));
    pinUI.querySelector<HTMLElement>('.gm-mapclose').onclick = () => { pinUI.classList.remove('on'); mode = 'desk'; };
  }
  function choose(id, btn) {
    sfx.thud(); btn.classList.add('pinned');
    if (id === 'B') {
      if (!heard.has('gen') && !done.has('test')) { btn.classList.remove('pinned'); say('LOGIC:', '"B is a guess right now. I need proof. Test the masala, and listen to that call again."', 7000); return; }
      pinFinding('which'); complete('which'); pinUI.querySelector<HTMLElement>('.gm-maphint').textContent = 'Godown B. Pinned.';
      say('LOGIC:', '"Godown B, behind Platform 4. The truck leaves at 5. Before I call it in…"', 7000); return;
    }
    wrong++; btn.classList.add('wrong'); save();
    const why = {
      pl1: '"A waiting room full of people? Nobody hides a man there."',
      sarwate: '"The bus brought him there. That\'s where he started, not where he is."',
      chai: '"That\'s where he met Pappu, not his kidnappers."',
      A: '"Godown A has been shut since June. And I heard something running behind that ransom call. Turn the TONE down and listen."',
    }[id];
    say('LOGIC:', why, 7500);
  }

  /* ================= endings ================= */
  function ending() {
    if (ended) return; ended = true; mode = 'end';
    const secs = Math.round((performance.now() - t0) / 1000), mm = Math.floor(secs / 60), ss = String(secs % 60).padStart(2, '0');
    const best = confronted;
    say('YOU:', best ? 'Rakesh is safe. And the man who sold him out is on the inspector\'s list.' : 'Rakesh is safe. Somebody still told them where he was.', 5000);
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    setTimeout(() => {
      ctx.dawn?.();
      const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
      endUI.innerHTML = `<div class="gm-paper"><div class="np-mast">INDORE EVENING POST</div><div class="np-date">${date} · SPECIAL DAWN EDITION</div>
        <h1>${best ? 'EDITOR TIPPED OFF FAKE JEERAVAN GANG' : 'FAKE JEERAVAN RACKET BUSTED NEAR INDORE JUNCTION'}</h1>
        <h2>${best ? 'Reporter Rakesh Mehra rescued from Godown B at 4:52 AM, minutes before the 5 AM truck. Night editor detained.' : 'Kidnapped reporter Rakesh Mehra rescued at dawn from Godown B behind Platform 4.'}</h2>
        <p>${best ? 'Police raided the Swad Masala Udyog godown after a private detective matched a smuggled sample to the fake packets on sale across the city. The paper\'s night editor admitted telling the gang where Mr. Mehra would be. "My wife never gave up," Mr. Mehra said.' : 'Police seized thousands of fake packets from the Swad Masala Udyog godown. Mr. Mehra was found unharmed. Police say they are still trying to find out who told the gang where he would be.'}</p>
        <div class="np-stamp">${best ? 'CASE CLOSED' : 'RESCUED'}</div>
        <div class="np-case"><b>${best ? 'BEST ENDING' : 'ENDING 1 OF 2'}</b> ${mm}:${ss} · ${pinned.length} findings · ${wrong ? wrong + ' wrong pin' + (wrong > 1 ? 's' : '') : 'no wrong pins'}</div>
        ${best ? '' : '<div class="np-tease">One thread is still loose. Who told them where Rakesh was? Play again to find out.</div>'}
        <div class="np-btns"><button class="again">PLAY AGAIN</button><button class="tour">TAKE THE TOUR</button></div></div>`;
      endUI.classList.add('on'); gsap.fromTo(endUI.firstElementChild, { y: 80, rotate: -6, opacity: 0, scale: .9 }, { y: 0, rotate: -1, opacity: 1, scale: 1, duration: 1, ease: 'power3.out' });
      animate(endUI.querySelector('.np-stamp'), { scale: [3, 1], opacity: [0, .85], rotate: [-28, -12], duration: 380, delay: 1100, ease: 'inQuart', onComplete: () => sfx.thud() });
      animate(endUI.querySelectorAll('.gm-paper > h1, .gm-paper > h2, .gm-paper > p'), { opacity: [0, 1], y: [10, 0], delay: stagger(140, { start: 500 }), duration: 600, ease: 'outCubic' });
      endUI.querySelector<HTMLElement>('.again').onclick = () => { stop(); ctx.again(); };
      endUI.querySelector<HTMLElement>('.tour').onclick = () => { stop(); ctx.toTour(); };
    }, 3000);
  }

  /* ================= hints & the guide ring ================= */
  let hinted = false;
  const HINTS = {
    listen: ['asha', 'Start with the ransom call', 'GUT: "Asha\'s phone. Play the call, and listen to what\'s behind the voice."'],
    search: [null, 'Take a look', 'GUT: "His things will talk if I let them. Pick a few up."'],
    godown: ['phone', 'Try the number', 'LOGIC: "The card has 1987, two gaps and 60. The notebook has two pairs: 14 and 21."'],
    chai: ['phone', 'Call the chai stall', 'GUT: "The receipt has the stall\'s number at the top. Who did he meet there?"'],
    test: [null, 'Test the masala', 'LOGIC: "Real jeeravan sinks. Sawdust floats. Put them in water."'],
    which: ['asha', 'Listen again', 'GUT: "A or B? Replay the ransom call with the TONE knob turned all the way down."'],
    texts: ['asha', 'Read the messages', 'GUT: "What did Rakesh tell Asha before 11:47? Her messages."'],
    editor: ['phone', 'Call the night desk', 'LOGIC: "His press ID has the night desk number. Who calls a reporter at 11:41?"'],
    police: ['phone', 'Call it in', 'LOGIC: "112. Or ring the editor back first and make him admit it."'],
  };
  function current() { return ACTS[act].obj.find((o) => !done.has(o.id))?.id; }
  function nextTarget() {
    const c = current(); if (!c) return null; const h = HINTS[c]; if (!h) return null;
    if (c === 'search') { const n = SEARCH.find((s) => !seen.has(s)); return n ? [n, h[1]] : null; }
    if (c === 'test') { if (!ev.items.envelope?.visible) return ['phone', 'Call the chai stall']; if (!seen.has('envelope_open')) return ['envelope', 'Open the envelope']; return null; }
    if (c === 'godown' && !(seen.has('bizcard') && seen.has('notebook'))) return [seen.has('bizcard') ? 'notebook' : 'bizcard', 'The number is in here'];
    if (c === 'which' && heard.has('gen')) return ['map', 'Mark the map'];
    return h[0] ? [h[0], h[1]] : null;
  }
  const guide = q('.gm-guide'); const gv = new THREE.Vector3();
  function updateGuide() {
    const idle = performance.now() - lastAct;
    if (mode === 'desk' && idle > 45000 && !hinted) { hinted = true; const c = current(); if (c && HINTS[c]) { const [w, ...r] = HINTS[c][2].split(':'); say(w + ':', r.join(':').trim(), 8000); } }
    if (mode !== 'desk' || idle < 7000) { guide.classList.remove('on'); return; }
    const nt = nextTarget(); if (!nt) { guide.classList.remove('on'); return; }
    const o = ev.items[nt[0]]; if (!o || !visible(o)) return;
    o.getWorldPosition(gv); gv.project(cam);
    guide.style.transform = `translate(${(gv.x * .5 + .5) * innerWidth}px,${(-gv.y * .5 + .5) * innerHeight}px)`;
    guide.querySelector('span').textContent = nt[1]; guide.classList.add('on');
  }

  /* ================= start / stop ================= */
  function reset() {
    act = 1; mins = 192; wrong = 0; confronted = false; ended = false; done.clear(); seen.clear(); heard.clear(); clearBoard();
    if (ev.items.envelope) ev.items.envelope.visible = false; btnLab.style.display = 'none';
  }
  function start(fresh = false) {
    [endUI, inspect, rec, pinUI, lab, actCard].forEach((n) => n.classList.remove('on')); ui.classList.remove('board'); btnBoard.textContent = 'LOOK AT THE BOARD';
    reset(); const sv = fresh ? null : load();
    mode = 'desk'; ui.classList.add('on'); ev.show(true); board.visible = true; Object.assign(view, HOME); t0 = performance.now(); lastAct = t0;
    if (sv && sv.act) {
      act = sv.act; mins = sv.mins; wrong = sv.wrong; confronted = sv.confronted;
      sv.done.forEach((d) => done.add(d)); sv.seen.forEach((d) => seen.add(d)); sv.heard.forEach((d) => heard.add(d));
      const byTitle = Object.fromEntries(Object.entries(FINDINGS).map(([k, f]) => [f[0], k])); sv.pins.forEach((t) => byTitle[t] && pinFinding(byTitle[t], true));
      if (seen.has('chai_called') && ev.items.envelope) ev.items.envelope.visible = true;
      if (seen.has('envelope_open')) btnLab.style.display = '';
      startAct(act, true);
      say('YOU:', `Back at the desk. ${fmt(mins)}. Act ${ACTS[act].n}: ${ACTS[act].t.toLowerCase()}`, 6000);
      return;
    }
    startAct(1, true);
    say('YOU:', 'Asha left twenty minutes ago. Everything she found where Rakesh\'s phone last pinged is on the desk, with her phone and the ransom call.', 8000);
    setTimeout(() => { if (mode === 'desk') playClip('asha_note', [[.3, `<b>ASHA (voice note):</b> ${H('Maine sab aapke table pe rakh diya hai. Unka bag, ghadi, sab kuch. Please, unhe dhoondh lijiye.', 'I\'ve left everything on your desk. His bag, his watch, everything. Please find him.')}`]], null, false); }, 8600);
    setTimeout(() => toast('Hover anything on the desk. Click to pick it up.'), 16000);
  }
  function stop() { mode = 'off'; stopClip?.(); recStop?.(); ui.classList.remove('on'); [endUI, inspect, rec, pinUI, lab, actCard].forEach((n) => n.classList.remove('on')); board.visible = false; document.body.style.cursor = ''; }
  q('.gm-new').onclick = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } start(true); };
  btnBoard.onclick = () => {
    if (mode === 'board') { mode = 'desk'; ui.classList.remove('board'); btnBoard.textContent = 'LOOK AT THE BOARD'; gsap.to(view, { ...HOME, duration: 1.4, ease: 'power2.inOut' }); return; }
    if (mode !== 'desk') return;
    mode = 'board'; ui.classList.add('board'); btnBoard.textContent = 'BACK TO THE DESK'; showInfo(null); gsap.to(view, { ...BOARD, duration: 1.6, ease: 'power2.inOut' });
  };
  btnMap.onclick = () => { if (mode === 'desk') openMap(); };

  return {
    start, stop, open, get active() { return mode !== 'off'; },
    // test hooks
    _dbg: { done, seen, heard, get act() { return act; }, startAct, complete, openLab, openMap, openAsha },
    camera() {
      updateGuide();
      const k = mode === 'board' ? .25 : 1;
      sx += (mx - sx) * .06; sy += (my - sy) * .06;
      cam.position.set(view.px + sx * .05 * k, view.py + sy * .03 * k, view.pz);
      cam.lookAt(view.lx + sx * .16 * k, view.ly + sy * .08 * k, view.lz);
    },
  };
}
