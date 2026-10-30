/* حماية محتوى الموقع من التصوير والنسخ
   - كل الصور والفيديوهات عليها لوجو ثمرات محفور في الملف نفسه (الحماية الأساسية).
   - الملف ده بيصعّب التصوير: بيغطي الصفحة وقت أدوات تصوير الشاشة والطباعة، ويمنع حفظ الصور.
   ملحوظة: مفيش موقع يقدر يمنع تصوير الشاشة 100% (خصوصًا من الموبايل)، علشان كده اللوجو على الصور هو الضمان. */
(() => {
const MSG = 'تصوير محتوى موقع ثمرات غير مسموح';

/* ---------- الشكل ---------- */
const css = document.createElement('style');
css.textContent = `
img,video{-webkit-user-drag:none;user-drag:none;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}
#tg-shield{position:fixed;inset:0;z-index:2147483647;display:none;place-items:center;align-content:center;gap:22px;
  background:#163d27;color:#eef6ea;text-align:center;padding:24px;font:600 clamp(17px,2.6vw,24px)/1.6 system-ui,'Segoe UI',Tahoma,sans-serif}
#tg-shield img{width:min(240px,55vw);height:auto}
#tg-shield small{display:block;font-weight:400;font-size:.7em;color:#9fd6a8;direction:ltr}
html.tg-on #tg-shield{display:grid}
html.tg-on body>*:not(#tg-shield){filter:blur(28px)!important}
#tg-toast{position:fixed;left:50%;bottom:28px;translate:-50% 20px;z-index:2147483646;background:#163d27;color:#eef6ea;
  padding:12px 20px;border-radius:12px;font:600 15px system-ui,Tahoma,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.25);
  opacity:0;pointer-events:none;transition:opacity .25s,translate .25s}
#tg-toast.show{opacity:1;translate:-50% 0}
@media print{
  html::before{content:"${MSG} — www.thamaratmisr.com";display:block;padding:40px;text-align:center;font:600 20px Tahoma,sans-serif;color:#163d27}
  body{display:none!important}
}`;
document.head.append(css);

const shield = document.createElement('div');
shield.id = 'tg-shield';
shield.setAttribute('aria-hidden', 'true');
shield.innerHTML = `<img src="/assets/logo-cream.png" alt=""><div>${MSG}<small>www.thamaratmisr.com</small></div>`;
const toast = document.createElement('div');
toast.id = 'tg-toast';
toast.setAttribute('role', 'status');
document.body.append(shield, toast);

const root = document.documentElement;
let hideT, toastT;
const show = (ms) => { clearTimeout(hideT); root.classList.add('tg-on'); if (ms) hideT = setTimeout(hide, ms); };
const hide = () => { clearTimeout(hideT); root.classList.remove('tg-on'); };
const say = () => { toast.textContent = MSG; toast.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 2600); };
const wipeClipboard = () => { try { navigator.clipboard && navigator.clipboard.writeText(MSG + ' — www.thamaratmisr.com'); } catch (e) {} };

/* ---------- أزرار تصوير الشاشة والطباعة والحفظ ---------- */
const typing = (t) => t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
addEventListener('keydown', (e) => {
  const k = (e.key || '').toLowerCase(), mod = e.ctrlKey || e.metaKey;
  if (k === 'printscreen' || e.keyCode === 44) { show(1500); wipeClipboard(); say(); return; }
  // ويندوز: Win+Shift+S — ماك: Cmd+Shift+3/4/5
  if ((e.metaKey && e.shiftKey) || k === 'meta' && e.shiftKey || k === 'shift' && e.metaKey) { show(); return; }
  if (mod && (k === 'p' || k === 's')) { e.preventDefault(); say(); return; }          // طباعة / حفظ الصفحة
  if (mod && e.shiftKey && k === 's') { e.preventDefault(); say(); return; }           // لقطة شاشة فايرفوكس
  if (mod && k === 'u') { e.preventDefault(); return; }                                 // عرض مصدر الصفحة
}, true);
addEventListener('keyup', (e) => {
  const k = (e.key || '').toLowerCase();
  if (k === 'printscreen' || e.keyCode === 44) { show(1500); wipeClipboard(); say(); return; }
  if (root.classList.contains('tg-on') && !e.metaKey && document.hasFocus()) hideT = setTimeout(hide, 900);
}, true);

/* ---------- لما الصفحة تفقد التركيز (أداة القص بتاخد التركيز من المتصفح) ---------- */
addEventListener('blur', () => {
  // الضغط جوه خريطة جوجل (iframe) بيعمل blur برضه — ده مش تصوير
  setTimeout(() => { if (document.activeElement && document.activeElement.tagName === 'IFRAME') return; if (!document.hasFocus()) show(); }, 0);
});
addEventListener('focus', () => { hideT = setTimeout(hide, 250); });
document.addEventListener('visibilitychange', () => { if (document.hidden) show(); else hideT = setTimeout(hide, 250); });
['pointermove', 'pointerdown', 'touchstart', 'wheel'].forEach((ev) =>
  addEventListener(ev, () => { if (root.classList.contains('tg-on') && document.hasFocus()) hide(); }, { passive: true }));
addEventListener('beforeprint', () => { show(); say(); });
addEventListener('afterprint', () => hide());

/* ---------- منع حفظ الصور والفيديوهات ---------- */
const media = (t) => t && t.closest && t.closest('img,video,picture,figure,.ph,[data-full],[data-video]');
document.addEventListener('contextmenu', (e) => { if (typing(e.target)) return; e.preventDefault(); if (media(e.target)) say(); }, true);
document.addEventListener('dragstart', (e) => { if (media(e.target)) e.preventDefault(); }, true);
document.addEventListener('copy', (e) => { if (media(e.target) || (e.target && e.target.querySelector && e.target.querySelector('img'))) e.preventDefault(); }, true);

const lockVideo = (v) => {
  v.setAttribute('controlsList', 'nodownload noplaybackrate noremoteplayback');
  v.setAttribute('disablePictureInPicture', '');
  v.setAttribute('disableRemotePlayback', '');
};
const scan = (n) => { if (n.tagName === 'VIDEO') lockVideo(n); else if (n.querySelectorAll) n.querySelectorAll('video').forEach(lockVideo); };
scan(document.body);
new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && scan(n))))
  .observe(document.body, { childList: true, subtree: true });
})();
