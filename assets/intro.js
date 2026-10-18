/* مقدمة الموقع (Intro) — نخلة 3D والتمر بيسقط منها، وآخر تمرة بتتفتح والنواة مكتوب عليها «ثمرات».
   بتظهر مرة واحدة في كل زيارة (sessionStorage)، وفيها زرار «تخطي».
   لإعادة عرضها في أي وقت: افتح الموقع بـ ?intro=1
   التوقيتات كلها بالثواني في T تحت. */
import * as THREE from './vendor/three.module.min.js';

const html = document.documentElement;
const root = document.getElementById('intro');
const qs = new URLSearchParams(location.search);
const FREEZE = qs.has('introT') ? parseFloat(qs.get('introT')) : null; // للمعاينة فقط

const T = {
  dropsFrom: 0.3, dropsTo: 5.3,   // التمر بيسقط في الفترة دي
  heroFall: 5.6, heroLand: 6.5,   // آخر تمرة
  crack: 7.2, open: 7.45, opened: 8.2,
  pitUp: 7.7, pitDone: 8.5,
  tag: 8.2,
  fade: 9.35, end: 10
};

let raf = 0, done = false, renderer = null;

function finish() {
  if (done) return; done = true;
  try { sessionStorage.setItem('thamarat-intro', '1'); } catch (e) {}
  root.classList.add('out');
  setTimeout(() => {
    cancelAnimationFrame(raf);
    if (renderer) { renderer.dispose(); renderer.forceContextLoss(); }
    root.remove();
    html.classList.remove('intro-on');
  }, 650);
}


/* ---------- أدوات ---------- */
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rand = mulberry(20261018);
const rr = (a, b) => a + (b - a) * rand();
const clamp01 = x => Math.min(1, Math.max(0, x));
const smooth = x => { x = clamp01(x); return x * x * (3 - 2 * x); };
const easeOut = x => 1 - Math.pow(1 - clamp01(x), 3);
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

function canvasTex(w, h, draw, { repeat, color = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.anisotropy = 8;
  return t;
}

/* ---------- الخامات ---------- */
function makeTextures() {
  const bark = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#5e412a'; g.fillRect(0, 0, w, h);
    const rows = 8, cols = 4, cw = w / cols, rh = h / rows;
    for (let r = -1; r <= rows; r++) for (let c = -1; c <= cols; c++) {
      const x = c * cw + (r % 2 ? cw / 2 : 0), y = r * rh + rh / 2;
      g.beginPath(); g.moveTo(x - cw * .52, y - rh * .1); g.quadraticCurveTo(x, y - rh * .75, x + cw * .52, y - rh * .1);
      g.lineTo(x + cw * .4, y + rh * .5); g.lineTo(x - cw * .4, y + rh * .5); g.closePath();
      const gr = g.createLinearGradient(x, y - rh * .6, x, y + rh * .5);
      gr.addColorStop(0, '#a07a4c'); gr.addColorStop(.45, '#765232'); gr.addColorStop(1, '#3a2716');
      g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(28,16,6,.75)'; g.lineWidth = 3; g.stroke();
    }
    for (let i = 0; i < 2200; i++) { g.fillStyle = rand() < .5 ? `rgba(20,12,5,${rand() * .18})` : `rgba(200,160,110,${rand() * .12})`; g.fillRect(rand() * w, rand() * h, rand() * 7 + 1, 1); }
  }, { repeat: [7, 2] });

  const sand = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#d7b98d'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26000; i++) {
      const s = rand(); g.fillStyle = s < .45 ? `rgba(150,110,65,${rand() * .35})` : s < .9 ? `rgba(245,225,190,${rand() * .35})` : `rgba(90,65,40,${rand() * .4})`;
      g.fillRect(rand() * w, rand() * h, rand() < .9 ? 1 : 2, rand() < .9 ? 1 : 2);
    }
    g.globalAlpha = .07; g.strokeStyle = '#8a6a44'; g.lineWidth = 2;
    for (let i = 0; i < 18; i++) { g.beginPath(); const y = rand() * h; g.moveTo(0, y); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x / 40 + i) * 6); g.stroke(); }
  }, { repeat: [70, 70] });

  // تجاعيد قشرة البلح (رمادي — اللون من الخامة)
  const wrinkle = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#dcdcdc'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) {
      g.strokeStyle = rand() < .7 ? `rgba(40,40,40,${rr(.15, .45)})` : `rgba(255,255,255,${rr(.2, .5)})`;
      g.lineWidth = rr(1, 3.5); g.beginPath();
      let x = rand() * w, y = rand() * h, a = rand() * 6.3; g.moveTo(x, y);
      for (let k = 0; k < 8; k++) { a += rr(-.6, .6); x += Math.cos(a) * 14; y += Math.sin(a) * 10; g.lineTo(x, y); }
      g.stroke();
    }
  }, { color: false });

  const flesh = canvasTex(512, 512, (g, w, h) => {
    const cx = w / 2, cy = h / 2;
    const gr = g.createRadialGradient(cx, cy, 10, cx, cy, w / 2);
    gr.addColorStop(0, '#e9b467'); gr.addColorStop(.55, '#d3913f'); gr.addColorStop(.92, '#b06a2a'); gr.addColorStop(1, '#5a240c');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 380; i++) { const a = rand() * Math.PI * 2, r0 = rr(.32, .5) * w / 2, r1 = rr(.7, .95) * w / 2;
      g.strokeStyle = `rgba(${rand() < .5 ? '120,62,20' : '250,210,140'},${rr(.08, .22)})`; g.lineWidth = rr(1, 2.4);
      g.beginPath(); g.moveTo(cx + Math.cos(a) * r0 * 1.2, cy + Math.sin(a) * r0 * .85); g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.stroke(); }
    // تجويف النواة + الغشاء الأبيض
    g.save(); g.translate(cx, cy); g.scale(1, .72);
    const cav = g.createRadialGradient(0, 0, 10, 0, 0, w * .33);
    cav.addColorStop(0, '#6b3a17'); cav.addColorStop(.8, '#8a4f22'); cav.addColorStop(1, 'rgba(240,215,170,.9)');
    g.fillStyle = cav; g.beginPath(); g.arc(0, 0, w * .33, 0, Math.PI * 2); g.fill();
    g.restore();
  });

  const spark = canvasTex(64, 64, (g, w) => {
    const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,248,220,1)'); gr.addColorStop(.25, 'rgba(255,214,120,.8)'); gr.addColorStop(1, 'rgba(255,190,80,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
  return { bark, sand, wrinkle, flesh, spark };
}

function pitTextures() {
  const W = 1024, H = 430, word = 'ثمرات';
  const font = `700 250px Alexandria, Tajawal, Tahoma, sans-serif`;
  const map = canvasTex(W, H, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#b8916a'); gr.addColorStop(.5, '#a37b55'); gr.addColorStop(1, '#8c6644');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(${rand() < .5 ? '90,60,35' : '220,195,160'},${rr(.06, .18)})`; g.lineWidth = rr(1, 2);
      const y = rand() * H; g.beginPath(); g.moveTo(rand() * W * .3, y); g.bezierCurveTo(W * .4, y + rr(-8, 8), W * .6, y + rr(-8, 8), W - rand() * W * .3, y + rr(-6, 6)); g.stroke(); }
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl';
    g.fillStyle = 'rgba(255,236,200,.55)'; g.fillText(word, W / 2 + 3, H / 2 + 14);
    g.fillStyle = '#3a1d0a'; g.fillText(word, W / 2, H / 2 + 8);
  });
  const bump = canvasTex(W, H, (g) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl';
    g.filter = 'blur(3px)'; g.fillStyle = '#000'; g.fillText(word, W / 2, H / 2 + 8);
  }, { color: false });
  return { map, bump };
}

/* ---------- النخلة ---------- */
function bladeGeo() {
  const g = new THREE.PlaneGeometry(1, 1, 8, 1); g.translate(.5, 0, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const w = Math.pow(Math.sin(Math.PI * Math.min(1, x * .92 + .08)), .6);
    p.setY(i, y * w); p.setZ(i, -.22 * x * x - Math.abs(y) * .25);
  }
  g.computeVertexNormals(); return g;
}

function taperTube(curve, seg, rad, kOf) {
  const geo = new THREE.TubeGeometry(curve, seg, 1, rad, false);
  const pos = geo.attributes.position, p = V(), c = V();
  for (let i = 0; i <= seg; i++) {
    const t = i / seg; curve.getPointAt(t, c); const k = kOf(t);
    for (let j = 0; j <= rad; j++) { const idx = i * (rad + 1) + j; p.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(k).add(c); pos.setXYZ(idx, p.x, p.y, p.z); }
  }
  geo.computeVertexNormals(); return geo;
}

function buildPalm(tex, { H = 6, fronds = 26, clusters = 0, detail = 1, shadows = true, seed = 1 } = {}) {
  const R = mulberry(seed), r = (a, b) => a + (b - a) * R();
  const group = new THREE.Group();
  const lean = V(r(-.35, .35), 0, r(-.35, .35));
  const trunkCurve = new THREE.CatmullRomCurve3([V(0, 0, 0), V(lean.x * .2, H * .35, lean.z * .2), V(lean.x * .6, H * .7, lean.z * .6), V(lean.x, H, lean.z)]);
  const trunk = new THREE.Mesh(
    taperTube(trunkCurve, 40 * detail, 14, t => (.27 - .07 * t) * (1 + .9 * Math.exp(-t * 16)) * (1 + .03 * Math.sin(t * 140))),
    new THREE.MeshStandardMaterial({ map: tex.bark, bumpMap: tex.bark, bumpScale: 2.5, roughness: .95, color: 0xffffff }));
  trunk.castShadow = shadows; trunk.receiveShadow = true; group.add(trunk);

  const crown = V(lean.x, H, lean.z);
  // كتلة الجمّارة أعلى الجذع
  const boss = new THREE.Mesh(new THREE.SphereGeometry(.34, 16, 12), new THREE.MeshStandardMaterial({ color: 0x6a5232, roughness: 1 }));
  boss.scale.set(1, .9, 1); boss.position.copy(crown).add(V(0, .05, 0)); boss.castShadow = shadows; group.add(boss);

  const blade = bladeGeo();
  const per = Math.round(30 * detail);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .75, side: THREE.DoubleSide });
  const leaves = new THREE.InstancedMesh(blade, leafMat, fronds * per * 2);
  leaves.castShadow = shadows; leaves.receiveShadow = true;
  const spineMat = new THREE.MeshStandardMaterial({ color: 0xb4a35e, roughness: .8 });
  const m = new THREE.Matrix4(), up = V(0, 1, 0), col = new THREE.Color();
  const tan = V(), side = V(), lup = V(), X = V(), Y = V(), Z = V(), p = V();
  let li = 0;
  for (let f = 0; f < fronds; f++) {
    const az = f * 2.39996 + r(-.15, .15);
    const k = f / (fronds - 1);                     // 0 = أحدث سعفة (فوق)
    const el = (1 - k) * 1.2 - k * .45 + r(-.1, .1);
    const L = r(3.1, 3.9) * (.85 + .15 * Math.sin(k * Math.PI));
    const droop = .18 + .4 * Math.cos(el);
    const d0 = V(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
    const base = crown.clone().addScaledVector(d0, .25).add(V(0, -.05 - k * .25, 0));
    const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; const q = base.clone().addScaledVector(d0, L * t); q.y -= droop * L * t * t; pts.push(q); }
    const curve = new THREE.CatmullRomCurve3(pts);
    const spine = new THREE.Mesh(taperTube(curve, 16, 5, t => .04 * (1 - t) + .006), spineMat);
    spine.castShadow = shadows; group.add(spine);
    const old = el < -.15;
    for (let i = 0; i < per; i++) {
      const t = .14 + .85 * (i / (per - 1));
      curve.getPointAt(t, p); curve.getTangentAt(t, tan);
      side.crossVectors(tan, up); if (side.lengthSq() < 1e-4) side.set(1, 0, 0); side.normalize();
      lup.crossVectors(side, tan).normalize();
      const ll = (.28 + .62 * Math.sin(Math.PI * Math.pow(t, .75))) * L / 3.6;
      for (const s of [-1, 1]) {
        const phi = .5 + r(-.12, .12);
        X.copy(side).multiplyScalar(s * Math.cos(phi)).addScaledVector(lup, Math.sin(phi)).addScaledVector(tan, .55).normalize();
        Z.crossVectors(tan, X).normalize(); if (s < 0) Z.negate();
        Y.crossVectors(Z, X).normalize();
        m.makeBasis(X, Y, Z); m.scale(V(ll, .055, ll)); m.setPosition(p);
        leaves.setMatrixAt(li, m);
        if (old) col.setHSL(r(.09, .12), r(.35, .45), r(.38, .48)); else col.setHSL(r(.26, .3), r(.22, .32), r(.34, .42));
        leaves.setColorAt(li, col); li++;
      }
    }
  }
  leaves.count = li; group.add(leaves);

  // سباطات البلح
  const clusterData = [];
  if (clusters) {
    const stalkMat = new THREE.MeshStandardMaterial({ color: 0xd9a23a, roughness: .6 });
    for (let c = 0; c < clusters; c++) {
      const az = c / clusters * Math.PI * 2 + .4;
      const d = V(Math.cos(az), 0, Math.sin(az));
      const b = crown.clone().addScaledVector(d, .22).add(V(0, -.3, 0));
      const end = b.clone().addScaledVector(d, .8).add(V(0, -.55, 0));
      const curve = new THREE.CatmullRomCurve3([b, b.clone().addScaledVector(d, .5).add(V(0, .08, 0)), end]);
      const stalk = new THREE.Mesh(taperTube(curve, 14, 6, t => .045 - .015 * t), stalkMat);
      stalk.castShadow = shadows; group.add(stalk);
      clusterData.push({ az, end });
    }
  }
  return { group, crown, clusters: clusterData };
}

function dateGeo(R, len, { halves = false } = {}) {
  // تمرة: بيضاوية مستطيلة على محور X، مدببة شوية من ناحية
  const deform = (p) => { const k = 1 - .14 * (p.x / len); p.y *= k; p.z *= k; return p; };
  const mk = (ts, tl) => {
    const g = new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, ts, tl);
    g.scale(len, R, R);
    const pos = g.attributes.position, p = V();
    for (let i = 0; i < pos.count; i++) { deform(p.fromBufferAttribute(pos, i)); pos.setXYZ(i, p.x, p.y, p.z); }
    g.computeVertexNormals(); return g;
  };
  if (!halves) return mk(0, Math.PI);
  const cap = (dir) => {
    const g = new THREE.CircleGeometry(1, 48); g.rotateX(dir * -Math.PI / 2); g.scale(len * .985, 1, R * .985);
    const pos = g.attributes.position, p = V();
    for (let i = 0; i < pos.count; i++) { deform(p.fromBufferAttribute(pos, i)); pos.setXYZ(i, p.x, p.y, p.z); }
    return g;
  };
  return { top: mk(0, Math.PI / 2), bottom: mk(Math.PI / 2, Math.PI / 2), capUp: cap(1), capDown: cap(-1) };
}

/* ---------- المشهد ---------- */
async function start(guard) {
  const fontReady = Promise.race([document.fonts?.load('700 200px Alexandria') ?? Promise.resolve(), new Promise(r => setTimeout(r, 1800))]);
  const mobile = Math.min(innerWidth, innerHeight) < 700;

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.75 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  root.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const HORIZON = new THREE.Color(0xf1dcb4);
  scene.fog = new THREE.Fog(HORIZON, 16, 58);
  renderer.setClearColor(HORIZON);

  // سما بتدرّج + وهج الشمس
  const sunDir = V(-.55, .62, .55).normalize();
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(150, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(0x5f9fd6) }, mid: { value: new THREE.Color(0xbcdaea) }, hor: { value: HORIZON }, sun: { value: sunDir } },
    vertexShader: 'varying vec3 vd; void main(){ vd = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `varying vec3 vd; uniform vec3 top,mid,hor,sun;
      void main(){ float h = clamp(vd.y,0.,1.);
        vec3 c = mix(hor, mid, smoothstep(0.,.18,h)); c = mix(c, top, smoothstep(.18,.75,h));
        float s = max(dot(vd, sun),0.); c += vec3(1.,.85,.6)*(pow(s,40.)*.6 + pow(s,6.)*.12);
        gl_FragColor = vec4(c,1.);
        #include <colorspace_fragment>
      }`
  })));

  scene.add(new THREE.HemisphereLight(0xd6e8ff, 0xc7a06a, 1.25));
  const sun = new THREE.DirectionalLight(0xffe4b8, 2.6);
  sun.position.copy(sunDir).multiplyScalar(16);
  sun.castShadow = true; sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 9, bottom: -5, near: 1, far: 40 });
  sun.shadow.bias = -.0004; sun.shadow.normalBias = .02;
  scene.add(sun, sun.target);

  const tex = makeTextures();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.MeshStandardMaterial({ map: tex.sand, bumpMap: tex.sand, bumpScale: 1.2, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  // النخلة الرئيسية
  const palm = buildPalm(tex, { clusters: 6, seed: 7 });
  scene.add(palm.group);

  // نخيل في الخلفية
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + .35 + (i / 8 - .5) * 3.6 + rr(-.15, .15), d = rr(14, 30);
    const bg = buildPalm(tex, { H: rr(4.8, 6.8), fronds: 16, detail: .55, shadows: false, seed: 100 + i });
    bg.group.position.set(Math.sin(a) * d, 0, Math.cos(a) * d); bg.group.rotation.y = rand() * 6.3;
    scene.add(bg.group);
  }

  // البلح على السباطات
  const DR = .05, DL = .085;
  const skinMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: tex.wrinkle, bumpMap: tex.wrinkle, bumpScale: 1.6, roughness: .42, clearcoat: .55, clearcoatRoughness: .35 });
  const dGeo = dateGeo(DR, DL);
  const PER = 64;
  const hang = new THREE.InstancedMesh(dGeo, skinMat, palm.clusters.length * PER);
  hang.castShadow = true;
  const strandPts = [];
  const hangPos = [];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = V(1, 1, 1), col = new THREE.Color();
  const dateColor = () => { const s = rand(); return s < .35 ? col.setHex(0xb0581c) : s < .75 ? col.setHex(0x7b3214) : col.setHex(0x4c1b0b); };
  palm.clusters.forEach((c, ci) => {
    for (let k = 0; k < PER; k++) {
      const h = Math.pow(rand(), .8), rad = .3 * (1 - h * .55) * Math.sqrt(rand()), a = rand() * 6.3;
      const p = c.end.clone().add(V(Math.cos(a) * rad, -.08 - h * .8, Math.sin(a) * rad));
      e.set(rr(-.3, .3), rand() * 6.3, Math.PI / 2 + rr(-.3, .3)); q.setFromEuler(e);
      m.compose(p, q, one); const idx = ci * PER + k; hang.setMatrixAt(idx, m); hang.setColorAt(idx, dateColor());
      hangPos.push({ p, q: q.clone(), idx, ci });
      strandPts.push(c.end.x, c.end.y, c.end.z, p.x, p.y + DL * .9, p.z);
    }
  });
  scene.add(hang);
  const strands = new THREE.BufferGeometry(); strands.setAttribute('position', new THREE.Float32BufferAttribute(strandPts, 3));
  scene.add(new THREE.LineSegments(strands, new THREE.LineBasicMaterial({ color: 0xcf9a3e, transparent: true, opacity: .8 })));

  /* ---------- الكاميرا ---------- */
  const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, .015, 400);
  const fitFov = () => { const a = innerWidth / innerHeight; camera.fov = a < .8 ? 58 : a < 1.2 ? 50 : 42; camera.aspect = a; camera.updateProjectionMatrix(); };
  fitFov();
  const camA = (t) => {
    const u = smooth(t / T.heroFall);
    const th = .95 - .6 * u, r = 9.6 - 2.2 * u, h = 1.15 + .8 * u;
    return { pos: V(Math.sin(th) * r, h, Math.cos(th) * r), look: V(0, 4.5 - .9 * u, 0) };
  };
  const thL = .35;
  const Ry = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), thL);
  const L = V(Math.sin(thL), 0, Math.cos(thL)).multiplyScalar(2.1).add(V(-.35 * Math.cos(thL), .058, .35 * Math.sin(thL)));
  const local = (x, y, z) => V(x, y, z).applyQuaternion(Ry).add(L);
  const closeDist = () => { const a = Math.min(camera.aspect, 1.6); return .34 / ((a < 1 ? 1.05 : .6) * 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * a); };

  // التمرة الأخيرة (نصين + نواة)
  const HR = .06, HL = .1;
  const hg = dateGeo(HR, HL, { halves: true });
  const heroSkin = new THREE.MeshPhysicalMaterial({ color: 0x6e2810, map: tex.wrinkle, bumpMap: tex.wrinkle, bumpScale: 1.4, roughness: .38, clearcoat: .7, clearcoatRoughness: .3 });
  const fleshMat = new THREE.MeshStandardMaterial({ map: tex.flesh, roughness: .55 });
  const hero = new THREE.Group();
  const bottom = new THREE.Group();
  bottom.add(new THREE.Mesh(hg.bottom, heroSkin), new THREE.Mesh(hg.capUp, fleshMat));
  const hinge = new THREE.Group(); hinge.position.set(0, 0, -HR);
  const topHalf = new THREE.Group(); topHalf.position.set(0, 0, HR);
  topHalf.add(new THREE.Mesh(hg.top, heroSkin), new THREE.Mesh(hg.capDown, fleshMat));
  hinge.add(topHalf);
  hero.add(bottom, hinge);
  hero.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  await fontReady;
  const pt = pitTextures();
  const pitGeo = new THREE.SphereGeometry(1, 64, 32);
  pitGeo.scale(HL * .64, HR * .36, HR * .42);
  { const pos = pitGeo.attributes.position, uv = pitGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) / (HL * .64) + 1) / 2, (-pos.getZ(i) / (HR * .42) + 1) / 2); }
  const pit = new THREE.Mesh(pitGeo, new THREE.MeshPhysicalMaterial({ map: pt.map, bumpMap: pt.bump, bumpScale: 3, roughness: .5, clearcoat: .35, clearcoatRoughness: .4 }));
  pit.castShadow = true;
  const pitHolder = new THREE.Group(); pitHolder.add(pit); hero.add(pitHolder);
  const glow = new THREE.PointLight(0xffd08a, 0, .6, 2); glow.position.set(0, .07, .05); hero.add(glow);
  scene.add(hero);

  // لمعة عند الفتح
  const SP = 70, spPos = new Float32Array(SP * 3), spVel = [];
  for (let i = 0; i < SP; i++) { const a = rand() * 6.3, b = rr(.2, 1.3); spVel.push(V(Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b)).multiplyScalar(rr(.04, .14))); }
  const spGeo = new THREE.BufferGeometry(); spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
  const spMat = new THREE.PointsMaterial({ map: tex.spark, size: .012, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const sparks = new THREE.Points(spGeo, spMat); sparks.frustumCulled = false; hero.add(sparks);

  // اختيار التمرة الأخيرة من السباطة اللي ناحية الكاميرا
  const camAt = camA(T.heroFall).pos;
  let heroSrc = hangPos[0], best = -1e9;
  hangPos.forEach(h => { const s = -h.p.distanceTo(camAt) - Math.abs(h.p.y - 4.9) * 2; if (s > best) { best = s; heroSrc = h; } });
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  hang.setMatrixAt(heroSrc.idx, zero);
  const qHang = heroSrc.q.clone();
  const qFinal = Ry.clone();

  // التمر اللي بيسقط
  const N = mobile ? 34 : 46;
  const fall = new THREE.InstancedMesh(dGeo, skinMat, N); fall.castShadow = true; fall.receiveShadow = true;
  const pool = hangPos.filter(h => h !== heroSrc);
  const drops = [];
  for (let i = 0; i < N; i++) {
    const src = pool.splice(Math.floor(rand() * pool.length), 1)[0];
    const out = V(src.p.x, 0, src.p.z).normalize();
    drops.push({ src, t0: T.dropsFrom + (T.dropsTo - T.dropsFrom) * Math.pow(i / (N - 1), .85) + rr(-.12, .12), on: false, rest: false,
      p: V(), v: out.multiplyScalar(rr(.4, 1.3)).add(V(rr(-.3, .3), rr(-.2, .4), rr(-.3, .3))), q: new THREE.Quaternion(),
      w: V(rr(-9, 9), rr(-9, 9), rr(-9, 9)), qr: new THREE.Quaternion() });
    fall.setMatrixAt(i, zero);
    hang.getColorAt(src.idx, col); fall.setColorAt(i, col);
  }
  scene.add(fall);

  /* ---------- المحاكاة ---------- */
  const G = 8.5, FLOOR = DR, dq = new THREE.Quaternion(), ax = V();
  let simT = 0;
  function step(dt) {
    simT += dt;
    for (let i = 0; i < N; i++) {
      const d = drops[i];
      if (!d.on) {
        if (simT < d.t0) continue;
        d.on = true; d.p.copy(d.src.p); d.q.copy(d.src.q); hang.setMatrixAt(d.src.idx, zero); hang.instanceMatrix.needsUpdate = true;
      }
      if (!d.rest) {
        const hx = d.p.x - L.x, hz = d.p.z - L.z, hd = Math.hypot(hx, hz);
        if (hd < 1) { d.v.x += hx / (hd + 1e-3) * 30 * dt; d.v.z += hz / (hd + 1e-3) * 30 * dt; }
        d.v.y -= G * dt; d.p.addScaledVector(d.v, dt);
        const wl = d.w.length(); if (wl > 1e-3) { dq.setFromAxisAngle(ax.copy(d.w).divideScalar(wl), wl * dt); d.q.premultiply(dq); }
        if (d.p.y < FLOOR) {
          d.p.y = FLOOR;
          if (d.v.y < -.7) { d.v.y = -d.v.y * .3; d.v.x *= .5; d.v.z *= .5; d.w.multiplyScalar(.45); }
          else {
            d.rest = true; d.v.set(0, 0, 0);
            const axis = V(1, 0, 0).applyQuaternion(d.q); axis.y = 0; if (axis.lengthSq() < 1e-4) axis.set(1, 0, 0); axis.normalize();
            d.qr.setFromUnitVectors(V(1, 0, 0), axis).multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), rand() * 6.3));
          }
        }
      } else d.q.slerp(d.qr, 1 - Math.exp(-dt * 12));
      m.compose(d.p, d.q, one); fall.setMatrixAt(i, m);
    }
    fall.instanceMatrix.needsUpdate = true;
  }

  const P0 = heroSrc.p.clone();
  const tmpQ = new THREE.Quaternion();
  function heroAt(t) {
    const pos = V(), qq = new THREE.Quaternion();
    if (t < T.heroFall) { pos.copy(P0); qq.copy(qHang); }
    else if (t < T.heroLand) {
      const u = (t - T.heroFall) / (T.heroLand - T.heroFall);
      pos.set(P0.x + (L.x - P0.x) * easeOut(u), P0.y + (L.y - P0.y) * u * u, P0.z + (L.z - P0.z) * easeOut(u));
      qq.copy(qHang).slerp(qFinal, smooth(u));
      qq.multiply(tmpQ.setFromAxisAngle(V(1, 0, 0), 4 * Math.PI * u)).multiply(tmpQ.setFromAxisAngle(V(0, 0, 1), Math.sin(Math.PI * u) * 1.1));
    } else {
      const s = t - T.heroLand; pos.copy(L);
      if (s < .24) pos.y += .07 * Math.sin(Math.PI * s / .24); else if (s < .38) pos.y += .018 * Math.sin(Math.PI * (s - .24) / .14);
      qq.copy(qFinal).multiply(tmpQ.setFromAxisAngle(V(1, 0, 0), Math.sin(s * 22) * .25 * Math.exp(-s * 7)));
    }
    return { pos, q: qq };
  }

  const tagEl = root.querySelector('.intro-tag');
  function frame(t) {
    const hs = heroAt(t);
    hero.position.copy(hs.pos); hero.quaternion.copy(hs.q);

    // فتح التمرة
    let open = 0;
    if (t > T.crack && t < T.open) open = -.07 * Math.sin(Math.PI * (t - T.crack) / (T.open - T.crack));
    else if (t >= T.open) { const u = clamp01((t - T.open) / (T.opened - T.open)); open = -1.8 * (1 - Math.pow(1 - u, 3)) + Math.sin(u * Math.PI) * -.12; }
    hinge.rotation.x = open;
    const pu = smooth((t - T.pitUp) / (T.pitDone - T.pitUp));
    pitHolder.position.y = HR * .32 * pu; pitHolder.rotation.x = .3 * pu; pitHolder.scale.setScalar(1 + .08 * pu);
    glow.intensity = .035 * pu;
    if (t > T.pitUp) {
      const s = t - T.pitUp; spMat.opacity = Math.max(0, Math.min(1, s * 4) * (1 - (s - .5) / 1.2));
      for (let i = 0; i < SP; i++) { const v = spVel[i], k = s * (1.1 - s * .25); spPos[i * 3] = v.x * k; spPos[i * 3 + 1] = .02 + v.y * k - .02 * s * s; spPos[i * 3 + 2] = v.z * k; }
      spGeo.attributes.position.needsUpdate = true;
    }

    // الكاميرا
    const A = camA(t), dist = closeDist();
    const Bpos = local(0, .9, 1.9), Cpos = local(0, dist * .7, dist * .72), Dpos = local(0, dist * .7, dist * .6);
    const s1 = smooth((t - (T.heroFall - .1)) / .55), s2 = smooth((t - (T.heroFall + .15)) / 1), s3 = smooth((t - (T.heroLand - .05)) / 1.05), s4 = smooth((t - T.open) / 1.6);
    const pos = A.pos.clone().lerp(Bpos, s2).lerp(Cpos, s3).lerp(Dpos, s4);
    const look = A.look.clone().lerp(hs.pos.clone().add(V(0, .02, 0)), s1).lerp(local(0, HR * .5, -HR * .3), s4);
    camera.position.copy(pos); camera.lookAt(look);

    if (tagEl) tagEl.classList.toggle('on', t >= T.tag);
  }

  renderer.compile(scene, camera);
  clearTimeout(guard);
  addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); fitFov(); });
  root.classList.add('ready');

  const DT = 1 / 120;
  if (FREEZE !== null) { while (simT < FREEZE) step(DT); frame(FREEZE); renderer.render(scene, camera); root.dataset.frozen = '1'; return; }

  let t0 = performance.now(), acc = 0, last = 0;
  const loop = (now) => {
    if (done) return;
    const t = (now - t0) / 1000;
    acc += Math.min(.1, t - last); last = t;
    while (acc >= DT) { step(DT); acc -= DT; }
    frame(t); renderer.render(scene, camera);
    if (t >= T.fade) { finish(); }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}

/* ---------- التشغيل ---------- */
if (root && html.classList.contains('intro-on')) {
  root.querySelector('.intro-skip')?.addEventListener('click', finish);
  addEventListener('keydown', e => { if (e.key === 'Escape') finish(); });
  const guard = FREEZE === null ? setTimeout(finish, 6000) : 0; // لو التحميل اتأخر أوي، نكمل على الموقع
  start(guard).catch(err => { console.warn('intro:', err); finish(); });
}
