/* =====================================================================
   أدوات مساعدة عامة: التنسيق، التواريخ، الأرقام، الملفات، الطباعة
   ===================================================================== */
'use strict';

const U = (() => {

  /* ---------- نصوص ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const toArDigits = (v) => String(v).replace(/[0-9]/g, d => AR_DIGITS[+d]);
  const toEnDigits = (v) => String(v ?? '')
    .replace(/[٠-٩]/g, d => AR_DIGITS.indexOf(d))
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

  /* تنسيق رقم حسب الإعداد (أرقام مشرقية أو غربية) */
  function fn(n) {
    if (n === null || n === undefined || n === '' || isNaN(n)) return '—';
    const s = Number(n).toLocaleString('en-US').replace(/,/g, '،');
    return (typeof S !== 'undefined' && S.settings().numerals === 'western') ? String(s) : toArDigits(s);
  }
  function num(n) { return `<span class="num">${fn(n)}</span>`; }

  /* ---------- التواريخ ---------- */
  const pad2 = (x) => String(x).padStart(2, '0');
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
  const nowISO = () => new Date().toISOString();

  function parseISO(iso) {
    if (!iso) return null;
    const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
    return isNaN(d) ? null : d;
  }
  function fmtDate(iso) {
    const d = parseISO(iso); if (!d) return '—';
    return `${fn(d.getDate())} ${CONFIG.months[d.getMonth()]} ${fn(d.getFullYear())}`;
  }
  function fmtDateFull(iso) {
    const d = parseISO(iso); if (!d) return '—';
    return `${CONFIG.weekdays[d.getDay()]}، ${d.getDate()} ${CONFIG.months[d.getMonth()]} ${d.getFullYear()}م`.replace(/[0-9]/g, c => (S.settings().numerals === 'western') ? c : AR_DIGITS[+c]);
  }
  function fmtTime(iso) {
    const d = parseISO(iso); if (!d) return '';
    let h = d.getHours(); const m = pad2(d.getMinutes());
    const per = h < 12 ? 'صباحاً' : 'مساءً';
    h = h % 12 || 12;
    return `${fn(h)}:${fn(m)} ${per}`;
  }
  function fmtDateTime(iso) {
    const d = parseISO(iso); if (!d) return '—';
    return `${fmtDate(iso)} — ${fmtTime(iso)}`;
  }

  function timeAgo(iso) {
    const d = parseISO(iso); if (!d) return '—';
    const sec = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
    const unit = (n, one, two, few, many) => {
      if (n === 1) return one; if (n === 2) return two;
      if (n >= 3 && n <= 10) return `${fn(n)} ${few}`;
      return `${fn(n)} ${many}`;
    };
    if (sec < 60) return 'الآن';
    const min = Math.floor(sec / 60); if (min < 60) return `منذ ${unit(min, 'دقيقة', 'دقيقتين', 'دقائق', 'دقيقة')}`;
    const hr = Math.floor(min / 60); if (hr < 24) return `منذ ${unit(hr, 'ساعة', 'ساعتين', 'ساعات', 'ساعة')}`;
    const day = Math.floor(hr / 24); if (day < 30) return `منذ ${unit(day, 'يوم', 'يومين', 'أيام', 'يوماً')}`;
    const mon = Math.floor(day / 30); if (mon < 12) return `منذ ${unit(mon, 'شهر', 'شهرين', 'أشهر', 'شهراً')}`;
    const yr = Math.floor(mon / 12); return `منذ ${unit(yr, 'سنة', 'سنتين', 'سنوات', 'سنة')}`;
  }

  function age(birthISO) {
    const b = parseISO(birthISO); if (!b) return null;
    const t = new Date();
    let a = t.getFullYear() - b.getFullYear();
    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
    return a;
  }

  function addDays(iso, days) {
    const d = parseISO(iso) || new Date();
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }
  /* أيام الدراسة: الأحد إلى الخميس */
  function schoolDaysBack(count, fromISO) {
    const out = []; let cur = fromISO || today();
    while (out.length < count) {
      const d = parseISO(cur);
      if (d.getDay() !== 5 && d.getDay() !== 6) out.push(cur);
      cur = addDays(cur, -1);
    }
    return out.reverse();
  }

  /* ---------- التوليد والتجزئة ---------- */
  let _uidC = 0;
  const uid = (p = 'id') => `${p}_${Date.now().toString(36)}${(++_uidC).toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) { h = ((h << 5) + h + str.charCodeAt(i)) | 0; }
    return 'h' + (h >>> 0).toString(36);
  }

  /* مولد عشوائي ثابت للبيانات التجريبية */
  function seededRng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const debounce = (f, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); }; };

  /* ---------- CSV ---------- */
  const csvCell = (v) => {
    const s = String(v ?? '');
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  function toCSV(headers, rows) {
    const lines = [headers.map(csvCell).join(',')];
    for (const r of rows) lines.push(r.map(csvCell).join(','));
    return '﻿' + lines.join('\r\n');
  }
  function parseCSV(text) {
    text = String(text).replace(/^﻿/, '');
    const rows = []; let cur = [''], inQ = false, field = '';
    const rowsArr = [];
    let record = [];
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
        else field += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === ',') { record.push(field); field = ''; }
        else if (c === '\n' || c === '\r') {
          if (c === '\r' && text[i + 1] === '\n') i++;
          record.push(field); field = '';
          if (record.some(x => x !== '')) rowsArr.push(record);
          record = [];
        } else field += c;
      }
    }
    record.push(field);
    if (record.some(x => x !== '')) rowsArr.push(record);
    return rowsArr;
  }

  /* ---------- تنزيل الملفات ---------- */
  function download(filename, content, mime = 'text/csv;charset=utf-8') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 400);
  }

  /* ---------- Excel ---------- */
  function sheetToCSV(ws) {
    return XLSX.utils.sheet_to_csv(ws, { FS: ',', blankrows: false });
  }

  /* ---------- واتساب ---------- */
  function waLink(text, phone) {
    let p = '';
    if (phone) {
      p = String(phone).replace(/[^\d]/g, '');
      if (p.startsWith('0')) p = '970' + p.slice(1);
      if (!p.startsWith('970') && p.length === 9) p = '970' + p;
      p = '/' + p;
    }
    return `https://wa.me${p}?text=${encodeURIComponent(text)}`;
  }
  function waShare(text, phone) { window.open(waLink(text, phone), '_blank'); }

  /* ---------- الطباعة ---------- */
  function printDoc({ title, meta = '', body = '', landscape = false, sign = true }) {
    const root = document.getElementById('print-root');
    const st = S.settings();
    const user = (typeof Auth !== 'undefined' && Auth.user()) ? Auth.user().name : '—';
    root.innerHTML = `
      <div class="pdoc">
        ${landscape ? '<style>@page { size: A4 landscape; }</style>' : ''}
        <div class="phead">
          <div class="ph-cell">
            <div>${CONFIG.country}</div>
            <div>${CONFIG.ministry}</div>
            <div>${esc(st.directorate || CONFIG.directorate)}</div>
          </div>
          <div class="ph-cell c">
            <div style="width:56px;margin:0 auto 2px">${LOGO_SVG}</div>
            <div class="ph-school">${esc(st.schoolName)}</div>
            <div class="ph-sys">${CONFIG.systemName}</div>
          </div>
          <div class="ph-cell l">
            <div>تاريخ الطباعة: ${fmtDate(today())}</div>
            <div>العام الدراسي: ${esc(st.academicYear)}</div>
            <div>الفصل الدراسي: ${esc(st.semester)}</div>
          </div>
        </div>
        <div class="ptitle">${esc(title)}</div>
        ${meta ? `<div class="pmeta">${meta}</div>` : ''}
        ${body}
        ${sign ? `<div class="psign"><span>توقيع المسؤول: ........................</span><span>ختم المدرسة: ........................</span></div>` : ''}
        <div class="pfoot">
          <span>حرر بواسطة: ${esc(user)}</span>
          <span>${CONFIG.systemName} — وثيقة رسمية</span>
        </div>
      </div>`;
    setTimeout(() => { window.print(); }, 80);
  }

  /* جدول HTML قابل للطباعة */
  function printTable(columns, rows) {
    return `<table class="ptbl"><thead><tr>${columns.map(c => `<th>${esc(c.label)}</th>`).join('')}</tr></thead>
      <tbody>${rows.length ? rows.map(r => `<tr>${columns.map(c => `<td>${esc(c.get ? c.get(r) : (r[c.key] ?? '—'))}</td>`).join('')}</tr>`).join('')
        : `<tr><td colspan="${columns.length}" style="text-align:center;color:#666">لا توجد بيانات</td></tr>`}</tbody></table>`;
  }
  function printKPIs(items) {
    return `<div class="pkpis">${items.map(([l, v]) => `<div class="pkpi"><b>${typeof v === 'number' ? fn(v) : esc(v)}</b>${esc(l)}</div>`).join('')}</div>`;
  }

  /* ---------- مشارك أخرى ---------- */
  const perfLevel = (pct) => CONFIG.perfLevels.find(l => pct >= l.min) || CONFIG.perfLevels.at(-1);
  const stageById = (id) => CONFIG.stages.find(s => s.id === id);
  const stageName = (id) => stageById(id)?.name || id || '—';
  const attStatus = (id) => CONFIG.attendanceStatuses.find(a => a.id === id);
  const badgeTone = (status) => ({ 'نشط': 'green', 'منتقل': 'amber', 'متوقف مؤقتاً': 'gray', 'متوقف': 'gray', 'في إجازة': 'amber', 'مقيم': 'green', 'نازح': 'red', 'عائد من النزوح': 'blue' }[status] || 'gray');

  function fmtPieces(pieces) {
    const per = S.settings().piecesPerCarton || CONFIG.piecesPerCarton;
    const c = Math.floor(pieces / per), r = pieces % per;
    if (c && r) return `${fn(c)} كرتونة + ${fn(r)} قطعة`;
    if (c) return `${fn(c)} كرتونة`;
    return `${fn(r)} قطعة`;
  }

  const fullAddress = (o) => [o.area, o.city, o.governorate].filter(Boolean).join(' — ') || '—';

  return {
    esc, fn, num, toArDigits, toEnDigits,
    today, nowISO, fmtDate, fmtDateFull, fmtTime, fmtDateTime, timeAgo, age, addDays, schoolDaysBack, parseISO,
    uid, hash, seededRng, debounce,
    toCSV, parseCSV, download, sheetToCSV,
    waLink, waShare,
    printDoc, printTable, printKPIs,
    perfLevel, stageById, stageName, attStatus, badgeTone, fmtPieces, fullAddress,
  };
})();
