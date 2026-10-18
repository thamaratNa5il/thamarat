/* محرك دراسات الجدوى المخصصة (صفحة السيلز /studies).
   نفس أرقام حاسبة الجدوى في index.html (الفدان الواحد، 60 نخلة)، مع إمكانية تغيير:
   الصنف، المساحة، عدد السنين، مين بيدفع الرعاية في أنهي سنين، نسبة الشركة وعلى أساس إيه، والأسعار.
   لو اتغيرت أرقام الحاسبة في index.html لازم تتغير هنا كمان (جدول VARIETIES). */

export const VARIETIES = {
  majdoul: {
    name: 'المجدول', short: 'مجدول', land: 600000, price: 180, offPrice: 3000,
    care: [25000, 25000, 25000, 35000, 35000, 50000, 65000, 65000, 65000, 65000],
    kg:   [0, 0, 0, 5, 15, 30, 50, 60, 70, 70],
    off:  [0, 0, 0, 1, 3, 3, 3, 2, 0, 0]
  },
  barhi: {
    name: 'البرحي', short: 'برحي', land: 600000, price: 40, offPrice: 2500,
    care: [25000, 25000, 25000, 35000, 35000, 50000, 65000, 65000, 65000, 65000],
    kg:   [0, 0, 15, 35, 50, 80, 120, 160, 210, 250],
    off:  [0, 0, 0, 1, 3, 3, 3, 2, 0, 0]
  },
  siwi: {
    name: 'السيوي', short: 'سيوي', roiOnLand: true, land: 350000, price: 35, offPrice: 300,
    care: [25000, 25000, 25000, 27000, 27000, 27000, 29000, 29000, 29000, 29000],
    kg:   [0, 0, 0, 15, 60, 120, 150, 150, 150, 150],
    off:  [0, 0, 0, 2, 2, 2, 2, 2, 2, 2]
  }
};

export const SYSTEMS = {
  standard: { name: 'النظام الأساسي', desc: 'العميل يتحمل مصروفات الرعاية، والشركة تاخد 25% من صافي الربح السنوي مقابل الإدارة', clientCareYears: 99, share: 0.25, base: 'profit' },
  mgmt10:   { name: 'نظام الإدارة 10%', desc: 'العميل يتحمل مصروفات الرعاية، والشركة تاخد 10% من صافي الربح مقابل الإدارة', clientCareYears: 99, share: 0.10, base: 'profit' },
  full25:   { name: 'الشركة تتحمل كل شيء', desc: 'الشركة تتحمل كل مصروفات الرعاية من أول سنة، وتاخد 25% من الإنتاج', clientCareYears: 0, share: 0.25, base: 'production' }
};

export const DEFAULTS = {
  variety: 'siwi', area: 1, years: 10, system: 'standard',
  clientCareYears: 99, share: 0.25, base: 'profit', shareOffshoots: true,
  palms: 60, growth: 0.20, landPrice: null, kgPrice: null, offPrice: null
};

export const ORD = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة',
  'الحادية عشرة', 'الثانية عشرة', 'الثالثة عشرة', 'الرابعة عشرة', 'الخامسة عشرة', 'السادسة عشرة', 'السابعة عشرة', 'الثامنة عشرة',
  'التاسعة عشرة', 'العشرون', 'الحادية والعشرون', 'الثانية والعشرون', 'الثالثة والعشرون', 'الرابعة والعشرون', 'الخامسة والعشرون'];

/** يكمّل الإعدادات الناقصة ويضبط الحدود */
export function normalize(p = {}) {
  const sys = SYSTEMS[p.system] || null;
  const q = { ...DEFAULTS, ...(sys ? { clientCareYears: sys.clientCareYears, share: sys.share, base: sys.base } : {}) };
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== null && v !== '') q[k] = v;
  if (!VARIETIES[q.variety]) q.variety = 'siwi';
  q.area = clamp(+q.area || 1, 0.01, 100000);
  q.years = Math.round(clamp(+q.years || 10, 5, 25));
  q.clientCareYears = Math.round(clamp(+q.clientCareYears, 0, 99));
  q.share = clamp(+q.share, 0, 0.9);
  q.base = q.base === 'production' ? 'production' : 'profit';
  q.shareOffshoots = q.shareOffshoots !== false;
  q.palms = Math.round(clamp(+q.palms || 60, 10, 200));
  q.growth = clamp(+q.growth, 0, 1);
  return q;
}

const clamp = (n, a, b) => Math.min(b, Math.max(a, isFinite(n) ? n : a));

/** يحسب الدراسة كاملة */
export function study(params) {
  const p = normalize(params);
  const v = VARIETIES[p.variety];
  const landF = p.landPrice || v.land, price = p.kgPrice || v.price, offPrice = p.offPrice || v.offPrice;
  const palms = p.palms * p.area;
  const at = (arr, i) => arr[Math.min(i, arr.length - 1)];
  let cum = 0, pre = 0, firstYear = null;
  const rows = [];
  for (let i = 0; i < p.years; i++) {
    const care = at(v.care, i) * p.area;
    const clientCare = i < p.clientCareYears ? care : 0;
    const companyCare = care - clientCare;
    const kg = at(v.kg, i), off = at(v.off, i);
    const dates = kg * palms * price, offs = off * palms * offPrice, rev = dates + offs;
    let companyShare;
    if (p.base === 'profit') companyShare = Math.max(0, rev - clientCare) * p.share;
    else companyShare = (p.shareOffshoots ? rev : dates) * p.share;
    const net = rev - clientCare - companyShare;
    if (rev === 0) pre += clientCare; else if (firstYear === null) firstYear = i;
    cum += net;
    rows.push({ i, care, clientCare, companyCare, kg, price, dates, off, offPrice, offs, rev, companyShare, net, cum });
  }
  const landCost = landF * p.area, cost = landCost + pre;
  const netSum = cum;
  const land = []; let val = landCost;
  for (let i = 0; i < p.years; i++) { const inc = val * p.growth; land.push({ i, val, inc, tot: val + inc }); val += inc; }
  const landAfter = val, gain = netSum + landAfter - cost;
  const roi = v.roiOnLand ? (netSum + landAfter) / landCost : gain / cost;
  let payback = null; rows.forEach(r => { if (payback === null && r.cum >= cost) payback = r.i; });
  const sum = k => rows.reduce((s, r) => s + r[k], 0);
  return {
    p, v, landF, price, offPrice, palms, rows, land, pre, landCost, cost, netSum, landAfter, gain, roi,
    roiDates: netSum / landCost, roiLand: landAfter / landCost, payback, firstYear,
    totals: { care: sum('care'), clientCare: sum('clientCare'), companyCare: sum('companyCare'), dates: sum('dates'), offs: sum('offs'), rev: sum('rev'), companyShare: sum('companyShare') }
  };
}

/** وصف النظام بالكلام لأي إعدادات */
export function describeSystem(p) {
  p = normalize(p);
  const pct = fmtPct(p.share);
  let care;
  if (p.clientCareYears >= p.years) care = 'العميل يتحمل مصروفات الرعاية طوال مدة الدراسة';
  else if (p.clientCareYears === 0) care = 'الشركة تتحمل كل مصروفات الرعاية من أول سنة';
  else care = `العميل يتحمل مصروفات الرعاية أول ${yearsWord(p.clientCareYears)}، والشركة تتحملها من السنة ${ORD[p.clientCareYears]}`;
  let share;
  if (p.share === 0) share = 'من غير نسبة للشركة';
  else if (p.base === 'profit') share = `الشركة تاخد ${pct} من صافي الربح السنوي`;
  else share = `الشركة تاخد ${pct} من ${p.shareOffshoots ? 'الإنتاج (إيراد التمور والفسائل)' : 'إيراد التمور (والفسائل للعميل)'}`;
  return care + '، و' + share;
}

export function systemTitle(p) {
  p = normalize(p);
  for (const s of Object.values(SYSTEMS)) {
    const cc = s.clientCareYears >= p.years ? p.years : s.clientCareYears;
    const pc = p.clientCareYears >= p.years ? p.years : p.clientCareYears;
    if (cc === pc && Math.abs(s.share - p.share) < 1e-9 && s.base === p.base && p.shareOffshoots) return s.name;
  }
  return 'نظام مخصص';
}

export const yearsN = n => n >= 3 && n <= 10 ? `${n} سنين` : n === 2 ? 'سنتين' : `${n} سنة`;
export function yearsWord(n) {
  return ({ 1: 'سنة', 2: 'سنتين', 3: '3 سنين', 4: '4 سنين', 5: '5 سنين' })[n] || `${n} سنة`;
}
export const fmtPct = s => (Math.round(s * 1000) / 10) + '%';
export const money = n => Math.round(n).toLocaleString('en-US');
export const fnum = n => (+(+n).toFixed(2)).toLocaleString('en-US', { maximumFractionDigits: 2 });
export function areaWord(a) {
  if (a === 1) return 'فدان';
  if (a === 2) return 'فدانين';
  if (a === 0.5) return 'نص فدان';
  if (a === 0.25) return 'ربع فدان';
  return fnum(a) + ' فدان';
}

/* ---------------------------------------------------------------------------
   فهم الطلب المكتوب بالعامية: «عايز دراسة جدوى لفدانين سيوي بنظام إن الشركة تتحمل المصاريف
   من السنة بعد التالتة وتاخد 25% من الإنتاج» ← إعدادات الدراسة.
   بيرجّع {params, notes} — notes = الحاجات اللي فهمها (بتتعرض للمستخدم يراجعها).
--------------------------------------------------------------------------- */
const DIG = s => s.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
export function norm(s) {
  return DIG(String(s || ''))
    .replace(/ـ/g, '').replace(/[ًٌٍَُِّْ]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/٫/g, '.').replace(/(\d),(\d{3})/g, '$1$2').replace(/(\d)،(\d)/g, '$1.$2')
    .replace(/٪/g, '%').toLowerCase().replace(/\s+/g, ' ').trim();
}

const WORDNUM = {
  'واحد': 1, 'واحده': 1, 'اتنين': 2, 'اثنين': 2, 'اثنان': 2, 'تلات': 3, 'تلاته': 3, 'ثلاث': 3, 'ثلاثه': 3, 'تلت': 3,
  'اربع': 4, 'اربعه': 4, 'خمس': 5, 'خمسه': 5, 'ست': 6, 'سته': 6, 'سبع': 7, 'سبعه': 7, 'تمن': 8, 'تمان': 8, 'تمانيه': 8, 'ثمانيه': 8, 'ثمان': 8,
  'تسع': 9, 'تسعه': 9, 'عشر': 10, 'عشره': 10, 'حداشر': 11, 'اتناشر': 12, 'اطناشر': 12, 'خمستاشر': 15, 'خمسطاشر': 15, 'عشرين': 20, 'تلاتين': 30, 'ثلاثين': 30,
  'اربعين': 40, 'خمسين': 50, 'ستين': 60, 'مية': 100, 'ميه': 100, 'مائه': 100, 'ميت': 100
};
const ORDWORDS = [
  [/(الاولي|الاوله|الاول|اول سنه)/, 1], [/(التانيه|الثانيه|التاني|الثاني)/, 2], [/(التالته|الثالثه|التالت|الثالث)/, 3],
  [/(الرابعه|الرابع)/, 4], [/(الخامسه|الخامس)/, 5], [/(السادسه|السادس)/, 6], [/(السابعه|السابع)/, 7],
  [/(التامنه|الثامنه|التامن|الثامن)/, 8], [/(التاسعه|التاسع)/, 9], [/(العاشره|العاشر)/, 10]
];
const NUM = '(\\d+(?:\\.\\d+)?)';

/** يقرا رقم مكتوب بالأرقام أو بالكلمات (+ ألف/مليون) */
function readNumber(t) {
  t = t.trim();
  let m = t.match(new RegExp('^' + NUM + '\\s*(الف|الاف|ك|k|مليون)?'));
  if (m) { let n = +m[1]; if (m[2] === 'مليون') n *= 1e6; else if (m[2]) n *= 1e3; return n; }
  m = t.match(/^(\S+)(?:\s+(الف|الاف|مليون))?/);
  if (m && WORDNUM[m[1]] != null) { let n = WORDNUM[m[1]]; if (m[2] === 'مليون') n *= 1e6; else if (m[2]) n *= 1e3; return n; }
  return null;
}

function findYearRef(s) {
  /* «السنه 4» أو «السنه الرابعه» أو «رابع سنه» → رقم السنة */
  let m = s.match(/السنه\s*(?:رقم\s*)?(\d+)/); if (m) return +m[1];
  for (const [re, n] of ORDWORDS) if (re.test(s)) return n;
  m = s.match(/(\d+)\s*(?:سنين|سنوات|سنه)/); if (m) return +m[1];
  return null;
}

export function parseQuery(text) {
  const s = ' ' + norm(text) + ' ';
  const out = {}, notes = [];

  /* الصنف */
  if (/(مجدول|مجهول|مدجول|medjool|majdoul|majhool)/.test(s)) out.variety = 'majdoul';
  else if (/(برحي|barhi|barhy)/.test(s)) out.variety = 'barhi';
  else if (/(سيوي|سيوه|سيويه|صعيدي|siwi|siwy)/.test(s)) out.variety = 'siwi';

  /* المساحة */
  let area = null, m;
  if ((m = s.match(new RegExp(NUM + '\\s*(?:فدان|فدادين|افدنه|فدن|feddan)')))) area = +m[1];
  else if ((m = s.match(/(\S+)\s+(?:فدادين|افدنه|فدان)/)) && WORDNUM[m[1]] != null) area = WORDNUM[m[1]];
  else if (/فدانين/.test(s)) area = 2;
  if (area === null && /(نص|نصف)\s*فدان/.test(s)) area = 0.5;
  if (area === null && /ربع\s*فدان/.test(s)) area = 0.25;
  if (area === null && /(تلت|ثلث)\s*فدان/.test(s)) area = 1 / 3;
  if (area !== null && /فدان\s*و\s*(نص|نصف)/.test(s)) area += 0.5;
  if (area !== null && /فدان\s*و\s*ربع/.test(s)) area += 0.25;
  if (area === null && /فدان\s*و\s*(نص|نصف)/.test(s)) area = 1.5;
  if (area === null && (m = s.match(new RegExp(NUM + '\\s*(?:قيراط|قراريط)')))) area = +m[1] / 24;
  if (area === null && /\sفدان\s/.test(s)) area = 1;
  if (area !== null) out.area = Math.round(area * 10000) / 10000;

  /* مدة الدراسة: «لمدة 15 سنة» / «على 20 سنة» / «15 سنه» (مش «السنه 15») */
  if ((m = s.match(new RegExp('(?:مده|لمده|علي|خلال|ل)\\s*' + NUM + '\\s*(?:سنه|سنين|سنوات|عام)')))) out.years = +m[1];
  else if ((m = s.match(/(?:مده|لمده|علي|خلال)\s*(\S+)\s*(?:سنين|سنوات|سنه)/)) && WORDNUM[m[1]] != null) out.years = WORDNUM[m[1]];
  else if ((m = s.match(new RegExp('(?:دراسه|الدراسه)[^.]{0,20}?' + NUM + '\\s*(?:سنه|سنين|سنوات)')))) out.years = +m[1];

  /* نظام جاهز بالاسم */
  if (/(النظام الاساسي|الدراسه الاساسيه|زي الدراسه|النظام العادي)/.test(s)) out.system = 'standard';
  if (/10\s*%|عشره في المي|10 في المي|10 بالمي/.test(s) && /(اداره|ارباح|ربح)/.test(s) && !/(تتحمل|تدفع|تصرف)/.test(s.replace(/العميل (يتحمل|يدفع)/g, ''))) out.system = 'mgmt10';

  /* مين بيدفع الرعاية */
  const companyPays = /(الشركه|احنا|هي)\s*(?:اللي\s*)?(تتحمل|هتتحمل|بتتحمل|تدفع|هتدفع|تصرف|هتصرف|تشيل|هتشيل|عليها)/.test(s) || /(علي|على) الشركه/.test(s) || /مصاريف(ها)? علي الشركه/.test(s);
  const clientPays = /(العميل|المستثمر|انا|هو)\s*(?:اللي\s*)?(يتحمل|هيتحمل|بيتحمل|يدفع|هيدفع|يصرف|هيصرف|يشيل|عليه)/.test(s);
  let careYears = null;
  /* «من السنه بعد التالته» / «بعد السنه التالته» / «بعد تالت سنه» */
  if ((m = s.match(/بعد\s*(?:ال)?(?:سنه\s*)?(\S+)(?:\s*سنه|\s*سنين|\s*سنوات)?/))) {
    const seg = s.slice(m.index, m.index + 30);
    const n = findYearRef(seg.replace(/^بعد\s*/, 'السنه ').replace(/السنه\s+السنه/, 'السنه')) ?? (WORDNUM[m[1]] ?? (/^\d+$/.test(m[1]) ? +m[1] : null));
    if (n !== null && (companyPays || /(الشركه|مصاريف|مصروفات|رعايه)/.test(s))) careYears = n;
  }
  if (careYears === null && (m = s.match(/(?:من|ابتداء من|بدايه من|اعتبارا من)\s*(?:اول\s*)?(السنه\s*\S+|\S+\s*سنه)/))) {
    const n = findYearRef(m[1].startsWith('السنه') ? m[1] : 'السنه ' + m[1].replace(/\s*سنه$/, ''));
    if (n !== null) careYears = companyPays || !clientPays ? n - 1 : null;
  }
  if (careYears === null && (m = s.match(/(?:اول|اولي)\s*(\S+)\s*(?:سنين|سنوات|سنه)/)) && (clientPays || companyPays)) {
    const n = WORDNUM[m[1]] ?? (/^\d+$/.test(m[1]) ? +m[1] : null);
    if (n !== null) careYears = clientPays && !/(اول\s*\S+\s*(سنين|سنوات|سنه)\s*(علي|على)\s*الشركه)/.test(s) ? n : 0;
    if (n !== null && /(اول\s*\S+\s*(سنين|سنوات|سنه)\s*(علي|على)\s*الشركه)/.test(s)) { careYears = 0; notes.push('⚠︎ الشركة تتحمل أول سنين — باقي السنين اتعتبرت على الشركة برضه، عدّلها لو محتاج'); }
  }
  if (careYears === null && /(حتي|لحد|لغايه)\s*(التبشير|الاثمار|الانتاج|اول انتاج)/.test(s)) {
    const v = VARIETIES[out.variety || 'siwi'];
    careYears = v.kg.findIndex(k => k > 0);
  }
  if (careYears === null && companyPays && !clientPays) careYears = 0;
  if (careYears === null && clientPays && !companyPays) careYears = 99;
  if (careYears !== null) out.clientCareYears = careYears;

  /* نسبة الشركة */
  let share = null;
  if ((m = s.match(new RegExp(NUM + '\\s*(?:%|في الميه|في المئه|في المايه|بالميه|بالمئه|بالمايه|في الميت|percent)')))) share = +m[1] / 100;
  else if ((m = s.match(/(\S+)\s*(?:في الميه|في المئه|بالميه)/)) && WORDNUM[m[1]] != null) share = WORDNUM[m[1]] / 100;
  else if (/ربع\s*(ال)?(انتاج|ارباح|ربح|محصول|ايراد|دخل)/.test(s)) share = 0.25;
  else if (/(نص|نصف)\s*(ال)?(انتاج|ارباح|ربح|محصول|ايراد|دخل)/.test(s)) share = 0.5;
  else if (/(تلت|ثلث)\s*(ال)?(انتاج|ارباح|ربح|محصول|ايراد|دخل)/.test(s)) share = 1 / 3;
  if (/(من غير|بدون)\s*(نسبه|اداره)/.test(s)) share = 0;
  if (share !== null) out.share = share;

  /* على أساس إيه */
  const prod = /(الانتاج|انتاج|المحصول|محصول|الايراد|ايراد|الدخل|التمر|من البيع|المبيعات)/.test(s.replace(/حتي\s*(التبشير|الاثمار|الانتاج|اول انتاج)/g, ''));
  const prof = /(الربح|ربح|ارباح|الارباح|صافي)/.test(s);
  if (prod && !prof) out.base = 'production';
  else if (prof && !prod) out.base = 'profit';
  else if (out.share != null || out.clientCareYears != null) {
    out.base = (out.clientCareYears != null && out.clientCareYears < 50) ? 'production' : 'profit';
  }
  if (/(الفسائل\s*(للعميل|بتاعه العميل|بتاعتي|ليا)|من غير الفسائل|بدون الفسائل|التمر بس|من التمر فقط)/.test(s)) out.shareOffshoots = false;

  /* الأسعار */
  const after = (re) => { const mm = s.match(re); return mm ? readNumber(s.slice(mm.index + mm[0].length)) : null; };
  let n;
  if ((n = after(/(?:سعر\s*الكيلو|الكيلو\s*(?:ب|بسعر|=|:)?|سعر\s*كيلو\s*التمر|الكيلو\s*هيتباع\s*ب)\s*/)) !== null && n > 0 && n < 5000) out.kgPrice = n;
  if ((n = after(/(?:سعر\s*الفدان|الفدان\s*(?:ب|بسعر|=|:)|تمن\s*الفدان|ثمن\s*الفدان)\s*/)) !== null && n >= 10000) out.landPrice = n;
  if ((n = after(/(?:سعر\s*الفسيله|الفسيله\s*(?:ب|بسعر|=|:)|تمن\s*الفسيله)\s*/)) !== null && n > 0 && n < 100000) out.offPrice = n;
  if ((m = s.match(new RegExp('(?:الارض|قيمه الارض|سعر الارض)[^%]{0,25}?(?:تزيد|بتزيد|هتزيد|زياده|نمو|ترتفع)[^%\\d]{0,10}' + NUM + '\\s*%')))) out.growth = +m[1] / 100;
  else if ((m = s.match(new RegExp('(?:زياده|نمو)\\s*(?:قيمه\\s*)?(?:سعر\\s*)?الارض\\s*' + NUM + '\\s*%')))) out.growth = +m[1] / 100;
  if ((m = s.match(new RegExp(NUM + '\\s*(?:نخله|فسيله)\\s*(?:في|لل|ل)\\s*(?:ال)?فدان')))) out.palms = +m[1];

  /* لو نسبة الإدارة اتكتبت ككلمة «زيادة الأرض» بالغلط، ما ناخدهاش كنسبة الشركة */
  if (out.growth != null && out.share != null && Math.abs(out.growth - out.share) < 1e-9 && !/(تاخد|ناخد|نسبه|للشركه|الشركه\s*(تاخد|هتاخد))/.test(s)) delete out.share;

  return { params: out, notes };
}

/** ملخص الدراسة كنص (للواتساب) */
export function summaryText(r, extra = '') {
  const p = r.p, v = r.v, Y = p.years;
  const lines = [
    `*دراسة جدوى استرشادية — ${areaWord(p.area)} ${v.short}*`,
    `شركة ثمرات للاستثمار والتنمية الزراعية`,
    ``,
    `▪︎ النظام: ${describeSystem(p)}`,
    `▪︎ عدد النخيل: ${fnum(r.palms)} نخلة`,
    `▪︎ ثمن الأرض: ${money(r.landCost)} ج`,
    `▪︎ مصروفات على العميل حتى التبشير: ${money(r.pre)} ج`,
    `▪︎ إجمالي التكلفة على العميل: ${money(r.cost)} ج`,
    `▪︎ صافي أرباح التمور والفسائل خلال ${yearsN(Y)}: ${money(r.netSum)} ج`,
    `▪︎ قيمة الأرض المتوقعة بعد ${yearsN(Y)}: ${money(r.landAfter)} ج`,
    `▪︎ معدل العائد الإجمالي: ${Math.round(r.roi * 100).toLocaleString('en-US')}%`,
    r.firstYear !== null ? `▪︎ أول إيراد: السنة ${ORD[r.firstYear]}` : '',
    r.payback !== null ? `▪︎ استرداد التكلفة: السنة ${ORD[r.payback]}` : '',
    ``,
    `الأرقام استرشادية وليست التزامًا بعائد محدد.`,
    extra,
    `للتواصل: 01274577688 — thamaratmisr.com`
  ];
  return lines.filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n').trim();
}
