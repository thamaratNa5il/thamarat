/* صفحة «من أرض الواقع» (#field)
   لإضافة صورة أو فيديو: حط الملف في assets/field/ وزوّد سطر في المصفوفة المناسبة تحت.
   الصور: اسم-الملف.webp (كبيرة) + اسم-الملف-s.webp (صغيرة). الفيديو: .mp4 + صورة غلاف .jpg بنفس الاسم. */
(() => {
const D = 'assets/field/';
const page = document.querySelector('[data-page="field"]');
if (!page) return;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- البيانات ---------- */
const STEPS = [ // مراحل الاستصلاح
  ['r-raw',   'الأرض البكر',        'أرض صحراوية مفتوحة قبل أي تدخل.'],
  ['r-level', 'التسوية والتخطيط',    'تسوية الأرض وتخطيط خطوط الزراعة بمعدات الشركة.'],
  ['r-trench','حفر خطوط الري',       'خنادق الخطوط الرئيسية اللي هتشيل مياه الري للمزرعة.'],
  ['r-rig',   'حفر الآبار',          'ماكينات حفر الآبار المملوكة للشركة.'],
  ['r-solar', 'الطاقة الشمسية',      'محطات طاقة شمسية في قلب المزرعة.'],
  ['r-pipes', 'شبكات الري',          'مدّ المواسير وتجهيز شبكات الري.'],
  ['r-build', 'مباني الخدمة',        'مباني الخدمة في موقع المزرعة.'],
  ['r-rows',  'جاهزة للزراعة',       '']
];
const RECLAIM_VIDS = [
  ['v-r1', 'الحفار شغال', 'حفر خط ري رئيسي'],
  ['v-r2', 'تجهيز الأرض', 'تسوية وتمهيد بالمعدات'],
  ['v-r3', 'جولة في الموقع', 'الطاقة الشمسية ومباني الخدمة']
];
const NURSERY = [ // [ملف, نوع: p طولي / l عرضي / v فيديو, تعليق]
  ['n-1','p','فسائل في أكياس، كل واحدة على نقطة ري'],
  ['v-n1','v','جولة بين خطوط المشتل'],
  ['n-2','p',''],
  ['n-8','l','صوب التظليل بتحمي الفسائل من الشمس المباشرة'],
  ['n-3','p',''],
  ['n-9','p','ممرات منظمة بين الخطوط'],
  ['v-n2','v','الفسائل عن قرب'],
  ['n-4','p',''],
  ['n-10','p','شبكة ري بالتنقيط لكل فسيلة'],
  ['n-5','p',''],
  ['v-n3','v','من جوه الصوبة'],
  ['n-11','p',''],
  ['n-7','p',''],
  ['n-6','p',''],
  ['n-12','p','جاهزة تتنقل للأرض'],
  ['n-13','p','']
];
const FARMS = [ // معرض «مزارعنا»
  ['p-1','p','نخلة محمّلة بالسباطات'],
  ['p-3','p','السباطة جوه كيس شبكي يحميها'],
  ['p-5','p',''],
  ['v-p2','v','بين النخيل وقت الحصاد'],
  ['p-2','p',''],
  ['p-4','p','البلح من قريب'],
  ['p-9','p',''],
  ['p-6','p',''],
  ['p-10','p','موسم الحصاد'],
  ['p-7','p',''],
  ['p-11','p',''],
  ['p-8','p',''],
  ['p-12','p',''],
  ['p-13','p',''],
  ['p-14','p',''],
  ['p-15','p',''],
  ['p-16','p','']
];

/* ---------- أدوات ---------- */
const h = (s) => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstChild; };
const vidTag = (id, cls = '') => `<video class="${cls}" muted loop playsinline preload="none" poster="${D}${id}.jpg" data-auto><source src="${D}${id}.mp4" type="video/mp4"></video>`;
const PLAY = '<svg viewBox="0 0 24 24"><path d="M7 4v16l13-8z"/></svg>';

/* مراحل الاستصلاح */
const steps = page.querySelector('#fx-steps');
STEPS.forEach(([f, t, d]) => steps.append(h(
  `<figure class="fx-step"><div class="ph" data-full="${D}${f}.webp" data-cap="${d ? t + ' — ' + d : t}" tabindex="0" role="button" aria-label="كبّر الصورة: ${t}"><img src="${D}${f}-s.webp" alt="${t}" loading="lazy"></div><figcaption><b>${t}</b>${d ? `<span>${d}</span>` : ''}</figcaption></figure>`)));
page.querySelectorAll('.fx-arrows button').forEach(b => b.onclick = () => {
  const dir = +b.dataset.dir; // RTL: الجاي على الشمال
  steps.scrollBy({ left: -dir * (steps.querySelector('.fx-step').offsetWidth + 18), behavior: 'smooth' });
});

/* فيديوهات الاستصلاح */
const reel = page.querySelector('#fx-reel');
RECLAIM_VIDS.forEach(([f, t, s]) => reel.append(h(
  `<figure class="fx-vid paused"><div class="frame" role="button" tabindex="0" aria-label="تشغيل/إيقاف: ${t}">${vidTag(f)}<span class="live">من الموقع</span><span class="play">${PLAY}</span></div><figcaption>${t}<small>${s}</small></figcaption></figure>`)));

/* المشتل */
const track = page.querySelector('#fx-track');
NURSERY.forEach(([f, k, c]) => track.append(k === 'v'
  ? h(`<figure class="fx-card v" data-video="${D}${f}.mp4" data-cap="${c}">${vidTag(f)}${c ? `<figcaption>${c}</figcaption>` : ''}</figure>`)
  : h(`<figure class="fx-card ${k}" data-full="${D}${f}.webp" data-cap="${c}" tabindex="0"><img src="${D}${f}-s.webp" alt="${c || 'فسائل نخيل في المشتل'}" loading="lazy">${c ? `<figcaption>${c}</figcaption>` : ''}</figure>`)));

/* مزارعنا */
const mason = page.querySelector('#fx-mason');
FARMS.forEach(([f, k, c], i) => {
  const el = k === 'v'
    ? h(`<figure class="fx-tile v" data-video="${D}${f}.mp4" data-cap="${c}" tabindex="0">${vidTag(f)}${c ? `<figcaption>${c}</figcaption>` : ''}</figure>`)
    : h(`<figure class="fx-tile" data-full="${D}${f}.webp" data-cap="${c}" tabindex="0"><img src="${D}${f}-s.webp" alt="${c || 'نخيل مثمر في مزارعنا'}" loading="lazy" width="420" height="560">${c ? `<figcaption>${c}</figcaption>` : ''}</figure>`);
  if (i >= 12) el.dataset.extra = '';
  mason.append(el);
});
const extras = [...mason.querySelectorAll('[data-extra]')];
const moreBtn = page.querySelector('#fx-more');
if (extras.length && matchMedia('(max-width:700px)').matches) {
  extras.forEach(e => e.hidden = true);
  moreBtn.hidden = false;
  moreBtn.querySelector('button').onclick = () => { extras.forEach(e => e.hidden = false); moreBtn.hidden = true; };
}

/* ---------- قبل / بعد ---------- */
const ba = page.querySelector('.fx-ba'), range = ba.querySelector('input');
const setPos = (p) => { p = Math.max(0, Math.min(100, p)); ba.style.setProperty('--pos', p + '%'); range.value = p; };
range.addEventListener('input', () => { setPos(+range.value); ba.classList.add('used'); });
let drag = false;
ba.addEventListener('pointerdown', e => { drag = true; ba.classList.add('used'); move(e); });
addEventListener('pointerup', () => drag = false);
ba.addEventListener('pointermove', e => drag && move(e));
function move(e) { const r = ba.getBoundingClientRect(); setPos((e.clientX - r.left) / r.width * 100); }
/* لمحة تلقائية أول ما يظهر علشان الزائر يفهم إن فيه سحب */
new IntersectionObserver((es, o) => {
  if (!es[0].isIntersecting || reduce) return; o.disconnect();
  const t0 = performance.now();
  const anim = (t) => { if (ba.classList.contains('used')) return; const k = Math.min(1, (t - t0) / 2200);
    setPos(50 + Math.sin(k * Math.PI * 2) * 22); if (k < 1) requestAnimationFrame(anim); };
  requestAnimationFrame(anim);
}, { threshold: .6 }).observe(ba);

/* ---------- تشغيل الفيديوهات لما تظهر بس ---------- */
const vids = [...page.querySelectorAll('video[data-auto]')];
const vio = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target, fig = v.closest('.fx-vid');
  if (e.isIntersecting && !reduce && !v.dataset.user) { v.play().then(() => fig && fig.classList.remove('paused')).catch(() => {}); }
  else if (!e.isIntersecting) { v.pause(); fig && fig.classList.add('paused'); }
}), { threshold: .35 });
vids.forEach(v => vio.observe(v));
/* لو المتصفح ما قدرش يشغّل الفيديو، تفضل صورة الغلاف ظاهرة بدل مربع أسود */
vids.forEach(v => v.querySelector('source').addEventListener('error', () => {
  const img = new Image(); img.src = v.poster; img.alt = ''; img.className = v.className;
  img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block'; vio.unobserve(v); v.replaceWith(img);
}));
page.querySelectorAll('.fx-vid .frame').forEach(fr => {
  const v = fr.querySelector('video'), fig = fr.parentElement;
  const toggle = () => { if (v.paused) { v.dataset.user = ''; delete v.dataset.user; v.play(); fig.classList.remove('paused'); } else { v.pause(); v.dataset.user = '1'; fig.classList.add('paused'); } };
  fr.onclick = toggle; fr.onkeydown = e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle());
});

/* ---------- المشتل: تمرير أفقي مثبّت مع السكرول ---------- */
const hs = page.querySelector('.fx-hs'), pin = hs.querySelector('.pin'), hsBar = hs.querySelector('.fx-hs-bar b');
let hsMax = 0, native = true;
function hsLayout() {
  native = reduce || innerWidth < 900;
  hs.classList.toggle('native', native);
  if (native) { hs.style.height = ''; return; }
  hsMax = Math.max(0, track.scrollWidth - pin.clientWidth);
  hs.style.height = (pin.offsetHeight + hsMax) + 'px';
}
function hsScroll() {
  if (native) { const m = pin.scrollWidth - pin.clientWidth; hsBar.style.width = (m > 0 ? Math.abs(pin.scrollLeft) / m * 100 : 0) + '%'; return; }
  const r = hs.getBoundingClientRect(), top = parseFloat(getComputedStyle(pin).top);
  const p = Math.max(0, Math.min(1, (top - r.top) / (hs.offsetHeight - pin.offsetHeight || 1)));
  track.style.transform = `translateX(${p * hsMax}px)`; // RTL: الصور الجاية بتيجي من الشمال
  hsBar.style.width = (p * 100) + '%';
}
pin.addEventListener('scroll', hsScroll, { passive: true });

/* ---------- شريط الرحلة ---------- */
const chapters = ['fx-land', 'fx-nursery', 'fx-farms'].map(id => page.querySelector('#' + id));
const railBtns = [...page.querySelectorAll('.fx-rail button')];
function rail() {
  const mid = innerHeight * .45;
  chapters.forEach((ch, i) => {
    const r = ch.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (mid - r.top) / r.height));
    railBtns[i].querySelector('.bar b').style.width = (p * 100) + '%';
    railBtns[i].classList.toggle('on', r.top <= mid && r.bottom > mid);
    railBtns[i].classList.toggle('done', p >= 1);
  });
}
const jump = (i) => chapters[i].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
railBtns.forEach((b, i) => b.onclick = () => jump(i));
page.querySelectorAll('.fx-tri button').forEach((b, i) => b.onclick = () => jump(i));

function onScroll() { if (page.hidden) return; hsScroll(); rail(); }
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => { if (!page.hidden) { hsLayout(); onScroll(); } });
addEventListener('routechange', () => setTimeout(() => { if (!page.hidden) { hsLayout(); onScroll(); } else vids.forEach(v => v.pause()); }, 30));
if (!page.hidden) requestAnimationFrame(() => { hsLayout(); onScroll(); });
addEventListener('load', () => { if (!page.hidden) { hsLayout(); onScroll(); } });
track.querySelectorAll('img').forEach(i => i.addEventListener('load', () => !page.hidden && hsLayout(), { once: true }));

/* ---------- عارض الصور ---------- */
const lb = h(`<div class="fx-lb" role="dialog" aria-modal="true" aria-label="عارض الصور">
  <div class="top"><span class="cnt"></span><button class="x" aria-label="إغلاق"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
  <div class="stage"><button class="pv" aria-label="السابقة"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button><div class="media" style="display:contents"></div><button class="nx" aria-label="التالية"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button></div>
  <div class="cap"></div></div>`);
document.body.append(lb);
let set = [], idx = 0, lastFocus = null;
function show(i) {
  idx = (i + set.length) % set.length;
  const el = set[idx], m = lb.querySelector('.media');
  m.innerHTML = el.dataset.video
    ? `<video src="${el.dataset.video}" controls autoplay playsinline loop></video>`
    : `<img src="${el.dataset.full}" alt="${el.dataset.cap || ''}">`;
  lb.querySelector('.cap').textContent = el.dataset.cap || '';
  lb.querySelector('.cnt').textContent = `${idx + 1} / ${set.length}`;
  const nxt = set[(idx + 1) % set.length]; if (nxt.dataset.full) new Image().src = nxt.dataset.full;
}
function open(el) {
  const group = el.closest('#fx-steps, #fx-track, #fx-mason');
  set = [...group.querySelectorAll('[data-full],[data-video]')].filter(x => !x.hidden);
  lastFocus = document.activeElement;
  vids.forEach(v => v.pause());
  show(set.indexOf(el)); lb.classList.add('open'); document.body.style.overflow = 'hidden';
  lb.querySelector('.x').focus();
}
function close() {
  lb.classList.remove('open'); lb.querySelector('.media').innerHTML = ''; document.body.style.overflow = '';
  lastFocus && lastFocus.focus({ preventScroll: true }); onScroll();
  vids.forEach(v => { const r = v.getBoundingClientRect(); if (!reduce && !v.dataset.user && r.bottom > 0 && r.top < innerHeight) v.play().catch(() => {}); });
}
lb.querySelector('.x').onclick = close;
lb.querySelector('.nx').onclick = () => show(idx + 1);
lb.querySelector('.pv').onclick = () => show(idx - 1);
lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('stage')) close(); });
addEventListener('keydown', e => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape') close();
  if (e.key === 'ArrowLeft') show(idx + 1);   // RTL: الشمال = التالي
  if (e.key === 'ArrowRight') show(idx - 1);
});
let sx = null;
lb.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
lb.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(idx + (dx > 0 ? 1 : -1)); sx = null; });
page.addEventListener('click', e => { const el = e.target.closest('[data-full],[data-video]'); if (el && !e.target.closest('.fx-vid')) open(el); });
page.addEventListener('keydown', e => { if (e.key !== 'Enter') return; const el = e.target.closest('[data-full],[data-video]'); if (el) open(el); });
})();
