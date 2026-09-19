/* =====================================================================
   قارئ رمز QR: المسح بالكاميرا + الإدخال اليدوي
   ===================================================================== */
'use strict';
window.Views = window.Views || {};

Views.qrReader = function (container) {
  let stream = null;
  let timer = null;
  let scanning = false;
  const recent = [];

  const stopCamera = () => {
    scanning = false;
    if (timer) { clearInterval(timer); timer = null; }
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    renderScanBox(false);
  };
  window.__viewCleanup = stopCamera;

  function parsePayload(text) {
    text = String(text || '').trim();
    const m = text.match(/^AISHIYA\|STU\|(.+)$/);
    if (m) return { fileNo: m[1].trim() };
    if (/^\d{3,6}$/.test(text)) return { fileNo: text };
    return null;
  }

  function showResult(fileNo) {
    const stu = S.studentByFileNo(fileNo);
    const box = container.querySelector('#scanResult');
    if (!stu) {
      box.innerHTML = `
        <div class="card"><div class="card-body" style="text-align:center;padding:2rem">
          <span class="sc-ic tone-red" style="width:54px;height:54px;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:.7rem">${UI.icon('xCircle')}</span>
          <div class="bold" style="font-size:1.05rem">لا يوجد طالب برقم الملف ${U.esc(fileNo)}</div>
          <div class="muted small mt-1">تأكد من الرقم أو امسح رمزاً صادراً من النظام</div>
        </div></div>`;
      return;
    }
    const att = S.db.attendance.find(a => a.studentId === stu.id && a.date === U.today());
    const avg = S.avgForStudent(stu.id);
    recent.unshift({ ts: Date.now(), id: stu.id });
    if (recent.length > 8) recent.pop();
    S.log('مسح رمز QR', `مسح رمز الطالب «${stu.name}» (${stu.fileNo})`);
    box.innerHTML = `
      <div class="card">
        <div class="card-head"><div class="card-title">${UI.icon('checkCircle')} تم التعرف على الطالب</div>${UI.badge('رمز صالح', 'green')}</div>
        <div class="card-body">
          <div class="profile-head">
            ${UI.avatar(stu.name, stu.gender === 'أنثى' ? 'a-girl' : 'a-boy', 'lg')}
            <div class="ph-info" style="flex:1">
              <h2 style="font-size:1.15rem">${U.esc(stu.name)}</h2>
              <div class="ph-meta">
                <span class="chip num">ملف ${U.esc(stu.fileNo)}</span>
                <span class="chip">${U.esc(stu.grade)} — ${U.esc(stu.section)}</span>
                ${UI.badge(U.stageName(stu.stage), 'teal')}
              </div>
              <div class="ph-meta">
                <span>${UI.icon('guardians')} ${U.esc((S.guardianOf(stu) || {}).name || '—')}</span>
                ${avg !== null ? `<span>${UI.icon('award')} المتوسط ${U.fn(avg)}٪</span>` : ''}
                <span>${UI.icon('attendance')} حالة اليوم: ${att ? `<b>${U.attStatus(att.status).name}</b>` : '<b class="muted">لم يُسجل بعد</b>'}</span>
              </div>
            </div>
          </div>
          <div class="flex mt-2">
            <button class="btn p sm" data-go="#/students/${stu.id}">${UI.icon('eye')} عرض ملف الطالب</button>
            ${!att ? `<button class="btn green sm" id="markPresent">${UI.icon('checkCircle')} تسجيل حاضر اليوم</button>` : ''}
            <button class="btn o sm" id="qrPrintCard">${UI.icon('print')} طباعة بطاقته</button>
          </div>
        </div>
      </div>`;
    UI.bindGo(box);
    box.querySelector('#markPresent')?.addEventListener('click', () => {
      S.db.attendance.push({ id: S.nextId('attendance'), date: U.today(), studentId: stu.id, status: 'present', stage: stu.stage, grade: stu.grade, section: stu.section });
      S.save();
      S.log('تسجيل حضور سريع', `تسجيل حضور الطالب «${stu.name}» عبر قارئ QR`);
      UI.ok(`تم تسجيل الطالب «${stu.name}» حاضراً اليوم`);
      showResult(fileNo);
      renderRecent();
    });
    box.querySelector('#qrPrintCard')?.addEventListener('click', () => {
      U.printDoc({ title: 'بطاقة تعريف طالب', body: QRU.studentCardHTML(stu), sign: false });
    });
    renderRecent();
  }

  function renderRecent() {
    const box = container.querySelector('#recentScans');
    if (!box) return;
    box.innerHTML = recent.length ? recent.map(r => {
      const s = S.student(r.id);
      if (!s) return '';
      return `<div class="gs-item" data-go="#/students/${s.id}" style="border-bottom:1px solid var(--border)">
        ${UI.avatar(s.name, s.gender === 'أنثى' ? 'a-girl' : 'a-boy')}
        <div style="flex:1"><div class="t-main small">${U.esc(s.name)}</div><div class="t-sub">ملف ${U.esc(s.fileNo)}</div></div>
        <span class="tl-time">${U.timeAgo(new Date(r.ts).toISOString())}</span></div>`;
    }).join('') : `<div class="empty" style="padding:1.6rem"><div class="e-s">لم يتم مسح أي رموز بعد — ستظهر آخر عمليات المسح هنا</div></div>`;
    UI.bindGo(box);
  }

  function renderScanBox(on) {
    const box = container.querySelector('#scanBox');
    if (!box) return;
    if (on) {
      box.innerHTML = `<video id="scanVideo" autoplay playsinline muted></video><div class="scan-frame"></div>`;
    } else {
      box.innerHTML = `<div class="scan-off">
        ${UI.icon('scan')}
        <div class="bold" style="color:#d5ece2">الكاميرا متوقفة</div>
        <div class="small" style="opacity:.8">اضغط «تشغيل الكاميرا» ووجّه رمز QR نحو الإطار</div>
      </div>`;
    }
  }

  async function startCamera() {
    if (!('mediaDevices' in navigator && navigator.mediaDevices.getUserMedia)) {
      UI.err('المتصفح لا يدعم الوصول إلى الكاميرا', 'تعذر التشغيل');
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    } catch (e) {
      UI.dialog({
        title: 'تعذر الوصول إلى الكاميرا', icon: 'camera', size: 'sm',
        body: `<p style="line-height:1.9;font-size:.9rem">لم يتم منح إذن استخدام الكاميرا أو لا توجد كاميرا متاحة. يمكنك في هذه الحالة استخدام <b>الإدخال اليدوي لرقم الملف</b> في الأسفل للوصول إلى ملف الطالب بنفس الطريقة.</p>`,
        foot: `<button class="btn p" data-close>حسناً، فهمت</button>`,
      });
      return;
    }
    renderScanBox(true);
    const video = container.querySelector('#scanVideo');
    video.srcObject = stream;
    await video.play().catch(() => { });
    scanning = true;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    timer = setInterval(() => {
      if (!scanning || video.readyState !== video.HAVE_ENOUGH_DATA) return;
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      try {
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (typeof jsQR === 'undefined') return;
        const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        if (code && code.data) {
          const p = parsePayload(code.data);
          if (p) { stopCamera(); showResult(p.fileNo); UI.ok('تم مسح الرمز بنجاح', 'تم التعرف'); }
        }
      } catch (e) { /* تجاهل أخطاء الإطار */ }
    }, 350);
  }

  container.innerHTML = `
    <div class="page-head">
      <div><h1>قارئ رمز QR</h1><div class="ph-sub">امسح رمز الطالب للوصول السريع لملفه أو تسجيل حضوره مباشرة</div></div>
      <div class="ph-actions"><button class="btn o" data-go="#/students">${UI.icon('students')} قائمة الطلبة</button></div>
    </div>
    <div class="grid-2">
      <div class="stack">
        <div class="card"><div class="card-body">
          <div class="scan-box" id="scanBox"></div>
          <div class="flex mt-2">
            <button class="btn p" id="btnScan">${UI.icon('camera')} تشغيل الكاميرا</button>
            <button class="btn o hidden" id="btnStop">${UI.icon('x')} إيقاف الكاميرا</button>
            <span class="small muted">يتم التقاط الرمز تلقائياً عند ظهوره داخل الإطار</span>
          </div>
        </div></div>
        <div class="card">
          <div class="card-head"><div class="card-title">${UI.icon('idCard')} الإدخال اليدوي</div><span class="card-sub">بديل عند تعذر استخدام الكاميرا</span></div>
          <div class="card-body">
            <div class="flex">
              <div class="fb-search" style="max-width:none;flex:1">${UI.icon('search')}<input id="manualFileNo" inputmode="numeric" placeholder="أدخل رقم ملف الطالب…"></div>
              <button class="btn p" id="manualGo">${UI.icon('search')} بحث</button>
            </div>
            <div class="hint mt-1">مثال على رقم الملف: ١٠٢٥ — يظهر الرقم في بطاقة الطالب وأعلى ملفه الشخصي</div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">${UI.icon('activity')} آخر عمليات المسح</div></div>
          <div class="card-body flush" id="recentScans"></div>
        </div>
      </div>
      <div id="scanResult">
        <div class="card"><div class="card-body">
          <div class="empty" style="padding:2.4rem 1rem">
            <div class="e-ic">${UI.icon('qr')}</div>
            <div class="e-t">بانتظار مسح رمز الطالب</div>
            <div class="e-s">شغّل الكاميرا ووجّهها نحو رمز QR المطبوع على بطاقة الطالب، أو أدخل رقم الملف يدوياً.<br>يمكنك طباعة بطاقات الطلبة من صفحة الطلبة ← إنشاء رمز QR.</div>
          </div>
        </div></div>
      </div>
    </div>`;

  UI.bindGo(container);
  renderScanBox(false);
  renderRecent();

  const btnScan = container.querySelector('#btnScan');
  const btnStop = container.querySelector('#btnStop');
  btnScan.addEventListener('click', async () => { btnScan.classList.add('hidden'); btnStop.classList.remove('hidden'); await startCamera(); if (!stream) { btnStop.classList.add('hidden'); btnScan.classList.remove('hidden'); } });
  btnStop.addEventListener('click', () => { stopCamera(); btnStop.classList.add('hidden'); btnScan.classList.remove('hidden'); });

  const manual = container.querySelector('#manualFileNo');
  const go = () => {
    const v = U.toEnDigits(manual.value).trim();
    if (!v) { UI.warn('أدخل رقم الملف أولاً'); return; }
    showResult(v);
    manual.value = '';
  };
  container.querySelector('#manualGo').addEventListener('click', go);
  manual.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
};
