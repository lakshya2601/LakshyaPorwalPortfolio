// Second half of the office: surveillance monitors (MLOps), wall of badges (experience),
// chalkboard (teaching), off duty, and the case-closed contact form.
export function buildScenes2(THREE, S) {
  const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw(x, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return { t, c, x }; };
  const std = (c, r = .6, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const shadowy = (g) => g.traverse((o: any) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  /* ---- surveillance cart with 4 CRT monitors (right-front corner) ---- */
  const cart = new THREE.Group(); cart.position.set(2.6, 0, -1.4); cart.rotation.y = -2.39; S.add(cart);
  const metal = std(0x1d1f24, .45, .7), crtM = std(0x2b2a26, .5, .1);
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.3, .05, .6), metal); top.position.y = .78; cart.add(top);
  const shelf = top.clone(); shelf.position.y = .25; cart.add(shelf);
  for (const [x, z] of [[-.6, -.26], [.6, -.26], [-.6, .26], [.6, .26]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .8, 8), metal); l.position.set(x, .4, z); cart.add(l); }
  const screens = [];
  const MON = [[-.33, 1.03, 0], [.33, 1.03, 0], [-.33, 1.5, 0], [.33, 1.5, 0]];
  MON.forEach(([x, y], i) => {
    const body = new THREE.Mesh(new THREE.BoxGeometry(.6, .44, .42), crtM); body.position.set(x, y, -.04); cart.add(body);
    const back = new THREE.Mesh(new THREE.BoxGeometry(.4, .3, .2), crtM); back.position.set(x, y, -.33); cart.add(back);
    const s = tex(320, 240, () => {}); const m = new THREE.MeshBasicMaterial({ map: s.t, toneMapped: false });
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(.5, .36), m); scr.position.set(x, y, .175); cart.add(scr);
    screens.push({ ...s, m, i, hist: Array.from({ length: 40 }, () => .5) });
  });
  const monGlow = new THREE.PointLight(0x7fd0ff, 0, 3.5, 1.6); monGlow.position.set(2.5, 1.3, -1.9); S.add(monGlow);
  shadowy(cart);
  const LABELS = ['PIPELINE · CI/CD', 'MODEL HEALTH', 'LATENCY p95', 'COST / 1K REQ'];
  let alarm = 0;
  function drawScreens(t) {
    for (const s of screens) {
      const { x, c } = s, w = c.width, h = c.height; const red = s.i === 1 && alarm > 0;
      x.fillStyle = red ? '#2a0606' : '#03110c'; x.fillRect(0, 0, w, h);
      x.fillStyle = red ? '#ff5a4a' : '#5dffa8'; x.font = '15px Courier New'; x.fillText(LABELS[s.i], 12, 22);
      x.fillText(new Date().toLocaleTimeString('en-GB'), w - 92, 22);
      if (s.i === 0) {
        const st = ['DATA', 'TRAIN', 'EVAL', 'DEPLOY', 'WATCH']; const k = Math.floor(t * .8) % 6;
        st.forEach((n, j) => { x.strokeStyle = j < k ? '#5dffa8' : '#245c40'; x.strokeRect(14, 40 + j * 38, w - 28, 28); x.fillStyle = j < k ? '#5dffa8' : '#2f7a55'; x.fillText((j < k ? '[ok] ' : '[..] ') + n, 24, 59 + j * 38); });
      } else {
        if (Math.random() < .25) { s.hist.shift(); let v = .5 + (Math.random() - .5) * .25; if (s.i === 1 && alarm > 0) v = .9; s.hist.push(v); }
        x.strokeStyle = red ? '#ff5a4a' : '#5dffa8'; x.lineWidth = 2; x.beginPath();
        s.hist.forEach((v, j) => { const px = 12 + j * (w - 24) / 39, py = h - 20 - v * (h - 70); j ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke();
        if (red) { x.fillStyle = '#ff5a4a'; x.font = 'bold 22px Courier New'; x.fillText('DRIFT DETECTED', 60, h / 2); }
        else if (s.i === 1 && alarm < 0) { x.fillStyle = '#5dffa8'; x.font = 'bold 20px Courier New'; x.fillText('RETRAINED · OK', 70, h / 2); }
      }
      for (let y = 0; y < h; y += 3) { x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, y, w, 1); }
      s.t.needsUpdate = true;
    }
  }

  /* ---- wall of badges (right wall, x = 4) ---- */
  const badges = new THREE.Group(); S.add(badges);
  const JOBS = [
    ['LEEZOVA', 'AI/ML ENGINEER', 'OCT 2025 – NOW', 'Indore', '#b08d57'],
    ['CANSVOLUTION', 'ML ENGINEER', 'JUN – OCT 2025', 'Indore', '#9aa0a8'],
    ['FREELANCE', 'DEVELOPER', 'FEB – JUN 2025', 'Remote', '#9aa0a8'],
    ['CTRUH', 'SOFTWARE ENGINEER', 'AUG 2024 – JAN 2025', 'Bangalore', '#9aa0a8'],
    ['SVVV', 'B.TECH · COMPUTER SCIENCE', 'CLASS OF 2023', 'Indore', '#7a5a3a'],
  ];
  JOBS.forEach(([co, role, when, city, rim], i) => {
    const z = -3.95 - i * .62, y = i % 2 ? 1.72 : 1.98;
    const { t } = tex(300, 380, (x, w, h) => {
      x.fillStyle = '#1b1712'; x.fillRect(0, 0, w, h);
      x.fillStyle = rim; x.beginPath(); x.arc(w / 2, 120, 92, 0, 7); x.fill();
      x.fillStyle = '#1b1712'; x.beginPath(); x.arc(w / 2, 120, 76, 0, 7); x.fill();
      x.fillStyle = rim; x.font = 'bold 26px Georgia'; x.textAlign = 'center'; x.fillText('★', w / 2, 92);
      x.font = `bold ${co.length > 9 ? 22 : 30}px "Special Elite", Courier New`; x.fillText(co, w / 2, 135);
      x.font = '16px Courier New'; x.fillText(city.toUpperCase(), w / 2, 162);
      x.fillStyle = '#e9dfc6'; x.font = 'bold 19px Courier New'; x.fillText(role, w / 2, 262);
      x.fillStyle = '#b7ab92'; x.font = '18px Courier New'; x.fillText(when, w / 2, 296);
    });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(.04, .52, .42), std(0x2a1a10, .5)); frame.position.set(3.97, y, z); badges.add(frame);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(.36, .46), new THREE.MeshBasicMaterial({ map: t, color: 0xd8d0c0 }));
    face.position.set(3.945, y, z); face.rotation.y = -Math.PI / 2; badges.add(face);
  });
  const badgeLight = new THREE.SpotLight(0xffd6a0, 0, 5, .7, .6, 1.4); badgeLight.position.set(2.6, 3.2, -5.2); badgeLight.target.position.set(4, 1.8, -5.2); S.add(badgeLight, badgeLight.target);

  /* ---- chalkboard (left wall, near the door) ---- */
  const chalk = tex(1024, 640, (x, w, h) => {
    x.fillStyle = '#1f2b25'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * .04})`; x.fillRect(Math.random() * w, Math.random() * h, 3, 1); }
    x.strokeStyle = 'rgba(240,240,230,.85)'; x.fillStyle = 'rgba(240,240,230,.9)'; x.lineWidth = 3;
    x.font = '46px "Special Elite", Courier New'; x.fillText('MLOps 101', 60, 90);
    x.font = '30px "Special Elite", Courier New';
    const st = ['data', 'model', 'deploy', 'monitor']; st.forEach((s, i) => { x.strokeRect(60 + i * 230, 160, 170, 70); x.fillText(s, 80 + i * 230, 205); if (i < 3) { x.beginPath(); x.moveTo(232 + i * 230, 195); x.lineTo(285 + i * 230, 195); x.stroke(); } });
    x.beginPath(); x.moveTo(890, 235); x.quadraticCurveTo(520, 330, 145, 235); x.stroke(); x.fillText('↺ repeat', 450, 320);
    x.fillText('"If it isn\'t monitored,', 60, 420); x.fillText(' it isn\'t in production."', 60, 465);
    x.font = '26px "Special Elite", Courier New'; x.fillText('Internship curriculum · Leezova', 60, 560);
  });
  const board = new THREE.Group(); board.position.set(-3.96, 1.85, -1.7); board.rotation.y = Math.PI / 2; S.add(board);
  board.add(new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.15, .04), std(0x3a2618, .5)));
  const cb = new THREE.Mesh(new THREE.PlaneGeometry(1.62, 1.02), new THREE.MeshBasicMaterial({ map: chalk.t, color: 0x8a948c })); cb.position.z = .025; board.add(cb);
  const tray = new THREE.Mesh(new THREE.BoxGeometry(1.6, .03, .07), std(0x3a2618, .5)); tray.position.set(0, -.56, .05); board.add(tray);

  /* ---- off duty: chai on the cabinet steam ---- */
  const steam = []; const steamM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(.012, 8, 6), steamM.clone()); p.position.set(.62, .95, -4.3); S.add(p); steam.push({ p, o: i / 6 }); }
  let steamOn = 0;

  return {
    screens, monGlow, badgeLight,
    setAlarm(v) { alarm = v; },
    setSteam(v) { steamOn = v; },
    update(t, active) {
      if (active.mon) drawScreens(t);
      for (const s of steam) { const k = (t * .35 + s.o) % 1; s.p.position.set(.62 + Math.sin(t * 2 + s.o * 9) * .02 * k, .93 + k * .35, -4.3); s.p.scale.setScalar(1 + k * 1.6); s.p.material.opacity = steamOn * (1 - k) * .16; }
    },
  };
}
