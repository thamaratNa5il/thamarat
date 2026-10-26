/* مساعد ثمرات — شات بيرد على أسئلة الزوار فورًا.
   1) حسابات العائد والتكلفة بتتعمل محليًا بنفس معادلات حاسبة الموقع (window.thamaratModel).
   2) باقي الأسئلة بتروح للمساعد الذكي على /api/chat (لو مفعّل).
   3) لو المساعد الذكي مش متاح، الرد بيطلع من قاعدة المعرفة assets/chat-kb.js محليًا. */
import { KB, CONTACT, STARTERS } from './chat-kb.js';

const $ = (s, r = document) => r.querySelector(s);

/* ---------- تطبيع النص العربي علشان المطابقة ---------- */
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩', FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
function norm(s) {
  return String(s).toLowerCase()
    .replace(/[٠-٩]/g, d => AR_DIGITS.indexOf(d)).replace(/[۰-۹]/g, d => FA_DIGITS.indexOf(d))
    .replace(/[ً-ٰٟـ]/g, '')          // تشكيل وتطويل
    .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/٫/g, '.').replace(/[،؟?!.,:؛"'()«»\-_/]+(?!\d)/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
const INDEX = KB.map(e => ({ e, keys: e.k.map(norm).concat(norm(e.t)) }));

function bestMatch(q) {
  const n = ' ' + norm(q) + ' ';
  let best = null, top = 0;
  for (const { e, keys } of INDEX) {
    let s = 0;
    for (const k of keys) {
      if (!k) continue;
      if (n.includes(' ' + k + ' ')) s += 2 + k.split(' ').length * 1.5;      // كلمة/عبارة كاملة
      else if (k.length >= 4 && n.includes(k)) s += 1 + k.split(' ').length;  // جزء من كلمة (ال/وال/بال...)
    }
    if (s > top) { top = s; best = e; }
  }
  return top >= 2 ? best : null;
}

/* ---------- حسابات الجدوى ---------- */
const VARS = [
  { key: 'majdoul', re: /مجدول|مدجول|medjool|majdoul/, name: 'المجدول' },
  { key: 'barhi', re: /برحي|barhi/, name: 'البرحي' },
  { key: 'siwi', re: /سيوي|siwi/, name: 'السيوي' }
];
const CALC_WORDS = /قارن|مقارن|عائد|ربح|ارباح|مكسب|هكسب|تكلف|سعر|بكام|كام|احسب|حساب|جدوي|جدوى|استرد|مصاريف|فلوس|محتاج|قيمه/;
const money = n => Math.round(n).toLocaleString('en-US');
const fnum = n => (Math.round(n * 100) / 100).toLocaleString('en-US');
const ORD = ['الأولى', 'التانية', 'التالتة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'التامنة', 'التاسعة', 'العاشرة'];

function parseArea(n) {
  if (/فدانين/.test(n)) return 2;
  const m = n.match(/(\d+(?:\.\d+)?)\s*(?:فدان|افدنه|فدادين|ف\b)?/);
  if (m) return parseFloat(m[1]);
  if (/نص فدان/.test(n)) return 0.5;
  if (/فدان واحد|الفدان|فدان/.test(n)) return 1;
  return null;
}

function calcAnswer(q) {
  const model = window.thamaratModel;
  if (typeof model !== 'function') return null;
  const n = norm(q);
  const vars = VARS.filter(v => v.re.test(n));
  const area = parseArea(n);
  const hasNum = /\d/.test(n) || /فدان/.test(n);
  if (!hasNum || !CALC_WORDS.test(n) && !(vars.length && /\d/.test(n))) return null;
  if (!area || area <= 0 || area > 5000) return null;
  const F = fnum(area) + (area === 1 ? ' فدان' : area === 2 ? ' فدان (فدانين)' : ' فدان');
  const note = '\n\nالأرقام **استرشادية وليست التزامًا بعائد محدد**، وبتختلف حسب الأسعار وظروف الإنتاج.';

  if (vars.length !== 1) {   // مفيش صنف أو أكتر من صنف → مقارنة
    const list = (vars.length ? vars : VARS).map(v => {
      const m = model(v.key, area);
      return `• **${v.name}**: التكلفة ${money(m.cost)} ج · صافي العائد ${money(m.gain)} ج · العائد ${Math.round(m.roi * 100)}%`;
    }).join('\n');
    return { text: `مقارنة على مساحة **${F}** لمدة 10 سنين:\n${list}${note}\n[افتح الحاسبة وشوف التفاصيل](#calc)`, calc: { key: (vars[0] || VARS[1]).key, area } };
  }
  const v = vars[0], m = model(v.key, area);
  const pay = m.payback !== null ? `\n• استرداد التكلفة متوقع في **السنة ${ORD[m.payback]}**.` : '';
  const text =
    `دراسة **${v.name}** على **${F}** (${money(m.palms)} نخلة، 10 سنين):\n` +
    `• تمن الأرض: ${money(m.landCost)} ج\n` +
    `• مصروفات حتى التبشير: ${money(m.pre)} ج\n` +
    `• **إجمالي التكلفة: ${money(m.cost)} ج**\n` +
    `• صافي ربح التمور والفسائل (بعد نسبة الشركة): ${money(m.netSum)} ج\n` +
    `• قيمة الأرض بعد 10 سنين: ${money(m.landAfter)} ج\n` +
    `• **صافي العائد الإجمالي: ${money(m.gain)} ج — معدل العائد ${Math.round(m.roi * 100)}%**` +
    pay + note + `\n[افتح الجدول السنوي في الحاسبة](#calc) · [اطلب المساحة دي](#order)`;
  return { text, calc: { key: v.key, area } };
}

/* ---------- ردود قصيرة ---------- */
const GREET = /^(السلام عليكم|سلام عليكم|سلام|اهلا|اهلين|هاي|هلو|hi|hello|صباح الخير|صباح النور|مساء الخير|مساء النور|ازيك|ازيكم|عامل ايه)( .{0,15})?$/;
const THANKS = /(شكرا|متشكر|تسلم|تسلمي|ميرسي|thanks|thank you|جزاك الله|الله يكرمك)/;
const BYE = /^(باي|مع السلامه|سلام عليكم ورحمه الله|bye)$/;

function localAnswer(q) {
  const n = norm(q);
  if (GREET.test(n)) return { text: 'أهلًا بيك في **ثمرات** 🌴\nاسألني عن أي حاجة: المشروعات، غرب المنيا، الأصناف، الأسعار والعائد، أو إزاي تحجز أرضك.' };
  if (THANKS.test(n) && n.split(' ').length <= 6) return { text: 'العفو، تحت أمرك في أي وقت 🌴\nلو حابب تكمل مع خدمة العملاء: واتساب **' + CONTACT.waLocal + '**.' };
  if (BYE.test(n)) return { text: 'مع السلامة، ونتمنى نشوفك قريب في غرب المنيا 🌴' };
  const c = calcAnswer(q);
  if (c) return c;
  return null;
}
function kbAnswer(q) {
  const e = bestMatch(q);
  return e ? { text: e.a } : null;
}
const UNKNOWN = { text: 'السؤال ده إجابته الدقيقة عند خدمة العملاء — كلّمهم على واتساب **' + CONTACT.waLocal + '** وهيردوا عليك بالتفصيل.\n\nوتقدر تسألني عن: المشروعات، ليه غرب المنيا، الأصناف، الأسعار والعائد، الرعاية، أو طريقة الحجز.', wa: true };

/* ---------- عرض الرسائل ---------- */
function esc(s) { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function render(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\[([^\]]+)\]\((#[a-z]+)\)/g, '<a href="$2" data-hash>$1</a>')
    .replace(/\n/g, '<br>');
}

const CSS = `
.tc-fab{position:fixed;z-index:60;inset-inline-end:calc(18px + env(safe-area-inset-left,0px));bottom:calc(18px + env(safe-area-inset-bottom,0px));display:flex;align-items:center;gap:10px;border:0;cursor:pointer;border-radius:99px;padding:8px 18px 8px 8px;background:var(--leaf);color:var(--on-leaf);font:700 15px var(--body);box-shadow:0 10px 30px rgba(14,38,23,.28),0 0 0 4px color-mix(in srgb,var(--leaf) 22%,transparent);transition:transform .2s,box-shadow .2s,opacity .2s}
.tc-fab:hover{transform:translateY(-2px)}
.tc-fab .tc-ic{width:38px;height:38px;border-radius:50%;background:var(--on-leaf);display:grid;place-items:center}
.tc-fab .tc-ic svg{width:21px;height:21px;fill:var(--leaf)}
.tc-fab .tc-dot{position:absolute;top:6px;inset-inline-start:36px;width:10px;height:10px;border-radius:50%;background:#7fd88f;box-shadow:0 0 0 2px var(--leaf)}
.tc-open .tc-fab{opacity:0;pointer-events:none;transform:scale(.8)}
.tc-panel{position:fixed;z-index:61;inset-inline-end:18px;bottom:calc(18px + env(safe-area-inset-bottom,0px));width:min(400px,calc(100vw - 36px));height:min(620px,calc(100dvh - 110px));display:flex;flex-direction:column;background:var(--forest);color:var(--ink);border-radius:22px;overflow:hidden;box-shadow:0 24px 60px rgba(14,38,23,.35),0 0 0 1px var(--canopy);transform-origin:bottom left;transform:translateY(16px) scale(.96);opacity:0;pointer-events:none;transition:transform .25s cubic-bezier(.2,.8,.2,1),opacity .2s}
.tc-open .tc-panel{transform:none;opacity:1;pointer-events:auto}
.tc-head{display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--frond);color:var(--on-frond)}
.tc-av{width:42px;height:42px;border-radius:50%;background:#fff;display:grid;place-items:center;flex:none;overflow:hidden}
.tc-av img{width:34px;height:auto}
.tc-ttl{flex:1;min-width:0;line-height:1.35}
.tc-ttl b{display:block;font:700 16px var(--display)}
.tc-ttl small{font-size:12.5px;opacity:.85;display:flex;align-items:center;gap:6px}
.tc-ttl small::before{content:"";width:7px;height:7px;border-radius:50%;background:#7fd88f}
.tc-hb{width:36px;height:36px;border-radius:50%;border:0;cursor:pointer;display:grid;place-items:center;background:rgba(255,255,255,.14);color:inherit;flex:none;text-decoration:none;transition:background .2s}
.tc-hb:hover{background:rgba(255,255,255,.26)}
.tc-hb svg{width:18px;height:18px;fill:currentColor}
.tc-log{flex:1;overflow-y:auto;padding:16px 14px 8px;display:flex;flex-direction:column;gap:10px;overscroll-behavior:contain;scroll-behavior:smooth}
.tc-m{max-width:88%;padding:10px 14px;border-radius:18px;font-size:15px;line-height:1.75;word-wrap:break-word;animation:tcIn .25s ease}
.tc-m.bot{align-self:flex-start;background:var(--grove);border-start-start-radius:6px;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--canopy) 70%,transparent)}
.tc-m.me{align-self:flex-end;background:var(--leaf);color:var(--on-leaf);border-start-end-radius:6px}
.tc-m b{color:var(--sprout);font-weight:700}
.tc-m.me b{color:inherit}
.tc-m a{color:var(--sprout);font-weight:700;text-underline-offset:3px}
.tc-m .tc-wa{display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:7px 14px;border-radius:99px;background:#25a55f;color:#fff;text-decoration:none;font-weight:700;font-size:14px}
.tc-m .tc-wa svg{width:16px;height:16px;fill:#fff}
.tc-typing{align-self:flex-start;display:flex;gap:5px;padding:14px 16px;background:var(--grove);border-radius:18px;border-start-start-radius:6px}
.tc-typing i{width:7px;height:7px;border-radius:50%;background:var(--muted);animation:tcDot 1s infinite}
.tc-typing i:nth-child(2){animation-delay:.15s}.tc-typing i:nth-child(3){animation-delay:.3s}
.tc-chips{display:flex;flex-wrap:wrap;gap:7px;padding:2px 14px 10px}
.tc-chip{border:0;cursor:pointer;font:600 13.5px var(--body);padding:7px 13px;border-radius:99px;background:var(--grove);color:var(--sprout);box-shadow:inset 0 0 0 1px var(--canopy);transition:background .2s}
.tc-chip:hover{background:var(--canopy)}
.tc-form{display:flex;align-items:flex-end;gap:8px;padding:10px 12px 12px;border-top:1px solid var(--canopy);background:var(--forest)}
.tc-in{flex:1;resize:none;max-height:110px;min-height:44px;border:0;outline:0;border-radius:22px;padding:11px 16px;font:500 15.5px var(--body);line-height:1.5;background:var(--grove);color:var(--ink);box-shadow:inset 0 0 0 1px var(--canopy)}
.tc-in:focus{box-shadow:inset 0 0 0 2px var(--leaf)}
.tc-in::placeholder{color:var(--muted)}
.tc-send{width:44px;height:44px;flex:none;border-radius:50%;border:0;cursor:pointer;background:var(--leaf);color:var(--on-leaf);display:grid;place-items:center;transition:opacity .2s,transform .2s}
.tc-send:disabled{opacity:.45;cursor:default}
.tc-send svg{width:20px;height:20px;fill:currentColor}
.tc-foot{font-size:11.5px;color:var(--muted);text-align:center;padding:0 12px 10px;background:var(--forest)}
@keyframes tcIn{from{opacity:0;transform:translateY(6px)}}
@keyframes tcDot{0%,60%,100%{opacity:.3;transform:none}30%{opacity:1;transform:translateY(-3px)}}
@media (max-width:560px){
  .tc-fab{padding:8px;inset-inline-end:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px))}
  .tc-fab .tc-lbl{display:none}
  .tc-panel{inset:auto 0 0 0;width:100%;height:min(88dvh,100dvh - 60px);border-radius:22px 22px 0 0;padding-bottom:env(safe-area-inset-bottom,0px)}
}
@media (prefers-reduced-motion:reduce){.tc-panel,.tc-fab,.tc-m{transition:none;animation:none}}
`;

const ICON_CHAT = '<svg viewBox="0 0 24 24"><path d="M12 3C6.5 3 2 6.8 2 11.5c0 2.4 1.2 4.6 3.1 6.1L4.3 21l4-1.9c1.2.4 2.4.6 3.7.6 5.5 0 10-3.8 10-8.5S17.5 3 12 3zm-4 9.7a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6zm4 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6zm4 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6z"/></svg>';
const ICON_WA = '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.8 14.1c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1a17 17 0 0 1-1.8-.7c-3.1-1.3-5.1-4.5-5.3-4.7-.2-.2-1.2-1.6-1.2-3.1s.8-2.2 1.1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .7.5l1 2.3c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.4-.1.7.2.3.8 1.4 1.8 2.2 1.2 1.1 2.2 1.4 2.5 1.6.3.1.5.1.7-.1l1-1.2c.2-.3.4-.3.7-.2l2.2 1.1c.3.1.5.2.6.3.1.2.1.8-.1 1.5z"/></svg>';
const ICON_X = '<svg viewBox="0 0 24 24"><path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7l1.4-1.4 6.3 6.3 6.3-6.3z"/></svg>';
const ICON_SEND = '<svg viewBox="0 0 24 24"><path d="M21 20.5 3 12l18-8.5v6.6L9 12l12 1.9z"/></svg>';

function build() {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const root = document.createElement('div');
  root.className = 'tc';
  root.innerHTML = `
    <button class="tc-fab" type="button" aria-label="افتح مساعد ثمرات" aria-expanded="false" aria-controls="tc-panel">
      <span class="tc-ic">${ICON_CHAT}</span><span class="tc-lbl">اسأل ثمرات</span><span class="tc-dot"></span>
    </button>
    <div class="tc-panel" id="tc-panel" role="dialog" aria-label="مساعد ثمرات" aria-modal="false">
      <div class="tc-head">
        <div class="tc-av"><img src="assets/logo-green.png" alt=""></div>
        <div class="tc-ttl"><b>مساعد ثمرات</b><small>بيرد عليك فورًا</small></div>
        <a class="tc-hb" href="https://wa.me/${CONTACT.wa}" target="_blank" rel="noopener" aria-label="كلّم خدمة العملاء على واتساب" title="واتساب خدمة العملاء">${ICON_WA}</a>
        <button class="tc-hb tc-close" type="button" aria-label="اقفل المساعد">${ICON_X}</button>
      </div>
      <div class="tc-log" role="log" aria-live="polite"></div>
      <div class="tc-chips"></div>
      <form class="tc-form">
        <textarea class="tc-in" rows="1" maxlength="600" placeholder="اكتب سؤالك هنا…" aria-label="سؤالك"></textarea>
        <button class="tc-send" type="submit" aria-label="إرسال" disabled>${ICON_SEND}</button>
      </form>
      <div class="tc-foot">الأرقام استرشادية · للتفاصيل النهائية: خدمة العملاء</div>
    </div>`;
  document.body.appendChild(root);
  return root;
}

function init() {
  const root = build();
  const fab = $('.tc-fab', root), panel = $('.tc-panel', root), log = $('.tc-log', root), chips = $('.tc-chips', root);
  const form = $('.tc-form', root), input = $('.tc-in', root), send = $('.tc-send', root);
  const history = [];
  let aiOff = false, busy = false, greeted = false;

  const scroll = () => { log.scrollTop = log.scrollHeight; };
  function add(role, text, opts = {}) {
    const m = document.createElement('div');
    m.className = 'tc-m ' + (role === 'user' ? 'me' : 'bot');
    if (role === 'user') m.textContent = text;
    else {
      m.innerHTML = render(text);
      if (opts.wa) m.insertAdjacentHTML('beforeend', `<br><a class="tc-wa" href="https://wa.me/${CONTACT.wa}" target="_blank" rel="noopener">${ICON_WA}كلّم خدمة العملاء</a>`);
    }
    log.appendChild(m); scroll();
    history.push({ role: role === 'user' ? 'user' : 'assistant', content: text });
    return m;
  }
  function typing(on) {
    let t = $('.tc-typing', log);
    if (on && !t) { t = document.createElement('div'); t.className = 'tc-typing'; t.innerHTML = '<i></i><i></i><i></i>'; log.appendChild(t); scroll(); }
    if (!on && t) t.remove();
  }
  function setChips(list) {
    chips.innerHTML = '';
    list.forEach(q => { const b = document.createElement('button'); b.type = 'button'; b.className = 'tc-chip'; b.textContent = q; b.onclick = () => ask(q); chips.appendChild(b); });
    chips.hidden = !list.length;
  }

  async function askAI() {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 20000);
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: history.slice(-10) }), signal: ctl.signal });
      if (r.status === 503 || r.status === 404 || r.status === 405) { aiOff = true; return null; }
      if (!r.ok) return null;
      const d = await r.json();
      return d && d.reply ? { text: d.reply } : null;
    } catch (e) { return null; } finally { clearTimeout(timer); }
  }

  async function ask(q) {
    q = q.trim(); if (!q || busy) return;
    busy = true; send.disabled = true; setChips([]);
    add('user', q); input.value = ''; grow();
    typing(true);
    let ans = localAnswer(q);
    if (ans) await new Promise(r => setTimeout(r, 280));
    else {
      if (!aiOff) ans = await askAI();
      if (!ans) { ans = kbAnswer(q); if (ans) await new Promise(r => setTimeout(r, 280)); }
      if (!ans) ans = UNKNOWN;
    }
    typing(false);
    add('bot', ans.text, ans);
    if (ans.calc && typeof window.thamaratSetCalc === 'function') window.thamaratSetCalc(ans.calc.key, ans.calc.area);
    busy = false; send.disabled = !input.value.trim();
    input.focus({ preventScroll: true });
  }

  function open() {
    document.documentElement.classList.add('tc-open'); fab.setAttribute('aria-expanded', 'true');
    if (!greeted) {
      greeted = true;
      add('bot', 'أهلًا بيك في **ثمرات للاستثمار والتنمية الزراعية** 🌴\nأنا مساعدك، اسألني أي سؤال عن الشركة والمشروعات والأصناف والأسعار والعائد، وهرد عليك فورًا.');
      history.length = 0;   // رسالة الترحيب مش جزء من سياق المساعد الذكي
      setChips(STARTERS);
    }
    if (matchMedia('(min-width:561px)').matches) setTimeout(() => input.focus({ preventScroll: true }), 200);
  }
  function close() { document.documentElement.classList.remove('tc-open'); fab.setAttribute('aria-expanded', 'false'); fab.focus({ preventScroll: true }); }

  function grow() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 110) + 'px'; }
  fab.onclick = open;
  $('.tc-close', root).onclick = close;
  addEventListener('keydown', e => { if (e.key === 'Escape' && document.documentElement.classList.contains('tc-open')) close(); });
  input.addEventListener('input', () => { send.disabled = busy || !input.value.trim(); grow(); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask(input.value); } });
  form.addEventListener('submit', e => { e.preventDefault(); ask(input.value); });
  log.addEventListener('click', e => {   // روابط صفحات الموقع: على الموبايل بنقفل الشات علشان الصفحة تبان
    const a = e.target.closest('a[data-hash]');
    if (a && matchMedia('(max-width:560px)').matches) close();
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
