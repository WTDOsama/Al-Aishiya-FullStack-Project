/* =====================================================================
   أدوات رموز QR: الإنشاء، التنزيل، حوارات العرض
   ===================================================================== */
'use strict';

const QRU = (() => {
  const available = () => typeof window.qrcode !== 'undefined';

  const payloadFor = (stu) => `AISHIYA|STU|${stu.fileNo}`;

  function make(text) {
    if (!available()) return null;
    const q = qrcode(0, 'M');
    q.addData(text, 'Byte');
    q.make();
    return q;
  }

  function svg(text, cellSize = 5, margin = 2) {
    const q = make(text);
    if (!q) return '';
    try { return q.createSvgTag({ cellSize, margin, scalable: true }); }
    catch (e) { return q.createSvgTag(cellSize, margin); }
  }

  function downloadPNG(text, filename, cellSize = 10) {
    const q = make(text);
    if (!q) { UI.err('تعذر إنشاء الرمز، مكتبة QR غير متوفرة'); return; }
    const n = q.getModuleCount();
    const margin = 4;
    const size = (n + margin * 2) * cellSize;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#062e26';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++)
      if (q.isDark(r, c)) ctx.fillRect((margin + c) * cellSize, (margin + r) * cellSize, cellSize, cellSize);
    canvas.toBlob((b) => {
      const url = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 400);
      UI.ok('تم تحميل رمز QR بصيغة PNG');
    }, 'image/png');
  }

  /* بطاقة الطالب للطباعة */
  function studentCardHTML(stu, qrText) {
    const st = S.settings();
    return `
    <div style="border:2px solid #0b7a5c;border-radius:14px;padding:16px 18px;max-width:330px;margin:20px auto;font-family:Cairo,Arial">
      <div style="display:flex;align-items:center;gap:10px;border-bottom:1.5px dashed #b9cfc6;padding-bottom:9px">
        <div style="width:42px">${LOGO_SVG}</div>
        <div>
          <div style="font-weight:800;font-size:13.5px;color:#083f31">${U.esc(st.schoolName)}</div>
          <div style="font-size:9.5px;color:#555">بطاقة تعريف طالب — العام الدراسي ${U.esc(st.academicYear)}</div>
        </div>
      </div>
      <div style="display:flex;gap:14px;align-items:center;padding-top:12px">
        <div class="pqr" style="width:120px;flex:none">${svg(qrText || payloadFor(stu), 4, 1)}</div>
        <div style="font-size:12px;line-height:2">
          <div style="font-weight:800;font-size:14.5px;color:#0a3c2f">${U.esc(stu.name)}</div>
          <div>رقم الملف: <b>${U.esc(stu.fileNo)}</b></div>
          <div>الصف: <b>${U.esc(stu.grade)} — شعبة ${U.esc(stu.section)}</b></div>
          <div>المرحلة: <b>${U.stageName(stu.stage)}</b></div>
        </div>
      </div>
    </div>`;
  }

  /* حوار عرض رمز الطالب */
  function showStudentQR(stu) {
    if (!available()) { UI.err('مكتبة إنشاء رموز QR غير محملة'); return; }
    const text = payloadFor(stu);
    S.log('إنشاء رمز QR', `إنشاء رمز QR للطالب «${stu.name}» (${stu.fileNo})`);
    UI.dialog({
      title: 'رمز QR الخاص بالطالب', sub: stu.name, icon: 'qr', size: 'sm',
      body: `
        <div class="qr-box">
          <div style="background:#fff;border:1px solid var(--border);border-radius:14px;padding:12px;display:inline-block">${svg(text, 5, 2)}</div>
          <div class="q-cap">رقم الملف: <b class="num">${U.esc(stu.fileNo)}</b> — امسح الرمز للوصول السريع لملف الطالب</div>
        </div>`,
      foot: `
        <button class="btn p" id="qrPrint">${UI.icon('print')} طباعة بطاقة الطالب</button>
        <button class="btn o" id="qrDl">${UI.icon('download')} تحميل PNG</button>
        <button class="btn o" data-close>إغلاق</button>`,
      onMount(el, close) {
        el.querySelector('#qrDl').addEventListener('click', () => downloadPNG(text, `qr-student-${stu.fileNo}.png`));
        el.querySelector('#qrPrint').addEventListener('click', () => {
          U.printDoc({ title: 'بطاقة تعريف طالب', body: studentCardHTML(stu, text), sign: false });
          S.log('طباعة بطاقة طالب', `طباعة بطاقة تعريف للطالب «${stu.name}»`);
        });
      },
    });
  }

  return { available, payloadFor, svg, downloadPNG, studentCardHTML, showStudentQR };
})();
