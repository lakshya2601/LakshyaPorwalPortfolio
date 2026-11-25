// Chapters after the intro: scroll / arrow keys / swipe / chapter list move the camera through the office.
export function initChapters(ctx) {
  const { THREE, S, cam, shot, gsap, sfx, R } = ctx;
  const $ = (id) => document.getElementById(id);
  const panel = $('panel'), nav = $('chapters');

  /* ---------- 3D: evidence board cards + strings ---------- */
  const OZ = -7.5, BX = 1.6, BY = 2.05, BZ = OZ + .115;
  const board = new THREE.Group(); board.visible = false; S.add(board);
  function cardTex(title, items, accent, w = 512, h = 384, photo) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    x.fillStyle = '#ede3cc'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(80,60,30,${Math.random() * .06})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    x.fillStyle = accent; x.fillRect(0, 0, w, 10);
    x.fillStyle = '#1a1612'; x.font = 'bold 40px "Special Elite", "Courier New", monospace'; x.fillText(title, 28, 70);
    x.fillStyle = 'rgba(26,22,18,.35)'; x.fillRect(28, 86, w - 56, 2);
    x.font = '30px "Special Elite", "Courier New", monospace'; x.fillStyle = '#2a241d';
    items.forEach((it, i) => x.fillText('· ' + it, 34, 136 + i * 44));
    if (photo) { x.font = 'bold 150px Georgia, serif'; x.fillStyle = '#2a241d'; x.textAlign = 'center'; x.fillText('L.P.', w / 2, 260); x.font = '28px "Special Elite", monospace'; x.fillText('THE DETECTIVE', w / 2, 330); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }
  const SKILLS = [
    { id: 'ai', title: 'AI / ML', items: ['PyTorch, TensorFlow', 'LLMs & RAG', 'NLP, deep learning', 'scikit-learn'], accent: '#b3261e', x: .72, y: 2.42, r: -.06 },
    { id: 'ops', title: 'MLOps', items: ['MLflow, Airflow', 'Docker, Kubernetes', 'CI/CD pipelines', 'model monitoring'], accent: '#a06a12', x: 2.48, y: 2.4, r: .05 },
    { id: 'be', title: 'BACKEND', items: ['Python, FastAPI', 'Flask, REST', 'Go, Java, C++', 'SQL / PL-SQL'], accent: '#1f4e79', x: .78, y: 1.66, r: .04 },
    { id: 'fe', title: 'FRONTEND', items: ['React, Next.js', 'React Native', 'TypeScript, JS', 'Three.js'], accent: '#2f6b3a', x: 2.44, y: 1.66, r: -.04 },
    { id: 'data', title: 'DATA & CLOUD', items: ['Pandas, Spark', 'feature engineering', 'AWS', 'Git'], accent: '#5b3a7a', x: 1.6, y: 1.5, r: .02 },
  ];
  const cards = [];
  const center = new THREE.Mesh(new THREE.PlaneGeometry(.36, .3), new THREE.MeshBasicMaterial({ map: cardTex('', [], '#1a1612', 512, 420, true), color: 0xb8b0a0 }));
  center.position.set(BX, 2.28, BZ + .006); center.rotation.z = .03; board.add(center);
  const pinG = new THREE.SphereGeometry(.018, 12, 8), pinM = new THREE.MeshBasicMaterial({ color: 0xc0392b });
  const pin = (x, y) => { const p = new THREE.Mesh(pinG, pinM); p.position.set(x, y, BZ + .02); board.add(p); };
  pin(BX, 2.28 + .13);
  for (const s of SKILLS) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.52, .39), new THREE.MeshBasicMaterial({ map: cardTex(s.title, s.items, s.accent), color: 0xa8a090, transparent: true }));
    m.position.set(s.x, s.y, BZ); m.rotation.z = s.r; m.userData = s; board.add(m); cards.push(m); pin(s.x, s.y + .17);
  }
  const strings = SKILLS.map((s) => {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(BX, 2.41, BZ + .021), new THREE.Vector3(s.x, s.y + .17, BZ + .021)]);
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xc0392b, transparent: true, opacity: .9 })); board.add(l); return l;
  });
  // cross links (skills that work together)
  [['ai', 'ops'], ['ops', 'be'], ['be', 'fe'], ['ai', 'data']].forEach(([a, b]) => {
    const A = SKILLS.find((s) => s.id === a), Bk = SKILLS.find((s) => s.id === b);
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(A.x, A.y + .17, BZ + .021), new THREE.Vector3(Bk.x, Bk.y + .17, BZ + .021)]);
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x8a2a20, transparent: true, opacity: .55 })); board.add(l); strings.push(l);
  });

  /* ---------- 3D: archive drawer ---------- */
  const archive = new THREE.Group(); S.add(archive);
  const drawer = new THREE.Group(); drawer.position.set(-2.9, 1.1, -7.07); archive.add(drawer);
  const dm = new THREE.MeshStandardMaterial({ color: 0x23332b, roughness: .45, metalness: .3 });
  const face = new THREE.Mesh(new THREE.BoxGeometry(.57, .39, .025), dm); face.position.z = .3; drawer.add(face);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(.18, .03, .03), new THREE.MeshStandardMaterial({ color: 0xcfcfcf, roughness: .2, metalness: 1 })); handle.position.set(0, .1, .33); drawer.add(handle);
  for (const [w, h, d, x, y, z] of [[.02, .3, .58, -.27, -.03, 0], [.02, .3, .58, .27, -.03, 0], [.54, .02, .58, 0, -.17, 0]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), dm); p.position.set(x, y, z); drawer.add(p); }
  const folders = [];
  const fm = [0xc49a5b, 0xb88d4f, 0xd1a868].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: .9 }));
  for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.5, .27, .008), fm[i % 3]); f.position.set(0, -.03, -.24 + i * .055); f.rotation.x = -.08; drawer.add(f); folders.push(f); }
  const archLight = new THREE.PointLight(0xffc890, 0, 3, 1.6); archLight.position.set(-2.75, 1.75, -6.3); S.add(archLight);
  drawer.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  /* ---------- chapters ---------- */
  const OFFICE = { px: .1, py: 1.5, pz: -2.2, lx: 0, ly: 1.22, lz: -5.3 };
  const CASES = [
    {
      no: '01', title: 'The Question Nobody Could Query', where: 'Leezova Technologies · Oct 2025 – now',
      crime: 'The answers were in the database, but only engineers could ask it anything. Everyone else waited.',
      evidence: ['LLMs', 'Generative AI', 'Python', 'SQL'],
      method: 'Built a text-to-SQL feature: plain-English questions in, accurate SQL out, with the right schema context so the model asks the database what was actually meant.',
      verdict: 'Anyone can question the data in plain English.',
    },
    {
      no: '02', title: 'The News That Never Stopped', where: 'Cansvolution · Jun 2025 – Oct 2025',
      crime: 'Too many articles, too little time, and summaries that made things up.',
      evidence: ['RAG', 'LLMs', 'Feature engineering', 'CI/CD', 'Monitoring'],
      method: 'Built a news-summarization system on RAG: clean the data, retrieve what matters, let the LLM summarise from real sources. Shipped it with CI/CD pipelines and monitoring for model health, errors and cost.',
      verdict: 'Grounded summaries, watched around the clock.',
    },
    {
      no: '03', title: 'The Install That Took Forever', where: 'Ctruh · Aug 2024 – Jan 2025',
      crime: 'A data platform that was slow to install, crashed when things went wrong, and needed the internet everywhere.',
      evidence: ['ML data discovery', 'Microservices', 'DevOps', 'Failure handling'],
      method: 'Built ML-driven data discovery (patterns, origins and links across datasets), hardened failure handling, and made fully offline (darksite) installs possible.',
      verdict: 'Installation time cut by 40%.',
    },
  ];
  const DESK = { px: -.15, py: 2.05, pz: -3.7, lx: -.25, ly: .84, lz: -4.62 };
  const CH = [
    { name: 'The detective', cam: OFFICE, html: null },
    {
      name: 'The letter', cam: { px: .05, py: 1.32, pz: -3.15, lx: .1, ly: .95, lz: -4.7 },
      html: `<div class="letter"><div class="lt-date">Indore, ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      <p>Dear Detective,</p><p>Our AI dazzles in the demo and falls apart in production. Answers drift. Costs climb. Nobody can say why.</p>
      <p>We need someone who can build it, ship it, and keep it honest. Will you take the case?</p><p class="lt-sign">— A client</p></div>
      <div class="reply">Case accepted. Here's the evidence. ↓</div>`,
    },
    { name: 'The evidence board', cam: { px: 1.6, py: 2.0, pz: -5.05, lx: 1.6, ly: 1.98, lz: -7.5 }, html: `<div class="tag"><b>EXHIBIT A</b><br>The tools I trust.<br><span>hover a card to follow the string</span></div>` },
    {
      name: 'The archive', cam: { px: -2.35, py: 1.95, pz: -5.75, lx: -2.95, ly: 1.0, lz: -6.95 },
      html: `<div class="notes"><div class="nh">FIELD NOTES · HOW I STOP AI FROM MAKING THINGS UP</div>
      <ol><li><b>Retrieve.</b> Pull the right files from the archive: a vector search finds the passages that actually answer the question.</li>
      <li><b>Augment.</b> Put that evidence in front of the model, next to the question.</li>
      <li><b>Generate.</b> The model answers from the evidence, and cites it. No evidence, no claim.</li></ol>
      <div class="nf">That's RAG. I build it, and the pipelines that keep it fresh.</div></div>`,
    },
    ...CASES.map((c) => ({ name: `Case #${c.no}`, cam: DESK, html: caseHTML(c), case: true })),
  ];
  function caseHTML(c) {
    return `<div class="folder"><div class="ftab">CASE #${c.no}</div><div class="fbody">
      <div class="fwhere">${c.where}</div><h2>${c.title}</h2>
      <div class="frow"><span>THE CRIME</span><p>${c.crime}</p></div>
      <div class="frow"><span>THE EVIDENCE</span><p>${c.evidence.map((e) => `<i>${e}</i>`).join(' ')}</p></div>
      <div class="frow"><span>THE METHOD</span><p>${c.method}</p></div>
      <div class="frow"><span>THE VERDICT</span><p><b>${c.verdict}</b></p></div>
      <div class="fstamp">SOLVED</div></div></div>`;
  }
  nav.innerHTML = CH.map((c, i) => `<button data-i="${i}"><em>${String(i + 1).padStart(2, '0')}</em><span>${c.name}</span></button>`).join('') + `<button disabled><em>··</em><span>more cases soon</span></button>`;
  nav.querySelectorAll('button[data-i]').forEach((b) => (b.onclick = () => go(+b.dataset.i)));

  let cur = 0, busy = false, active = false;
  function go(i) {
    if (!active || busy || i === cur || i < 0 || i >= CH.length) return;
    busy = true; const prev = cur; cur = i;
    nav.querySelectorAll('button').forEach((b, k) => b.classList.toggle('on', k === i));
    const same = CH[prev].case && CH[i].case;
    gsap.to(shot, { ...CH[i].cam, duration: same ? .6 : 2.2, ease: 'power2.inOut' });
    // panel
    gsap.to(panel, { opacity: 0, y: 14, duration: .35, onComplete: () => {
      panel.className = 'ui ch' + i + (CH[i].case ? ' case' : '');
      panel.innerHTML = CH[i].html || '';
      if (CH[i].html) gsap.fromTo(panel, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .8, delay: same ? 0 : 1.2, ease: 'power3.out', onStart: () => { if (CH[i].case || i === 1) sfx.paper(); } });
      const st = panel.querySelector('.fstamp');
      if (st) gsap.fromTo(st, { opacity: 0, scale: 2.4, rotate: -24 }, { opacity: 1, scale: 1, rotate: -12, duration: .28, delay: (same ? .5 : 1.8), ease: 'power4.in', onComplete: sfx.thud });
    } });
    gsap.to('#note', { opacity: i === 0 ? 1 : 0, duration: .5 });
    // chapter-specific 3D
    if (i === 2) showBoard(); else if (prev === 2) board.visible = false;
    gsap.to(drawer.position, { z: i === 3 ? -6.68 : -7.07, duration: 1.1, delay: i === 3 ? 1.6 : 0, ease: 'power3.out', onStart: () => { if (i === 3) sfx.slide(); } });
    gsap.to(archLight, { intensity: i === 3 ? 4.5 : 0, duration: 1 });
    setTimeout(() => { busy = false; }, same ? 700 : 1500);
  }
  function showBoard() {
    board.visible = true;
    cards.forEach((c, k) => gsap.fromTo(c.position, { z: BZ + .25 }, { z: BZ, duration: .5, delay: 1.4 + k * .18, ease: 'bounce.out', onComplete: () => sfx.tick(180, .05, .2, 'triangle') }));
    cards.forEach((c, k) => gsap.fromTo(c.material, { opacity: 0 }, { opacity: 1, duration: .3, delay: 1.4 + k * .18 }));
    strings.forEach((l, k) => { l.geometry.setDrawRange(0, 0); setTimeout(() => l.geometry.setDrawRange(0, 2), 2400 + k * 120); });
  }
  // hover on the board
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let hover = null;
  addEventListener('pointermove', (e) => {
    if (cur !== 2) return;
    ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)); ray.setFromCamera(ndc, cam);
    const h = ray.intersectObjects(cards)[0]?.object || null;
    if (h !== hover) {
      if (hover) gsap.to(hover.scale, { x: 1, y: 1, duration: .3 });
      hover = h; document.body.style.cursor = h ? 'pointer' : '';
      cards.forEach((c, k) => { c.material.color.setHex(!h || c === h ? (c === h ? 0xe8e0cc : 0xa8a090) : 0x6a6458); strings[k].material.opacity = !h || c === h ? .95 : .25; });
      if (h) { gsap.to(h.scale, { x: 1.12, y: 1.12, duration: .3 }); sfx.tick(1400, .03, .05); }
    }
  });
  // input
  let wheelAcc = 0;
  addEventListener('wheel', (e) => { if (!active) return; wheelAcc += e.deltaY; if (Math.abs(wheelAcc) > 60) { go(cur + Math.sign(wheelAcc)); wheelAcc = 0; } }, { passive: true });
  addEventListener('keydown', (e) => { if (!active) return; if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) go(cur + 1); if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) go(cur - 1); });
  let ty = null; addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchend', (e) => { if (!active || ty == null) return; const d = ty - e.changedTouches[0].clientY; if (Math.abs(d) > 40) go(cur + Math.sign(d)); ty = null; }, { passive: true });

  return {
    start() { active = true; cur = 0; nav.querySelector('button').classList.add('on'); gsap.to(['#chapters', '#next'], { opacity: 1, duration: 1 }); },
    reset() { active = false; cur = 0; board.visible = false; drawer.position.z = -7.07; panel.innerHTML = ''; gsap.set(['#chapters', '#next', panel], { opacity: 0 }); nav.querySelectorAll('button').forEach((b) => b.classList.remove('on')); },
    get index() { return cur; }, go,
  };
}
