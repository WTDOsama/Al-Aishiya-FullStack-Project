/* =====================================================================
   الحضور والغياب: التسجيل اليومي + سجل الغياب
   ===================================================================== */
'use strict';
window.Views = window.Views || {};

Views.attendance = function (container) {
  const sel = { date: U.today(), stage: 'primary', grade: 'الصف الأول', section: 'أ' };
  let marks = {}; /* studentId -> status */

  const attCounts = (rows) => ({
    present: rows.filter(a => a.status === 'present').length,
    absent: rows.filter(a => a.status === 'absent').length,
    late: rows.filter(a => a.status === 'late').length,
    excused: rows.filter(a => a.status === 'excused').length,
  });

  /* ================= تبويب التسجيل ================= */
  function roster() { return S.roster(sel.stage, sel.grade, sel.section); }

  function loadExisting() {
    marks = {};
    for (const s of roster()) {
      const ex = S.db.attendance.find(a => a.studentId === s.id && a.date === sel.date);
      marks[s.id] = ex ? ex.status : 'present';
    }
  }

  function registerHTML() {
    const kids = roster();
    const dayAtt = S.todayAttendance(sel.date);
    const wholeC = attCounts(dayAtt);

    return `
      <div class="card">
        <div class="card-head">
          <div class="card-title">${UI.icon('attendance')} تسجيل الحضور اليومي</div>
          <div class="flex">
            <span class="chip">${UI.icon('checkCircle')} حاضر اليوم (المدرسة): <b class="num">${U.fn(wholeC.present)}</b></span>
            <span class="chip">${UI.icon('xCircle')} غائب: <b class="num">${U.fn(wholeC.absent)}</b></span>
            <span class="chip">${UI.icon('clock')} متأخر: <b class="num">${U.fn(wholeC.late)}</b></span>
            <span class="chip">${UI.icon('info')} بعذر: <b class="num">${U.fn(wholeC.excused)}</b></span>
          </div>
        </div>
        <div class="card-body">
          <div class="form-grid cols-4">
            <div class="field"><label>التاريخ</label><input type="date" class="input ltr" style="text-align:right" id="attDate" value="${sel.date}" max="${U.today()}"></div>
            <div class="field"><label>المرحلة الدراسية</label><select class="select" id="attStage">${UI.opt(CONFIG.stages.map(s => ({ v: s.id, l: s.name })), sel.stage)}</select></div>
            <div class="field"><label>الصف</label><select class="select" id="attGrade"></select></div>
            <div class="field"><label>الشعبة</label><select class="select" id="attSection">${UI.opt(CONFIG.sections, sel.section)}</select></div>
          </div>
        </div>
        <div class="card-body flush">
          ${kids.length ? `
          <div class="flex" style="padding:.7rem 1rem;border-bottom:1px solid var(--border);background:var(--surface-2)">
            <span class="small muted bold">${U.fn(kids.length)} من الطلبة في الشعبة المحددة</span>
            <span style="flex:1"></span>
            <button class="btn o sm" data-bulk="present">${UI.icon('checkCircle')} الكل حاضر</button>
            <button class="btn o sm" data-bulk="absent">${UI.icon('xCircle')} الكل غائب</button>
            <button class="btn p sm" id="saveAtt">${UI.icon('save')} حفظ الحضور</button>
          </div>
          <div class="table-wrap"><table class="tbl compact">
            <thead><tr><th style="width:50px">#</th><th>اسم الطالب</th><th>الحالة</th><th>ملاحظة</th></tr></thead>
            <tbody>
              ${kids.map((s, i) => {
      const st2 = marks[s.id];
      const note = S.absenceStreak(s.id, S.settings().absenceAlert) && st2 !== 'absent' ? '<span class="badge b-red" title="غياب متكرر مؤخراً"><i class="b-dot"></i>غاب ٣ أيام متتالية مؤخراً</span>' : '';
      return `<tr data-sid="${s.id}">
                <td class="faint num">${U.fn(i + 1)}</td>
                <td>${UI.personCell(s.name, `ملف ${s.fileNo}`, s.gender)}</td>
                <td><div class="seg">${CONFIG.attendanceStatuses.map(a => `<button type="button" class="sg ${marks[s.id] === a.id ? a.cls : ''}" data-st="${a.id}">${a.name}</button>`).join('')}</div></td>
                <td>${note}</td>
              </tr>`;
    }).join('')}
            </tbody>
          </table></div>` : UI.empty({
      title: 'لا يوجد طلبة في هذه الشعبة',
      sub: 'تأكد من اختيار المرحلة والصف والشعبة الصحيحة، أو أضف طلبة أولاً',
      icon: 'students',
      action: `<button class="btn p" data-go="#/students">${UI.icon('plus')} الانتقال إلى صفحة الطلبة</button>`,
    })}
        </div>
      </div>`;
  }

  function bindRegister() {
    const dateInp = container.querySelector('#attDate');
    const stageSel = container.querySelector('#attStage');
    const gradeSel = container.querySelector('#attGrade');
    const secSel = container.querySelector('#attSection');
    const fillGrades = () => {
      const st = CONFIG.stages.find(x => x.id === sel.stage);
      gradeSel.innerHTML = UI.opt(st ? st.grades : [], sel.grade);
    };
    fillGrades();

    dateInp?.addEventListener('change', () => { sel.date = dateInp.value || U.today(); loadExisting(); refreshRegister(); });
    stageSel?.addEventListener('change', () => { sel.stage = stageSel.value; sel.grade = (CONFIG.stages.find(x => x.id === sel.stage)).grades[0]; loadExisting(); refreshRegister(); });
    gradeSel?.addEventListener('change', () => { sel.grade = gradeSel.value; loadExisting(); refreshRegister(); });
    secSel?.addEventListener('change', () => { sel.section = secSel.value; loadExisting(); refreshRegister(); });

    container.querySelectorAll('tr[data-sid] .sg').forEach(btn => btn.addEventListener('click', () => {
      const sid = +btn.closest('tr').dataset.sid;
      marks[sid] = btn.dataset.st;
      btn.closest('.seg').querySelectorAll('.sg').forEach(b => b.className = 'sg' + (b === btn ? ' ' + CONFIG.attendanceStatuses.find(a => a.id === btn.dataset.st).cls : ''));
    }));

    container.querySelectorAll('[data-bulk]').forEach(b => b.addEventListener('click', () => {
      roster().forEach(s => marks[s.id] = b.dataset.bulk);
      refreshRegister();
      UI.toast(b.dataset.bulk === 'present' ? 'تم تحديد جميع الطلبة «حاضر»' : 'تم تحديد جميع الطلبة «غائب»', 'info');
    }));

    container.querySelector('#saveAtt')?.addEventListener('click', () => {
      const kids = roster();
      if (!kids.length) return;
      let updated = 0, added = 0;
      for (const s of kids) {
        const status = marks[s.id] || 'present';
        const ex = S.db.attendance.find(a => a.studentId === s.id && a.date === sel.date);
        if (ex) { if (ex.status !== status) { ex.status = status; updated++; } }
        else {
          S.db.attendance.push({ id: S.nextId('attendance'), date: sel.date, studentId: s.id, status, stage: s.stage, grade: s.grade, section: s.section });
          added++;
        }
      }
      S.save();
      S.log('تسجيل الحضور', `تسجيل حضور ${sel.grade} — شعبة ${sel.section} بتاريخ ${U.fmtDate(sel.date)} (${U.fn(kids.length)} طالب)`);
      S.checkAlerts();
      UI.ok(`تم حفظ حضور ${sel.grade} — شعبة ${sel.section} بنجاح`, 'تم التسجيل');
      renderAll();
    });
  }

  /* ================= تقارير سريعة ================= */
  function printToday() {
    const dayAtt = S.todayAttendance(sel.date);
    const c = attCounts(dayAtt);
    const rows = dayAtt.map(a => {
      const stu = S.student(a.studentId) || {};
      return { ...a, name: stu.name || 'محذوف', grade2: stu.grade || a.grade, section2: stu.section || a.section, stage2: stu.stage || a.stage };
    }).sort((a, b) => (a.stage2 + a.grade2 + a.name).localeCompare(b.stage2 + b.grade2 + b.name, 'ar'));
    U.printDoc({
      title: 'تقرير الحضور والغياب اليومي', landscape: true,
      meta: `${U.fmtDateFull(sel.date)}`,
      body: `
        ${U.printKPIs([['حاضر', c.present], ['غائب', c.absent], ['متأخر', c.late], ['غياب بعذر', c.excused], ['الإجمالي', dayAtt.length]])}
        ${U.printTable([
        { label: 'اسم الطالب', get: r => r.name },
        { label: 'المرحلة', get: r => U.stageName(r.stage2) },
        { label: 'الصف', get: r => r.grade2 },
        { label: 'الشعبة', get: r => r.section2 },
        { label: 'الحالة', get: r => U.attStatus(r.status).name },
      ], rows)}`,
    });
    S.log('طباعة تقرير', `طباعة تقرير الحضور اليومي بتاريخ ${U.fmtDate(sel.date)}`);
  }

  function shareToday() {
    const dayAtt = S.todayAttendance(sel.date);
    const c = attCounts(dayAtt);
    const text = [
      `🗓 *تقرير الحضور اليومي — ${S.settings().schoolName}*`,
      `📅 ${U.fmtDateFull(sel.date)}`, '',
      `✅ حاضر: ${U.fn(c.present)}`,
      `❌ غائب: ${U.fn(c.absent)}`,
      `⏰ متأخر: ${U.fn(c.late)}`,
      `📄 غياب بعذر: ${U.fn(c.excused)}`,
      `📊 نسبة الحضور: ${dayAtt.length ? U.fn(Math.round(c.present / dayAtt.length * 100)) : '—'}٪`, '',
      `_صادر عن ${CONFIG.systemName}_`,
    ].join('\n');
    U.waShare(text);
    S.log('مشاركة عبر واتساب', 'مشاركة ملخص الحضور اليومي عبر واتساب');
  }

  /* ================= سجل الغياب ================= */
  function absenceSection(el) {
    const rows = S.db.attendance
      .filter(a => a.status !== 'present')
      .sort((a, b) => b.date.localeCompare(a.date));
    UI.dataTable(el, {
      rows,
      searchPlaceholder: 'ابحث باسم الطالب…',
      searchKeys: [r => (S.student(r.studentId) || {}).name || ''],
      filters: [
        { key: 'st', label: 'الحالة', options: CONFIG.attendanceStatuses.filter(a => a.id !== 'present').map(a => ({ v: a.id, l: a.name })), match: (r, v) => r.status === v },
        { key: 'stage', label: 'المرحلة', options: CONFIG.stages.map(s => ({ v: s.id, l: s.name })), match: (r, v) => (S.student(r.studentId) || {}).stage === v || r.stage === v },
      ],
      toolbar: `<button class="btn o sm" id="expAbs">${UI.icon('download')} تصدير</button>
                <button class="btn o sm" id="printAbs">${UI.icon('print')} طباعة</button>`,
      columns: [
        { label: 'التاريخ', render: r => `<span class="t-main nowrap">${U.fmtDate(r.date)}</span><div class="t-sub">${CONFIG.weekdays[U.parseISO(r.date).getDay()]}</div>` },
        { label: 'اسم الطالب', render: r => { const s = S.student(r.studentId); return s ? UI.personCell(s.name, U.stageName(s.stage), s.gender) : '<span class="faint">طالب محذوف</span>'; } },
        { label: 'الصف', render: r => { const s = S.student(r.studentId); return `<span class="small">${U.esc((s || r).grade || '')} — ${U.esc((s || r).section || '')}</span>`; } },
        { label: 'الحالة', render: r => UI.badge(U.attStatus(r.status).name, U.attStatus(r.status).tone) },
      ],
      actions: (r) => [{
        icon: 'trash', title: 'حذف السجل', tone: 'del',
        onClick: async () => {
          const yes = await UI.confirm({ title: 'حذف سجل الحضور', danger: true, message: 'حذف هذا السجل نهائياً؟', okLabel: 'حذف' });
          if (!yes) return;
          S.remove('attendance', r.id);
          S.log('حذف سجل حضور', `حذف سجل حضور بتاريخ ${U.fmtDate(r.date)}`);
          UI.ok('تم حذف السجل');
          renderAll();
        },
      }],
      pageSize: 12,
      emptyTitle: 'لا توجد سجلات غياب أو تأخر',
      emptySub: 'جميع الطلبة ملتزمون بالحضور — استمر!',
      emptyIcon: 'checkCircle',
    });
    el.querySelector('#expAbs')?.addEventListener('click', () => {
      const data = rows.map(r => { const s = S.student(r.studentId) || {}; return [r.date, s.name || 'محذوف', U.stageName(s.stage || r.stage), s.grade || r.grade, s.section || r.section, U.attStatus(r.status).name]; });
      U.download(`سجل-الغياب-${U.today()}.csv`, U.toCSV(['التاريخ', 'اسم الطالب', 'المرحلة', 'الصف', 'الشعبة', 'الحالة'], data));
      UI.ok('تم تصدير سجل الغياب بصيغة CSV');
      S.log('تصدير بيانات', 'تصدير سجل الغياب بصيغة CSV');
    });
    el.querySelector('#printAbs')?.addEventListener('click', () => {
      U.printDoc({
        title: 'تقرير الغياب والتأخر', landscape: true,
        meta: `إجمالي السجلات: ${U.fn(rows.length)}`,
        body: U.printTable([
          { label: 'التاريخ', get: r => U.fmtDate(r.date) },
          { label: 'اسم الطالب', get: r => (S.student(r.studentId) || {}).name || 'محذوف' },
          { label: 'الصف', get: r => (S.student(r.studentId) || {}).grade || r.grade },
          { label: 'الشعبة', get: r => (S.student(r.studentId) || {}).section || r.section },
          { label: 'الحالة', get: r => U.attStatus(r.status).name },
        ], rows),
      });
      S.log('طباعة تقرير', 'طباعة تقرير الغياب والتأخر');
    });
  }

  /* ================= التجميع ================= */
  function refreshRegister() {
    const el = container.querySelector('#registerBox');
    el.innerHTML = registerHTML();
    bindRegister();
    UI.bindGo(el);
  }

  function renderAll() {
    const ph = UI.pageHead({
      title: 'الحضور والغياب',
      sub: `تسجيل متابعة الدوام اليومي — ${U.fmtDateFull(U.today())}`,
      actions: [
        { label: 'طباعة تقرير اليوم', icon: 'print', kind: 'o', onClick: printToday },
        { label: 'مشاركة عبر واتساب', icon: 'whatsapp', kind: 'wa', onClick: shareToday },
      ],
    });
    const todayC = attCounts(S.todayAttendance());
    container.innerHTML = `
      ${ph.html}
      <div class="stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
        ${UI.statCard({ label: 'حاضر اليوم', value: todayC.present, icon: 'checkCircle', tone: 'green' })}
        ${UI.statCard({ label: 'غائب اليوم', value: todayC.absent, icon: 'xCircle', tone: 'red' })}
        ${UI.statCard({ label: 'متأخر اليوم', value: todayC.late, icon: 'clock', tone: 'amber' })}
        ${UI.statCard({ label: 'غياب بعذر', value: todayC.excused, icon: 'info', tone: 'blue' })}
        ${UI.statCard({ label: 'نسبة الحضور', value: (S.todayAttendance().length ? U.fn(Math.round(todayC.present / S.todayAttendance().length * 100)) : '—') + '٪', icon: 'trend', tone: 'teal' })}
      </div>
      <div id="registerBox"></div>
      <div class="card">
        <div class="card-head"><div class="card-title">${UI.icon('xCircle')} سجل الغياب والتأخر</div><span class="card-sub">جميع سجلات الغياب والتأخر والغياب بعذر</span></div>
        <div class="card-body flush" id="absBox"></div>
      </div>`;
    ph.bind(container);
    loadExisting();
    refreshRegister();
    absenceSection(container.querySelector('#absBox'));
  }

  renderAll();
};
